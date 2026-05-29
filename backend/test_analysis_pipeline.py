import unittest
from unittest.mock import AsyncMock, patch

from analysis_pipeline import analyze_text_content


class AnalyzePipelineTests(unittest.IsolatedAsyncioTestCase):
    @patch("analysis_pipeline.extract_structured_entities")
    @patch("analysis_pipeline.verify_entities", new_callable=AsyncMock)
    @patch("analysis_pipeline.score_analysis")
    @patch("analysis_pipeline.reason_with_gemma", new_callable=AsyncMock)
    async def test_likely_scam_from_high_risk_score(
        self,
        mock_reason,
        mock_score,
        mock_verify,
        mock_extract,
    ):
        mock_extract.return_value = {
            "payment_requests": ["registration fee"],
            "urgency_phrases": ["urgent"],
            "sensitive_info_requests": ["aadhaar"],
        }
        mock_verify.return_value = {
            "verification_status": "Failed",
            "checks": [],
            "verified_sources": [],
        }
        mock_score.return_value = {
            "risk_score": 68,
            "score_breakdown": [{"title": "Asks for payment or a deposit", "weight": 32}],
            "detected_scam_reasons": ["Asks for payment or a deposit"],
            "explanations": [],
            "recommendations": ["Do not pay any fee."],
            "flags": ["Asks for payment or a deposit"],
            "suspicious_phrases": ["registration fee"],
            "highlighted_text": "<mark>registration fee</mark>",
            "trust_breakdown": {},
            "trust_indicators": [],
            "verified_trust_count": 0,
            "severe_red_flags": 1,
        }
        mock_reason.return_value = None

        result = await analyze_text_content("test scam text")

        self.assertEqual(result["classification"], "Likely Scam")
        self.assertEqual(result["risk_level"], "Likely Scam")
        self.assertGreaterEqual(result["scam_probability"], 56)
        self.assertIn("Asks for payment or a deposit", result["detected_scam_reasons"])

    @patch("analysis_pipeline.extract_structured_entities")
    @patch("analysis_pipeline.verify_entities", new_callable=AsyncMock)
    @patch("analysis_pipeline.score_analysis")
    @patch("analysis_pipeline.reason_with_gemma", new_callable=AsyncMock)
    async def test_low_score_without_verification_is_upgraded_to_suspicious(
        self,
        mock_reason,
        mock_score,
        mock_verify,
        mock_extract,
    ):
        mock_extract.return_value = {
            "payment_requests": [],
            "urgency_phrases": [],
            "sensitive_info_requests": [],
        }
        mock_verify.return_value = {
            "verification_status": "Unverified",
            "checks": [],
            "verified_sources": [],
        }
        mock_score.return_value = {
            "risk_score": 12,
            "score_breakdown": [],
            "detected_scam_reasons": [],
            "explanations": [],
            "recommendations": [],
            "flags": [],
            "suspicious_phrases": [],
            "highlighted_text": "",
            "trust_breakdown": {},
            "trust_indicators": [],
            "verified_trust_count": 0,
            "severe_red_flags": 0,
        }
        mock_reason.return_value = None

        result = await analyze_text_content("ambiguous internship text")

        self.assertEqual(result["classification"], "Suspicious")
        self.assertEqual(result["risk_level"], "Suspicious")
        self.assertGreaterEqual(result["scam_probability"], 26)
        self.assertEqual(result["verification_status"], "Unverified")


if __name__ == "__main__":
    unittest.main()
