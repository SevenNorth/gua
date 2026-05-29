from os import environ

import uvicorn


def main() -> None:
    uvicorn.run(
        "wenyao_backend.main:app",
        host=environ.get("WENYAO_HOST", "127.0.0.1"),
        port=int(environ.get("WENYAO_PORT", "8000")),
        reload=environ.get("WENYAO_RELOAD", "true").lower() in {"1", "true", "yes", "on"},
    )


if __name__ == "__main__":
    main()
