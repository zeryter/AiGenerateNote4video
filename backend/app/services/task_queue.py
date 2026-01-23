import os
import json
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from queue import Queue, Empty
from threading import Thread, Event
from typing import Optional, Dict, Any, Tuple
from uuid import uuid4

from app.enmus.task_status_enums import TaskStatus
from app.db.engine import get_db
from app.db.models.task_queue import TaskQueueItem, TaskQueueState
from app.services.note import NoteGenerator, NOTE_OUTPUT_DIR
from app.utils.logger import get_logger

logger = get_logger(__name__)

LOCK_TIMEOUT_SECONDS = int(os.getenv("QUEUE_LOCK_TIMEOUT_SECONDS", "600"))
POLL_INTERVAL_SECONDS = float(os.getenv("QUEUE_POLL_INTERVAL_SECONDS", "0.5"))


def _save_note_to_file(task_id: str, note):
    NOTE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(NOTE_OUTPUT_DIR / f"{task_id}.json", "w", encoding="utf-8") as f:
        json.dump(asdict(note), f, ensure_ascii=False, indent=2)


def _run_note_task(payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    task_id = payload.get("task_id")
    if not task_id:
        return False, "缺少 task_id"
    model_name = payload.get("model_name")
    provider_id = payload.get("provider_id")
    if not model_name or not provider_id:
        NoteGenerator()._update_status(task_id, TaskStatus.FAILED, message="请选择模型和提供者")
        return False, "请选择模型和提供者"
    try:
        note = NoteGenerator().generate(
            video_url=payload.get("video_url", ""),
            platform=payload.get("platform", ""),
            quality=payload.get("quality"),
            task_id=task_id,
            model_name=model_name,
            provider_id=provider_id,
            link=payload.get("link"),
            _format=payload.get("format"),
            style=payload.get("style"),
            extras=payload.get("extras"),
            screenshot=payload.get("screenshot"),
            video_understanding=payload.get("video_understanding", False),
            video_interval=payload.get("video_interval", 0),
            grid_size=payload.get("grid_size", []),
        )
        if note and note.markdown:
            _save_note_to_file(task_id, note)
        return True, None
    except Exception as exc:
        NoteGenerator()._update_status(task_id, TaskStatus.FAILED, message=str(exc))
        logger.error(f"任务执行失败 {task_id}: {exc}", exc_info=True)
        return False, str(exc)


class TaskQueue:
    def __init__(self, concurrency: int):
        self.concurrency = max(1, concurrency)
        self.queue: Queue[Optional[Dict[str, Any]]] = Queue()
        self.stop_event = Event()
        self.workers: list[Thread] = []
        self.worker_group_id = uuid4().hex

    def start(self):
        if self.workers:
            return
        _ensure_queue_state()
        _recover_stale_tasks()
        for _ in range(self.concurrency):
            worker_id = f"{self.worker_group_id}-{len(self.workers)}"
            worker = Thread(target=self._worker_loop, args=(worker_id,), daemon=True)
            worker.start()
            self.workers.append(worker)

    def stop(self):
        if not self.workers:
            return
        self.stop_event.set()
        for _ in self.workers:
            self.queue.put(None)
        for worker in self.workers:
            worker.join(timeout=1)
        self.workers = []

    def enqueue(self, payload: Dict[str, Any]):
        self.queue.put(payload)

    def size(self) -> int:
        db = next(get_db())
        try:
            return (
                db.query(TaskQueueItem)
                .filter(TaskQueueItem.status == TaskStatus.QUEUED.value, TaskQueueItem.paused == False)
                .count()
            )
        finally:
            db.close()

    def _worker_loop(self, worker_id: str):
        while not self.stop_event.is_set():
            if _is_queue_paused():
                self.stop_event.wait(POLL_INTERVAL_SECONDS)
                continue
            try:
                payload = self.queue.get(timeout=0.5)
            except Empty:
                payload = None
            if payload is None:
                payload = _dequeue_task(worker_id)
            if payload is None:
                continue
            try:
                task_id = payload.get("task_id")
                if task_id and is_task_canceled(task_id):
                    NoteGenerator()._update_status(task_id, TaskStatus.FAILED, message="任务已取消")
                    clear_canceled(task_id)
                    _finalize_task(task_id, False, "任务已取消")
                else:
                    success, error_message = _run_note_task(payload)
                    _finalize_task(task_id, success, error_message)
            finally:
                if payload is not None:
                    try:
                        self.queue.task_done()
                    except ValueError:
                        pass


_task_queue: Optional[TaskQueue] = None


def start_task_queue() -> TaskQueue:
    global _task_queue
    if _task_queue:
        return _task_queue
    concurrency = int(os.getenv("QUEUE_CONCURRENCY", "1"))
    _task_queue = TaskQueue(concurrency)
    _task_queue.start()
    return _task_queue


def stop_task_queue():
    global _task_queue
    if _task_queue:
        _task_queue.stop()
        _task_queue = None


def enqueue_task(payload: Dict[str, Any]) -> int:
    queue = start_task_queue()
    _upsert_task(payload)
    queue.enqueue(payload)
    return queue.size()


def cancel_task(task_id: str) -> bool:
    if not task_id:
        return False
    db = next(get_db())
    try:
        updated = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.task_id == task_id)
            .update(
                {
                    "status": "CANCELED",
                    "last_error": "任务已取消",
                    "locked_at": None,
                    "lock_owner": None,
                },
                synchronize_session=False,
            )
        )
        db.commit()
        if updated:
            NoteGenerator()._update_status(task_id, TaskStatus.FAILED, message="任务已取消")
        return updated > 0
    finally:
        db.close()


