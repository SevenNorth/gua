# 问爻后端

轻量 FastAPI 后端，实现匿名访客、每日次数限制、起卦会话恢复、基础解卦校验和详细解卦缓存。

## 开发命令

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn wenyao_backend.main:app --reload
```

服务默认读取仓库根目录：

- SQLite 数据库：`data/wenyao.db`
- 基础解卦文件：`public/gua/{gua_code}.txt`

## 常用环境变量

- `WENYAO_DATABASE_URL`：数据库连接，默认 `sqlite:///../data/wenyao.db`
- `WENYAO_GUA_DATA_DIR`：卦象数据目录，默认仓库根目录下的 `public/gua`
- `WENYAO_COOKIE_SECURE`：是否设置 Secure Cookie，开发环境默认 `false`
- `WENYAO_ALLOWED_ORIGINS`：CORS 白名单，逗号分隔
- `WENYAO_TIMEZONE`：每日次数统计时区，默认 `Asia/Shanghai`
- `WENYAO_SQLITE_JOURNAL_MODE`：SQLite journal mode，开发默认 `MEMORY`，生产默认 `WAL`

## 接口约定

`PATCH /api/castings/{castingId}/lines` 的 `lines` 按“初爻到上爻”顺序提交，也就是从下到上共 6 个值。

详细解卦当前是本地结构化生成，用于打通业务流程；后续可以在 `wenyao_backend/readings.py` 中替换为模型生成服务。
