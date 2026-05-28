# 问爻后端 PRD

## 1. 技术栈

- 语言：Python
- Web 框架：FastAPI
- 数据库：PostgreSQL
- ORM：SQLAlchemy
- 数据迁移：Alembic
- 接口格式：REST JSON API

## 2. 后端目标

后端为问爻提供匿名用户识别、每日次数限制、起卦流程记录、基础解卦数据读取、详细解卦生成和历史记录能力。

现阶段不做登录系统，不做支付功能。

## 3. 匿名访客识别

### 3.1 目标

在用户不登录的情况下，尽量识别同一个浏览器或设备，用于每日次数限制和历史记录归属。

### 3.2 规则

- 用户首次访问后端时，如果没有有效访客 Cookie，后端生成 `visitorId`。
- `visitorId` 使用随机不可猜测字符串。
- `visitorId` 通过 Cookie 返回给前端。
- Cookie 应设置：
  - `HttpOnly`
  - `Secure`
  - `SameSite=Lax`
- 不使用浏览器指纹作为主要识别方式。
- IP 只作为风控补充，不作为用户身份。

### 3.3 限制

- 用户清除 Cookie、更换浏览器、更换设备或使用隐私模式时，后端可能无法识别为同一用户。
- 产品口径应描述为“每个设备/浏览器”，不承诺严格识别“每个人”。

## 4. 每日起卦次数限制

### 4.1 规则

- 每个 `visitorId` 每个自然日最多可开始 3 次起卦。
- 进入起卦输入或抛硬币步骤时，前端调用后端开始起卦接口。
- 后端校验当日剩余次数。
- 有剩余次数时，创建起卦会话并扣减一次起卦次数。
- 当日次数用完时，后端拒绝创建新的起卦会话。
- 前端恢复未完成起卦流程时，不应重复扣减次数。

### 4.2 返回信息

后端应返回：

- 今日起卦已用次数
- 今日起卦剩余次数
- 是否允许开始新起卦
- 明日恢复时间

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
- `base_reading_result`
- `created_at`
- `updated_at`
- `completed_at`

### 5.3 规则

- 一个 `visitorId` 同一时间只能有一个未完成起卦会话。
- 如果存在未完成会话，后端应返回该会话，不创建新会话。
- 求问内容在会话创建后锁定。
- 会话完成基础解卦前，不允许修改求问内容。
- 会话完成基础解卦前，不允许创建新的起卦会话。
- 用户点击“重新起卦”时，前端可请求关闭当前已完成会话，然后创建新会话。

## 6. 基础解卦

### 6.1 规则

- 前端完成六爻后，将 `lines` 提交给后端。
- 后端根据六爻生成 6 位卦码。
- 卦码生成规则：
  - 阳爻：`1`
  - 阴爻：`0`
  - 从下到上拼接
- 后端读取对应基础解卦数据。
- 后端保存基础解卦结果到起卦会话。
- 基础解卦完成后，会话状态改为 `base_reading_completed`。

### 6.2 数据来源

现阶段基础解卦数据可继续使用前端已有的 64 个卦象数据文件，后续可迁移到数据库。

## 7. 每日详细解卦次数限制

### 7.1 规则

- 每个 `visitorId` 每个自然日最多可使用 3 次详细解卦。
- 详细解卦只允许在基础解卦完成后请求。
- 详细解卦使用起卦会话中锁定的 `question` 和 `gua_code`。
- 前端不能在请求详细解卦时临时修改问题。
- 次数用完后，后端拒绝请求，并返回明日恢复时间。

### 7.2 返回信息

后端应返回：

- 今日详细解卦已用次数
- 今日详细解卦剩余次数
- 是否允许详细解卦
- 明日恢复时间

## 8. 详细解卦

### 8.1 目标

根据用户锁定的求问内容和卦象，生成针对性解卦内容。

### 8.2 请求数据

详细解卦请求不允许直接传入新的 `question`，只传 `casting_id`。

后端根据 `casting_id` 读取：

- 求问内容
- 卦码
- 六爻原始值
- 基础解卦结果
- 起卦时间

### 8.3 返回内容

详细解卦结果建议包含：

