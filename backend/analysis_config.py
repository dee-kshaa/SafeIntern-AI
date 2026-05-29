import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

REPORTS_FILE = os.path.join(os.path.dirname(__file__), "reports.json")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma4")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if origin.strip()
]
SEMANTIC_MODEL = os.getenv("SEMANTIC_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
SEMANTIC_MATCH_THRESHOLD = float(os.getenv("SEMANTIC_MATCH_THRESHOLD", "0.58"))
MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS = int(os.getenv("MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS", "20"))
MIN_SEMANTIC_SCORE_BOOST = int(os.getenv("MIN_SEMANTIC_SCORE_BOOST", "12"))
MAX_SEMANTIC_SCORE_BOOST = int(os.getenv("MAX_SEMANTIC_SCORE_BOOST", "24"))
TOP_K_SEMANTIC_MATCHES = int(os.getenv("TOP_K_SEMANTIC_MATCHES", "3"))

PERSONAL_EMAIL_DOMAINS = {
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
}

TRUSTED_PROFILE_HOSTS = {
    "linkedin.com",
    "www.linkedin.com",
    "glassdoor.com",
    "www.glassdoor.com",
    "indeed.com",
    "www.indeed.com",
    "ambitionbox.com",
    "www.ambitionbox.com",
    "crunchbase.com",
    "www.crunchbase.com",
}

SCAM_SEARCH_TERMS = ("scam", "fake", "fraud", "complaint", "review")

SEMANTIC_SCAM_EXAMPLES = [
    "No interview required. Pay a refundable onboarding fee now to confirm internship slot.",
    "Urgent hiring for partner projects. Register immediately on this site or your seat is cancelled.",
    "Before onboarding, purchase a mandatory certification kit and reply yes to continue.",
    "You are automatically selected with high stipend and free trip. Share Aadhaar, PAN, bank details, and OTP.",
    "Transfer a refundable security deposit for verification and keep this hiring process confidential.",
    "Guaranteed placement at top companies after paying for certification. No coding required.",
]

PAYMENT_PATTERNS = [
    "registration fee",
    "processing fee",
    "security deposit",
    "refundable deposit",
    "onboarding fee",
    "training fee",
    "certificate fee",
    "certification fee",
    "pay now",
    "payment required",
    "wallet recharge",
    "upi payment",
    "send money",
    "transfer money",
]

URGENCY_PATTERNS = [
    "act now",
    "urgent",
    "immediately",
    "last chance",
    "within 24 hours",
    "limited seats",
    "join immediately",
    "start today",
    "offer expires today",
    "respond immediately",
]

INTERVIEW_PATTERNS = [
    "no interview",
    "without interview",
    "selected based on resume",
    "immediate selection",
    "direct selection",
    "chat interview",
    "interview on whatsapp",
    "interview via telegram",
    "whatsapp interview",
]

SENSITIVE_INFO_PATTERNS = [
    "aadhaar",
    "aadhar",
    "pan card",
    "passport",
    "id proof",
    "bank account",
    "ifsc",
    "otp",
    "cvv",
    "upi id",
]

FAKE_HR_PATTERNS = [
    "dear candidate",
    "congratulations candidate",
    "kindly share documents",
    "hr department team",
    "reply yes to continue",
    "selected for our partner company",
    "guaranteed placement",
]

SUSPICIOUS_PHRASE_PATTERNS = [
    "registration fee",
    "guaranteed placement",
    "no interview required",
    "share OTP",
    "limited seats",
    "urgent payment",
]

MISSPELLING_PATTERNS = [
    "interveiw",
    "seletion",
    "recuiter",
    "aadhar",
    "whats app",
    "salery",
]
