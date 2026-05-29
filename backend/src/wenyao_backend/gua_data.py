import base64
import json
from pathlib import Path
from typing import Any
from urllib.parse import unquote

from .errors import ApiError

VALID_YAO_VALUES = {6, 7, 8, 9}


def validate_lines(lines: list[int]) -> list[int]:
    if len(lines) != 6 or any(line not in VALID_YAO_VALUES for line in lines):
        raise ApiError(
            "INVALID_LINES",
            "lines 必须包含 6 个值，每个值只能是 6、7、8、9。",
            status_code=422,
        )
    return lines


def build_gua_code(lines: list[int]) -> str:
    validate_lines(lines)
    return "".join("1" if line % 2 == 1 else "0" for line in lines)


def load_gua_data(gua_data_dir: Path, gua_code: str) -> dict[str, Any]:
    if len(gua_code) != 6 or any(char not in {"0", "1"} for char in gua_code):
        raise ApiError("BASE_READING_NOT_FOUND", "卦码不合法。", status_code=404)

    file_path = gua_data_dir / f"{gua_code}.txt"
    if not file_path.exists():
        raise ApiError("BASE_READING_NOT_FOUND", "基础解卦数据不存在。", status_code=404)

    try:
        encoded_text = file_path.read_text(encoding="utf-8").strip()
        uri_encoded_json = base64.b64decode(encoded_text).decode("utf-8")
        parsed = json.loads(unquote(uri_encoded_json))
    except (OSError, UnicodeDecodeError, ValueError) as exc:
        raise ApiError("BASE_READING_NOT_FOUND", "基础解卦数据解析失败。", status_code=500) from exc

    if not _is_valid_gua_data(parsed):
        raise ApiError("BASE_READING_NOT_FOUND", "基础解卦数据结构不合法。", status_code=500)

    return parsed


def _is_valid_gua_data(value: Any) -> bool:
    if not isinstance(value, dict):
        return False

    string_fields = ("gua", "name", "info", "intro")
    if any(not isinstance(value.get(field), str) for field in string_fields):
        return False

    return _is_string_list(value.get("explain")) and _is_string_list(value.get("external"))


def _is_string_list(value: Any) -> bool:
    return isinstance(value, list) and all(isinstance(item, str) for item in value)
