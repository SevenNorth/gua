import base64
import json
from pathlib import Path
from urllib.parse import quote

import pytest
from fastapi.testclient import TestClient

from wenyao_backend.app import create_app
from wenyao_backend.config import Settings
from wenyao_backend.errors import ApiError
from wenyao_backend.readings import _parse_ai_result


def write_gua_file(gua_dir: Path, gua_code: str = "111111") -> None:
    gua_dir.mkdir(parents=True, exist_ok=True)
    data = {
        "gua": gua_code,
        "name": "乾为天",
        "info": "刚健中正",
        "intro": "乾卦提示主动进取，也要注意节制和时机。",
        "explain": ["宜稳步推进。", "避免过度自信。"],
        "external": ["参考外部解读。"],
    }
    encoded = base64.b64encode(quote(json.dumps(data, ensure_ascii=False)).encode("utf-8"))
    (gua_dir / f"{gua_code}.txt").write_text(encoded.decode("utf-8"), encoding="utf-8")


def make_client(tmp_path: Path, *, casting_daily_limit: int = 3) -> TestClient:
    gua_dir = tmp_path / "gua"
    write_gua_file(gua_dir)
    settings = Settings(
        env="test",
        database_url=f"sqlite:///{(tmp_path / 'test.db').as_posix()}",
        gua_data_dir=gua_dir,
        allowed_origins=["http://testserver"],
        cookie_name="wenyao_visitor_id",
        cookie_secure=False,
        cookie_max_age_seconds=3600,
        timezone_name="Asia/Shanghai",
        casting_daily_limit=casting_daily_limit,
        detail_reading_daily_limit=3,
        incomplete_casting_ttl_hours=24,
        daily_usage_retention_days=180,
        detail_reading_retention_days=90,
        casting_retention_days=180,
        visitor_retention_days=180,
        sqlite_journal_mode="WAL",
        auto_create_db=True,
        ai_base_url="https://example.test/v1",
        ai_api_key="test-key",
        ai_model="test-model",
        ai_temperature=0.7,
        ai_timeout_seconds=60,
    )
    return TestClient(create_app(settings))


def test_casting_flow_and_detail_reading_cache(tmp_path: Path, monkeypatch) -> None:
    def fake_detail_reading(*args, **kwargs):
        return {
            "title": "乾为天 AI 解读",
            "questionCategory": "事业工作",
            "questionSummary": "是否适合推进计划？",
            "overallJudgement": "当前适合稳步推进，但仍需保留调整空间。",
            "keyAdvice": ["先验证关键条件。"],
            "risks": ["避免过度自信。"],
            "actionItems": ["列出本周行动。"],
        }

    monkeypatch.setattr(
        "wenyao_backend.routes.generate_casting_detail_reading",
        fake_detail_reading,
    )

    with make_client(tmp_path) as client:
        session_response = client.get("/api/visitor/session")
        assert session_response.status_code == 200
        assert session_response.json()["castingUsage"]["used"] == 0

        create_response = client.post(
            "/api/castings",
            json={"question": "是否适合推进计划？", "mode": "manual"},
        )
        assert create_response.status_code == 200
        create_body = create_response.json()
        casting_id = create_body["casting"]["castingId"]
        assert create_body["castingUsage"]["used"] == 1

        reused_response = client.post(
            "/api/castings",
            json={"question": "新问题", "mode": "online"},
        )
        assert reused_response.status_code == 200
        assert reused_response.json()["reused"] is True
        assert reused_response.json()["casting"]["castingId"] == casting_id
        assert reused_response.json()["castingUsage"]["used"] == 1

        lines_response = client.patch(
            f"/api/castings/{casting_id}/lines",
            json={"lines": [7, 7, 7, 7, 7, 7]},
        )
        assert lines_response.status_code == 200
        assert lines_response.json()["casting"]["guaCode"] == "111111"
        assert lines_response.json()["baseReading"]["name"] == "乾为天"

        detail_response = client.post(f"/api/castings/{casting_id}/detail-reading")
        assert detail_response.status_code == 200
        detail_body = detail_response.json()
        detail_id = detail_body["detailReading"]["detailReadingId"]
        assert detail_body["detailReading"]["status"] == "completed"
        assert detail_body["detailReadingUsage"]["used"] == 1

        cached_response = client.post(f"/api/castings/{casting_id}/detail-reading")
        assert cached_response.status_code == 200
        assert cached_response.json()["detailReading"]["detailReadingId"] == detail_id
        assert cached_response.json()["detailReadingUsage"]["used"] == 1


