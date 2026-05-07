from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import json
import os
import re
import uuid
from datetime import datetime
import io

app = FastAPI(title="SafeIntern AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

REPORTS_FILE = os.path.join(os.path.dirname(__file__), "reports.json")

def load_reports():
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, "r") as f:
            return json.load(f)
    return []

def save_reports(reports):
    with open(REPORTS_FILE, "w") as f:
        json.dump(reports, f, indent=2)

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
    urgency_keywords = ["limited seats", "act now", "urgent", "immediately", "last chance", "within 24 hours", "hurry", "today only", "expires soon", "don't miss"]
    phishing_keywords = ["verify your details", "click here", "login to claim", "confirm your account", "update your information", "verify now"]
    suspicious_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"]
    unrealistic_pay = ["10 lakh", "1 crore", "₹1,00,000", "₹50,000 per month", "earn 50000", "earn 1 lakh"]

    for kw in payment_keywords:
        if kw in text_lower:
            flags.append(f"Payment keyword detected: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 30, 95)

    for kw in cert_keywords:
        if kw in text_lower:
            flags.append(f"Suspicious certification/training fee language: '{kw}'")
            risky_phrases.append(kw)
            payment_risk = min(payment_risk + 20, 95)
            language_credibility = max(language_credibility - 20, 10)

    if "₹" in text or "inr" in text_lower:
        flags.append("Indian Rupee currency symbol found - possible money request")
        risky_phrases.append("₹")
        payment_risk = min(payment_risk + 15, 95)

    for kw in urgency_keywords:
        if kw in text_lower:
            flags.append(f"Urgency tactic detected: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 20, 10)

    for domain in suspicious_domains:
        if domain in text_lower:
            flags.append(f"Suspicious email domain: '{domain}' used for official communication")
            risky_phrases.append(domain)
            recruiter_authenticity = max(recruiter_authenticity - 30, 10)
            company_presence = max(company_presence - 25, 10)

    for kw in phishing_keywords:
        if kw in text_lower:
            flags.append(f"Phishing language detected: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 25, 10)
            recruiter_authenticity = max(recruiter_authenticity - 20, 10)

    for kw in unrealistic_pay:
        if kw in text_lower:
            flags.append(f"Unrealistic compensation claim: '{kw}'")
            risky_phrases.append(kw)
            language_credibility = max(language_credibility - 20, 10)

    telegram_mention = "telegram" in text_lower or "t.me" in text_lower
    whatsapp_mention = "whatsapp" in text_lower
    has_official_email = bool(re.search(r'[a-zA-Z0-9._%+-]+@(?!gmail|yahoo|hotmail|outlook)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text))
    has_website = bool(re.search(r'https?://(?!t\.me|wa\.me)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text))

    if (telegram_mention or whatsapp_mention) and not has_official_email and not has_website:
        flags.append("Only informal contact (Telegram/WhatsApp) with no official website or email")
        risky_phrases.extend([kw for kw in ["telegram", "whatsapp", "t.me"] if kw in text_lower])
        recruiter_authenticity = max(recruiter_authenticity - 35, 10)
        company_presence = max(company_presence - 30, 10)

    scam_probability = 0
    if payment_risk > 50:
        scam_probability += 40
    if recruiter_authenticity < 50:
        scam_probability += 25
    if company_presence < 50:
        scam_probability += 20
    if language_credibility < 50:
        scam_probability += 15
    scam_probability = min(scam_probability + len(flags) * 3, 99)

    if scam_probability >= 75:
        risk_level = "Critical Risk"
    elif scam_probability >= 50:
        risk_level = "High Risk"
    elif scam_probability >= 25:
        risk_level = "Suspicious"
    else:
        risk_level = "Safe"

    explanations = []
    if payment_risk > 50:
        explanations.append({
            "title": "Requests Payment or Fees",
            "description": "Legitimate internships never ask candidates to pay fees, deposits, or registration charges. This is a major red flag.",
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

    recommendations = [
        "Never pay any fee to secure an internship or job",
        "Verify the company on LinkedIn and official government portals",
        "Only communicate through official company email domains",
        "Check for a verified company website before proceeding",
        "Report suspicious postings to the platform and cybercrime.gov.in",
    ]
    if payment_risk > 50:
        recommendations.insert(0, "IMMEDIATELY stop communication - this appears to be a money scam")

    if scam_probability < 20:
        summary = "This listing appears to be legitimate. Standard safety precautions are still advised."
    elif scam_probability < 50:
        summary = "This listing shows some suspicious patterns. Exercise caution and verify the company independently."
    elif scam_probability < 75:
        summary = "This listing has multiple high-risk indicators. Strong possibility of a scam - do not pay any money."
    else:
        summary = "CRITICAL: This listing has extremely high scam probability. Do not engage, do not pay, report immediately."

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
    
    result = await analyze_with_ollama(request.text)
    if result is None:
        result = rule_based_analysis(request.text)
    
    return result

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
        
        result = await analyze_with_ollama(extracted_text)
        if result is None:
            result = rule_based_analysis(extracted_text)
        
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
