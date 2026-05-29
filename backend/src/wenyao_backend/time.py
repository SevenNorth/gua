from datetime import UTC, datetime, timedelta

from .config import Settings


def utcnow() -> datetime:
    return datetime.now(UTC)


def local_now(settings: Settings) -> datetime:
    return utcnow().astimezone(settings.timezone)


def today(settings: Settings):
    return local_now(settings).date()


def next_local_midnight(settings: Settings) -> datetime:
    now = local_now(settings)
    tomorrow = now.date() + timedelta(days=1)
    return datetime.combine(tomorrow, datetime.min.time(), tzinfo=settings.timezone)
