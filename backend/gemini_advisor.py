"""Gemini-style internship prioritization advisor with deterministic fallback."""

from __future__ import annotations

import json
import re
from typing import Any

try:
    from reasoning import call_ollama
except Exception:
    call_ollama = None


async def explain_priority(internship_record: dict[str, Any]) -> dict[str, Any]:
    fallback = _deterministic_fallback(internship_record)

    if call_ollama is None:
        return fallback

    prompt = f"""You are a career decision support assistant.
Given this internship record, return strict JSON with keys why_risky (string), should_prioritize (boolean), missing_skills (array of strings).

Internship record:
{json.dumps(internship_record, ensure_ascii=False)}

Rules:
- Keep why_risky concise and practical.
- missing_skills should contain 0-4 items.
- Return only valid JSON.
"""

    try:
        response_text = await call_ollama(prompt)
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not match:
            return fallback
        parsed = json.loads(match.group())
        return {
            "why_risky": str(parsed.get("why_risky") or fallback["why_risky"]),
            "should_prioritize": bool(parsed.get("should_prioritize")),
            "missing_skills": _sanitize_skills(parsed.get("missing_skills"), fallback["missing_skills"]),
        }
    except Exception:
        return fallback


def _deterministic_fallback(internship_record: dict[str, Any]) -> dict[str, Any]:
    trust = _to_float(internship_record.get("trust_score"))
    scam = _to_float(internship_record.get("scam_risk_score"))
    deadline = _to_float(internship_record.get("deadline_in_days"))

    should_prioritize = bool(trust >= 55 and scam <= 45 and deadline <= 30)

    if scam >= 70:
        why_risky = "High scam-risk pattern detected in this listing, so verify recruiter identity and company channels before applying."
    elif trust < 45:
        why_risky = "Trust score is low compared to other listings, so prioritize verification before sharing documents."
    elif deadline <= 5:
        why_risky = "Application deadline is very close, which increases urgency pressure; confirm authenticity before quick submission."
    else:
        why_risky = "Risk appears moderate, but independent checks are still recommended before committing effort."

    skills_raw = str(internship_record.get("skills_required") or "")
    missing_skills = [part.strip() for part in skills_raw.split(",") if part.strip()][:3]

    return {
        "why_risky": why_risky,
        "should_prioritize": should_prioritize,
        "missing_skills": missing_skills,
    }


def _sanitize_skills(candidate: Any, fallback: list[str]) -> list[str]:
    if not isinstance(candidate, list):
        return fallback
    clean = [str(item).strip() for item in candidate if str(item).strip()]
    return clean[:4] if clean else fallback


def _to_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0