def is_task_canceled(task_id: str) -> bool:
    if not task_id:
        return False
    db = next(get_db())
    try:
        item = db.query(TaskQueueItem).filter(TaskQueueItem.task_id == task_id).first()
        return bool(item and item.status == "CANCELED")
    finally:
        db.close()


def clear_canceled(task_id: str) -> None:
    if not task_id:
        return
    db = next(get_db())
    try:
        db.query(TaskQueueItem).filter(TaskQueueItem.task_id == task_id).update(
            {
                "status": TaskStatus.FAILED.value,
                "locked_at": None,
                "lock_owner": None,
            },
            synchronize_session=False,
        )
        db.commit()
    finally:
        db.close()


def pause_queue() -> None:
    db = next(get_db())
    try:
        state = _get_or_create_queue_state(db)
        state.is_paused = True
        db.commit()
    finally:
        db.close()


def resume_queue() -> None:
    db = next(get_db())
    try:
        state = _get_or_create_queue_state(db)
        state.is_paused = False
        db.commit()
    finally:
        db.close()


def pause_task(task_id: str) -> bool:
    if not task_id:
        return False
    db = next(get_db())
    try:
        updated = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.task_id == task_id, TaskQueueItem.status == TaskStatus.QUEUED.value)
            .update({"paused": True}, synchronize_session=False)
        )
        db.commit()
        return updated > 0
    finally:
        db.close()


def resume_task(task_id: str) -> bool:
    if not task_id:
        return False
    db = next(get_db())
    try:
        updated = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.task_id == task_id)
            .update({"paused": False}, synchronize_session=False)
        )
        db.commit()
        return updated > 0
    finally:
        db.close()


def _get_or_create_queue_state(db):
    state = db.query(TaskQueueState).filter(TaskQueueState.id == 1).first()
    if not state:
        state = TaskQueueState(id=1, is_paused=False)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def _ensure_queue_state() -> None:
    db = next(get_db())
    try:
        _get_or_create_queue_state(db)
    finally:
        db.close()


def _is_queue_paused() -> bool:
    db = next(get_db())
    try:
        state = _get_or_create_queue_state(db)
        return bool(state.is_paused)
    finally:
        db.close()


def _upsert_task(payload: Dict[str, Any]) -> None:
    task_id = payload.get("task_id")
    if not task_id:
        return
    db = next(get_db())
    try:
        payload_json = json.dumps(payload, ensure_ascii=False)
        item = db.query(TaskQueueItem).filter(TaskQueueItem.task_id == task_id).first()
        max_attempts = int(payload.get("max_attempts", 3))
        if item:
            item.payload_json = payload_json
            item.status = TaskStatus.QUEUED.value
            item.paused = False
            item.locked_at = None
            item.lock_owner = None
            item.last_error = None
            item.max_attempts = max_attempts
            item.attempts = 0
        else:
            item = TaskQueueItem(
                task_id=task_id,
                payload_json=payload_json,
                status=TaskStatus.QUEUED.value,
                attempts=0,
                max_attempts=max_attempts,
                paused=False,
            )
            db.add(item)
        db.commit()
    finally:
        db.close()


def _dequeue_task(worker_id: str) -> Optional[Dict[str, Any]]:
    db = next(get_db())
    try:
        if _is_queue_paused():
            return None
        task = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.status == TaskStatus.QUEUED.value, TaskQueueItem.paused == False)
            .order_by(TaskQueueItem.created_at.asc())
            .first()
        )
        if not task:
            return None
        if task.attempts >= task.max_attempts:
            task.status = TaskStatus.FAILED.value
            task.last_error = "超过最大重试次数"
            db.commit()
            return None
        updated = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.task_id == task.task_id, TaskQueueItem.status == TaskStatus.QUEUED.value)
            .update(
                {
                    "status": "RUNNING",
                    "locked_at": datetime.now(timezone.utc),
                    "lock_owner": worker_id,
                    "attempts": task.attempts + 1,
                },
                synchronize_session=False,
            )
        )
        if updated == 0:
            db.rollback()
            return None
        db.commit()
        try:
            payload = json.loads(task.payload_json)
        except Exception:
            db.query(TaskQueueItem).filter(TaskQueueItem.task_id == task.task_id).update(
                {
                    "status": TaskStatus.FAILED.value,
                    "last_error": "任务数据解析失败",
                    "locked_at": None,
                    "lock_owner": None,
                },
                synchronize_session=False,
            )
            db.commit()
            return None
        return payload
    finally:
        db.close()


def _finalize_task(task_id: Optional[str], success: bool, error_message: Optional[str]) -> None:
    if not task_id:
        return
    db = next(get_db())
    try:
        item = db.query(TaskQueueItem).filter(TaskQueueItem.task_id == task_id).first()
        if not item:
            return
        if success:
            item.status = TaskStatus.SUCCESS.value
            item.last_error = None
        else:
            item.status = TaskStatus.FAILED.value
            item.last_error = error_message
        item.locked_at = None
        item.lock_owner = None
        db.commit()
    finally:
        db.close()


def _recover_stale_tasks() -> None:
    db = next(get_db())
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=LOCK_TIMEOUT_SECONDS)
        stale_tasks = (
            db.query(TaskQueueItem)
            .filter(TaskQueueItem.status == "RUNNING")
            .all()
        )
        for task in stale_tasks:
            if task.locked_at is None or task.locked_at < cutoff:
                if task.attempts >= task.max_attempts:
                    task.status = TaskStatus.FAILED.value
                    task.last_error = "超过最大重试次数"
                else:
                    task.status = TaskStatus.QUEUED.value
                task.locked_at = None
                task.lock_owner = None
        db.commit()
    finally:
        db.close()
