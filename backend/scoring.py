import logging
import re
from typing import Any, Dict, List, Optional

from analysis_config import (
    MAX_SEMANTIC_SCORE_BOOST,
    MIN_SEMANTIC_SCORE_BOOST,
    MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS,
    MISSPELLING_PATTERNS,
    OLLAMA_MODEL,
    PERSONAL_EMAIL_DOMAINS,
    SEMANTIC_MATCH_THRESHOLD,
    SEMANTIC_MODEL,
    SEMANTIC_SCAM_EXAMPLES,
    TOP_K_SEMANTIC_MATCHES,
)
from extraction import highlight_text

try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer

    SEMANTIC_MATCHING_AVAILABLE = True
except (ImportError, ModuleNotFoundError):
    faiss = None
    np = None
    SentenceTransformer = None
    SEMANTIC_MATCHING_AVAILABLE = False

logger = logging.getLogger(__name__)
semantic_model = None
semantic_index = None
semantic_examples: List[str] = []


def clamp(value: Any, minimum: int = 0, maximum: int = 100) -> int:
    try:
        return max(minimum, min(int(round(float(value))), maximum))
    except (TypeError, ValueError):
        return minimum


def initialize_semantic_scam_index() -> None:
    global semantic_model, semantic_index, semantic_examples
    if not SEMANTIC_MATCHING_AVAILABLE or semantic_model is not None:
        return
    try:
        semantic_model = SentenceTransformer(SEMANTIC_MODEL)
        embeddings = semantic_model.encode(
            SEMANTIC_SCAM_EXAMPLES,
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")
        semantic_index = faiss.IndexFlatIP(embeddings.shape[1])
        semantic_index.add(embeddings)
        semantic_examples = SEMANTIC_SCAM_EXAMPLES
    except Exception as exc:
        logger.warning("Semantic scam index initialization failed: %s", exc)
        semantic_model = None
        semantic_index = None
        semantic_examples = []


def semantic_scam_similarity(text: str) -> Optional[Dict[str, Any]]:
    if not SEMANTIC_MATCHING_AVAILABLE or len(text.strip()) < MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS:
        return None
    initialize_semantic_scam_index()
    if semantic_model is None or semantic_index is None:
        return None
    try:
        query_embedding = semantic_model.encode([text], convert_to_numpy=True, normalize_embeddings=True).astype("float32")
        top_k = min(TOP_K_SEMANTIC_MATCHES, len(semantic_examples))
        scores, indices = semantic_index.search(query_embedding, top_k)
    except Exception as exc:
        logger.warning("Semantic scam scoring failed: %s", exc)
        return None

    if scores.size == 0:
        return None
    best_similarity = float(scores[0][0])
    if best_similarity < SEMANTIC_MATCH_THRESHOLD:
        return None

    matches = []
    for score, index in zip(scores[0], indices[0]):
        similarity = float(score)
        if similarity < SEMANTIC_MATCH_THRESHOLD or index < 0 or index >= len(semantic_examples):
            continue
        matches.append({"similarity": round(similarity, 3), "example": semantic_examples[index]})
    if not matches:
        return None
    return {"best_similarity": round(best_similarity, 3), "matches": matches}


def _contains_unrealistic_salary(text_lower: str, salary_mentions: List[str]) -> bool:
    daily_markers = ("per day", "/day", "daily payout", "daily earning")
    if any(marker in text_lower for marker in daily_markers):
        return True
    for mention in salary_mentions:
        digits = int(re.sub(r"\D", "", mention) or "0")
        if digits >= 50000:
            return True
    return any(term in text_lower for term in ("1 lakh", "10 lakh", "earn 50000", "instant salary"))


def _add_score(
    score_breakdown: List[Dict[str, Any]],
    flags: List[str],
    explanations: List[Dict[str, str]],
    recommendations: List[str],
    highlight_terms: List[str],
    *,
    title: str,
    description: str,
    weight: int,
    severity: str,
    evidence: List[str],
    flag_text: Optional[str] = None,
    recommendation: Optional[str] = None,
) -> int:
    score_breakdown.append(
        {
            "title": title,
            "weight": weight,
            "severity": severity,
            "description": description,
            "evidence": evidence,
        }
    )
    flags.append(flag_text or title)
    explanations.append({"title": title, "description": description, "severity": severity})
    highlight_terms.extend(evidence)
    if recommendation:
        recommendations.append(recommendation)
    return weight


def score_analysis(text: str, entities: Dict[str, Any], verification: Dict[str, Any]) -> Dict[str, Any]:
    text_lower = text.lower()
    flags: List[str] = []
    explanations: List[Dict[str, str]] = []
    score_breakdown: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    highlight_terms: List[str] = []
    trust_indicators = list(verification.get("trust_indicators", []))

    payment_risk = 5
    recruiter_authenticity = 65
    company_presence = 55
    language_credibility = 60
    risk_score = 0
    severe_red_flags = 0

    payment_requests = entities.get("payment_requests", [])
    sensitive_requests = entities.get("sensitive_info_requests", [])
    urgency_phrases = entities.get("urgency_phrases", [])
    interview_claims = entities.get("interview_process_claims", [])
    fake_hr_phrases = entities.get("fake_hr_phrases", [])
    communication_channels = set(entities.get("communication_channels", []))
    salary_mentions = entities.get("salary_mentions", [])
    recruiter_email = entities.get("recruiter_email")
    domain_age_days = verification.get("domain_age_days")

    if payment_requests:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Asks for payment or a deposit",
            description="Legitimate internships do not ask candidates to pay registration fees, deposits, or onboarding charges.",
            weight=32,
            severity="high",
            evidence=payment_requests,
            recommendation="Do not pay any fee to secure an internship or job.",
        )
        payment_risk = clamp(payment_risk + 55)
        recruiter_authenticity = clamp(recruiter_authenticity - 18)
        severe_red_flags += 1

    if sensitive_requests:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Requests sensitive ID or bank details too early",
            description="Early requests for Aadhaar, PAN, passport, bank, or OTP details are consistent with identity theft and financial fraud patterns.",
            weight=26,
            severity="high",
            evidence=sensitive_requests,
            recommendation="Do not share government IDs, OTPs, or banking data with an unverified recruiter.",
        )
        payment_risk = clamp(payment_risk + 20)
        recruiter_authenticity = clamp(recruiter_authenticity - 22)
        severe_red_flags += 1

    if recruiter_email and recruiter_email.split("@", 1)[1].lower() in PERSONAL_EMAIL_DOMAINS:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Uses a personal recruiter email domain",
            description="Recruiters using Gmail, Yahoo, or similar personal domains are harder to verify and carry more impersonation risk.",
            weight=12,
            severity="medium",
            evidence=[recruiter_email],
            recommendation="Prefer communication from an official company email domain.",
        )
        recruiter_authenticity = clamp(recruiter_authenticity - 18)
        company_presence = clamp(company_presence - 12)

    if _contains_unrealistic_salary(text_lower, salary_mentions):
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Compensation looks unrealistic for an internship",
            description="Very high daily or monthly payouts are common bait in internship scams.",
            weight=12,
            severity="medium",
            evidence=salary_mentions or ["salary claim"],
            recommendation="Compare the stipend with similar internships from verified companies.",
        )
        language_credibility = clamp(language_credibility - 10)

    if interview_claims:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="No credible interview process",
            description="Immediate selection or chat-only interviews remove normal screening steps and increase scam risk.",
            weight=14,
            severity="high" if any("no interview" in claim for claim in interview_claims) else "medium",
            evidence=interview_claims,
            recommendation="Ask for a structured interview process before sharing documents.",
        )
        recruiter_authenticity = clamp(recruiter_authenticity - 14)
        language_credibility = clamp(language_credibility - 10)

    if urgency_phrases:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Uses urgency or pressure tactics",
            description="Scam offers often force quick decisions so candidates skip verification.",
            weight=9,
            severity="medium",
            evidence=urgency_phrases,
            recommendation="Slow down and verify the recruiter independently before responding.",
        )
        language_credibility = clamp(language_credibility - 12)

    if {"WhatsApp", "Telegram"}.intersection(communication_channels) and "Email" not in communication_channels:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Informal messaging-only communication",
            description="WhatsApp or Telegram-only recruiting without official channels is a strong scam indicator.",
            weight=16,
            severity="high",
            evidence=[channel.lower() for channel in communication_channels if channel in {"WhatsApp", "Telegram"}],
            flag_text="Telegram/WhatsApp-only communication",
            recommendation="Ask for an official company email thread or careers page before proceeding.",
        )
        recruiter_authenticity = clamp(recruiter_authenticity - 18)
        company_presence = clamp(company_presence - 14)
        severe_red_flags += 1

    if fake_hr_phrases:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Fake HR wording patterns detected",
            description="Generic hiring boilerplate and canned HR language frequently appear in mass scam outreach.",
            weight=8,
            severity="medium",
            evidence=fake_hr_phrases,
        )
        language_credibility = clamp(language_credibility - 10)

    misspellings = [pattern for pattern in MISSPELLING_PATTERNS if pattern in text_lower]
    if misspellings:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Spelling inconsistencies found in hiring language",
            description="Repeated spelling or branding mistakes can indicate low-effort fraud messages.",
            weight=6,
            severity="low",
            evidence=misspellings,
        )
        language_credibility = clamp(language_credibility - 8)

    if not entities.get("urls") and verification.get("candidate_domain") is None:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="No company website could be identified",
            description="Without a website or corporate domain, the opportunity is much harder to verify.",
            weight=11,
            severity="medium",
            evidence=[entities.get("company_name") or "company details missing"],
        )
        company_presence = clamp(company_presence - 16)

    if domain_age_days is not None and domain_age_days <= 180:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Domain appears recently created",
            description="Newly created domains are riskier for internship offers because they lack a longer operating history.",
            weight=18,
            severity="high",
            evidence=[f"{domain_age_days} days old"],
        )
        company_presence = clamp(company_presence - 18)

    if verification.get("verification_status") in {"Failed", "Unverified"}:
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Recruiter or company could not be verified",
            description="Independent verification from trusted sources was missing or failed.",
            weight=15,
            severity="high" if verification.get("verification_status") == "Failed" else "medium",
            evidence=verification.get("risk_indicators") or ["verification failed"],
            recommendation="Verify the company website, LinkedIn page, and public internship reviews before replying.",
        )
        recruiter_authenticity = clamp(recruiter_authenticity - 14)
        company_presence = clamp(company_presence - 14)

    if verification.get("complaint_signals"):
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Scam complaint signals found on the web",
            description="Search results surfaced complaint or scam language linked to the company or internship claim.",
            weight=28,
            severity="high",
            evidence=verification["complaint_signals"],
            recommendation="Treat this opportunity as unsafe until a trusted source disproves the complaint trail.",
        )
        severe_red_flags += 1

    semantic_signal = semantic_scam_similarity(text)
    if semantic_signal:
        semantic_boost = clamp(
            semantic_signal["best_similarity"] * MAX_SEMANTIC_SCORE_BOOST,
            MIN_SEMANTIC_SCORE_BOOST,
            MAX_SEMANTIC_SCORE_BOOST,
        )
        risk_score += _add_score(
            score_breakdown,
            flags,
            explanations,
            recommendations,
            highlight_terms,
            title="Matches known internship scam patterns",
            description="The message is semantically similar to previously observed internship scam templates.",
            weight=semantic_boost,
            severity="high" if semantic_signal["best_similarity"] >= 0.7 else "medium",
            evidence=[match["example"] for match in semantic_signal["matches"]],
        )
        recruiter_authenticity = clamp(recruiter_authenticity - 10)
        language_credibility = clamp(language_credibility - 10)

    trust_bonus = min(len(trust_indicators) * 4, 16)
    if verification.get("domain_age_days") and verification["domain_age_days"] >= 730:
        trust_bonus += 4

    final_risk_score = clamp(risk_score - trust_bonus)
    if verification.get("verification_status") == "Verified":
        recruiter_authenticity = clamp(recruiter_authenticity + 14)
        company_presence = clamp(company_presence + 18)
    elif verification.get("verification_status") == "Partially Verified":
        recruiter_authenticity = clamp(recruiter_authenticity + 8)
        company_presence = clamp(company_presence + 10)

    if trust_indicators:
        explanations.append(
            {
                "title": "Verified trust indicators",
                "description": "; ".join(trust_indicators[:3]),
                "severity": "low",
            }
        )

    recommendations.extend(
        [
            "Cross-check the internship on the company careers page or official LinkedIn account.",
            "Do not share identity documents until after a verified interview and offer process.",
            "Prefer verified recruiter domains over personal email addresses or chat-only contact.",
        ]
    )

    highlighted_text = highlight_text(text, highlight_terms)
    verified_trust_count = len(trust_indicators)

    return {
        "risk_score": final_risk_score,
        "flags": list(dict.fromkeys(flags)) or ["No major scam indicators detected"],
        "explanations": explanations,
        "recommendations": list(dict.fromkeys(recommendations)),
        "score_breakdown": score_breakdown,
        "trust_breakdown": {
            "payment_risk": clamp(payment_risk),
            "recruiter_authenticity": clamp(recruiter_authenticity),
            "company_presence": clamp(company_presence),
            "language_credibility": clamp(language_credibility),
        },
        "trust_indicators": trust_indicators,
        "highlighted_text": highlighted_text,
        "verified_trust_count": verified_trust_count,
        "severe_red_flags": severe_red_flags,
        "detected_scam_reasons": [entry["title"] for entry in score_breakdown if entry["weight"] > 0],
        "semantic_signal": semantic_signal,
        "model_name": OLLAMA_MODEL,
    }
