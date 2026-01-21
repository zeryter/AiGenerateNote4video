from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.db.video_tags_dao import get_video_tags, upsert_video_tags, get_tags_stats
from app.utils.response import ResponseWrapper as R


router = APIRouter()


class TagsPayload(BaseModel):
    tags: List[str]


@router.get("/video_tags/{platform}/{video_id}")
def get_tags(platform: str, video_id: str):
    return R.success({"tags": get_video_tags(platform, video_id)})


@router.put("/video_tags/{platform}/{video_id}")
def put_tags(platform: str, video_id: str, payload: TagsPayload):
    tags = upsert_video_tags(platform, video_id, payload.tags)
    return R.success({"tags": tags})


@router.get("/tags_stats")
def tags_stats(platform: Optional[str] = None):
    return R.success({"items": get_tags_stats(platform=platform)})

