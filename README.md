# SafeIntern-AI

![Hackathon](https://img.shields.io/badge/Gemma%204%20Good-Hackathon-blueviolet)
![AI-Powered Fraud Analysis](https://img.shields.io/badge/AI-Powered%20Fraud%20Analysis-Enabled-2ea44f)
![Explainable Scam Intelligence](https://img.shields.io/badge/Explainable%20Scam%20Intelligence-Active-1f6feb)

SafeIntern-AI is an AI-powered safety platform built to protect students and early-career applicants from fake internship and job scams.

## Project Introduction

Internship and entry-level job scams are growing rapidly across social media, messaging apps, and fake career portals. Many students are pressured to pay “registration fees,” share sensitive documents, or trust fraudulent recruiters offering unrealistic opportunities.

The damage is serious: students lose money, confidence, time, and access to legitimate opportunities. SafeIntern-AI addresses this by analyzing suspicious job/internship content, estimating scam risk, and clearly explaining *why* an offer may be dangerous.

## Features

- **AI Scam Detection** for internship and job postings
- **Scam Confidence Scoring** with clear risk probability
- **Suspicious Phrase Highlighting** for red-flag language
- **Explainability / Reasoning Engine** to justify results
- **Screenshot OCR Support** for image-based scam messages
- **Report History Dashboard** for tracked past analyses
- **Responsive Dual-Theme UI** (light/dark)
- **Privacy-Focused Local AI Analysis** via Ollama-compatible setup

## AI & Platform Architecture

SafeIntern-AI uses a full-stack architecture designed for fast, explainable fraud analysis:

- **Frontend Experience Layer**: React + Vite with TailwindCSS for a fast, responsive interface and clean interaction flow.
- **Backend Intelligence Layer**: FastAPI service for analysis APIs, scoring orchestration, and report persistence.
- **LLM Reasoning Layer**: Gemma 3 served through Ollama for explainable AI-driven scam reasoning.
- **Visualization Layer**: Recharts-powered dashboard components for risk trends and safety insights.
- **Extraction Layer**: Pytesseract OCR for converting screenshot text into analyzable content.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, TailwindCSS |
| Backend | FastAPI |
| AI Model Serving | Gemma 3 via Ollama |
| Data Visualization | Recharts |
| OCR | Pytesseract |

## Installation & Setup

### Backend (FastAPI)

1. Open a terminal in the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the backend API:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend (Vite + React)

1. Open a second terminal in the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage Instructions

1. Paste suspicious internship/job text into the analyzer.
2. Upload screenshots or files when scam details are image-based.
3. Run analysis to view scam probability and risk level.
4. Review highlighted suspicious phrases and explanation insights.
5. Save and review results in the report history dashboard.

## Why This Matters

SafeIntern-AI supports:

- **Student Safety** by reducing exposure to financial and identity fraud
- **Digital Trust** in online recruitment ecosystems
- **AI for Social Good** through practical, real-world harm prevention
- **Recruitment Fraud Prevention** at early stages of candidate engagement

## Hackathon Alignment

This project aligns strongly with the Gemma 4 Good Hackathon themes:

- **Safety & Trust**: focuses on detecting recruitment fraud before harm occurs.
- **Digital Equity & Inclusivity**: helps students who may lack access to formal verification channels.
- **Local AI with Ollama**: enables privacy-conscious and locally controlled analysis workflows.
- **Explainable AI Systems**: provides transparent reasoning, not just black-box scores.

## Future Improvements

- Browser extension for one-click internship page scanning
- Multilingual scam detection for regional and global users
- Recruiter verification workflows and trust signals
- Email inbox scanning for fraudulent recruitment chains
- Mobile app support for on-the-go safety checks

## Screenshots

> Add your latest demo screenshots before final submission.

![Analyzer Screen Placeholder](https://img.shields.io/badge/Screenshot-Analyzer%20View-lightgrey)
![Dashboard Placeholder](https://img.shields.io/badge/Screenshot-Report%20Dashboard-lightgrey)
![Explainability Placeholder](https://img.shields.io/badge/Screenshot-Reasoning%20Panel-lightgrey)
