import base64
import json
from pathlib import Path
from urllib.parse import quote

from fastapi.testclient import TestClient

from wenyao_backend.app import create_app
from wenyao_backend.config import Settings


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


def make_client(tmp_path: Path) -> TestClient:
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
        casting_daily_limit=3,
        detail_reading_daily_limit=3,
        incomplete_casting_ttl_hours=24,
        daily_usage_retention_days=180,
        detail_reading_retention_days=90,
        casting_retention_days=180,
        visitor_retention_days=180,
        sqlite_journal_mode="WAL",
        auto_create_db=True,
    )
    return TestClient(create_app(settings))


def test_casting_flow_and_detail_reading_cache(tmp_path: Path) -> None:
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
