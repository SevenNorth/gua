# 问爻后端 PRD

## 1. 技术栈

- 语言：Python
- Web 框架：FastAPI
- 数据库：SQLite
- ORM：SQLAlchemy
- 数据迁移：Alembic
- 接口格式：REST JSON API
- 默认数据库文件：`data/wenyao.db`

当前阶段以后端轻量可部署为优先，不引入 PostgreSQL。后续如果出现多实例部署、高写并发、后台运营分析或更复杂查询，再迁移到 PostgreSQL。

SQLite 使用要求：

- 数据库文件必须放在持久化目录，不能放在临时目录。
- 启用 WAL 模式，降低读写互相阻塞。
- 启用 foreign key 约束。
- 设置合理的 busy timeout，避免短时间写锁直接失败。
- 部署时需要定期备份 `.db` 文件。

## 2. 当前阶段后端目标

后端为问爻提供最小必要服务端能力：

- 匿名访客识别。
- 每日起卦次数限制。
- 每日详细解卦次数限制。
- 当前起卦流程记录与刷新恢复。
- 根据六爻生成卦码，并校验基础解卦数据是否存在。
- 详细解卦生成与结果缓存。

当前阶段不做：

- 登录系统。
- 服务端历史记录列表。
- 服务端清空历史记录。
- 独立 `history_records` 表。
- 基础解卦数据入库。
- 广告商接入。

历史记录当前继续由前端 `localStorage` 保存。后端只保存完成次数限制、流程锁定、详细解卦生成和重复查看所需的数据。

## 3. 匿名访客识别

### 3.1 目标

在用户不登录的情况下，尽量识别同一个浏览器或设备，用于每日次数限制、当前流程恢复和详细解卦缓存归属。

### 3.2 规则

- 用户首次访问后端时，如果没有有效访客 Cookie，后端生成 `visitorId`。
- `visitorId` 使用随机不可猜测字符串。
- `visitorId` 通过 Cookie 返回给前端。
- Cookie 应设置：
  - `HttpOnly`
  - `Secure`
  - `SameSite=Lax`
- 本地开发环境可通过配置关闭 `Secure`，生产环境必须开启。
- 不使用浏览器指纹作为主要识别方式。
- IP 只作为风控补充，不作为用户身份。

### 3.3 产品口径

- 产品文案应描述为“每个设备/浏览器每天 3 次”。
- 不承诺严格识别“每个人”。
- 用户清除 Cookie、更换浏览器、更换设备或使用隐私模式时，后端可能无法识别为同一用户。

## 4. 每日起卦次数限制

### 4.1 规则

- 每个 `visitorId` 每个自然日最多可开始 3 次起卦。
- 进入起卦输入或抛硬币步骤时，前端调用后端开始起卦接口。
- 后端校验当日剩余次数。
- 有剩余次数时，创建起卦会话并扣减一次起卦次数。
- 如果当前存在未关闭的起卦会话，后端返回该会话，不重复扣减次数。
- 当日次数用完时，后端拒绝创建新的起卦会话。
- 起卦次数按服务端日期统计，默认使用服务端本地时区。

### 4.2 返回信息

后端应返回：

- 今日起卦已用次数。
- 今日起卦剩余次数。
- 是否允许开始新起卦。
- 明日恢复时间。

## 5. 起卦流程会话

### 5.1 目标

支持起卦过程中刷新页面后恢复状态，并保证基础解卦完成前不能重新提问或重新起卦。

### 5.2 会话状态

起卦会话至少包含：

- `casting_id`
- `visitor_id`
- `question`
- `mode`
  - `online`
  - `manual`
- `lines`
- `gua_code`
- `status`
  - `casting`
  - `base_reading_loading`
  - `base_reading_completed`
  - `closed`
  - `expired`
- `created_at`
- `updated_at`
- `completed_at`
- `closed_at`

### 5.3 规则

- 一个 `visitorId` 同一时间只能有一个未关闭起卦会话。
- 未关闭状态包括 `casting`、`base_reading_loading`、`base_reading_completed`。
- 如果存在未关闭会话，创建接口应返回该会话，不创建新会话，也不重复扣减次数。
- 求问内容在会话创建后锁定。
- 会话完成基础解卦前，不允许修改求问内容。
- 用户点击“重新起卦”时，前端请求关闭当前已完成会话，然后再创建新会话。
- 未完成会话超过 24 小时可标记为 `expired`，不再阻塞用户重新起卦。

