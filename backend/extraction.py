import io
import os
import re
import string
from email import policy
from email.parser import BytesParser
from html import escape
from typing import Any, Dict, Iterable, List, Optional
from urllib.parse import urlparse

from analysis_config import (
    FAKE_HR_PATTERNS,
    INTERVIEW_PATTERNS,
    PAYMENT_PATTERNS,
    SUSPICIOUS_PHRASE_PATTERNS,
    SENSITIVE_INFO_PATTERNS,
    URGENCY_PATTERNS,
)

PHONE_REGEX = re.compile(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,6}")
URL_REGEX = re.compile(r"https?://[^\s<>'\"]+|www\.[^\s<>'\"]+")
SALARY_REGEX = re.compile(
    r"(?:₹|rs\.?|inr|usd|\$)\s?[\d,]+(?:\s?(?:per\s?(?:month|week|day)|/month|/week|/day|stipend|salary))?",
    re.IGNORECASE,
)

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}
PDF_EXTENSIONS = {".pdf"}
EMAIL_EXTENSIONS = {".eml", ".msg"}
TEXT_EXTENSIONS = {".txt", ".md"}
TOKEN_STRIP_CHARS = string.whitespace + string.punctuation.replace("@", "").replace(".", "").replace("-", "")


def dedupe(values: Iterable[str]) -> List[str]:
    seen = set()
    unique_values = []
    for value in values:
        normalized = value.strip()
        if not normalized:
            continue
        lowered = normalized.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        unique_values.append(normalized)
    return unique_values


def _collect_matches(text_lower: str, patterns: Iterable[str]) -> List[str]:
    return dedupe(pattern for pattern in patterns if pattern.lower() in text_lower)


def _candidate_tokens(text: str) -> List[str]:
    return [token.strip(TOKEN_STRIP_CHARS) for token in text.replace("\n", " ").split()]


def _looks_like_domain(token: str) -> bool:
    if not token or "." not in token or token.startswith((".", "-")) or token.endswith((".", "-")):
        return False
    labels = token.lower().split(".")
    if len(labels) < 2 or len(labels[-1]) < 2 or not labels[-1].isalpha():
        return False
    return all(label and all(character.isalnum() or character == "-" for character in label) for label in labels)


def _extract_emails_and_domains(text: str) -> tuple[List[str], List[str]]:
    emails: List[str] = []
    domains: List[str] = []
    for raw_token in _candidate_tokens(text):
        token = raw_token.lower().removeprefix("mailto:")
        if token.startswith(("http://", "https://", "www.")):
            continue
        if token.count("@") == 1:
            local_part, domain = token.split("@", 1)
            if local_part and _looks_like_domain(domain):
                allowed_local = all(character.isalnum() or character in "._%+-" for character in local_part)
                if allowed_local:
                    emails.append(token)
                    domains.append(domain)
            continue
        if _looks_like_domain(token):
            domains.append(token.lstrip("www."))
    return dedupe(emails), dedupe(domains)


def extract_company_name(text: str) -> Optional[str]:
    company_patterns = [
        r"([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:pvt|ltd|llc|inc|corp|company|technologies|solutions|services)",
        r"([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+is\s+(?:hiring|looking)",
        r"(?:from|at|by|team)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)",
        r"([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+internship",
    ]
    for pattern in company_patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip()
    return None


