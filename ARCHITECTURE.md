# SafeIntern-AI Architecture

## 1. Objective
SafeIntern-AI analyzes internship/job content and returns an explainable scam-risk assessment. The system is designed for fast interactive use, transparent reasoning, and modular extensibility.

## 2. High-Level Components

1. **Frontend (React + Vite)**
   - User input for text/files
   - Visualization of risk score, explanations, and report history
   - Calls backend REST API

2. **Backend API (FastAPI)**
   - Request validation and orchestration
   - Analysis pipeline invocation
   - Report persistence (`reports.json`)

3. **Analysis Pipeline**
   - Structured entity extraction
   - External verification checks
   - Deterministic scoring and trust breakdown
   - Optional Gemma/Ollama reasoning adjustment

4. **External/Model Services**
   - Ollama endpoint for LLM responses
   - Public web/domain endpoints for verification
   - OCR libraries for image extraction

## 3. Request Flow

### Text Analysis (`POST /api/analyze`)
1. Frontend sends `text` and `source`.
2. Backend validates non-empty content.
3. `extract_structured_entities` identifies company, contact, payment requests, urgency, interview claims, and sensitive-data requests.
4. `verify_entities` performs domain/profile/review checks and complaint-signal probing.
5. `score_analysis` computes weighted risk, flags, trust breakdown, and recommendations.
6. `reason_with_gemma` (if available) produces optional confidence and score adjustment.
7. Pipeline returns final classification, probability/score, explanations, and evidence.

### File/Image Analysis (`POST /api/analyze/file` and `/api/analyze/image`)
1. Backend receives upload bytes.
2. `extract_text_from_upload` routes by file type:
   - image -> OCR
   - PDF -> text extraction
   - email -> header/body extraction
   - text -> decode
3. Extracted text is passed to same main pipeline.

## 4. Backend Module Responsibilities
- `main.py`: API routes, CORS, report CRUD, app startup
- `analysis_pipeline.py`: end-to-end orchestration and final result shaping
- `extraction.py`: regex/pattern extraction + upload content extraction
- `verification.py`: web/domain/profile/review verification signals
- `scoring.py`: deterministic risk/trust scoring logic
- `reasoning.py`: Ollama/Gemma call and structured parsing
- `analysis_config.py`: runtime configuration constants and environment loading

## 5. Data Contracts (Core Output)
Representative response fields:
- `classification` / `risk_level`
- `scam_probability`, `risk_meter`, `confidence_score`
- `summary`, `flags`, `detected_scam_reasons`
- `explanations`, `recommendations`
- `verification_status`, `verification_checks`, `verified_sources`
- `score_breakdown`, `trust_breakdown`, `extracted_entities`

## 6. Configuration Design
Configuration is environment-driven for portability:
- API host/port (`API_HOST`, `API_PORT`)
- CORS origin allowlist (`CORS_ORIGINS`)
- Frontend API URL (`VITE_API_BASE_URL`)
- Model settings (`OLLAMA_URL`, `OLLAMA_MODEL`, semantic tuning variables)

This supports local demo, cloud deployment, and environment-specific override without code edits.

## 7. Security and Trust Considerations
- CORS allowlist is explicit and configurable.
- System avoids automatic action execution; it only returns advisory analysis.
- Sensitive-data requests are treated as high-risk signals.
- Public web verification can be unavailable or noisy; outputs remain explainable even when verification is partial.

## 8. Reliability and Failure Handling
- If LLM reasoning fails, deterministic scoring still returns results.
- If verification endpoints fail, pipeline degrades to extraction + scoring with explicit verification status.
- Unsupported upload formats return controlled error responses.

## 9. Build and Test Strategy
- Frontend checks: lint + production build
- Backend tests: minimal unit tests for analysis pipeline orchestration and classification behavior
- CI: GitHub Actions workflow runs frontend checks and backend tests on push/pull_request

## 10. Scalability Notes (Near-term)
- Current report storage is file-based (`reports.json`) and suitable for demo scope.
- A production migration path would use persistent DB storage, background jobs for verification calls, and API rate controls.
