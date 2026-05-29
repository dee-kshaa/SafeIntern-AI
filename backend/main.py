from datetime import datetime
import json
import os
import uuid

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from analysis_config import API_HOST, API_PORT, CORS_ORIGINS, REPORTS_FILE
from analysis_pipeline import analyze_text_content, analyze_upload_content
from reasoning import call_ollama

app = FastAPI(title="SafeIntern AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    text: str
    source: str | None = "text"


class ChatRequest(BaseModel):
    message: str
    context: str | None = ""


class ReportRequest(BaseModel):
    text: str
    analysis: dict
    source: str | None = "text"


def load_reports():
    if os.path.exists(REPORTS_FILE):
        with open(REPORTS_FILE, "r", encoding="utf-8") as file_handle:
            return json.load(file_handle)
    return []


def save_reports(reports):
    with open(REPORTS_FILE, "w", encoding="utf-8") as file_handle:
        json.dump(reports, file_handle, indent=2)


@app.post("/api/analyze")
async def analyze_text(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    return await analyze_text_content(request.text, source=request.source or "text")


@app.post("/api/analyze/image")
@app.post("/api/analyze/file")
async def analyze_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        return await analyze_upload_content(file.filename or "upload", file.content_type, contents)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error processing file: {exc}") from exc


@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        prompt = f"""You are SafeIntern AI, a helpful assistant that protects students from internship and job scams.

Context: {request.context if request.context else 'General safety question'}
User question: {request.message}

Provide a concise response with practical verification advice."""
        response = await call_ollama(prompt)
        return {"response": response}
    except Exception:
        responses = {
            "safe": "Always verify a company's official website and LinkedIn page before applying. Legitimate companies never ask for upfront fees.",
            "red flag": "Key red flags: payment requests, personal emails, unrealistic salaries, WhatsApp/Telegram-only communication, and urgency pressure.",
            "verify": "To verify a company, check the official site, LinkedIn page, domain age, and public reviews before sharing documents.",
        }
        msg_lower = request.message.lower()
        for key, response in responses.items():
            if key in msg_lower:
                return {"response": response}
        return {"response": "Verify the company independently and never pay or share identity documents before a legitimate interview process."}


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
    reports = [report for report in reports if report["id"] != report_id]
    save_reports(reports)
    return {"message": "Report deleted"}


@app.get("/")
async def root():
    return {"message": "SafeIntern AI API is running"}
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host=API_HOST, port=API_PORT)