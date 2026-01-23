from sqlalchemy import Column, String, Text, Integer, DateTime, Boolean, func

from app.db.engine import Base


class TaskQueueItem(Base):
    __tablename__ = "task_queue"

    task_id = Column(String, primary_key=True)
    payload_json = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="QUEUED")
    attempts = Column(Integer, nullable=False, default=0)
    max_attempts = Column(Integer, nullable=False, default=3)
    locked_at = Column(DateTime, nullable=True)
    lock_owner = Column(String, nullable=True)
    paused = Column(Boolean, nullable=False, default=False)
    last_error = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class TaskQueueState(Base):
    __tablename__ = "task_queue_state"

    id = Column(Integer, primary_key=True, autoincrement=True)
    is_paused = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
