import secrets
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from .cleanup import expire_stale_castings
from .config import Settings
from .database import get_db
from .errors import ApiError
from .gua_data import build_gua_code, load_gua_data, validate_lines
from .models import Casting, DetailReading, Visitor
from .readings import generate_casting_detail_reading, generate_detail_reading
from .serializers import serialize_casting, serialize_detail_reading, serialize_visitor
from .time import utcnow
from .usage import get_usage, get_usage_summary, next_reset_at
from .visitors import get_or_create_visitor

router = APIRouter(prefix="/api")

DbSession = Annotated[Session, Depends(get_db)]
VisitorDep = Annotated[Visitor, Depends(get_or_create_visitor)]

OPEN_CASTING_STATUSES = ("casting", "base_reading_loading", "base_reading_completed")


class CreateCastingRequest(BaseModel):
    question: str = Field(default="", max_length=500)
    mode: Literal["online", "manual"]


class UpdateLinesRequest(BaseModel):
    lines: list[int] = Field(min_length=6, max_length=6)


class AiDetailReadingRequest(BaseModel):
    question: str = Field(default="", max_length=500)
    guaCode: str = Field(min_length=6, max_length=6)
    lines: list[int] = Field(min_length=6, max_length=6)


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def usage_payload(db: Session, visitor_id: str, settings: Settings) -> dict:
    return {
        "castingUsage": get_usage_summary(
            db,
            visitor_id,
            settings,
            kind="casting",
        ),
        "detailReadingUsage": get_usage_summary(
            db,
            visitor_id,
            settings,
            kind="detail_reading",
        ),
    }


def find_current_casting(db: Session, visitor_id: str) -> Casting | None:
    return db.scalars(
        select(Casting)
        .where(Casting.visitor_id == visitor_id)
        .where(Casting.status.in_(OPEN_CASTING_STATUSES))
        .order_by(Casting.created_at.desc())
    ).first()


