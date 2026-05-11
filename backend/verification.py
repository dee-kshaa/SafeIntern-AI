import re
import socket
from datetime import datetime, timezone
from html import unescape
from typing import Any, Dict, List, Optional
from urllib.parse import parse_qs, unquote, urlparse

import httpx

from analysis_config import PERSONAL_EMAIL_DOMAINS, SCAM_SEARCH_TERMS, TRUSTED_PROFILE_HOSTS

SEARCH_ENDPOINT = "https://duckduckgo.com/html/"
RDAP_ENDPOINT = "https://rdap.org/domain/{domain}"
REQUEST_HEADERS = {"User-Agent": "SafeIntern-AI/1.0"}


def _clean_domain(domain: Optional[str]) -> Optional[str]:
    if not domain:
        return None
    cleaned = domain.lower().strip().lstrip("www.")
    if ":" in cleaned:
        cleaned = cleaned.split(":", 1)[0]
    return cleaned or None


def is_personal_email_domain(domain: Optional[str]) -> bool:
    cleaned = _clean_domain(domain)
    return bool(cleaned and cleaned in PERSONAL_EMAIL_DOMAINS)


def _domain_from_email(email: Optional[str]) -> Optional[str]:
    if not email or "@" not in email:
        return None
    return _clean_domain(email.split("@", 1)[1])


def _domain_from_url(url: str) -> Optional[str]:
    parsed = urlparse(url if url.startswith("http") else f"https://{url}")
    return _clean_domain(parsed.netloc)


def _candidate_domain(entities: Dict[str, Any]) -> Optional[str]:
    email_domain = _domain_from_email(entities.get("recruiter_email"))
    if email_domain and not is_personal_email_domain(email_domain):
        return email_domain
    for url in entities.get("urls", []):
        domain = _domain_from_url(url)
        if domain:
            return domain
    for domain in entities.get("domain_names", []):
        normalized = _clean_domain(domain)
        if normalized and not is_personal_email_domain(normalized):
            return normalized
    return email_domain


def _decode_duckduckgo_link(href: str) -> str:
    href = unescape(href)
    if href.startswith("//"):
        href = f"https:{href}"
    parsed = urlparse(href)
    host = _clean_domain(parsed.netloc)
    if host == "duckduckgo.com" or (host and host.endswith(".duckduckgo.com")):
        target = parse_qs(parsed.query).get("uddg", [""])[0]
        if target:
            return unquote(target)
    return href


def _host(url: str) -> str:
    return _clean_domain(urlparse(url).netloc) or ""


