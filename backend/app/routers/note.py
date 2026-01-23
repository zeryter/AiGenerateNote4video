# app/routers/note.py
import json
import os
import uuid
from pathlib import Path
from typing import Optional
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel, validator, field_validator
from dataclasses import asdict

from app.db.video_task_dao import get_task_by_video, get_all_tasks
from app.enmus.exception import NoteErrorEnum
from app.enmus.note_enums import DownloadQuality
from app.exceptions.note import NoteError
from app.services.note import NoteGenerator, logger
from app.services.task_queue import enqueue_task
from app.utils.response import ResponseWrapper as R
from app.utils.url_parser import extract_video_id
from app.validators.video_url_validator import is_supported_video_url
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
import httpx
from app.enmus.task_status_enums import TaskStatus
from app.db.video_tags_dao import get_video_tags

# from app.services.downloader import download_raw_audio
# from app.services.whisperer import transcribe_audio

router = APIRouter()


class RecordRequest(BaseModel):
    video_id: Optional[str] = None
    platform: Optional[str] = None
    task_id: Optional[str] = None


class VideoRequest(BaseModel):
    video_url: str
    platform: str
    quality: DownloadQuality
    screenshot: Optional[bool] = False
    link: Optional[bool] = False
    model_name: str
    provider_id: str
    task_id: Optional[str] = None
    format: Optional[list] = []
    style: str = None
    extras: Optional[str]=None
    video_understanding: Optional[bool] = False
    video_interval: Optional[int] = 0
    grid_size: Optional[list] = []

    @field_validator("video_url")
    def validate_supported_url(cls, v):
        url = str(v)
        parsed = urlparse(url)
        if parsed.scheme in ("http", "https"):
            # 是网络链接，继续用原有平台校验
            if not is_supported_video_url(url):
                raise NoteError(code=NoteErrorEnum.PLATFORM_NOT_SUPPORTED.code,
                                message=NoteErrorEnum.PLATFORM_NOT_SUPPORTED.message)

        return v


NOTE_OUTPUT_DIR = os.getenv("NOTE_OUTPUT_DIR", "note_results")
UPLOAD_DIR = "uploads"

VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".flv", ".m4v"}


def _infer_local_upload_url(audio_meta: dict) -> str:
    if not isinstance(audio_meta, dict):
        return ""

    raw_info = audio_meta.get("raw_info") or {}
    if isinstance(raw_info, dict):
        for key in ("webpage_url", "upload_url", "video_url", "source_url", "original_url"):
            v = raw_info.get(key)
            if isinstance(v, str) and v.startswith("/uploads/") and v.strip():
                return v

        video_path = raw_info.get("video_path")
        if isinstance(video_path, str):
            normalized = video_path.replace("\\", "/")
            if "/uploads/" in normalized:
                return f"/uploads/{normalized.split('/uploads/')[-1]}"

    video_path = audio_meta.get("video_path")
    if isinstance(video_path, str):
        normalized = video_path.replace("\\", "/")
        if "/uploads/" in normalized:
            return f"/uploads/{normalized.split('/uploads/')[-1]}"

    candidate_path = audio_meta.get("file_path")
    if not isinstance(candidate_path, str):
        candidate_path = raw_info.get("path") if isinstance(raw_info, dict) else ""
    if not isinstance(candidate_path, str) or not candidate_path:
        return ""

    normalized = candidate_path.replace("\\", "/")
    if "/uploads/" not in normalized:
        return ""

    base_name = os.path.splitext(os.path.basename(normalized))[0]
    uploads_dir = os.path.join(os.getcwd(), UPLOAD_DIR)
    try:
        for entry in os.listdir(uploads_dir):
            entry_base, entry_ext = os.path.splitext(entry)
            if entry_base == base_name and entry_ext.lower() in VIDEO_EXTENSIONS:
                return f"/uploads/{entry}"
    except Exception:
        return ""

    return ""


def save_note_to_file(task_id: str, note):
    os.makedirs(NOTE_OUTPUT_DIR, exist_ok=True)
    with open(os.path.join(NOTE_OUTPUT_DIR, f"{task_id}.json"), "w", encoding="utf-8") as f:
        json.dump(asdict(note), f, ensure_ascii=False, indent=2)


@router.post('/delete_task')
def delete_task(data: RecordRequest):
    try:
        deleted_count = NoteGenerator().delete_note(video_id=data.video_id or "", platform=data.platform or "", task_id=data.task_id)
        return R.success({"deleted": deleted_count}, msg='删除成功')
    except Exception as e:
        return R.error(msg=e)


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_location = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_location, "wb+") as f:
        f.write(await file.read())

    # 假设你静态目录挂载了 /uploads
    return R.success({"url": f"/uploads/{file.filename}"})


@router.post("/generate_note")
def generate_note(data: VideoRequest):
    try:

        video_id = extract_video_id(data.video_url, data.platform)
        # if not video_id:
        #     raise HTTPException(status_code=400, detail="无法提取视频 ID")
        # existing = get_task_by_video(video_id, data.platform)
        # if existing:
        #     return R.error(
        #         msg='笔记已生成，请勿重复发起',
        #
        #     )
        if data.task_id:
            # 如果传了task_id，说明是重试！
            task_id = data.task_id
            # 更新之前的状态
            NoteGenerator()._update_status(task_id, TaskStatus.QUEUED)
            logger.info(f"重试模式，复用已有 task_id={task_id}")
        else:
            # 正常新建任务
            task_id = str(uuid.uuid4())
            NoteGenerator()._update_status(task_id, TaskStatus.QUEUED)

        enqueue_task({
            "task_id": task_id,
            "video_url": data.video_url,
            "platform": data.platform,
            "quality": data.quality,
            "link": data.link,
            "screenshot": data.screenshot,
            "model_name": data.model_name,
            "provider_id": data.provider_id,
            "format": data.format,
            "style": data.style,
            "extras": data.extras,
            "video_understanding": data.video_understanding,
            "video_interval": data.video_interval,
            "grid_size": data.grid_size,
        })
        return R.success({"task_id": task_id})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/task_status/{task_id}")
