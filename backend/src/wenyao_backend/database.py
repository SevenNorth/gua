from collections.abc import Generator
from pathlib import Path
from sqlite3 import DatabaseError

from fastapi import Request
from sqlalchemy import Engine, create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from .config import Settings
from .models import Base


def _is_sqlite_url(database_url: str) -> bool:
    return make_url(database_url).drivername.startswith("sqlite")


def create_engine_for_settings(settings: Settings) -> Engine:
    connect_args = {}
    if _is_sqlite_url(settings.database_url):
        connect_args["check_same_thread"] = False
        database = make_url(settings.database_url).database
        if database and database != ":memory:":
            Path(database).parent.mkdir(parents=True, exist_ok=True)

    engine = create_engine(settings.database_url, connect_args=connect_args, future=True)

    if _is_sqlite_url(settings.database_url):

        @event.listens_for(engine, "connect")
        def configure_sqlite(dbapi_connection, _connection_record) -> None:  # type: ignore[no-untyped-def]
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.execute("PRAGMA busy_timeout=5000")
            if make_url(settings.database_url).database != ":memory:":
                try:
                    cursor.execute(f"PRAGMA journal_mode={settings.sqlite_journal_mode}")
                except DatabaseError:
                    cursor.execute("PRAGMA journal_mode=MEMORY")
            cursor.close()

    return engine


def create_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def init_db(engine: Engine) -> None:
    Base.metadata.create_all(bind=engine)


def get_db(request: Request) -> Generator[Session]:
    session_factory = request.app.state.session_factory
    db = session_factory()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
