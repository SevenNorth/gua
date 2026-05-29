from typing import Any

from .models import Casting


def generate_detail_reading(casting: Casting, gua_data: dict[str, Any]) -> dict[str, Any]:
    question = casting.question.strip()
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
