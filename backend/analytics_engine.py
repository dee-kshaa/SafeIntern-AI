"""Internship market analytics engine."""

from __future__ import annotations

from collections import Counter

from cloud_pipeline import query_bigquery_dataset
from gpu_accel import pd


def _clean_data(frame: pd.DataFrame) -> pd.DataFrame:
    cleaned = frame.copy()

    numeric_cols = ["stipend_inr", "deadline_in_days", "trust_score", "scam_risk_score"]
    for col in numeric_cols:
        cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")

    cleaned = cleaned.dropna(subset=numeric_cols + ["company", "category", "skills_required", "listed_date"])
    cleaned["listed_date"] = pd.to_datetime(cleaned["listed_date"], errors="coerce")
    cleaned = cleaned.dropna(subset=["listed_date"])

    cleaned["company"] = cleaned["company"].astype(str).str.strip()
    cleaned["category"] = cleaned["category"].astype(str).str.strip()
    cleaned["skills_required"] = cleaned["skills_required"].astype(str).str.lower()

    return cleaned.reset_index(drop=True)


def _trend_data(frame: pd.DataFrame) -> list[dict]:
    trend = (
        frame.assign(month=frame["listed_date"].dt.to_period("M").astype(str))
        .groupby("month", as_index=False)
        .agg(
            avg_scam_risk=("scam_risk_score", "mean"),
            avg_trust=("trust_score", "mean"),
            listings=("id", "count"),
        )
        .sort_values("month")
    )
    trend["avg_scam_risk"] = trend["avg_scam_risk"].round(2)
    trend["avg_trust"] = trend["avg_trust"].round(2)
    return trend.to_dict("records")


def _top_companies(frame: pd.DataFrame, limit: int = 10) -> list[dict]:
    top = frame.groupby("company", as_index=False).size().rename(columns={"size": "count"})
    top = top.sort_values("count", ascending=False).head(limit)
    return top.to_dict("records")


def _top_skills(frame: pd.DataFrame, limit: int = 12) -> list[dict]:
    skill_counter: Counter[str] = Counter()
    for raw in frame["skills_required"].fillna(""):
        parts = [part.strip() for part in str(raw).split(",") if part.strip()]
        skill_counter.update(parts)

    return [{"skill": skill, "count": count} for skill, count in skill_counter.most_common(limit)]


def _salary_distribution(frame: pd.DataFrame) -> list[dict]:
    bins = [0, 10000, 15000, 20000, 30000, 50000, 100000]
    labels = ["0-10k", "10k-15k", "15k-20k", "20k-30k", "30k-50k", "50k+"]
    salary_bins = pd.cut(frame["stipend_inr"], bins=bins, labels=labels, include_lowest=True)
    distribution = salary_bins.value_counts().sort_index()

    return [
        {"range": str(label), "count": int(distribution.get(label, 0))}
        for label in labels
    ]


def _category_breakdown(frame: pd.DataFrame) -> list[dict]:
    category = frame.groupby("category", as_index=False).size().rename(columns={"size": "count"})
    category = category.sort_values("count", ascending=False)
    return category.to_dict("records")


def _deadline_urgency(frame: pd.DataFrame) -> list[dict]:
    urgent = int((frame["deadline_in_days"] <= 7).sum())
    moderate = int(((frame["deadline_in_days"] > 7) & (frame["deadline_in_days"] <= 21)).sum())
    flexible = int((frame["deadline_in_days"] > 21).sum())

    return [
        {"bucket": "Urgent (<= 7 days)", "count": urgent},
        {"bucket": "Upcoming (8-21 days)", "count": moderate},
        {"bucket": "Planned (22+ days)", "count": flexible},
    ]


def _trust_vs_scam(frame: pd.DataFrame) -> list[dict]:
    sample = frame[["id", "company", "category", "trust_score", "scam_risk_score", "deadline_in_days", "stipend_inr"]]
    sample = sample.sort_values("id").head(400)
    return sample.rename(columns={"trust_score": "trust", "scam_risk_score": "scam_risk"}).to_dict("records")


def _recommendation_candidates(frame: pd.DataFrame) -> list[dict]:
    ranked = frame.copy()
    ranked["priority_score"] = (
        ranked["trust_score"] * 0.45
        + (100 - ranked["scam_risk_score"]) * 0.35
        + (30000 - ranked["deadline_in_days"].clip(upper=60) * 400) / 300
    )
    ranked = ranked.sort_values("priority_score", ascending=False).head(12)

    columns = [
        "id",
        "company",
        "category",
        "stipend_inr",
        "deadline_in_days",
        "trust_score",
        "scam_risk_score",
        "skills_required",
    ]
    return ranked[columns].to_dict("records")


def get_full_analytics() -> dict:
    frame = query_bigquery_dataset()
    cleaned = _clean_data(frame)

    total_records = int(len(cleaned))
    avg_stipend = float(cleaned["stipend_inr"].mean()) if total_records else 0.0
    high_risk_count = int((cleaned["scam_risk_score"] >= 65).sum())

    return {
        "summary": {
            "total_listings": total_records,
            "average_stipend_inr": round(avg_stipend, 2),
            "average_trust_score": round(float(cleaned["trust_score"].mean()), 2) if total_records else 0.0,
            "high_risk_listings": high_risk_count,
            "high_risk_percentage": round((high_risk_count / total_records) * 100, 2) if total_records else 0.0,
        },
        "scam_trends": _trend_data(cleaned),
        "salary_distribution": _salary_distribution(cleaned),
        "top_hiring_companies": _top_companies(cleaned),
        "top_skills": _top_skills(cleaned),
        "category_breakdown": _category_breakdown(cleaned),
        "deadline_urgency": _deadline_urgency(cleaned),
        "trust_vs_scam_scatter": _trust_vs_scam(cleaned),
        "recommendation_candidates": _recommendation_candidates(cleaned),
    }
