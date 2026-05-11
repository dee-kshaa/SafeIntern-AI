from typing import Any, Dict, Optional

from extraction import extract_structured_entities, extract_text_from_upload
from reasoning import reason_with_gemma
from scoring import clamp, score_analysis
from verification import verify_entities


GENUINE_THRESHOLD = 25
SUSPICIOUS_THRESHOLD = 55
MIN_LLM_CONFIDENCE_FOR_ADJUSTMENT = 40


def _classification_from_score(score: int) -> str:
    if score <= GENUINE_THRESHOLD:
        return "Genuine"
    if score <= SUSPICIOUS_THRESHOLD:
        return "Suspicious"
    return "Likely Scam"


def _build_summary(classification: str, verification_status: str, reasons: list[str]) -> str:
    if classification == "Likely Scam":
        return "This opportunity shows multiple scam indicators and should be treated as unsafe until proven otherwise."
    if classification == "Suspicious":
        return "This opportunity needs independent verification before you trust it because several warning signs remain unresolved."
    if verification_status != "Verified":
        return "The wording looks calmer, but verification is still incomplete, so continue carefully."
    return "Multiple trust indicators were verified and the weighted risk score stayed low, so this looks comparatively safer."


def _build_ai_explanation(
    scoring: Dict[str, Any],
    extracted: Dict[str, Any],
    summary: str,
    classification: str,
) -> Dict[str, Any]:
    reasons: list[str] = []

    if extracted.get("payment_requests"):
        reasons.append("Requests upfront payment")
    if extracted.get("urgency_phrases"):
        reasons.append("Uses urgency tactics")
    if any(item.get("title") == "Compensation looks unrealistic for an internship" for item in scoring["score_breakdown"]):
        reasons.append("Promises unrealistic stipend")
    if extracted.get("sensitive_info_requests"):
        reasons.append("Requests sensitive information")

    if not reasons:
        reasons = scoring.get("detected_scam_reasons", [])[:4]
    if not reasons:
        reasons = ["No major scam indicators were detected."]

    return {
        "title": "AI Explanation",
        "summary": summary,
        "classification_context": classification,
        "reasons": reasons,
    }


async def analyze_text_content(text: str, source: str = "text") -> Dict[str, Any]:
    extracted = extract_structured_entities(text)
    verification = await verify_entities(extracted)
    scoring = score_analysis(text, extracted, verification)
    reasoning = await reason_with_gemma(text=text, extracted=extracted, verification=verification, scoring=scoring)

    final_score = scoring["risk_score"]
    if reasoning:
        llm_adjustment = reasoning.get("risk_score_adjustment", 0)
        llm_confidence = reasoning.get("confidence", 0)
        weighted_adjustment = round(llm_adjustment * max(llm_confidence, MIN_LLM_CONFIDENCE_FOR_ADJUSTMENT) / 100)
        final_score = clamp(final_score + weighted_adjustment, 0, 100)
        if reasoning.get("classification_candidate") == "Likely Scam" and scoring["risk_score"] >= 40:
            final_score = max(final_score, 56)

    classification = _classification_from_score(final_score)
    if classification == "Genuine" and (
        scoring["verified_trust_count"] < 2
        or scoring["severe_red_flags"] > 0
        or verification["verification_status"] != "Verified"
    ):
        classification = "Suspicious"
        final_score = max(final_score, 26)

    confidence = reasoning.get("confidence") if reasoning else clamp(45 + len(scoring["score_breakdown"]) * 6 + scoring["verified_trust_count"] * 4)
    summary = reasoning.get("reasoning_summary") if reasoning and reasoning.get("reasoning_summary") else _build_summary(classification, verification["verification_status"], scoring["detected_scam_reasons"])

    explanations = list(scoring["explanations"])
    if reasoning and reasoning.get("verification_assessment"):
        explanations.append(
            {
                "title": "Gemma verification assessment",
                "description": reasoning["verification_assessment"],
                "severity": "low" if classification == "Genuine" else "medium",
            }
        )

    recommendations = list(scoring["recommendations"])
    if reasoning:
        recommendations.extend(reasoning.get("recommendations", []))

    ai_explanation = _build_ai_explanation(scoring, extracted, summary, classification)

    return {
        "classification": classification,
        "scam_probability": final_score,
        "scam_confidence_score": final_score,
        "scam_confidence_percentage": f"{final_score}%",
        "risk_meter": final_score,
        "risk_level": classification,
        "confidence_score": clamp(confidence),
        "summary": summary,
        "flags": scoring["flags"],
        "detected_scam_reasons": scoring["detected_scam_reasons"],
        "suspicious_phrases": scoring["suspicious_phrases"],
        "highlighted_text": scoring["highlighted_text"],
        "ai_explanation": ai_explanation,
        "explanations": explanations,
        "recommendations": list(dict.fromkeys(recommendations)),
        "trust_breakdown": scoring["trust_breakdown"],
        "trust_indicators": scoring["trust_indicators"],
        "verification_status": verification["verification_status"],
        "verification_checks": verification["checks"],
        "verified_sources": verification["verified_sources"],
        "score_breakdown": scoring["score_breakdown"],
        "extracted_entities": extracted,
        "model_reasoning": reasoning,
        "source": source,
    }


async def analyze_upload_content(filename: str, content_type: Optional[str], raw_bytes: bytes, source: str = "file") -> Dict[str, Any]:
    extracted_upload = extract_text_from_upload(filename, content_type, raw_bytes)
    extracted_text = extracted_upload["text"]
    result = await analyze_text_content(extracted_text, source=extracted_upload["content_kind"] or source)
    result["extracted_text"] = extracted_text
    result["content_kind"] = extracted_upload["content_kind"]
    return result