def find_casting_or_raise(db: Session, visitor_id: str, casting_id: str) -> Casting:
    casting = db.scalars(
        select(Casting)
        .where(Casting.visitor_id == visitor_id)
        .where(Casting.casting_id == casting_id)
    ).first()
    if casting is None:
        raise ApiError("CASTING_NOT_FOUND", "起卦会话不存在。", status_code=404)
    return casting


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/visitor/session")
def visitor_session(
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    expire_stale_castings(db, settings)
    current_casting = find_current_casting(db, visitor.visitor_id)
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()
    return {
        "visitor": serialize_visitor(visitor),
        "currentCasting": serialize_casting(current_casting) if current_casting else None,
        **usage,
    }


@router.post("/castings")
def create_casting(
    payload: CreateCastingRequest,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    expire_stale_castings(db, settings)
    current_casting = find_current_casting(db, visitor.visitor_id)
    if current_casting is not None:
        usage = usage_payload(db, visitor.visitor_id, settings)
        db.commit()
        return {
            "casting": serialize_casting(current_casting),
            "reused": True,
            **usage,
        }

    usage = get_usage(db, visitor.visitor_id, settings)
    if usage.casting_count >= settings.casting_daily_limit:
        raise ApiError(
            "CASTING_LIMIT_EXCEEDED",
            "今日起卦次数已用完，请明日再来。",
            status_code=429,
            details={
                "castingUsage": get_usage_summary(
                    db,
                    visitor.visitor_id,
                    settings,
                    kind="casting",
                )
            },
        )

    usage.casting_count += 1
    now = utcnow()
    casting = Casting(
        casting_id=f"cst_{secrets.token_urlsafe(18)}",
        visitor_id=visitor.visitor_id,
        question=payload.question.strip(),
        mode=payload.mode,
        status="casting",
        created_at=now,
        updated_at=now,
    )
    db.add(casting)
    usage_payload_data = usage_payload(db, visitor.visitor_id, settings)
    db.commit()
    db.refresh(casting)

    return {
        "casting": serialize_casting(casting),
        "reused": False,
        **usage_payload_data,
    }


@router.get("/castings/current")
def current_casting(
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    expire_stale_castings(db, settings)
    current = find_current_casting(db, visitor.visitor_id)
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()
    return {
        "casting": serialize_casting(current) if current else None,
        **usage,
    }


@router.patch("/castings/{casting_id}/lines")
def update_casting_lines(
    casting_id: str,
    payload: UpdateLinesRequest,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    casting = find_casting_or_raise(db, visitor.visitor_id, casting_id)
    if casting.status in {"closed", "expired"}:
        raise ApiError("CASTING_NOT_FOUND", "起卦会话已关闭或过期。", status_code=404)

    lines = validate_lines(payload.lines)
    gua_code = build_gua_code(lines)
    base_reading = load_gua_data(settings.gua_data_dir, gua_code)

    now = utcnow()
    casting.lines = lines
    casting.gua_code = gua_code
    casting.status = "base_reading_completed"
    casting.completed_at = casting.completed_at or now
    casting.updated_at = now
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()
    db.refresh(casting)

    return {
        "casting": serialize_casting(casting),
        "baseReading": base_reading,
        **usage,
    }


@router.post("/ai-detail-reading")
def create_ai_detail_reading(
    payload: AiDetailReadingRequest,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    lines = validate_lines(payload.lines)
    if build_gua_code(lines) != payload.guaCode:
        raise ApiError("INVALID_LINES", "lines 与 guaCode 不匹配。", status_code=422)

    usage = get_usage(db, visitor.visitor_id, settings)
    if usage.detail_reading_count >= settings.detail_reading_daily_limit:
        raise ApiError(
            "DETAIL_READING_LIMIT_EXCEEDED",
            "今日详细解卦次数已用完，请明日再来。",
            status_code=429,
            details={
                "detailReadingUsage": get_usage_summary(
                    db,
                    visitor.visitor_id,
                    settings,
                    kind="detail_reading",
                ),
                "nextResetAt": next_reset_at(settings).isoformat(),
            },
        )

    base_reading = load_gua_data(settings.gua_data_dir, payload.guaCode)
    try:
        result = generate_detail_reading(
            question=payload.question,
            lines=lines,
            gua_data=base_reading,
            settings=settings,
        )
    except ApiError:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise ApiError(
            "DETAIL_READING_GENERATION_FAILED",
            "AI 详细解卦生成失败，请稍后重试。",
            status_code=500,
        ) from exc

    usage.detail_reading_count += 1
    usage.updated_at = utcnow()
    usage_payload_data = usage_payload(db, visitor.visitor_id, settings)
    db.commit()

    return {
        "detailReading": {
            "status": "completed",
            "result": result,
        },
        **usage_payload_data,
    }


@router.post("/castings/{casting_id}/restart")
def restart_casting(
    casting_id: str,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    casting = find_casting_or_raise(db, visitor.visitor_id, casting_id)
    if casting.status != "base_reading_completed":
        raise ApiError("CASTING_NOT_COMPLETED", "基础解卦完成后才能重新起卦。", status_code=409)

    now = utcnow()
    casting.status = "closed"
    casting.closed_at = now
    casting.updated_at = now
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()

    return {
        "casting": serialize_casting(casting),
        **usage,
    }


@router.post("/castings/{casting_id}/detail-reading")
def create_or_get_detail_reading(
    casting_id: str,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    casting = find_casting_or_raise(db, visitor.visitor_id, casting_id)
    if casting.status != "base_reading_completed" or not casting.gua_code:
        raise ApiError("CASTING_NOT_COMPLETED", "基础解卦完成后才能请求详细解卦。", status_code=409)

    detail = db.scalars(
        select(DetailReading).where(DetailReading.casting_id == casting.casting_id)
    ).first()
    if detail and detail.status in {"completed", "generating"}:
        usage = usage_payload(db, visitor.visitor_id, settings)
        db.commit()
        return {
            "detailReading": serialize_detail_reading(detail),
            **usage,
        }

    usage = get_usage(db, visitor.visitor_id, settings)
    if usage.detail_reading_count >= settings.detail_reading_daily_limit:
        raise ApiError(
            "DETAIL_READING_LIMIT_EXCEEDED",
            "今日详细解卦次数已用完，请明日再来。",
            status_code=429,
            details={
                "detailReadingUsage": get_usage_summary(
                    db,
                    visitor.visitor_id,
                    settings,
                    kind="detail_reading",
                ),
                "nextResetAt": next_reset_at(settings).isoformat(),
            },
        )

    if detail is None:
        now = utcnow()
        detail = DetailReading(
            detail_reading_id=f"dr_{secrets.token_urlsafe(18)}",
            casting_id=casting.casting_id,
            visitor_id=visitor.visitor_id,
            status="generating",
            usage_counted=False,
            created_at=now,
            updated_at=now,
        )
        db.add(detail)
    else:
        detail.status = "generating"
        detail.error_message = None
        detail.updated_at = utcnow()

    try:
        base_reading = load_gua_data(settings.gua_data_dir, casting.gua_code)
        result = generate_casting_detail_reading(casting, base_reading, settings)
    except ApiError:
        detail.status = "failed"
        detail.usage_counted = False
        detail.error_message = "详细解卦生成失败。"
        detail.updated_at = utcnow()
        db.commit()
        raise
    except Exception as exc:
        detail.status = "failed"
        detail.usage_counted = False
        detail.error_message = "详细解卦生成失败。"
        detail.updated_at = utcnow()
        db.commit()
        raise ApiError(
            "DETAIL_READING_GENERATION_FAILED",
            "详细解卦生成失败，请稍后重试。",
            status_code=500,
        ) from exc

    usage.detail_reading_count += 1
    now = utcnow()
    detail.status = "completed"
    detail.result = result
    detail.error_message = None
    detail.usage_counted = True
    detail.completed_at = now
    detail.updated_at = now
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()
    db.refresh(detail)

    return {
        "detailReading": serialize_detail_reading(detail),
        **usage,
    }


@router.get("/castings/{casting_id}/detail-reading")
def get_detail_reading(
    casting_id: str,
    db: DbSession,
    visitor: VisitorDep,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict:
    casting = find_casting_or_raise(db, visitor.visitor_id, casting_id)
    detail = db.scalars(
        select(DetailReading).where(DetailReading.casting_id == casting.casting_id)
    ).first()
    usage = usage_payload(db, visitor.visitor_id, settings)
    db.commit()

    return {
        "detailReading": serialize_detail_reading(detail) if detail else None,
        **usage,
    }
