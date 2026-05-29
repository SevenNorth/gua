FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app/backend

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

COPY backend/ ./

RUN uv sync --frozen --no-dev

EXPOSE 8000

CMD ["uv", "run", "main.py"]
