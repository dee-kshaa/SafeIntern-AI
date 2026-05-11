import json
import re
from typing import Any, Dict, Optional

import httpx

from analysis_config import OLLAMA_MODEL, OLLAMA_URL


def clamp(value: Any, minimum: int = 0, maximum: int = 100) -> int:
    try:
        return max(minimum, min(int(round(float(value))), maximum))
    except (TypeError, ValueError):
        return minimum


async def call_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
        )
        response.raise_for_status()
        return response.json().get("response", "")


async def reason_with_gemma(
    *,
    text: str,
    extracted: Dict[str, Any],
    verification: Dict[str, Any],
    scoring: Dict[str, Any],
) -> Optional[Dict[str, Any]]:
    prompt = f"""You are Gemma 4 operating as the primary reasoning model for an internship scam detection backend.

You are reviewing deterministic evidence that was already extracted and scored. False negatives are more dangerous than false positives.
Do not output \"Genuine\" unless BOTH conditions are true:
1. deterministic risk score is 25 or below
2. at least two trust indicators are verified

Return ONLY valid JSON with exactly this schema:
{{
  "classification_candidate": "Genuine|Suspicious|Likely Scam",
  "confidence": 0,
  "risk_score_adjustment": 0,
  "reasoning_summary": "",
  "top_risks": [""],
  "trust_signals": [""],
  "known_scam_patterns": [""],
  "recommendations": [""],
  "verification_assessment": ""
}}

Deterministic evidence:
- risk_score: {scoring['risk_score']}
- verified_trust_count: {scoring['verified_trust_count']}
- verification_status: {verification['verification_status']}
- extracted_entities: {json.dumps(extracted, ensure_ascii=False)}
- trust_indicators: {json.dumps(verification['trust_indicators'], ensure_ascii=False)}
- verification_risks: {json.dumps(verification['risk_indicators'], ensure_ascii=False)}
- complaint_signals: {json.dumps(verification['complaint_signals'], ensure_ascii=False)}
- score_breakdown: {json.dumps(scoring['score_breakdown'], ensure_ascii=False)}

Message text:
{text}
"""

    try:
        response_text = await call_ollama(prompt)
        match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if not match:
            return None
        parsed = json.loads(match.group())
    except Exception:
        return None

    parsed["confidence"] = clamp(parsed.get("confidence"), 0, 100)
    parsed["risk_score_adjustment"] = clamp(parsed.get("risk_score_adjustment"), -10, 10)
    return parsed
