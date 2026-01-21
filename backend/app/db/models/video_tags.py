from sqlalchemy import Column, Integer, String, DateTime, func, UniqueConstraint, Text

from app.db.engine import Base


class VideoTag(Base):
    __tablename__ = "video_tags"

    id = Column(Integer, primary_key=True, autoincrement=True)
    platform = Column(String, nullable=False)
    video_id = Column(String, nullable=False)
    tags_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("platform", "video_id", name="uq_video_tags_platform_video_id"),
    )

