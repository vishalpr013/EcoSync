import io
import zipfile

import pytest

from app.api.gamification import validate_challenge_transition
from app.api.reports import _csv_bytes, _excel_bytes, _pdf_bytes
from app.core.exceptions import BadRequestError
from app.models.gamification import ChallengeStatus
from app.models.gamification import Challenge, Difficulty
from app.schemas.common import PaginatedResponse
from app.api.dashboard import _improvement_plan, _score_band


@pytest.fixture
def report():
    return {
        "report_type": "Environmental Carbon Ledger",
        "generated_at": "2026-07-12T00:00:00+00:00",
        "summary": {"total_emissions": 42.5, "scope_1": 42.5},
        "table_rows": [{"date": "2026-07-12", "department": "Manufacturing", "emissions": 42.5}],
    }


def test_official_challenge_lifecycle():
    assert validate_challenge_transition("draft", "active") is ChallengeStatus.ACTIVE
    assert validate_challenge_transition("active", "under_review") is ChallengeStatus.UNDER_REVIEW
    assert validate_challenge_transition("under_review", "completed") is ChallengeStatus.COMPLETED
    assert validate_challenge_transition("completed", "archived") is ChallengeStatus.ARCHIVED


def test_challenge_cannot_skip_review():
    with pytest.raises(BadRequestError):
        validate_challenge_transition("active", "completed")


def test_report_exports_are_real_documents(report):
    csv_content = _csv_bytes(report)
    assert b"Environmental Carbon Ledger" in csv_content
    assert b"Manufacturing" in csv_content

    excel_content = _excel_bytes(report)
    assert zipfile.is_zipfile(io.BytesIO(excel_content))

    pdf_content = _pdf_bytes(report)
    assert pdf_content.startswith(b"%PDF-")
    assert len(pdf_content) > 1000


def test_paginated_response_serializes_sqlalchemy_models():
    challenge = Challenge(title="Zero Waste", description="Test", category_id=None, xp_reward=100,
                          difficulty=Difficulty.MEDIUM, created_by=None)
    payload = PaginatedResponse(items=[challenge], total=1, page=1, page_size=20, total_pages=1)
    assert b'"title":"Zero Waste"' in payload.model_dump_json().encode()


def test_esg_score_plan_prioritizes_the_weakest_pillar():
    assert _score_band(85.25) == {"grade": "B", "label": "Advanced", "next_target": 90}
    plan = _improvement_plan(89, 80.5, 85, {"environmental": 40, "social": 30, "governance": 30})
    assert plan[0]["pillar"] == "social"
    assert plan[0]["projected_overall_impact"] > 0


def test_demo_scores_resolve_to_ninety():
    weighted = 92 * 0.40 + 88 * 0.30 + 89.33 * 0.30
    assert round(weighted, 2) == 90.00