## 6. 基础解卦

### 6.1 规则

- 前端完成六爻后，将 `lines` 提交给后端。
- `lines` 只能包含 6 个值，每个值必须是 `6`、`7`、`8`、`9`。
- 后端根据六爻生成 6 位卦码。
- 卦码生成规则：
  - `7`、`9` 为阳爻，记为 `1`。
  - `6`、`8` 为阴爻，记为 `0`。
  - 按从下到上的顺序拼接。
- 后端校验对应基础解卦文件存在。
- 后端保存 `lines`、`gua_code`，并将会话状态改为 `base_reading_completed`。

### 6.2 数据来源

现阶段基础解卦数据继续使用前端已有的 64 个卦象数据文件：

- 路径：`public/gua/{gua_code}.txt`
- 文件名示例：`111111.txt`

后端不把基础解卦完整 JSON 存入数据库。接口可以按需读取静态文件并返回基础解卦内容，但数据库只持久化 `gua_code` 和流程状态，避免重复存储大字段。

## 7. 每日详细解卦次数限制

### 7.1 规则

- 每个 `visitorId` 每个自然日最多可使用 3 次详细解卦。
- 详细解卦只允许在基础解卦完成后请求。
- 详细解卦使用起卦会话中锁定的 `question`、`lines` 和 `gua_code`。
- 前端不能在请求详细解卦时临时修改问题。
- 同一个起卦会话已生成详细解卦后，再次查看不重复扣减次数。
- 次数用完后，后端拒绝请求，并返回明日恢复时间。
- 生成失败时不应消耗详细解卦次数；如果已预扣次数，必须回滚或标记未计数。

### 7.2 返回信息

后端应返回：

- 今日详细解卦已用次数。
- 今日详细解卦剩余次数。
- 是否允许详细解卦。
- 明日恢复时间。

## 8. 详细解卦

### 8.1 目标

根据用户锁定的求问内容和卦象，生成针对性解卦内容。

### 8.2 请求数据

详细解卦请求不允许直接传入新的 `question`，只传 `casting_id`。

后端根据 `casting_id` 读取：

- 求问内容。
- 卦码。
- 六爻原始值。
- 基础解卦数据。
- 起卦时间。

### 8.3 返回内容

详细解卦结果建议包含：

- 解卦标题。
- 问题摘要。
- 综合判断。
- 关键建议。
- 风险提醒。
- 可执行行动建议。

### 8.4 状态

详细解卦记录状态：

- `generating`
- `completed`
- `failed`

### 8.5 规则

- 同一个起卦会话只保留一条详细解卦记录。
- 已完成详细解卦后，再次请求直接返回已完成结果。
- 生成中再次请求返回当前生成状态，不重复创建任务。
- 生成失败后可允许用户重试，重试前不应消耗次数。
- 后端返回内容应避免确定性承诺，表达上应偏参考和建议。

## 9. 历史记录

当前阶段历史记录不由后端实现，继续由前端 `localStorage` 保存。

前端历史记录至少保存：

- 求问内容。
- 起卦时间。
- 六爻原始值。
- 卦码。
- 卦名。
- 基础解卦结果。
- 详细解卦结果。

后端不提供历史记录列表、历史详情和清空历史记录接口。后续如果要支持跨设备历史、登录用户历史或后台管理，再新增服务端历史能力。

## 10. API 规划

### 10.1 访客

- `GET /api/visitor/session`
  - 获取或创建匿名访客。
  - 返回访客信息、今日起卦次数、今日详细解卦次数。

### 10.2 起卦

- `POST /api/castings`
  - 创建起卦会话或返回当前未关闭会话。
  - 请求包含 `question` 和 `mode`。
  - 当日次数不足时返回错误。

- `GET /api/castings/current`
  - 获取当前未关闭起卦会话。
  - 用于刷新页面后恢复流程。

- `PATCH /api/castings/{castingId}/lines`
  - 更新六爻结果。
  - 六爻完成后生成卦码并完成基础解卦状态。

- `POST /api/castings/{castingId}/restart`
  - 在基础解卦完成后关闭当前流程。
  - 用于允许用户重新提问和起卦。

### 10.3 详细解卦

