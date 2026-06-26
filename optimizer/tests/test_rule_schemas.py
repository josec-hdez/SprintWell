"""Parity between the shared rule JSON Schemas and the Pydantic params (issue #56).

The schemas in ``/shared/rule-schemas`` are the single source of truth consumed
by both the backend (ajv) and this optimizer. This test loads each schema and
asserts the optimizer's Pydantic ``*Params`` model agrees on field names and
required fields, so the two validators cannot silently diverge (brief §6.1, §15).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from pydantic import BaseModel

from models import (
    AvoidCategoryParams,
    AvoidSkillParams,
    AvoidWeekdayParams,
    BlackoutDateParams,
    CooldownAfterParams,
    FocusPreferenceParams,
    LearnSkillParams,
    MaxTasksPerSprintParams,
    PreferCategoryParams,
    PreferDomainParams,
    PreferSkillParams,
    PreferWeekdayParams,
)

_SCHEMAS_DIR = Path(__file__).resolve().parents[2] / "shared" / "rule-schemas"

_MODELS: dict[str, type[BaseModel]] = {
    "PREFER_SKILL": PreferSkillParams,
    "AVOID_SKILL": AvoidSkillParams,
    "PREFER_CATEGORY": PreferCategoryParams,
    "AVOID_CATEGORY": AvoidCategoryParams,
    "PREFER_DOMAIN": PreferDomainParams,
    "PREFER_WEEKDAY": PreferWeekdayParams,
    "AVOID_WEEKDAY": AvoidWeekdayParams,
    "BLACKOUT_DATE": BlackoutDateParams,
    "MAX_TASKS_PER_SPRINT": MaxTasksPerSprintParams,
    "FOCUS_PREFERENCE": FocusPreferenceParams,
    "COOLDOWN_AFTER": CooldownAfterParams,
    "LEARN_SKILL": LearnSkillParams,
}


def _index() -> dict[str, str]:
    data = json.loads((_SCHEMAS_DIR / "index.json").read_text(encoding="utf-8"))
    assert data["schemaVersion"] == 1
    types: dict[str, str] = data["types"]
    return types


def test_index_covers_every_rule_type() -> None:
    assert set(_index()) == set(_MODELS)


@pytest.mark.parametrize("rule_type", sorted(_MODELS))
def test_schema_matches_pydantic_params(rule_type: str) -> None:
    schema = json.loads((_SCHEMAS_DIR / _index()[rule_type]).read_text(encoding="utf-8"))
    model = _MODELS[rule_type]

    schema_properties = set(schema["properties"].keys())
    model_fields = set(model.model_fields)
    assert schema_properties == model_fields, f"{rule_type}: property/field mismatch"

    schema_required = set(schema.get("required", []))
    model_required = {name for name, field in model.model_fields.items() if field.is_required()}
    assert schema_required == model_required, f"{rule_type}: required mismatch"
