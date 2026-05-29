from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .time import utcnow


class Base(DeclarativeBase):
    pass


class Visitor(Base):
    __tablename__ = "visitors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visitor_id: Mapped[str] = mapped_column(String(96), unique=True, index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )

    __table_args__ = (Index("ix_visitors_last_seen_at", "last_seen_at"),)


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    visitor_id: Mapped[str] = mapped_column(
        String(96),
        ForeignKey("visitors.visitor_id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    casting_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    detail_reading_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint("visitor_id", "date", name="uq_daily_usage_visitor_date"),
        Index("ix_daily_usage_date", "date"),
    )


class Casting(Base):
    __tablename__ = "castings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    casting_id: Mapped[str] = mapped_column(String(96), unique=True, index=True, nullable=False)
    visitor_id: Mapped[str] = mapped_column(
        String(96),
        ForeignKey("visitors.visitor_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    question: Mapped[str] = mapped_column(Text, default="", nullable=False)
    mode: Mapped[str] = mapped_column(String(16), nullable=False)
    lines: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    gua_code: Mapped[str | None] = mapped_column(String(6), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_castings_visitor_status", "visitor_id", "status"),
        Index("ix_castings_created_at", "created_at"),
    )


class DetailReading(Base):
    __tablename__ = "detail_readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    detail_reading_id: Mapped[str] = mapped_column(
        String(96),
        unique=True,
        index=True,
        nullable=False,
    )
    casting_id: Mapped[str] = mapped_column(
        String(96),
        ForeignKey("castings.casting_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    visitor_id: Mapped[str] = mapped_column(
        String(96),
        ForeignKey("visitors.visitor_id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    usage_counted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utcnow,
        onupdate=utcnow,
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (Index("ix_detail_readings_created_at", "created_at"),)
