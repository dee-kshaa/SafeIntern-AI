"""Cloud Storage -> BigQuery pipeline with mock and production integration hooks."""

from __future__ import annotations

import os
import random
from datetime import date, timedelta

from gpu_accel import pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATASET_PATH = os.path.join(DATA_DIR, "internships_dataset.csv")
USE_GCP_SERVICES = os.getenv("USE_GCP_SERVICES", "false").lower() == "true"

_BIGQUERY_TABLE: pd.DataFrame | None = None


# ------------------------------
# Mock implementation (hackathon)
# ------------------------------
def _ensure_mock_dataset() -> str:
    if os.path.exists(DATASET_PATH):
        return DATASET_PATH

    os.makedirs(DATA_DIR, exist_ok=True)

    rng = random.Random(42)
    base_date = date.today() - timedelta(days=140)

    companies = [
        "Infosys", "TCS", "Wipro", "Accenture", "Cognizant", "Google", "Microsoft", "Amazon", "Flipkart",
        "Swiggy", "Zomato", "Paytm", "PhonePe", "Razorpay", "Freshworks", "Zoho", "Meesho", "Myntra",
        "NVIDIA", "Intel", "IBM", "Deloitte", "EY", "KPMG", "PwC", "Juspay", "Postman", "CRED",
        "Urban Company", "Groww", "Khatabook", "Druva", "BrowserStack", "Practo", "Unacademy", "Byju's",
    ]
    categories = [
        "Software Engineering", "Data Science", "Data Analytics", "Product Management", "Cybersecurity",
        "AI/ML", "Cloud Engineering", "UI/UX Design", "Marketing", "Business Operations",
    ]
    category_skills = {
        "Software Engineering": ["python", "java", "git", "sql", "react", "nodejs"],
        "Data Science": ["python", "pandas", "numpy", "machine learning", "sql", "statistics"],
        "Data Analytics": ["sql", "excel", "power bi", "tableau", "python", "communication"],
        "Product Management": ["roadmapping", "analytics", "stakeholder management", "sql", "communication"],
        "Cybersecurity": ["network security", "siem", "linux", "python", "threat analysis"],
        "AI/ML": ["python", "pytorch", "tensorflow", "mlops", "statistics", "llms"],
        "Cloud Engineering": ["gcp", "aws", "docker", "kubernetes", "terraform", "python"],
        "UI/UX Design": ["figma", "prototyping", "user research", "wireframing", "design systems"],
        "Marketing": ["seo", "content strategy", "analytics", "social media", "copywriting"],
        "Business Operations": ["excel", "sql", "reporting", "communication", "project management"],
    }

    records = []
    for record_id in range(1, 601):
        category = rng.choice(categories)
        company = rng.choice(companies)
        stipend = int(max(5000, rng.gauss(22000, 8000)))
        deadline = max(1, int(rng.triangular(1, 60, 12)))
        listed = base_date + timedelta(days=rng.randint(0, 140))

        baseline_trust = rng.uniform(35, 92)
        scam_noise = rng.uniform(-15, 15)
        scam_risk = min(100.0, max(0.0, 100.0 - baseline_trust + scam_noise))

        if rng.random() < 0.08:
            scam_risk = min(100.0, scam_risk + rng.uniform(20, 35))
            baseline_trust = max(5.0, baseline_trust - rng.uniform(18, 30))

        skills_pool = category_skills[category]
        required_skills = ", ".join(rng.sample(skills_pool, k=min(4, len(skills_pool))))

        records.append(
            {
                "id": record_id,
                "company": company,
                "category": category,
                "stipend_inr": stipend,
                "deadline_in_days": deadline,
                "trust_score": round(baseline_trust, 2),
                "scam_risk_score": round(scam_risk, 2),
                "skills_required": required_skills,
                "listed_date": listed.isoformat(),
            }
        )

    pd.DataFrame(records).to_csv(DATASET_PATH, index=False)
    return DATASET_PATH


def _mock_ingest_from_cloud_storage() -> dict:
    dataset_path = _ensure_mock_dataset()
    frame = pd.read_csv(dataset_path)
    return {
        "mode": "mock",
        "storage_provider": "google-cloud-storage",
        "bucket": "safeintern-hackathon-datasets",
        "object": "internships_dataset.csv",
        "records": int(len(frame)),
        "dataset_path": dataset_path,
    }


def _mock_load_into_bigquery() -> dict:
    global _BIGQUERY_TABLE

    ingestion = _mock_ingest_from_cloud_storage()
    _BIGQUERY_TABLE = pd.read_csv(ingestion["dataset_path"])
    return {
        "mode": "mock",
        "warehouse": "bigquery",
        "table": "safeintern.analytics.internships_dataset",
        "rows_loaded": int(len(_BIGQUERY_TABLE)),
        "dataset_path": ingestion["dataset_path"],
    }


def _mock_query_bigquery_dataset() -> pd.DataFrame:
    global _BIGQUERY_TABLE

    if _BIGQUERY_TABLE is None:
        _mock_load_into_bigquery()
    return _BIGQUERY_TABLE.copy()


# ---------------------------------
# Production integration placeholders
# ---------------------------------
def _production_ingest_from_cloud_storage() -> dict:
    raise NotImplementedError("Production Cloud Storage integration is not configured in this environment.")


def _production_load_into_bigquery() -> dict:
    raise NotImplementedError("Production BigQuery load integration is not configured in this environment.")


def _production_query_bigquery_dataset() -> pd.DataFrame:
    raise NotImplementedError("Production BigQuery query integration is not configured in this environment.")


# -----------------
# Public API methods
# -----------------
def ingest_from_cloud_storage() -> dict:
    if USE_GCP_SERVICES:
        try:
            return _production_ingest_from_cloud_storage()
        except Exception:
            return _mock_ingest_from_cloud_storage()
    return _mock_ingest_from_cloud_storage()


def load_into_bigquery() -> dict:
    if USE_GCP_SERVICES:
        try:
            return _production_load_into_bigquery()
        except Exception:
            return _mock_load_into_bigquery()
    return _mock_load_into_bigquery()


def query_bigquery_dataset() -> pd.DataFrame:
    if USE_GCP_SERVICES:
        try:
            return _production_query_bigquery_dataset()
        except Exception:
            return _mock_query_bigquery_dataset()
    return _mock_query_bigquery_dataset()


def pipeline_status() -> dict:
    ingestion = ingest_from_cloud_storage()
    load_info = load_into_bigquery()
    return {
        "cloud_storage": {
            "provider": ingestion["storage_provider"],
            "mode": ingestion["mode"],
            "records": ingestion["records"],
            "dataset_path": ingestion["dataset_path"],
        },
        "bigquery": {
            "warehouse": load_info["warehouse"],
            "mode": load_info["mode"],
            "table": load_info["table"],
            "rows_loaded": load_info["rows_loaded"],
        },
        "use_gcp_services": USE_GCP_SERVICES,
    }
