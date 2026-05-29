from datetime import UTC, datetime

from .models import Casting, DailyUsage, DetailReading, Visitor
from .time import utcnow


def isoformat(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.isoformat()


def serialize_visitor(visitor: Visitor) -> dict:
    return {
        "visitorId": visitor.visitor_id,
        "createdAt": isoformat(visitor.created_at),
        "lastSeenAt": isoformat(visitor.last_seen_at),
    }


def serialize_casting(casting: Casting) -> dict:
    return {
        "castingId": casting.casting_id,
        "question": casting.question,
        "mode": casting.mode,
        "lines": casting.lines,
        "guaCode": casting.gua_code,
        "status": casting.status,
        "createdAt": isoformat(casting.created_at),
        "updatedAt": isoformat(casting.updated_at),
        "completedAt": isoformat(casting.completed_at),
        "closedAt": isoformat(casting.closed_at),
    }


def serialize_detail_reading(detail: DetailReading) -> dict:
    return {
        "detailReadingId": detail.detail_reading_id,
        "castingId": detail.casting_id,
        "status": detail.status,
        "result": detail.result,
        "errorMessage": detail.error_message,
        "usageCounted": detail.usage_counted,
        "createdAt": isoformat(detail.created_at),
        "updatedAt": isoformat(detail.updated_at),
        "completedAt": isoformat(detail.completed_at),
    }


def usage_summary(
    usage: DailyUsage,
    *,
    used: int,
    limit: int,
    next_reset_at: datetime,
) -> dict:
    remaining = max(limit - used, 0)
    return {
        "date": usage.date.isoformat(),
        "used": used,
        "remaining": remaining,
        "allowed": remaining > 0,
        "nextResetAt": isoformat(next_reset_at),
        "updatedAt": isoformat(usage.updated_at or utcnow()),
    }
