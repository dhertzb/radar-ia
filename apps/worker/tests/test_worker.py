from datetime import date

import pytest
from pydantic import ValidationError

from radar_worker.analysis import local_analysis
from radar_worker.cli import validate_runtime_settings
from radar_worker.config import Settings
from radar_worker.fixture import demo_data
from radar_worker.indicators import market_changes, risk_index
from radar_worker.models import Payload, Run


def payload(day=date(2026, 11, 8)):
    assets, closes, docs, evidence, events = demo_data(day)
    report = local_analysis(day.isoformat(), evidence, events, closes, len(docs))
    return Payload(
        run=Run(
            stableKey=f"daily:{day}:demo",
            startedAt="2026-11-08T10:00:00Z",
            finishedAt="2026-11-08T10:01:00Z",
            mode="DEMO",
            sourceFailures=[],
        ),
        companies=__import__("radar_worker.fixture", fromlist=["COMPANIES"]).COMPANIES,
        assets=assets,
        closes=closes,
        documents=docs,
        evidence=evidence,
        events=events,
        report=report,
    )


def test_weekend_preserves_last_trading_day():
    p = payload()
    assert max(c.tradingDate for c in p.closes) == "2026-11-06"


def test_variations_are_computed_in_code():
    p = payload(date(2026, 11, 11))
    result = market_changes(p.closes)
    assert result["nasdaq:NVDA"]["change_1d"] is not None
    assert result["nasdaq:NVDA"]["change_20d"] is not None


def test_insufficient_coverage_has_no_score():
    score, coverage, _ = risk_index([], [], 0)
    assert score is None and coverage < 0.6


def test_invalid_ai_reference_is_rejected():
    raw = payload().model_dump(mode="json")
    raw["report"]["evidenceStableKeys"].append("invented")
    with pytest.raises(ValidationError):
        Payload.model_validate(raw)


def test_stable_key_makes_rerun_idempotent():
    assert payload().run.stableKey == payload().run.stableKey


def test_runtime_settings_reject_empty_ingest_token():
    cfg = Settings(api_url="https://example.com/api/v1", ingest_token="")
    with pytest.raises(ValueError, match="INGEST_TOKEN"):
        validate_runtime_settings(cfg, False)


def test_runtime_settings_reject_empty_sec_user_agent_in_live_mode():
    cfg = Settings(api_url="https://example.com/api/v1", ingest_token="secret", sec_user_agent="")
    with pytest.raises(ValueError, match="SEC_USER_AGENT"):
        validate_runtime_settings(cfg, False)


def test_runtime_settings_allow_demo_without_sec_user_agent():
    cfg = Settings(api_url="https://example.com/api/v1", ingest_token="secret", sec_user_agent="")
    validate_runtime_settings(cfg, True)