def test_ai_detail_reading_endpoint_counts_usage(tmp_path: Path, monkeypatch) -> None:
    def fake_detail_reading(*args, **kwargs):
        return {
            "title": "乾为天 AI 解读",
            "questionCategory": "事业工作",
            "questionSummary": "是否适合推进计划？",
            "overallJudgement": "当前适合稳步推进，但仍需保留调整空间。",
            "keyAdvice": ["先验证关键条件。"],
            "risks": ["避免过度自信。"],
            "actionItems": ["列出本周行动。"],
        }

    monkeypatch.setattr(
        "wenyao_backend.routes.generate_detail_reading",
        fake_detail_reading,
    )

    with make_client(tmp_path) as client:
        response = client.post(
            "/api/ai-detail-reading",
            json={
                "question": "是否适合推进计划？",
                "guaCode": "111111",
                "lines": [7, 7, 7, 7, 7, 7],
            },
        )

        assert response.status_code == 200
        body = response.json()
        assert body["detailReading"]["status"] == "completed"
        assert body["detailReading"]["result"]["title"] == "乾为天 AI 解读"
        assert body["detailReadingUsage"]["used"] == 1


def test_casting_creation_respects_daily_limit(tmp_path: Path) -> None:
    with make_client(tmp_path, casting_daily_limit=1) as client:
        first_response = client.post(
            "/api/castings",
            json={"question": "第一次", "mode": "manual"},
        )
        assert first_response.status_code == 200
        first_casting_id = first_response.json()["casting"]["castingId"]
        assert first_response.json()["castingUsage"]["used"] == 1
        assert first_response.json()["castingUsage"]["remaining"] == 0

        lines_response = client.patch(
            f"/api/castings/{first_casting_id}/lines",
            json={"lines": [7, 7, 7, 7, 7, 7]},
        )
        assert lines_response.status_code == 200

        restart_response = client.post(f"/api/castings/{first_casting_id}/restart")
        assert restart_response.status_code == 200

        second_response = client.post(
            "/api/castings",
            json={"question": "第二次", "mode": "manual"},
        )
        assert second_response.status_code == 429
        body = second_response.json()
        assert body["error"]["code"] == "CASTING_LIMIT_EXCEEDED"
        assert body["error"]["details"]["castingUsage"]["used"] == 1
        assert body["error"]["details"]["castingUsage"]["remaining"] == 0


def test_parse_ai_result_accepts_json_code_fence() -> None:
    result = _parse_ai_result(
        """```json
{"title":"参考解读","questionCategory":"事业工作","questionSummary":"问题摘要","overallJudgement":"仅供参考。","keyAdvice":["稳步推进"],"risks":["避免冒进"],"actionItems":["先做验证"]}
```"""
    )

    assert result["title"] == "参考解读"
    assert result["questionCategory"] == "事业工作"
    assert result["keyAdvice"] == ["稳步推进"]


def test_parse_ai_result_rejects_incomplete_payload() -> None:
    with pytest.raises(ApiError):
        _parse_ai_result('{"title":"缺字段"}')


def test_parse_ai_result_rejects_unknown_category() -> None:
    with pytest.raises(ApiError):
        _parse_ai_result(
            json.dumps(
                {
                    "title": "参考解读",
                    "questionCategory": "未知分类",
                    "questionSummary": "问题摘要",
                    "overallJudgement": "仅供参考。",
                    "keyAdvice": ["稳步推进"],
                    "risks": ["避免冒进"],
                    "actionItems": ["先做验证"],
                },
                ensure_ascii=False,
            )
        )
