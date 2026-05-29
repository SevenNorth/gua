from datetime import timedelta

from sqlalchemy import delete, exists, select, update
from sqlalchemy.orm import Session

from .config import Settings
from .models import Casting, DailyUsage, DetailReading, Visitor
from .time import utcnow

STALE_CASTING_STATUSES = ("casting", "base_reading_loading")


def expire_stale_castings(db: Session, settings: Settings) -> int:
    expire_before = utcnow() - timedelta(hours=settings.incomplete_casting_ttl_hours)
    result = db.execute(
        update(Casting)
        .where(Casting.status.in_(STALE_CASTING_STATUSES))
        .where(Casting.created_at < expire_before)
        .values(status="expired", closed_at=utcnow(), updated_at=utcnow())
    )
    return result.rowcount or 0


def cleanup_old_records(db: Session, settings: Settings) -> None:
    now = utcnow()
    usage_before = (now - timedelta(days=settings.daily_usage_retention_days)).date()
    detail_before = now - timedelta(days=settings.detail_reading_retention_days)
    casting_before = now - timedelta(days=settings.casting_retention_days)
    visitor_before = now - timedelta(days=settings.visitor_retention_days)

    db.execute(delete(DailyUsage).where(DailyUsage.date < usage_before))
    db.execute(delete(DetailReading).where(DetailReading.created_at < detail_before))
    db.execute(
        delete(Casting)
        .where(Casting.status.in_(("closed", "expired")))
        .where(Casting.created_at < casting_before)
    )

    has_casting = exists(select(Casting.id).where(Casting.visitor_id == Visitor.visitor_id))
    has_detail = exists(
        select(DetailReading.id).where(DetailReading.visitor_id == Visitor.visitor_id)
    )
    has_usage = exists(select(DailyUsage.id).where(DailyUsage.visitor_id == Visitor.visitor_id))
    db.execute(
        delete(Visitor)
        .where(Visitor.last_seen_at < visitor_before)
        .where(~has_casting)
        .where(~has_detail)
        .where(~has_usage)
    )
