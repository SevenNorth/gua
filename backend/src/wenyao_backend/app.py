from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .cleanup import cleanup_old_records, expire_stale_castings
from .config import Settings, load_settings
from .database import create_engine_for_settings, create_session_factory, init_db
from .errors import register_error_handlers
from .routes import router


def create_app(settings: Settings | None = None) -> FastAPI:
    app_settings = settings or load_settings()
    engine = create_engine_for_settings(app_settings)
    session_factory = create_session_factory(engine)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if app_settings.auto_create_db:
            init_db(engine)

        with session_factory() as db:
            expire_stale_castings(db, app_settings)
            cleanup_old_records(db, app_settings)
            db.commit()

        yield

    app = FastAPI(title="问爻后端", version="0.1.0", lifespan=lifespan)
    app.state.settings = app_settings
    app.state.engine = engine
    app.state.session_factory = session_factory

    app.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_error_handlers(app)
    app.include_router(router)
    return app
