import json
from collections import Counter
from typing import List, Optional, Dict, Any

from app.db.engine import get_db
from app.db.models.video_tags import VideoTag


def _normalize_tags(tags: List[str]) -> List[str]:
    seen = set()
    normalized: List[str] = []
    for t in tags or []:
        if not isinstance(t, str):
            continue
        cleaned = t.strip()
        if not cleaned:
            continue
        if cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)
    return normalized


def get_video_tags(platform: str, video_id: str) -> List[str]:
    db = next(get_db())
    try:
        row = db.query(VideoTag).filter_by(platform=platform, video_id=video_id).first()
        if not row:
            return []
        try:
            data = json.loads(row.tags_json or "[]")
            if isinstance(data, list):
                return _normalize_tags(data)
        except Exception:
            return []
        return []
    finally:
        db.close()


def upsert_video_tags(platform: str, video_id: str, tags: List[str]) -> List[str]:
    db = next(get_db())
    try:
        normalized = _normalize_tags(tags)
        tags_json = json.dumps(normalized, ensure_ascii=False)

        row = db.query(VideoTag).filter_by(platform=platform, video_id=video_id).first()
        if row:
            row.tags_json = tags_json
        else:
            row = VideoTag(platform=platform, video_id=video_id, tags_json=tags_json)
            db.add(row)

        db.commit()
        return normalized
    finally:
        db.close()


def get_tags_stats(platform: Optional[str] = None) -> List[Dict[str, Any]]:
    db = next(get_db())
    try:
        q = db.query(VideoTag)
        if platform:
            q = q.filter_by(platform=platform)
        rows = q.all()

        counter: Counter[str] = Counter()
        for r in rows:
            try:
                data = json.loads(r.tags_json or "[]")
            except Exception:
                continue
            if not isinstance(data, list):
                continue
            for t in _normalize_tags(data):
                counter[t] += 1

        return [{"tag": tag, "count": count} for tag, count in counter.most_common()]
    finally:
        db.close()

