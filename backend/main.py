from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import httpx
import json
import os
import re
import uuid
from datetime import datetime
import io
import logging

try:
    import numpy as np
    import faiss
    from sentence_transformers import SentenceTransformer
    SEMANTIC_MATCHING_AVAILABLE = True
except Exception:
    np = None
    faiss = None
    SentenceTransformer = None
    SEMANTIC_MATCHING_AVAILABLE = False

app = FastAPI(title="SafeIntern AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPORTS_FILE = os.path.join(os.path.dirname(__file__), "reports.json")
HEURISTIC_FLAG_WEIGHT = 3
# Configurable model: override with OLLAMA_MODEL env var if needed (e.g. "gemma3", "mistral")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4")
SEMANTIC_MODEL_NAME = os.getenv("SEMANTIC_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
SEMANTIC_MATCH_THRESHOLD = float(os.getenv("SEMANTIC_MATCH_THRESHOLD", "0.58"))
MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS = 20
MIN_SEMANTIC_SCORE_BOOST = 12
MAX_SEMANTIC_SCORE_BOOST = 30
TOP_K_SEMANTIC_MATCHES = 3
SEMANTIC_AUTHENTICITY_PENALTY = 12
SEMANTIC_COMPANY_PENALTY = 10
SEMANTIC_LANGUAGE_PENALTY = 12
HIGH_SEVERITY_SEMANTIC_THRESHOLD = 0.7

# Curated fictional scam templates used as semantic anchors for FAISS similarity.
# Add new entries only when they represent distinct scam tactics (fee request, urgency,
# guaranteed placement, document/OTP harvesting, or confidential transfer requests).
SEMANTIC_SCAM_EXAMPLES = [
    "No interview required. Pay a refundable onboarding fee now to confirm internship slot.",
    "Urgent hiring for partner projects. Register immediately on this site or your seat is cancelled.",
    "Before onboarding, purchase a mandatory certification kit and reply yes to continue.",
    "You are automatically selected with high stipend and free trip. Share Aadhaar, PAN, bank details, and OTP.",
    "Transfer a refundable security deposit for verification and keep this hiring process confidential.",
    "Guaranteed placement at top companies after paying for certification. No coding required.",
]

semantic_model = None
semantic_index = None
semantic_examples = []
logger = logging.getLogger(__name__)

# Keywords requesting identity proofs — a major data-harvesting red flag
# NOTE: "aadhar" (single 'a') is intentionally included as a common misspelling
# found in scam messages targeting Indian students.
# Keys are phrases to match; values are concept group names for deduplication.
IDENTITY_PROOF_KEYWORDS = {
    "aadhaar": "id-aadhaar",
    "aadhar": "id-aadhaar",
    "pan card": "id-pan",
    "pan number": "id-pan",
    "passport copy": "id-passport",
    "passport number": "id-passport",
    "id proof": "id-generic",
    "id card": "id-generic",
    "identity proof": "id-generic",
    "selfie with id": "id-generic",
    "photo id": "id-generic",
    "government id": "id-generic",
    "driving licence": "id-dl",
    "driving license": "id-dl",
    "voter id": "id-voter",
    "birth certificate": "id-birth",
    "upload documents": "doc-submission",
    "send documents": "doc-submission",
    "submit id": "doc-submission",
    "attach id": "doc-submission",
}

# Keys are phrases to match; values are concept group names for deduplication.
FINANCIAL_DETAILS_KEYWORDS = {
    "bank account number": "bank-account",
    "account number": "bank-account",
    "bank details": "bank-account",
    "bank account": "bank-account",
    "ifsc code": "bank-routing",
    "ifsc": "bank-routing",
    "routing number": "bank-routing",
    "sort code": "bank-routing",
    "credit card number": "card-details",
    "debit card number": "card-details",
    "card number": "card-details",
    "card details": "card-details",
    "cvv": "card-security",
    "expiry date": "card-security",
    "net banking": "net-banking",
    "internet banking": "net-banking",
    "banking credentials": "net-banking",
    "otp": "auth-code",
    "one time password": "auth-code",
    "pin number": "auth-code",
    "upi id": "upi-details",
    "google pay": "upi-details",
    "phonepe": "upi-details",
    "paytm details": "upi-details",
}

# Keys are phrases to match; values are concept group names for deduplication.
CONTACT_HARVESTING_KEYWORDS = {
    "share your mobile": "mobile-contact",
    "send your mobile": "mobile-contact",
    "provide your mobile": "mobile-contact",
    "share your phone number": "mobile-contact",
    "send your phone number": "mobile-contact",
    "your phone number": "mobile-contact",
    "share your whatsapp": "mobile-contact",
    "whatsapp number": "mobile-contact",
    "contact number": "mobile-contact",
    "alternative email": "alt-email",
    "alternate email": "alt-email",
    "personal email address": "alt-email",
    "emergency contact details": "personal-data",
    "next of kin": "personal-data",
    "residential address": "personal-data",
}

# Keys are phrases to match; values are concept group names for deduplication.
SOFTWARE_LICENSE_KEYWORDS = {
    "software license fee": "software-purchase",
    "license fee": "software-purchase",
    "buy software": "software-purchase",
    "purchase software": "software-purchase",
    "software purchase": "software-purchase",
    "purchase license": "software-purchase",
    "software tool": "software-purchase",
    "tool fee": "access-fee",
    "access fee": "access-fee",
    "system access fee": "access-fee",
    "download fee": "download-fee",
    "app fee": "download-fee",
}

# Check-cashing / wire-back schemes (Phase 5 red flag)
CHECK_CASHING_KEYWORDS = {
    "deposit the check": "check-cashing",
    "cash the check": "check-cashing",
    "cashier's check": "check-cashing",
    "money order": "money-order",
    "wire money back": "wire-back",
    "send back the difference": "wire-back",
    "western union": "money-transfer",
    "moneygram": "money-transfer",
    "zelle": "money-transfer",
    "wire transfer": "wire-back",
}

# Vague or low-effort job descriptions (Phase 3)
VAGUE_JOB_KEYWORDS = {
    "earn online": "vague-role",
    "earn from home": "vague-role",
    "work from anywhere": "vague-role",
    "click ads": "vague-task",
    "fill surveys": "vague-task",
    "complete surveys": "vague-task",
    "watch videos": "vague-task",
    "data collection": "vague-task",
    "simple tasks": "vague-task",
    "online typing": "vague-task",
    "copy paste work": "vague-task",
    "no skills required": "no-skills",
    "anyone can do": "no-skills",
    "no qualification required": "no-skills",
    "flexible timing": "vague-role",
    "part time online": "vague-role",
}

# Text-only or absent interview process (Phase 4)
TEXT_ONLY_INTERVIEW_KEYWORDS = {
    "interview on whatsapp": "text-interview",
    "interview via whatsapp": "text-interview",
    "interview via chat": "text-interview",
    "interview on chat": "text-interview",
    "chat interview": "text-interview",
    "no video interview": "no-video",
    "no video call": "no-video",
    "selected based on resume": "no-screening",
    "no need for interview": "no-screening",
    "skip the interview": "no-screening",
    "shortlisted directly": "no-screening",
}

# Global sensitive information (SSN, EIN etc.) — Phase 1 / Phase 6
GLOBAL_SENSITIVE_INFO_KEYWORDS = {
    "social security number": "ssn",
    "social security": "ssn",
    "ssn": "ssn",
    "tax id number": "tax-id",
    "tax identification": "tax-id",
    "ein number": "tax-id",
    "national insurance number": "national-id",
    "national insurance": "national-id",
    "national id": "national-id",
}

# Process red flags: immediate joining and missing formal hiring docs
PROCESS_RED_FLAG_KEYWORDS = {
    "join immediately": "immediate-start",
    "start immediately": "immediate-start",
    "start today": "immediate-start",
    "join today": "immediate-start",
    "immediate joining": "immediate-start",
    "same day joining": "immediate-start",
    "no offer letter": "no-docs",
    "offer letter later": "no-docs",
    "contract will be shared later": "no-docs",
    "no contract needed": "no-docs",
    "without paperwork": "no-docs",
}

FAKE_INTERNSHIP_CLAIMS = {
    "work from home": "remote_lure",
    "wfh": "remote_lure",
    "data entry": "low-effort-role",
    "no interview": "no-screening",
    "no experience": "no-screening",
    "guaranteed placement": "guaranteed-selection",
    "direct selection": "guaranteed-selection",
    "easy money": "easy-income",
    "earn daily": "easy-income",
    "dm for details": "off-platform-contact",
    "message me directly": "off-platform-contact",
}

def initialize_semantic_scam_index() -> None:
    global semantic_model, semantic_index, semantic_examples
    if not SEMANTIC_MATCHING_AVAILABLE:
        return
    if semantic_model is not None and semantic_index is not None:
        return

    try:
        semantic_model = SentenceTransformer(SEMANTIC_MODEL_NAME)
        embeddings = semantic_model.encode(
            SEMANTIC_SCAM_EXAMPLES,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        embeddings = embeddings.astype("float32")
        semantic_index = faiss.IndexFlatIP(embeddings.shape[1])
        semantic_index.add(embeddings)
        semantic_examples = SEMANTIC_SCAM_EXAMPLES
    except Exception as exc:
        logger.warning("Semantic scam index initialization failed: %s", exc)
        semantic_model = None
        semantic_index = None
        semantic_examples = []


def semantic_scam_similarity(text: str) -> Optional[Dict[str, Any]]:
    if not SEMANTIC_MATCHING_AVAILABLE:
        return None
    if not text or len(text.strip()) < MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS:
        return None

    initialize_semantic_scam_index()
    if semantic_model is None or semantic_index is None:
        return None

    try:
        query_embedding = semantic_model.encode(
            [text],
            convert_to_numpy=True,
            normalize_embeddings=True,
        ).astype("float32")
        top_k = min(TOP_K_SEMANTIC_MATCHES, len(semantic_examples))
        scores, indices = semantic_index.search(query_embedding, top_k)
    except Exception as exc:
        logger.warning("Semantic similarity scoring failed: %s", exc)
        return None

    if scores.size == 0:
        return None

    best_similarity = float(scores[0][0])
    if best_similarity < SEMANTIC_MATCH_THRESHOLD:
        return None

    matches = []
    for score, idx in zip(scores[0], indices[0]):
        similarity = float(score)
        if similarity < SEMANTIC_MATCH_THRESHOLD or idx < 0 or idx >= len(semantic_examples):
            continue
        matches.append(
            {
                "similarity": round(similarity, 3),
                "example": semantic_examples[idx],
            }
        )

    if not matches:
        return None

    return {
        "best_similarity": round(best_similarity, 3),
        "matches": matches,
    }


initialize_semantic_scam_index()

def load_reports():
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, "r") as f:
            return json.load(f)
    return []

def save_reports(reports):
    with open(REPORTS_FILE, "w") as f:
        json.dump(reports, f, indent=2)

def extract_company_and_domain(text: str):
    """Return (company_name, email_domain) heuristically extracted from text."""
    email_match = re.search(r'[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text)
    domain = email_match.group(1) if email_match else None

    company_patterns = [
        r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:pvt|ltd|llc|inc|corp|company|technologies|solutions|services)',
        r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+is\s+(?:hiring|looking)',
        r'(?:from|at|by|team)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)',
        r'([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+internship',
    ]
    company = None
    for pattern in company_patterns:
        match = re.search(pattern, text)
        if match:
            company = match.group(1).strip()
            break
    return company, domain

def build_suggested_searches(company: Optional[str], domain: Optional[str]) -> List[str]:
    """Build a list of verification search queries based on extracted company/domain."""
    searches = []
    if company:
        searches.append(f'"{company}" scam OR fake internship')
        searches.append(f'"{company}" reviews site:glassdoor.com OR site:indeed.com')
        searches.append(f'"{company}" official LinkedIn company page')
    if domain:
        searches.append(f'WHOIS lookup for domain: {domain} (check registration date)')
    if company:
        searches.append(f'site:reddit.com/r/scams "{company}"')
    if not searches:
        searches = [
            "Search company name + 'scam' on Google",
            "Check company on LinkedIn",
            "Verify company on Glassdoor or Indeed",
        ]
    return searches

class AnalyzeRequest(BaseModel):
    text: str
    source: Optional[str] = "text"

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class ReportRequest(BaseModel):
    text: str
    analysis: dict
    source: Optional[str] = "text"

async def call_ollama(prompt: str) -> str:
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={"model": "gemma3", "prompt": prompt, "stream": False}
        )
        return response.json()["response"]

def highlight_text(text: str, risky_phrases: List[str]) -> str:
    highlighted = text
    for phrase in risky_phrases:
        pattern = re.compile(re.escape(phrase), re.IGNORECASE)
        highlighted = pattern.sub(
            f"<mark class='risk-high'>{phrase}</mark>",
            highlighted
        )
    return highlighted

def clamp(value: Any, minimum: int = 0, maximum: int = 100) -> int:
    try:
        return max(minimum, min(int(value), maximum))
    except (TypeError, ValueError):
        return minimum

def risk_level_from_probability(probability: int) -> str:
    if probability >= 75:
        return "Critical Risk"
    if probability >= 50:
        return "High Risk"
    if probability >= 25:
        return "Suspicious"
    return "Safe"

def summary_from_probability(probability: int) -> str:
    if probability < 20:
        return "This listing appears to be legitimate. Standard safety precautions are still advised."
    if probability < 50:
        return "This listing shows some suspicious patterns. Exercise caution and verify the company independently."
    if probability < 75:
        return "This listing has multiple high-risk indicators. Strong possibility of a scam - do not pay any money."
    return "CRITICAL: This listing has extremely high scam probability. Do not engage, do not pay, report immediately."

def merge_analysis_results(text: str, rule_result: Dict[str, Any], llm_result: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not llm_result:
        return rule_result

    llm_probability = clamp(llm_result.get("scam_probability"), 0, 100)
    merged_probability = max(rule_result.get("scam_probability", 0), llm_probability)

    rule_tb = rule_result.get("trust_breakdown", {})
    llm_tb = llm_result.get("trust_breakdown", {})

    merged_trust_breakdown = {
        "payment_risk": max(clamp(rule_tb.get("payment_risk"), 0, 100), clamp(llm_tb.get("payment_risk"), 0, 100)),
        "recruiter_authenticity": min(clamp(rule_tb.get("recruiter_authenticity"), 0, 100), clamp(llm_tb.get("recruiter_authenticity"), 0, 100)),
        "company_presence": min(clamp(rule_tb.get("company_presence"), 0, 100), clamp(llm_tb.get("company_presence"), 0, 100)),
        "language_credibility": min(clamp(rule_tb.get("language_credibility"), 0, 100), clamp(llm_tb.get("language_credibility"), 0, 100)),
    }

    merged_flags = []
    for source_flags in [rule_result.get("flags", []), llm_result.get("flags", [])]:
        for flag in source_flags:
            if isinstance(flag, str) and flag not in merged_flags:
                merged_flags.append(flag)
    if not merged_flags:
        merged_flags = ["No major red flags detected"]

    merged_recommendations = []
    for source_recs in [rule_result.get("recommendations", []), llm_result.get("recommendations", [])]:
        for rec in source_recs:
            if isinstance(rec, str) and rec not in merged_recommendations:
                merged_recommendations.append(rec)

    merged_explanations = []
    seen_explanation_titles = set()
    for source_explanations in [rule_result.get("explanations", []), llm_result.get("explanations", [])]:
        for exp in source_explanations:
            if not isinstance(exp, dict):
                continue
            title = exp.get("title", "")
            if title and title not in seen_explanation_titles:
                merged_explanations.append(exp)
                seen_explanation_titles.add(title)

    risk_level = risk_level_from_probability(merged_probability)
    summary = summary_from_probability(merged_probability)
    highlighted_text = rule_result.get("highlighted_text") or llm_result.get("highlighted_text") or text

    return {
        "scam_probability": merged_probability,
        "risk_level": risk_level,
        "flags": merged_flags,
        "highlighted_text": highlighted_text,
        "explanations": merged_explanations,
        "recommendations": merged_recommendations,
        "trust_breakdown": merged_trust_breakdown,
        "summary": summary,
    }

def rule_based_analysis(text: str) -> dict:
    text_lower = text.lower()
    flags = []
    risky_phrases = []
    payment_risk = 10
    recruiter_authenticity = 80
    company_presence = 70
    language_credibility = 80

    payment_keywords = ["pay", "fee", "deposit", "registration fee", "processing fee", "wallet", "upi", "payment", "transfer money", "send money", "advance payment", "refundable deposit"]
    cert_keywords = ["certificate", "certification program", "paid training", "training fee"]
    urgency_keywords = [
        "limited seats", "act now", "urgent", "immediately", "last chance",
        "within 24 hours", "hurry", "today only", "expires soon", "don't miss",
        "join immediately", "join now", "start today", "start immediately",
        "accept immediately", "accept now", "respond immediately", "reply immediately",
        "offer expires", "seats are filling", "apply now or miss",
    ]
    phishing_keywords = ["verify your details", "click here", "login to claim", "confirm your account", "update your information", "verify now"]
    suspicious_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    unrealistic_pay = [
        "10 lakh", "1 crore", "₹1,00,000", "₹50,000 per month", "earn 50000", "earn 1 lakh",
        "earn ₹", "₹10,000 daily", "₹5,000 daily", "per day earning", "daily payout",
        "weekly salary", "instant salary", "salary credited daily",
        "50000 monthly", "100000 monthly",
    ]
    scam_signal_score = 0
    matched_fake_lure_concepts = set()
    data_harvesting_risk = 0
    # Phase-tracking booleans for verification_checklist
    urgency_found = False
    personal_email_found = False
    unrealistic_pay_found = False
    vague_job_found = False
    text_only_interview_found = False
    check_cashing_found = False

    semantic_signal = semantic_scam_similarity(text)
    if semantic_signal:
        similarity = semantic_signal["best_similarity"]
        flags.append(f"Semantic match to known scam pattern (similarity: {similarity})")
        boost_floor = min(MIN_SEMANTIC_SCORE_BOOST, MAX_SEMANTIC_SCORE_BOOST)
        boost_ceiling = max(MIN_SEMANTIC_SCORE_BOOST, MAX_SEMANTIC_SCORE_BOOST)
        semantic_score_boost = clamp(
            int(similarity * boost_ceiling),
            boost_floor,
            boost_ceiling,
        )
        scam_signal_score += semantic_score_boost
        recruiter_authenticity = max(recruiter_authenticity - SEMANTIC_AUTHENTICITY_PENALTY, 10)
        company_presence = max(company_presence - SEMANTIC_COMPANY_PENALTY, 10)
        language_credibility = max(language_credibility - SEMANTIC_LANGUAGE_PENALTY, 10)

    for kw in payment_keywords:
        if kw in text_lower:
            flags.append(f"Payment keyword detected: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 30, 95)
            scam_signal_score += 25

    for kw in cert_keywords:
        if kw in text_lower:
            flags.append(f"Suspicious certification/training fee language: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 20, 95)
            language_credibility = max(language_credibility - 20, 10)
            scam_signal_score += 20

    if "₹" in text or "inr" in text_lower or bool(re.search(r'\brs\.?\s*\d', text_lower)):
        flags.append("Indian Rupee currency symbol/abbreviation found - possible money request")
        risky_phrases.append("₹")
        payment_risk = min(payment_risk + 15, 95)
        scam_signal_score += 10

    for kw in urgency_keywords:
        if kw in text_lower:
            urgency_found = True
            flags.append(f"Urgency tactic detected: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 20, 10)
            scam_signal_score += 8

    for domain in suspicious_domains:
        if domain in text_lower:
            personal_email_found = True
            flags.append(f"Suspicious email domain: '{domain}' used for official communication")
            risky_phrases.append(domain)
            recruiter_authenticity = max(recruiter_authenticity - 30, 10)
            company_presence = max(company_presence - 25, 10)
            scam_signal_score += 15

    for kw in phishing_keywords:
        if kw in text_lower:
            flags.append(f"Phishing language detected: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 25, 10)
            recruiter_authenticity = max(recruiter_authenticity - 20, 10)
            scam_signal_score += 20

    for kw in unrealistic_pay:
        if kw in text_lower:
            unrealistic_pay_found = True
            flags.append(f"Unrealistic compensation claim: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 20, 10)
            scam_signal_score += 15

    for kw, concept in FAKE_INTERNSHIP_CLAIMS.items():
        if kw in text_lower:
            flags.append(f"Common fake internship lure detected: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 12, 10)
            if concept not in matched_fake_lure_concepts:
                scam_signal_score += 10
                matched_fake_lure_concepts.add(concept)

    matched_identity_concepts: set = set()
    for kw, concept in IDENTITY_PROOF_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Request for identity proof/document: '{kw}'")
            risky_phrases.append(kw)
            recruiter_authenticity = max(recruiter_authenticity - 25, 10)
            data_harvesting_risk += 25
            if concept not in matched_identity_concepts:
                scam_signal_score += 20
                matched_identity_concepts.add(concept)

    matched_financial_concepts: set = set()
    for kw, concept in FINANCIAL_DETAILS_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Request for financial/banking details: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 30, 95)
            recruiter_authenticity = max(recruiter_authenticity - 30, 10)
            data_harvesting_risk += 30
            if concept not in matched_financial_concepts:
                scam_signal_score += 30
                matched_financial_concepts.add(concept)

    matched_contact_concepts: set = set()
    for kw, concept in CONTACT_HARVESTING_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Unsolicited contact-info request: '{kw}'")
            risky_phrases.append(kw)
            recruiter_authenticity = max(recruiter_authenticity - 15, 10)
            data_harvesting_risk += 15
            if concept not in matched_contact_concepts:
                scam_signal_score += 12
                matched_contact_concepts.add(concept)

    matched_software_concepts: set = set()
    for kw, concept in SOFTWARE_LICENSE_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Software/license fee request: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 25, 95)
            language_credibility = max(language_credibility - 15, 10)
            if concept not in matched_software_concepts:
                scam_signal_score += 20
                matched_software_concepts.add(concept)

    matched_check_cashing_concepts: set = set()
    for kw, concept in CHECK_CASHING_KEYWORDS.items():
        if kw in text_lower:
            check_cashing_found = True
            flags.append(f"Check-cashing or money-transfer scheme: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 35, 95)
            language_credibility = max(language_credibility - 15, 10)
            if concept not in matched_check_cashing_concepts:
                scam_signal_score += 35
                matched_check_cashing_concepts.add(concept)

    matched_vague_job_concepts: set = set()
    for kw, concept in VAGUE_JOB_KEYWORDS.items():
        if kw in text_lower:
            vague_job_found = True
            flags.append(f"Vague job description indicator: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 10, 10)
            company_presence = max(company_presence - 10, 10)
            if concept not in matched_vague_job_concepts:
                scam_signal_score += 8
                matched_vague_job_concepts.add(concept)

    matched_text_interview_concepts: set = set()
    for kw, concept in TEXT_ONLY_INTERVIEW_KEYWORDS.items():
        if kw in text_lower:
            text_only_interview_found = True
            flags.append(f"No proper interview process: '{kw}'")
            risky_phrases.append(kw)
            recruiter_authenticity = max(recruiter_authenticity - 15, 10)
            language_credibility = max(language_credibility - 10, 10)
            if concept not in matched_text_interview_concepts:
                scam_signal_score += 10
                matched_text_interview_concepts.add(concept)

    matched_global_sensitive_concepts: set = set()
    for kw, concept in GLOBAL_SENSITIVE_INFO_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Request for sensitive government ID/tax info: '{kw}'")
            risky_phrases.append(kw)
            recruiter_authenticity = max(recruiter_authenticity - 25, 10)
            data_harvesting_risk += 25
            if concept not in matched_global_sensitive_concepts:
                scam_signal_score += 20
                matched_global_sensitive_concepts.add(concept)

    matched_process_red_flag_concepts: set = set()
    for kw, concept in PROCESS_RED_FLAG_KEYWORDS.items():
        if kw in text_lower:
            flags.append(f"Suspicious hiring process indicator: '{kw}'")
            risky_phrases.append(kw)
            recruiter_authenticity = max(recruiter_authenticity - 15, 10)
            language_credibility = max(language_credibility - 10, 10)
            if concept == "immediate-start":
                urgency_found = True
            if concept not in matched_process_red_flag_concepts:
                scam_signal_score += 10
                matched_process_red_flag_concepts.add(concept)

    telegram_mention = "telegram" in text_lower or "t.me" in text_lower
    whatsapp_mention = "whatsapp" in text_lower
    has_official_email = bool(re.search(r'[a-zA-Z0-9._%+-]{1,64}@(?!gmail\b|yahoo\b|hotmail\b|outlook\b)[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){0,5}\.[a-zA-Z]{2,6}', text))
    has_website = bool(re.search(r'https?://(?!t\.me|wa\.me)[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63}){0,5}\.[a-zA-Z]{2,6}', text))

    if (telegram_mention or whatsapp_mention) and not has_official_email and not has_website:
        flags.append("Only informal contact (Telegram/WhatsApp) with no official website or email")
        risky_phrases.extend([kw for kw in ["telegram", "whatsapp", "t.me"] if kw in text_lower])
        recruiter_authenticity = max(recruiter_authenticity - 35, 10)
        company_presence = max(company_presence - 30, 10)
        scam_signal_score += 20

    base_probability = 0
    if payment_risk > 50:
        base_probability += 40
    if data_harvesting_risk >= 25:
        base_probability += 30
    if recruiter_authenticity < 50:
        base_probability += 25
    if company_presence < 50:
        base_probability += 20
    if language_credibility < 50:
        base_probability += 15
    heuristic_probability = min(base_probability + len(flags) * HEURISTIC_FLAG_WEIGHT, 99)
    # heuristic_probability activates only when aggregate indicators cross risk thresholds
    # (e.g. payment_risk > 50 → +40pts).  signal_probability is a raw cumulative keyword
    # score that catches texts with many individual hits even when no single threshold fires.
    # Taking max() ensures neither path can mask the other — the more conservative estimate wins.
    signal_probability = min(scam_signal_score, 99)
    scam_probability = max(heuristic_probability, signal_probability)
    risk_level = risk_level_from_probability(scam_probability)

    explanations = []
    if payment_risk > 50:
        explanations.append({
            "title": "Requests Payment or Fees",
            "description": "Legitimate internships never ask candidates to pay fees, deposits, or registration charges. This is a major red flag.",
            "severity": "high"
        })
    if data_harvesting_risk >= 25:
        explanations.append({
            "title": "Data Harvesting Attempt",
            "description": "This message asks for sensitive personal information such as identity proofs (Aadhaar, PAN, and passport), financial/banking details, or unnecessary contact information. Sharing these with an unverified recruiter risks identity theft and financial fraud.",
            "severity": "high"
        })
    if recruiter_authenticity < 50:
        explanations.append({
            "title": "Suspicious Recruiter Identity",
            "description": "The recruiter uses informal communication channels or personal email addresses instead of official company channels.",
            "severity": "high"
        })
    if company_presence < 50:
        explanations.append({
            "title": "No Official Company Presence",
            "description": "There is no verifiable official website or corporate email address, making it impossible to verify the company's legitimacy.",
            "severity": "medium"
        })
    if language_credibility < 50:
        explanations.append({
            "title": "Suspicious Language Patterns",
            "description": "The text uses urgency tactics, unrealistic promises, or phishing language commonly found in scam postings.",
            "severity": "medium"
        })
    if semantic_signal:
        explanations.append({
            "title": "Semantic Similarity to Known Scam Messages",
            "description": "This text is semantically similar to known fake internship and recruiter scam patterns, even when exact keywords differ.",
            "severity": "high" if semantic_signal["best_similarity"] >= HIGH_SEVERITY_SEMANTIC_THRESHOLD else "medium"
        })

    recommendations = [
        "Never pay any fee to secure an internship or job",
        "Never share Aadhaar, PAN, passport, or bank account details with an unverified recruiter",
        "Verify the company on LinkedIn and official government portals",
        "Only communicate through official company email domains",
        "Check for a verified company website before proceeding",
        "Report suspicious postings to the platform and cybercrime.gov.in",
    ]
    if payment_risk > 50:
        recommendations.insert(0, "IMMEDIATELY stop communication - this appears to be a money scam")
    if data_harvesting_risk >= 25:
        recommendations.insert(0, "Do NOT share any personal documents or financial details — this appears to be a data theft scam")
    if semantic_signal:
        recommendations.insert(0, "Treat this posting as potentially fraudulent and independently verify recruiter identity before any response")

    summary = summary_from_probability(scam_probability)

    highlighted = highlight_text(text, list(set(risky_phrases)))

    return {
        "scam_probability": scam_probability,
        "risk_level": risk_level,
        "flags": flags if flags else ["No major red flags detected"],
        "highlighted_text": highlighted,
        "explanations": explanations,
        "recommendations": recommendations,
        "trust_breakdown": {
            "payment_risk": payment_risk,
            "recruiter_authenticity": recruiter_authenticity,
            "company_presence": company_presence,
            "language_credibility": language_credibility,
        },
        "summary": summary,
    }

async def analyze_with_ollama(text: str) -> dict:
    prompt = f"""You are a scam detection AI specialized in identifying fake internship and job postings targeting students in India. 

Analyze the following text and return a JSON response with exactly this structure:
{{
  "scam_probability": <integer 0-100>,
  "risk_level": "<Safe|Suspicious|High Risk|Critical Risk>",
  "flags": ["<flag1>", "<flag2>"],
  "highlighted_text": "<original text with <mark class='risk-high'>risky phrases</mark> wrapped>",
  "explanations": [
    {{"title": "<title>", "description": "<explanation>", "severity": "<high|medium|low>"}}
  ],
  "recommendations": ["<rec1>", "<rec2>"],
  "trust_breakdown": {{
    "payment_risk": <0-100>,
    "recruiter_authenticity": <0-100>,
    "company_presence": <0-100>,
    "language_credibility": <0-100>
  }},
  "summary": "<brief summary>"
}}

Key red flags to detect:
- Requests for upfront payment, registration/training/software-license fees, or any money transfer.
- Communication from personal email addresses (Gmail, Yahoo, Hotmail) instead of official company domains.
- Requests for sensitive documents: Aadhaar, PAN, passport, ID card, driving licence, voter ID.
- Requests for financial/banking details: bank account number, IFSC code, credit/debit card details, CVV, OTP, net banking credentials.
- Unsolicited harvesting of contact info: mobile number, WhatsApp number, alternative email address.
- Urgency tactics: limited seats, join immediately, respond within 24 hours, offer expires today.
- Unrealistically high stipends or salaries for minimal work.
- Only informal contact channels (WhatsApp, Telegram) with no official website or email.
- Claims of guaranteed placement, no interview, no experience needed.
- Misspelled company names or domains.

Text to analyze:
{text}

Return ONLY the JSON, no other text."""

    try:
        response_text = await call_ollama(prompt)
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception:
        pass
    return None

@app.post("/api/analyze")
async def analyze_text(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    rule_result = rule_based_analysis(request.text)
    llm_result = await analyze_with_ollama(request.text)
    return merge_analysis_results(request.text, rule_result, llm_result)

@app.post("/api/analyze/image")
async def analyze_image(file: UploadFile = File(...)):
    try:
        from PIL import Image
        import pytesseract
        
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        extracted_text = pytesseract.image_to_string(image)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the image")
        
        rule_result = rule_based_analysis(extracted_text)
        llm_result = await analyze_with_ollama(extracted_text)
        result = merge_analysis_results(extracted_text, rule_result, llm_result)

        result["extracted_text"] = extracted_text
        return result
    except ImportError:
        raise HTTPException(status_code=500, detail="Image processing libraries not available")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        prompt = f"""You are SafeIntern AI, a helpful assistant that protects students from internship and job scams.
        
Context: {request.context if request.context else 'General safety question'}

User question: {request.message}

Provide a helpful, concise response about internship safety. Focus on practical advice."""
        
        response = await call_ollama(prompt)
        return {"response": response}
    except Exception:
        responses = {
            "safe": "Always verify a company's official website and LinkedIn page before applying. Legitimate companies never ask for upfront fees.",
            "red flag": "Key red flags: asking for payment, using personal emails, offering unrealistic salaries, only contacting via WhatsApp/Telegram, urgency pressure tactics.",
            "verify": "To verify a company: Check their official website, LinkedIn page, Glassdoor reviews, and government registration (CIN number in India).",
        }
        msg_lower = request.message.lower()
        for key, resp in responses.items():
            if key in msg_lower:
                return {"response": resp}
        return {"response": "I recommend always verifying the company's official website and never paying any upfront fees. If something feels off, trust your instincts and report suspicious postings."}

@app.get("/api/reports")
async def get_reports():
    return load_reports()

@app.post("/api/reports")
async def create_report(request: ReportRequest):
    reports = load_reports()
    report = {
        "id": str(uuid.uuid4()),
        "text": request.text[:500],
        "analysis": request.analysis,
        "source": request.source,
        "created_at": datetime.now().isoformat(),
    }
    reports.insert(0, report)
    save_reports(reports)
    return report

@app.delete("/api/reports/{report_id}")
async def delete_report(report_id: str):
    reports = load_reports()
    reports = [r for r in reports if r["id"] != report_id]
    save_reports(reports)
    return {"message": "Report deleted"}

@app.get("/")
async def root():
    return {"message": "SafeIntern AI API is running"}
