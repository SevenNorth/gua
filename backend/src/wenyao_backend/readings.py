import json
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from .config import Settings
from .errors import ApiError
from .models import Casting

REQUIRED_READING_FIELDS = {
    "title",
    "questionSummary",
    "overallJudgement",
    "keyAdvice",
    "risks",
    "actionItems",
}


def generate_local_detail_reading(
    *,
    question: str,
    lines: list[int] | None,
    gua_data: dict[str, Any],
) -> dict[str, Any]:
    del lines

    question = question.strip()
    question_summary = question or "本次起卦未填写具体问题，以下解读以卦象本身为参考。"
    gua_name = gua_data["name"]
    intro = gua_data["intro"]
    explain = gua_data["explain"]

    first_explain = explain[0] if explain else intro
    second_explain = explain[1] if len(explain) > 1 else intro

    return {
        "title": f"{gua_name}参考解读",
        "questionSummary": question_summary,
        "overallJudgement": (
            f"本次卦象为{gua_name}。结合卦象简介，当前更适合把它作为趋势和取舍的提醒，"
            f"不要把结果理解为确定承诺。{intro}"
        ),
        "keyAdvice": [
            first_explain,
            "先确认问题中最关键的约束，再决定是否推进；能小步验证的事项，不宜一次性押上全部资源。",
            "如果外部条件还不稳定，优先补齐信息、观察反馈，再做不可逆决定。",
        ],
        "risks": [
            second_explain,
            "卦象只能提供参考，现实结果仍会受到资源、时机、沟通和执行质量影响。",
            "避免因为短期顺逆而过度乐观或过度悲观，尤其要留意成本和边界。",
        ],
        "actionItems": [
            "把当前问题拆成一个本周可以验证的小行动。",
            "列出最影响结果的三个变量，并分别准备应对方案。",
            "在做最终决定前，找一个可信赖的人复盘假设和风险。",
        ],
    }


def generate_detail_reading(
    *,
    question: str,
    lines: list[int] | None,
    gua_data: dict[str, Any],
    settings: Settings,
) -> dict[str, Any]:
    if not settings.ai_configured:
        raise ApiError(
            "AI_MODEL_NOT_CONFIGURED",
            "AI 模型未配置，请先填写 backend/.env 中的模型地址、密钥和模型名称。",
            status_code=503,
        )

    model = ChatOpenAI(
        model=settings.ai_model,
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,
        temperature=settings.ai_temperature,
        timeout=settings.ai_timeout_seconds,
        max_retries=1,
    )
    response = model.invoke(
        [
            SystemMessage(content=_system_prompt()),
            HumanMessage(content=_user_prompt(question=question, lines=lines, gua_data=gua_data)),
        ]
    )
    return _parse_ai_result(response.content)


def generate_casting_detail_reading(
    casting: Casting,
    gua_data: dict[str, Any],
    settings: Settings,
) -> dict[str, Any]:
    return generate_detail_reading(
        question=casting.question,
        lines=casting.lines,
        gua_data=gua_data,
        settings=settings,
    )


def _system_prompt() -> str:
    return (
        "你是一个谨慎、克制的周易解读助手。"
        "你的任务是根据用户问题、六爻结果和基础卦象材料，生成参考性质的详细解卦。"
        "不要做确定性承诺，不要声称能预测绝对结果，不要提供医疗、法律、金融等高风险结论。"
        "只输出 JSON，不要输出 Markdown、代码块或额外说明。"
    )


def _user_prompt(
    *,
    question: str,
    lines: list[int] | None,
    gua_data: dict[str, Any],
) -> str:
    payload = {
        "question": question.strip() or "未填写具体问题",
        "linesFromBottomToTop": lines or [],
        "gua": {
            "code": gua_data["gua"],
            "name": gua_data["name"],
            "info": gua_data["info"],
            "intro": gua_data["intro"],
            "explain": gua_data["explain"],
            "external": gua_data["external"][:3],
        },
        "outputSchema": {
            "title": "string，简短标题",
            "questionSummary": "string，对问题的中性摘要",
            "overallJudgement": "string，综合判断，明确是参考建议",
            "keyAdvice": "string[]，3 条关键建议",
            "risks": "string[]，3 条风险提醒",
            "actionItems": "string[]，3 条可执行行动建议",
        },
    }
    return (
        "请基于以下 JSON 数据生成详细解卦。"
        "返回值必须是同一层级的 JSON 对象，必须包含 outputSchema 中列出的全部字段；"
        "keyAdvice、risks、actionItems 必须是字符串数组，每组 3 条，单条不超过 60 个中文字符。\n"
        f"{json.dumps(payload, ensure_ascii=False)}"
    )


def _parse_ai_result(content: Any) -> dict[str, Any]:
    if not isinstance(content, str):
        raise ApiError("AI_READING_INVALID_RESPONSE", "AI 解卦返回格式不合法。", status_code=502)

    text = content.strip()
    if text.startswith("```"):
        text = _strip_code_fence(text)

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ApiError(
            "AI_READING_INVALID_RESPONSE",
            "AI 解卦返回格式不是合法 JSON。",
            status_code=502,
        ) from exc

    if not _is_valid_reading_result(parsed):
        raise ApiError("AI_READING_INVALID_RESPONSE", "AI 解卦返回结构不完整。", status_code=502)

    return parsed


def _strip_code_fence(text: str) -> str:
    lines = text.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    return "\n".join(lines).strip()


def _is_valid_reading_result(value: Any) -> bool:
    if not isinstance(value, dict) or not REQUIRED_READING_FIELDS.issubset(value):
        return False

    string_fields = ("title", "questionSummary", "overallJudgement")
    if any(not isinstance(value.get(field), str) for field in string_fields):
        return False

    list_fields = ("keyAdvice", "risks", "actionItems")
    return all(_is_string_list(value.get(field)) for field in list_fields)


def _is_string_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)
