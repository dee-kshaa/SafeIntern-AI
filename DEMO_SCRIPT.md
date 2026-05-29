# SafeIntern-AI: 3-Minute Showcase Demo Script

## 0:00 - 0:20 | Problem
"Internship scams are rising across social platforms and messaging apps. Students are often asked to pay fees or share sensitive identity documents before any real interview. SafeIntern-AI helps users quickly evaluate these messages and understand why something is risky."

## 0:20 - 0:45 | Solution Overview
"SafeIntern-AI combines deterministic scam-signal detection, verification checks, and Gemma-based reasoning via Ollama. Instead of just returning a score, it provides explainable evidence: detected red flags, trust indicators, and next-step recommendations."

## 0:45 - 1:35 | Live Scam Example
1. Open the Analyzer page.
2. Paste a scam-like message (fee request + urgency + no interview + sensitive data request).
3. Click Analyze.
4. Narration:
   - "The system classifies this as Likely Scam."
   - "You can see specific reasons: upfront payment request, urgency pressure, and sensitive-data collection."
   - "Recommendations are practical and actionable: do not pay, do not share IDs/OTP, and verify independently."

## 1:35 - 2:05 | Legitimate-Looking Example
1. Replace with a more formal internship message containing official domain/email and interview steps.
2. Run analysis.
3. Narration:
   - "Now risk is lower and trust indicators appear."
   - "Even for low-risk messages, the system still advises independent verification before sharing sensitive data."

## 2:05 - 2:30 | Architecture + Explainability
"Behind the scenes, the pipeline extracts entities, checks verification signals, computes weighted risk, and applies optional LLM reasoning. The output includes score breakdowns and verification status so users can understand the decision path, not just the final label."

## 2:30 - 2:50 | Limitations + Responsible Use
"This is a decision-support tool, not a legal authority. Web verification and OCR can fail in real-world conditions, and model reasoning depends on deployment quality. We explicitly document these limitations to keep usage responsible."

## 2:50 - 3:00 | Close
"SafeIntern-AI demonstrates practical, explainable AI for social good: helping students avoid internship fraud with transparent and actionable risk analysis."
