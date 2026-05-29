# 问爻后端

轻量 FastAPI 后端，实现匿名访客、每日次数限制、起卦会话恢复、基础解卦校验和详细解卦缓存。

## 开发命令

```bash
uv sync
uv run alembic upgrade head
uv run main.py
```

AI 详细解卦使用 OpenAI v1 兼容接口。复制 `backend/.env.example` 为 `backend/.env`，填写：

```env
WENYAO_AI_BASE_URL=https://your-model-host/v1
WENYAO_AI_API_KEY=your-api-key
WENYAO_AI_MODEL=your-model-name
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
- `WENYAO_AI_BASE_URL`：OpenAI v1 兼容模型地址，例如 `https://example.com/v1`
- `WENYAO_AI_API_KEY`：模型服务密钥
- `WENYAO_AI_MODEL`：模型名称
- `WENYAO_AI_TEMPERATURE`：生成温度，默认 `0.7`
- `WENYAO_AI_TIMEOUT_SECONDS`：模型调用超时时间，默认 `60`

## 接口约定

`PATCH /api/castings/{castingId}/lines` 的 `lines` 按“初爻到上爻”顺序提交，也就是从下到上共 6 个值。

详细解卦由 `wenyao_backend/readings.py` 通过 LangChain 调用 OpenAI v1 兼容模型生成。
