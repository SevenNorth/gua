import re
import secrets
from typing import Annotated

from fastapi import Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings
from .database import get_db
from .models import Visitor
from .time import utcnow

VISITOR_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{24,128}$")


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def new_visitor_id() -> str:
    return secrets.token_urlsafe(32)


def set_visitor_cookie(response: Response, settings: Settings, visitor_id: str) -> None:
    response.set_cookie(
        key=settings.cookie_name,
        value=visitor_id,
        max_age=settings.cookie_max_age_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


def get_or_create_visitor(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> Visitor:
    cookie_visitor_id = request.cookies.get(settings.cookie_name)
    visitor = None

    if cookie_visitor_id and VISITOR_ID_PATTERN.match(cookie_visitor_id):
        visitor = db.scalars(
            select(Visitor).where(Visitor.visitor_id == cookie_visitor_id)
        ).first()

    now = utcnow()
    if visitor is None:
        visitor = Visitor(
            visitor_id=new_visitor_id(),
            created_at=now,
            last_seen_at=now,
        )
        db.add(visitor)
        db.flush()
    else:
        visitor.last_seen_at = now

    set_visitor_cookie(response, settings, visitor.visitor_id)
    return visitor