- `POST /api/castings/{castingId}/detail-reading`
  - 创建、重试或获取详细解卦。
  - 当日详细解卦次数不足时返回错误。
  - 已完成时直接返回缓存结果。

- `GET /api/castings/{castingId}/detail-reading`
  - 获取详细解卦状态和结果。

## 11. 数据表

### 11.1 visitors

- `id`
- `visitor_id`
- `created_at`
- `last_seen_at`

索引与约束：

- `visitor_id` 唯一索引。
- `last_seen_at` 普通索引，用于清理长期未访问访客。

### 11.2 daily_usage

合并每日起卦次数和每日详细解卦次数，避免拆成多张小表。

- `id`
- `visitor_id`
- `date`
- `casting_count`
- `detail_reading_count`
- `created_at`
- `updated_at`

索引与约束：

- `(visitor_id, date)` 唯一索引。
- `date` 普通索引，用于清理历史用量数据。

### 11.3 castings

- `id`
- `casting_id`
- `visitor_id`
- `question`
- `mode`
- `lines`
- `gua_code`
- `status`
- `created_at`
- `updated_at`
- `completed_at`
- `closed_at`

说明：

- `lines` 在 SQLite 中可用 JSON 或 TEXT 存储。
- 不保存完整 `base_reading_result`。
- `question` 允许为空，但创建后锁定。

索引与约束：

- `casting_id` 唯一索引。
- `visitor_id` 普通索引。
- `(visitor_id, status)` 普通索引，用于查找当前未关闭会话。
- `created_at` 普通索引，用于清理过期会话。

### 11.4 detail_readings

- `id`
- `detail_reading_id`
- `casting_id`
- `visitor_id`
- `status`
- `result`
- `error_message`
- `usage_counted`
- `created_at`
- `updated_at`
- `completed_at`

说明：

- `result` 在 SQLite 中可用 JSON 或 TEXT 存储。
- `usage_counted` 用于标记本次详细解卦是否已经扣减每日次数，避免失败后次数无法回滚。

索引与约束：

- `detail_reading_id` 唯一索引。
- `casting_id` 唯一索引，保证同一次起卦只有一条详细解卦记录。
- `visitor_id` 普通索引。
- `created_at` 普通索引，用于清理旧缓存。

## 12. 数据保留与清理策略

为避免 SQLite 文件持续膨胀，后端必须提供定期清理策略。可以先通过启动时任务、后台定时任务或运维脚本实现。

建议默认策略：

- 未完成起卦会话超过 24 小时，标记为 `expired`。
- `daily_usage` 只保留最近 180 天。
- `detail_readings` 只保留最近 90 天，或每个 `visitorId` 只保留最近 20 条。
- `castings` 只保留最近 180 天，或每个 `visitorId` 只保留最近 20 条。
- `visitors` 超过 180 天未访问，且没有需要保留的起卦或详细解卦记录时，可以删除。

如果执行了大量删除，后续可在低峰期执行 SQLite `VACUUM` 回收文件空间。

## 13. 错误码建议

- `VISITOR_REQUIRED`
- `CASTING_LIMIT_EXCEEDED`
- `DETAIL_READING_LIMIT_EXCEEDED`
- `CASTING_IN_PROGRESS`
- `CASTING_NOT_FOUND`
- `CASTING_NOT_COMPLETED`
- `QUESTION_LOCKED`
- `INVALID_LINES`
- `BASE_READING_NOT_FOUND`
- `DETAIL_READING_GENERATING`
- `DETAIL_READING_GENERATION_FAILED`

## 14. 后续扩展

- PostgreSQL 迁移。
- 登录系统。
- 服务端历史记录。
- 动爻和变卦。
- 基础解卦数据迁移到数据库。
- 广告商接入与激励广告奖励校验。
- 后台管理系统。

广告商接入属于大后期能力，不进入当前阶段后端接口和数据表设计。后续实现时应考虑：

- 对接广告商服务端奖励回调或校验接口，不能只依赖前端广告完成回调。
- 记录广告观看、奖励发放、奖励使用和失败原因。
- 将广告奖励与 `visitorId`、日期和奖励类型绑定，例如额外起卦机会或额外详细解卦机会。
- 做好幂等控制，避免同一广告回调重复发放权益。
- 广告奖励不可转让、不可折现，只用于当前产品内的次数权益。
- 遵守广告商平台规则、隐私合规要求和用户所在地适用法规。
