# SafeIntern-AI

SafeIntern-AI helps students evaluate internship and job messages for scam risk using a hybrid pipeline: deterministic fraud checks, external verification signals, and LLM-assisted reasoning.

This repository is prepared for showcase/demo usage and focuses on explainability, maintainability, and transparent limitations.

## Why this project
Internship scams often include upfront fee requests, fake recruiter identities, urgency pressure, and data-theft prompts. SafeIntern-AI provides:
- **Risk classification**: Genuine / Suspicious / Likely Scam
- **Explainable output**: score breakdown, extracted red flags, and recommendations
- **Multi-input support**: text, screenshots (OCR), PDFs, and email files
- **Verification signals**: domain checks, website availability, and public profile/review discovery

## Core Features
- FastAPI backend for analysis and report history
- React frontend for scanner, dashboard, and explanations
- Ollama-backed Gemma reasoning support
- Structured extraction for payment, urgency, interview, and sensitive-data indicators
- Trust/risk breakdown and highlighted suspicious phrases

## Repository Structure
- `/backend` - FastAPI API, extraction, scoring, verification, reasoning
- `/frontend` - React + Vite UI
- `/ARCHITECTURE.md` - end-to-end architecture and data flow
- `/DEMO_SCRIPT.md` - 3-minute showcase speaking script

## Quick Start

### 1) Backend
```bash
cd /tmp/workspace/dee-kshaa/SafeIntern-AI/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env
python main.py
```

### 2) Frontend
```bash
cd /tmp/workspace/dee-kshaa/SafeIntern-AI/frontend
npm install
cp .env.example .env
npm run dev
```

## Configuration (Environment Variables)

### Backend (`/backend/.env`)
- `API_HOST` (default: `0.0.0.0`)
- `API_PORT` (default: `8000`)
- `CORS_ORIGINS` (comma-separated)
- `OLLAMA_URL`
- `OLLAMA_MODEL`
- `SEMANTIC_MODEL_NAME`
- `SEMANTIC_MATCH_THRESHOLD`
- `MIN_TEXT_LENGTH_FOR_SEMANTIC_ANALYSIS`
- `MIN_SEMANTIC_SCORE_BOOST`
- `MAX_SEMANTIC_SCORE_BOOST`
- `TOP_K_SEMANTIC_MATCHES`

### Frontend (`/frontend/.env`)
- `VITE_API_BASE_URL` (default: `http://localhost:8000`)

## Example Inputs and Expected Output Style

### Example A: Scam-like message
**Input**
> Congratulations candidate! You are selected for a paid internship. Pay a refundable registration fee of ₹2,999 today to confirm your seat. No interview required. Share Aadhaar and bank details on WhatsApp now.

**Expected output (representative)**
- `classification`: **Likely Scam**
- `risk_level`: **Likely Scam**
- `scam_probability`: high (typically > 70)
- `detected_scam_reasons` includes fee request, no interview, sensitive-data request, urgency/chat-only behavior
- `recommendations` includes "do not pay", "do not share IDs/OTP", "verify company independently"

### Example B: Likely legitimate message
**Input**
> Summer Software Intern at Acme Technologies. Apply through careers.acmetech.com. Stipend ₹20,000/month. Selection includes coding test and two interviews. Contact: internships@acmetech.com

**Expected output (representative)**
- `classification`: **Genuine** or **Suspicious** (depends on verification signal availability)
- `scam_probability`: low-to-moderate
- `trust_indicators` may include official domain/email consistency and profile/review presence
- `recommendations` still ask the user to verify independently before sharing sensitive documents

> Note: Outputs are probabilistic/risk-oriented and intended for decision support, not final legal judgment.

## Known Limitations
- Verification checks rely on public web/network availability and may fail in restricted or offline environments.
- OCR quality depends on image clarity and language quality.
- Company extraction from free-form text can miss edge cases.
- LLM reasoning quality depends on model availability and prompt adherence.
- Risk labels are advisory and should not replace institutional/career-cell verification.

## Future Scope
- Add multilingual and region-specific scam pattern support.
- Add calibrated evaluation dataset and publish reproducible benchmark metrics.
- Add recruiter/domain allowlist and institutional verification connectors.
- Add richer audit trails for moderation and analyst workflows.
- Add deployment-ready observability and rate-limiting/security hardening.

## Build & Verification
- Frontend lint: `cd frontend && npm run lint`
- Frontend build: `cd frontend && npm run build`
- Backend tests: `python -m unittest discover -s backend -p 'test*.py'`
- CI workflow: `.github/workflows/build-verification.yml`

## Showcase Assets
- Architecture document: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Demo script: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)