def extract_structured_entities(text: str) -> Dict[str, Any]:
    text_lower = text.lower()
    emails, domains = _extract_emails_and_domains(text)
    urls = dedupe(URL_REGEX.findall(text))
    phone_numbers = dedupe(
        value for value in PHONE_REGEX.findall(text) if len(re.sub(r"\D", "", value)) >= 10
    )
    compensation = dedupe(SALARY_REGEX.findall(text))

    for url in urls:
        parsed = urlparse(url if url.startswith("http") else f"https://{url}")
        if parsed.netloc:
            domains.append(parsed.netloc.lower().lstrip("www."))

    communication_channels = []
    if "whatsapp" in text_lower or "wa.me" in text_lower:
        communication_channels.append("WhatsApp")
    if "telegram" in text_lower or "t.me" in text_lower:
        communication_channels.append("Telegram")
    if emails:
        communication_channels.append("Email")
    if phone_numbers:
        communication_channels.append("Phone")

    return {
        "company_name": extract_company_name(text),
        "recruiter_email": emails[0] if emails else None,
        "recruiter_emails": emails,
        "phone_numbers": phone_numbers,
        "salary_mentions": compensation,
        "stipend_mentions": compensation,
        "domain_names": dedupe(domain.strip(".,:; ") for domain in domains),
        "urls": urls,
        "payment_requests": _collect_matches(text_lower, PAYMENT_PATTERNS),
        "urgency_phrases": _collect_matches(text_lower, URGENCY_PATTERNS),
        "interview_process_claims": _collect_matches(text_lower, INTERVIEW_PATTERNS),
        "communication_channels": dedupe(communication_channels),
        "sensitive_info_requests": _collect_matches(text_lower, SENSITIVE_INFO_PATTERNS),
        "fake_hr_phrases": _collect_matches(text_lower, FAKE_HR_PATTERNS),
        "suspicious_phrases": _collect_matches(text_lower, SUSPICIOUS_PHRASE_PATTERNS),
    }


def highlight_text(text: str, risky_phrases: List[str]) -> str:
    highlighted = escape(text)
    for phrase in sorted(dedupe(risky_phrases), key=len, reverse=True):
        pattern = re.compile(re.escape(escape(phrase)), re.IGNORECASE)
        highlighted = pattern.sub(lambda match: f"<mark class='risk-high'>{match.group(0)}</mark>", highlighted)
    return highlighted.replace("\n", "<br />")


def _extract_text_from_email(raw_bytes: bytes) -> str:
    message = BytesParser(policy=policy.default).parsebytes(raw_bytes)
    segments = []
    for header in ("from", "to", "subject", "date"):
        value = message.get(header)
        if value:
            segments.append(f"{header.title()}: {value}")

    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain":
                segments.append(part.get_content())
    else:
        try:
            segments.append(message.get_content())
        except Exception:
            pass
    return "\n".join(segment.strip() for segment in segments if segment and segment.strip())


def _extract_text_from_pdf(raw_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise RuntimeError("PDF support requires pypdf to be installed") from exc

    reader = PdfReader(io.BytesIO(raw_bytes))
    pages = [(page.extract_text() or "").strip() for page in reader.pages]
    return "\n".join(page for page in pages if page)


def _extract_text_from_image(raw_bytes: bytes) -> str:
    try:
        from PIL import Image
        import pytesseract
    except ImportError as exc:
        raise RuntimeError("Image OCR libraries are not available") from exc

    image = Image.open(io.BytesIO(raw_bytes))
    return pytesseract.image_to_string(image)


def extract_text_from_upload(filename: str, content_type: Optional[str], raw_bytes: bytes) -> Dict[str, Any]:
    extension = os.path.splitext(filename or "")[1].lower()
    content_type = (content_type or "").lower()

    if content_type.startswith("image/") or extension in IMAGE_EXTENSIONS:
        extracted_text = _extract_text_from_image(raw_bytes)
        return {"text": extracted_text, "content_kind": "image"}

    if content_type == "application/pdf" or extension in PDF_EXTENSIONS:
        extracted_text = _extract_text_from_pdf(raw_bytes)
        return {"text": extracted_text, "content_kind": "pdf"}

    if content_type == "message/rfc822" or extension in EMAIL_EXTENSIONS:
        extracted_text = _extract_text_from_email(raw_bytes)
        return {"text": extracted_text, "content_kind": "email"}

    if content_type.startswith("text/") or extension in TEXT_EXTENSIONS:
        return {"text": raw_bytes.decode("utf-8", errors="ignore"), "content_kind": "text"}

    decoded_text = raw_bytes.decode("utf-8", errors="ignore")
    if decoded_text.strip():
        return {"text": decoded_text, "content_kind": "text"}

    raise RuntimeError("Unsupported file type. Upload an image, PDF, email, or text file.")