- 解卦标题
- 问题摘要
- 综合判断
- 关键建议
- 风险提醒
- 可执行行动建议

### 8.4 状态

详细解卦记录状态：

- `generating`
- `completed`
- `failed`

### 8.5 规则

- 同一个起卦会话已生成详细解卦后，再次查看不重复扣减次数。
- 生成失败时，不应消耗详细解卦次数，或应支持次数回滚。
- 后端返回内容应避免确定性承诺，表达上应偏参考和建议。

## 9. 历史记录

### 9.1 规则

- 基础解卦完成后，应形成一条历史记录。
- 详细解卦完成后，应更新对应历史记录。
- 历史记录按 `visitorId` 归属。
- 前端可查看最近历史记录。
- 前端可打开某条历史记录查看基础解卦和详细解卦结果。
- 用户可清空自己的历史记录。

### 9.2 保存字段

历史记录至少包含：

- 求问内容
- 起卦时间
- 六爻原始值
- 卦码
- 卦名
- 基础解卦结果
- 详细解卦结果

## 10. API 规划

### 10.1 访客

- `GET /api/visitor/session`
  - 获取或创建匿名访客。
  - 返回访客信息、今日起卦次数、今日详细解卦次数。

### 10.2 起卦

- `POST /api/castings`
  - 创建起卦会话。
  - 请求包含 `question` 和 `mode`。
  - 当日次数不足时返回错误。

- `GET /api/castings/current`
  - 获取当前未完成或最近完成的起卦会话。
  - 用于刷新页面后恢复流程。

- `PATCH /api/castings/{castingId}/lines`
  - 更新六爻结果。
  - 六爻完成后触发基础解卦。

- `POST /api/castings/{castingId}/restart`
  - 在基础解卦完成后关闭当前流程。
  - 用于允许用户重新提问和起卦。

### 10.3 详细解卦

- `POST /api/castings/{castingId}/detail-reading`
  - 创建或获取详细解卦。
  - 当日详细解卦次数不足时返回错误。

- `GET /api/castings/{castingId}/detail-reading`
  - 获取详细解卦状态和结果。

### 10.4 历史记录

- `GET /api/history`
  - 获取当前访客历史记录。

- `GET /api/history/{historyId}`
  - 获取单条历史记录详情。

- `DELETE /api/history`
  - 清空当前访客历史记录。

## 11. 数据表建议

### 11.1 visitors

- `id`
- `visitor_id`
- `created_at`
- `last_seen_at`

### 11.2 daily_casting_limits

- `id`
- `visitor_id`
- `date`
- `casting_count`
- `created_at`
- `updated_at`

### 11.3 daily_detail_reading_limits

- `id`
- `visitor_id`
- `date`
- `detail_reading_count`
- `created_at`
- `updated_at`

### 11.4 castings

- `id`
- `casting_id`
- `visitor_id`
- `question`
- `mode`
- `lines`
- `gua_code`
- `status`
- `base_reading_result`
- `created_at`
- `updated_at`
- `completed_at`

### 11.5 detail_readings

- `id`
- `detail_reading_id`
- `casting_id`
- `visitor_id`
- `status`
- `result`
- `error_message`
- `created_at`
- `updated_at`
- `completed_at`

### 11.6 history_records

- `id`
- `history_id`
- `visitor_id`
- `casting_id`
- `question`
- `lines`
- `gua_code`
- `gua_name`
- `base_reading_result`
- `detail_reading_result`
- `created_at`
- `updated_at`

## 12. 错误码建议

- `VISITOR_REQUIRED`
- `CASTING_LIMIT_EXCEEDED`
- `DETAIL_READING_LIMIT_EXCEEDED`
- `CASTING_IN_PROGRESS`
- `CASTING_NOT_FOUND`
- `CASTING_NOT_COMPLETED`
- `QUESTION_LOCKED`
- `INVALID_LINES`
- `BASE_READING_NOT_FOUND`
- `DETAIL_READING_GENERATION_FAILED`

## 13. 后续扩展

- 登录系统。
- 付费起卦。
- 付费详细解卦。
- 动爻和变卦。
- 后台管理系统。
- 基础解卦数据迁移到数据库。