def get_task_status(task_id: str):
    status_path = os.path.join(NOTE_OUTPUT_DIR, f"{task_id}.status.json")
    result_path = os.path.join(NOTE_OUTPUT_DIR, f"{task_id}.json")

    # 优先读状态文件
    if os.path.exists(status_path):
        with open(status_path, "r", encoding="utf-8") as f:
            status_content = json.load(f)

        status = status_content.get("status")
        message = status_content.get("message", "")

        if status == TaskStatus.SUCCESS.value:
            # 成功状态的话，继续读取最终笔记内容
            if os.path.exists(result_path):
                with open(result_path, "r", encoding="utf-8") as rf:
                    result_content = json.load(rf)
                audio_meta = result_content.get("audio_meta") or {}
                video_id = audio_meta.get("video_id")
                platform = audio_meta.get("platform")
                tags = get_video_tags(platform, video_id) if platform and video_id else []
                return R.success({
                    "status": status,
                    "result": result_content,
                    "tags": tags,
                    "message": message,
                    "task_id": task_id
                })
            else:
                # 理论上不会出现，保险处理
                return R.success({
                    "status": TaskStatus.QUEUED.value,
                    "message": "任务完成，但结果文件未找到",
                    "task_id": task_id
                })

        if status == TaskStatus.FAILED.value:
            return R.error(message or "任务失败", code=500)

        # 处理中状态
        return R.success({
            "status": status,
            "message": message,
            "task_id": task_id
        })

    # 没有状态文件，但有结果
    if os.path.exists(result_path):
        with open(result_path, "r", encoding="utf-8") as f:
            result_content = json.load(f)
        audio_meta = result_content.get("audio_meta") or {}
        video_id = audio_meta.get("video_id")
        platform = audio_meta.get("platform")
        tags = get_video_tags(platform, video_id) if platform and video_id else []
        return R.success({
            "status": TaskStatus.SUCCESS.value,
            "result": result_content,
            "tags": tags,
            "task_id": task_id
        })

    return R.success({
        "status": TaskStatus.QUEUED.value,
        "message": "任务排队中",
        "task_id": task_id
    })


@router.get("/image_proxy")
async def image_proxy(request: Request, url: str):
    headers = {
        "Referer": "https://www.bilibili.com/",
        "User-Agent": request.headers.get("User-Agent", ""),
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)

            if resp.status_code != 200:
                raise HTTPException(status_code=resp.status_code, detail="图片获取失败")

            content_type = resp.headers.get("Content-Type", "image/jpeg")
            return StreamingResponse(
                resp.aiter_bytes(),
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",  #  缓存一天
                    "Content-Type": content_type,
                }
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tasks")
def list_tasks(tags: Optional[str] = None, tags_match: str = "any"):
    tasks_db = get_all_tasks()
    results = []
    
    for t in tasks_db:
        result_path = os.path.join(NOTE_OUTPUT_DIR, f"{t.task_id}.json")
        status_path = os.path.join(NOTE_OUTPUT_DIR, f"{t.task_id}.status.json")
        
        task_data = {
            "id": t.task_id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "platform": t.platform,
            "status": "QUEUED"
        }
        
        # Determine status
        if os.path.exists(status_path):
            try:
                with open(status_path, "r", encoding="utf-8") as f:
                    s_data = json.load(f)
                    task_data["status"] = s_data.get("status", "QUEUED")
            except:
                pass
        # If no status file but result exists -> SUCCESS
        elif os.path.exists(result_path):
            task_data["status"] = "SUCCESS"

        
        # Load content if success (or if file exists)
        if os.path.exists(result_path):
            try:
                with open(result_path, "r", encoding="utf-8") as f:
                    content = json.load(f)
                    if "audio_meta" in content:
                        task_data["audioMeta"] = content["audio_meta"]
                    
                    if "transcript" in content:
                        task_data["transcript"] = content["transcript"]
                        
                    if "markdown" in content:
                        task_data["markdown"] = content["markdown"]

                    audio_meta = content.get("audio_meta") or {}
                    video_id = audio_meta.get("video_id")
                    platform = t.platform or audio_meta.get("platform")
                    task_data["tags"] = get_video_tags(platform, video_id) if platform and video_id else []
                        
                    video_url = content.get("audio_meta", {}).get("raw_info", {}).get("webpage_url", "")
                    if t.platform == "local" and not video_url:
                        video_url = _infer_local_upload_url(content.get("audio_meta", {}))

                    task_data["formData"] = {
                        "video_url": video_url,
                        "platform": t.platform,
                        "model_name": "", 
                        "provider_id": "",
                    }
                    
            except Exception as e:
                logger.error(f"Error loading task file {t.task_id}: {e}")
                
        results.append(task_data)
        
    if tags:
        requested = [t.strip() for t in tags.split(",") if t.strip()]
        if requested:
            match_all = tags_match.lower() == "all"
            filtered = []
            for item in results:
                item_tags = set(item.get("tags") or [])
                if match_all:
                    if all(t in item_tags for t in requested):
                        filtered.append(item)
                else:
                    if any(t in item_tags for t in requested):
                        filtered.append(item)
            results = filtered

    return R.success(results)