async def _duckduckgo_search(client: httpx.AsyncClient, query: str) -> List[Dict[str, str]]:
    response = await client.get(SEARCH_ENDPOINT, params={"q": query}, headers=REQUEST_HEADERS)
    response.raise_for_status()
    html = response.text
    links = re.findall(r'class="result__a" href="([^"]+)"[^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
    snippets = re.findall(r'class="result__snippet">(.*?)</a>|class="result__snippet">(.*?)</div>', html, re.IGNORECASE | re.DOTALL)

    results: List[Dict[str, str]] = []
    for index, (href, title) in enumerate(links[:5]):
        snippet_tuple = snippets[index] if index < len(snippets) else ("", "")
        snippet = next((part for part in snippet_tuple if part), "")
        url = _decode_duckduckgo_link(href)
        results.append(
            {
                "url": url,
                "host": _host(url),
                "title": re.sub(r"<.*?>", "", unescape(title)).strip(),
                "snippet": re.sub(r"<.*?>", "", unescape(snippet)).strip(),
            }
        )
    return results


async def _domain_age_days(client: httpx.AsyncClient, domain: str) -> Optional[int]:
    try:
        response = await client.get(RDAP_ENDPOINT.format(domain=domain), headers=REQUEST_HEADERS)
        response.raise_for_status()
        payload = response.json()
    except Exception:
        return None

    for event in payload.get("events", []):
        action = (event.get("eventAction") or "").lower()
        if action in {"registration", "registered", "creation", "created"}:
            event_date = event.get("eventDate")
            if not event_date:
                continue
            created_at = datetime.fromisoformat(event_date.replace("Z", "+00:00"))
            return max((datetime.now(timezone.utc) - created_at).days, 0)
    return None


def _host_matches(host: str, expected: str) -> bool:
    return host == expected or host.endswith(f".{expected}")


def _resolve_domain(domain: str) -> bool:
    try:
        socket.getaddrinfo(domain, 443)
        return True
    except socket.gaierror:
        return False


async def _check_website(client: httpx.AsyncClient, domain: str) -> Optional[str]:
    for scheme in ("https", "http"):
        url = f"{scheme}://{domain}"
        try:
            response = await client.get(url, headers=REQUEST_HEADERS)
            if response.status_code < 500:
                return url
        except Exception:
            continue
    return None


async def verify_entities(entities: Dict[str, Any]) -> Dict[str, Any]:
    checks: List[Dict[str, Any]] = []
    trust_indicators: List[str] = []
    risk_indicators: List[str] = []
    verified_sources: List[str] = []
    complaint_signals: List[str] = []
    company = entities.get("company_name")
    recruiter_email = entities.get("recruiter_email")
    email_domain = _domain_from_email(recruiter_email)
    candidate_domain = _candidate_domain(entities)
    domain_age_days = None

    if recruiter_email:
        if email_domain and is_personal_email_domain(email_domain):
            risk_indicators.append(f"Recruiter uses a personal email domain ({email_domain})")
            checks.append({"name": "official_email", "status": "failed", "details": risk_indicators[-1]})
        elif email_domain:
            trust_indicators.append(f"Recruiter uses an official-looking domain ({email_domain})")
            checks.append({"name": "official_email", "status": "verified", "details": trust_indicators[-1]})

    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        if candidate_domain and _resolve_domain(candidate_domain):
            website_url = await _check_website(client, candidate_domain)
            if website_url:
                trust_indicators.append(f"Official website responded at {website_url}")
                verified_sources.append(website_url)
                checks.append({"name": "website", "status": "verified", "details": trust_indicators[-1], "source": website_url})
            else:
                risk_indicators.append(f"Domain {candidate_domain} exists but the website could not be verified")
                checks.append({"name": "website", "status": "warning", "details": risk_indicators[-1]})
        elif candidate_domain:
            risk_indicators.append(f"No reachable company website found for {candidate_domain}")
            checks.append({"name": "website", "status": "failed", "details": risk_indicators[-1]})

        if candidate_domain:
            try:
                domain_age_days = await _domain_age_days(client, candidate_domain)
                if domain_age_days is not None:
                    age_years = round(domain_age_days / 365, 1)
                    if domain_age_days >= 730:
                        trust_indicators.append(f"Domain age looks established ({age_years} years old)")
                        checks.append({"name": "domain_age", "status": "verified", "details": trust_indicators[-1]})
                    elif domain_age_days <= 180:
                        risk_indicators.append(f"Domain appears recently registered ({domain_age_days} days old)")
                        checks.append({"name": "domain_age", "status": "failed", "details": risk_indicators[-1]})
                    else:
                        checks.append({"name": "domain_age", "status": "warning", "details": f"Domain age is {domain_age_days} days"})
            except Exception:
                checks.append({"name": "domain_age", "status": "unknown", "details": "Domain age could not be verified"})

        if company:
            search_jobs = {
                "linkedin": f'site:linkedin.com/company "{company}"',
                "reviews": f'(site:glassdoor.com OR site:indeed.com OR site:ambitionbox.com) "{company}" internship',
                "complaints": f'"{company}" internship scam OR fraud OR complaint',
            }
            for search_name, query in search_jobs.items():
                try:
                    results = await _duckduckgo_search(client, query)
                except Exception:
                    checks.append({"name": search_name, "status": "unknown", "details": f"{search_name.title()} search could not be completed"})
                    continue

                if search_name == "linkedin":
                    linkedin_match = next((item for item in results if _host_matches(item["host"], "linkedin.com")), None)
                    if linkedin_match:
                        detail = f"LinkedIn company profile surfaced in search results ({linkedin_match['url']})"
                        trust_indicators.append(detail)
                        verified_sources.append(linkedin_match["url"])
                        checks.append({"name": search_name, "status": "verified", "details": detail, "source": linkedin_match["url"]})
                    else:
                        checks.append({"name": search_name, "status": "warning", "details": "No LinkedIn company result was verified"})
                elif search_name == "reviews":
                    review_match = next((item for item in results if item["host"] in TRUSTED_PROFILE_HOSTS), None)
                    if review_match:
                        detail = f"Trusted company/review listing found on {review_match['host']}"
                        trust_indicators.append(detail)
                        verified_sources.append(review_match["url"])
                        checks.append({"name": search_name, "status": "verified", "details": detail, "source": review_match["url"]})
                    else:
                        checks.append({"name": search_name, "status": "warning", "details": "No trusted company listing was verified"})
                else:
                    matched_results = [
                        item for item in results
                        if any(term in f"{item['title']} {item['snippet']}".lower() for term in SCAM_SEARCH_TERMS)
                    ]
                    if len(matched_results) >= 2:
                        detail = f"Multiple scam/complaint search results mention {company}"
                        complaint_signals.append(detail)
                        checks.append({"name": search_name, "status": "failed", "details": detail})
                    else:
                        checks.append({"name": search_name, "status": "verified", "details": "No strong scam complaint cluster was found"})

    if candidate_domain and email_domain and candidate_domain == email_domain and not is_personal_email_domain(email_domain):
        trust_indicators.append("Recruiter email domain matches the detected company domain")

    if not company:
        risk_indicators.append("Company name could not be extracted for verification")
    if not trust_indicators and company:
        risk_indicators.append(f"Could not verify trusted sources for {company}")

    if complaint_signals or len(risk_indicators) >= 2:
        verification_status = "Failed"
    elif trust_indicators:
        verification_status = "Verified" if len(trust_indicators) >= 2 else "Partially Verified"
    else:
        verification_status = "Unverified"

    return {
        "verification_status": verification_status,
        "checks": checks,
        "trust_indicators": trust_indicators,
        "risk_indicators": risk_indicators,
        "verified_sources": list(dict.fromkeys(verified_sources)),
        "complaint_signals": complaint_signals,
        "domain_age_days": domain_age_days,
        "candidate_domain": candidate_domain,
    }
