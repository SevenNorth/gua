from dataclasses import dataclass
from os import environ
from pathlib import Path
from zoneinfo import ZoneInfo

from dotenv import load_dotenv


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _bool_env(name: str, default: bool) -> bool:
    raw_value = environ.get(name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _int_env(name: str, default: int) -> int:
    raw_value = environ.get(name)
    if raw_value is None:
        return default
    return int(raw_value)


def _float_env(name: str, default: float) -> float:
    raw_value = environ.get(name)
    if raw_value is None:
        return default
    return float(raw_value)


def _list_env(name: str, default: list[str]) -> list[str]:
    raw_value = environ.get(name)
    if raw_value is None:
        return default
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _sqlite_url(path: Path) -> str:
    return f"sqlite:///{path.as_posix()}"


@dataclass(frozen=True)
class Settings:
    env: str
    database_url: str
    gua_data_dir: Path
    allowed_origins: list[str]
    cookie_name: str
    cookie_secure: bool
    cookie_max_age_seconds: int
    timezone_name: str
    casting_daily_limit: int
    detail_reading_daily_limit: int
    incomplete_casting_ttl_hours: int
    daily_usage_retention_days: int
    detail_reading_retention_days: int
    casting_retention_days: int
    visitor_retention_days: int
    sqlite_journal_mode: str
    auto_create_db: bool
    ai_base_url: str
    ai_api_key: str
    ai_model: str
    ai_temperature: float
    ai_timeout_seconds: int

    @property
    def timezone(self) -> ZoneInfo:
        return ZoneInfo(self.timezone_name)

    @property
    def ai_configured(self) -> bool:
        return bool(self.ai_base_url and self.ai_api_key and self.ai_model)


def load_settings() -> Settings:
    root = _repo_root()
    load_dotenv(root / "backend" / ".env")

    env = environ.get("WENYAO_ENV", "development")
    default_database_path = root / "data" / "wenyao.db"
    default_database_url = _sqlite_url(default_database_path)
    default_allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    return Settings(
        env=env,
        database_url=environ.get("WENYAO_DATABASE_URL", default_database_url),
        gua_data_dir=Path(environ.get("WENYAO_GUA_DATA_DIR", root / "public" / "gua")),
        allowed_origins=_list_env("WENYAO_ALLOWED_ORIGINS", default_allowed_origins),
        cookie_name=environ.get("WENYAO_COOKIE_NAME", "wenyao_visitor_id"),
        cookie_secure=_bool_env("WENYAO_COOKIE_SECURE", env != "development"),
        cookie_max_age_seconds=_int_env("WENYAO_COOKIE_MAX_AGE_SECONDS", 180 * 24 * 60 * 60),
        timezone_name=environ.get("WENYAO_TIMEZONE", "Asia/Shanghai"),
        casting_daily_limit=_int_env("WENYAO_CASTING_DAILY_LIMIT", 3),
        detail_reading_daily_limit=_int_env("WENYAO_DETAIL_READING_DAILY_LIMIT", 3),
        incomplete_casting_ttl_hours=_int_env("WENYAO_INCOMPLETE_CASTING_TTL_HOURS", 24),
        daily_usage_retention_days=_int_env("WENYAO_DAILY_USAGE_RETENTION_DAYS", 180),
        detail_reading_retention_days=_int_env("WENYAO_DETAIL_READING_RETENTION_DAYS", 90),
        casting_retention_days=_int_env("WENYAO_CASTING_RETENTION_DAYS", 180),
        visitor_retention_days=_int_env("WENYAO_VISITOR_RETENTION_DAYS", 180),
        sqlite_journal_mode=environ.get(
            "WENYAO_SQLITE_JOURNAL_MODE",
            "MEMORY" if env == "development" else "WAL",
        ).upper(),
        auto_create_db=_bool_env("WENYAO_AUTO_CREATE_DB", True),
        ai_base_url=environ.get("WENYAO_AI_BASE_URL", "").strip(),
        ai_api_key=environ.get("WENYAO_AI_API_KEY", "").strip(),
        ai_model=environ.get("WENYAO_AI_MODEL", "").strip(),
        ai_temperature=_float_env("WENYAO_AI_TEMPERATURE", 0.7),
        ai_timeout_seconds=_int_env("WENYAO_AI_TIMEOUT_SECONDS", 60),
    )
