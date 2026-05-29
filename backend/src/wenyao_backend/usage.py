from typing import Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .models import DailyUsage
from .serializers import usage_summary
from .time import next_local_midnight, today, utcnow


def get_usage(db: Session, visitor_id: str, settings: Settings) -> DailyUsage:
    current_date = today(settings)
    usage = db.scalars(
        select(DailyUsage)
        .where(DailyUsage.visitor_id == visitor_id)
        .where(DailyUsage.date == current_date)
    ).first()

    if usage is None:
        now = utcnow()
        usage = DailyUsage(
            visitor_id=visitor_id,
            date=current_date,
            casting_count=0,
            detail_reading_count=0,
            created_at=now,
            updated_at=now,
        )
        db.add(usage)
        db.flush()

    return usage


def next_reset_at(settings: Settings):
    return next_local_midnight(settings)


def get_usage_summary(
    db: Session,
    visitor_id: str,
    settings: Settings,
    *,
    kind: Literal["casting", "detail_reading"],
) -> dict:
    usage = get_usage(db, visitor_id, settings)
    if kind == "casting":
        return usage_summary(
            usage,
            used=usage.casting_count,
            limit=settings.casting_daily_limit,
            next_reset_at=next_reset_at(settings),
        )

    return usage_summary(
        usage,
        used=usage.detail_reading_count,
        limit=settings.detail_reading_daily_limit,
        next_reset_at=next_reset_at(settings),
    )
