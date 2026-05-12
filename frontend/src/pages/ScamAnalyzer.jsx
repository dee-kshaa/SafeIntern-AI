import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Shield, Upload, FileText, Search, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import ScamMeter from '../components/ScamMeter';
import TrustBreakdown from '../components/TrustBreakdown';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import HighlightedText from '../components/HighlightedText';
import RiskBadge from '../components/RiskBadge';
import Loader from '../components/Loader';
import { analyzeText, analyzeImage, saveReport } from '../services/api';

export default function ScamAnalyzer() {
  const [activeTab, setActiveTab] = useState('text');
  const [text, setText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) setUploadedFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf'],
      'message/rfc822': ['.eml'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const normalizedRiskLevel =
    result?.risk_level === 'Safe' ? 'Genuine' :
    ['High Risk', 'Critical Risk'].includes(result?.risk_level) ? 'Likely Scam' :
    result?.risk_level;

  const handleAnalyze = async () => {
    setError('');
    setResult(null);
    setAnalyzing(true);
    setSaved(false);
    try {
      let data;
      if (activeTab === 'text') {
        if (!text.trim()) {
          setError('Please enter some text to analyze.');
          setAnalyzing(false);
          return;
        }
        data = await analyzeText(text, 'text');
      } else {
        if (!uploadedFile) {
          setError('Please upload a screenshot, PDF, or email file.');
          setAnalyzing(false);
          return;
        }
        data = await analyzeImage(uploadedFile);
      }
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Make sure the backend is running.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await saveReport(text || 'Image analysis', result, activeTab);
      setSaved(true);
    } catch {
      setError('Failed to save report.');
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
          <Shield className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          Scam Analyzer
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>Paste text or upload a screenshot to analyze for scam indicators</p>
      </div>

      <div className="glass-card p-6 mb-6 animate-slide-up transition-theme">
        <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-input)' }}>
          <button
            onClick={() => setActiveTab('text')}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
            style={
              activeTab === 'text'
                ? { background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-glow-primary)' }
                : { color: 'var(--text-muted)' }
            }
          >
            <FileText className="w-4 h-4" /> Paste Text
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className="px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
            style={
              activeTab === 'image'
                ? { background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-glow-primary)' }
                : { color: 'var(--text-muted)' }
            }
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
        </div>

        {activeTab === 'text' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste the internship/job posting text here...\n\nExample: 'We are hiring interns! Earn ₹50,000/month from home. Pay ₹2000 registration fee to get started. Contact us on WhatsApp: +91XXXXXXXXXX. Limited seats! Apply within 24 hours.'`}
            className="w-full h-48 rounded-xl p-4 text-sm resize-none theme-input"
          />
        ) : (
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-theme"
            style={
              isDragActive
                ? {
                    borderColor: 'var(--color-primary)',
                    background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  }
                : {
                    borderColor: 'var(--border-color)',
                    background: 'transparent',
                  }
            }
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-faint)' }} />
            {uploadedFile ? (
              <div>
                <p className="font-medium" style={{ color: 'var(--safe)' }}>{uploadedFile.name}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-faint)' }}>{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="mb-1" style={{ color: 'var(--text-muted)' }}>
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a screenshot, PDF, or email file here'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>or click to browse • PNG, JPG, PDF, EML, TXT supported</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            className="mt-4 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{
              background: 'color-mix(in srgb, var(--fraudulent) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--fraudulent) 35%, transparent)',
              color: 'var(--fraudulent)',
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-gradient px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><Search className="w-5 h-5" /> Analyze Now</>
            )}
          </button>
        </div>
      </div>

      {analyzing && (
        <div className="glass-card p-8 animate-fade-in">
          <Loader message="AI is scanning for scam indicators..." />
        </div>
      )}

      {result && !analyzing && (
        <div className="space-y-6 animate-fade-in">
          <div
            className="glass-card p-6 border-l-4"
            style={{
              borderLeftColor:
                normalizedRiskLevel === 'Genuine' ? 'var(--safe)' :
                normalizedRiskLevel === 'Suspicious' ? 'var(--suspicious)' : 'var(--fraudulent)',
            }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {normalizedRiskLevel === 'Genuine' ? (
                  <CheckCircle className="w-10 h-10 flex-shrink-0" style={{ color: 'var(--safe)' }} />
                ) : (
                  <AlertTriangle className="w-10 h-10 flex-shrink-0" style={{ color: 'var(--fraudulent)' }} />
                )}
                <div>
                  <RiskBadge level={normalizedRiskLevel} size="lg" />
                  <p className="text-sm mt-2 max-w-2xl" style={{ color: 'var(--text-secondary)' }}>{result.summary}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saved}
                className="px-5 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-theme"
                style={
                  saved
                    ? {
                        background: 'color-mix(in srgb, var(--safe) 18%, transparent)',
                        color: 'var(--safe)',
                        border: '1px solid color-mix(in srgb, var(--safe) 36%, transparent)',
                      }
                    : {
                        background: 'var(--bg-input)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-color)',
                      }
                }
              >
                <Save className="w-4 h-4" />
                {saved ? 'Saved!' : 'Save Report'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-6 flex flex-col items-center animate-fade-in">
              <h2 className="text-lg font-bold mb-6 self-start" style={{ color: 'var(--text-primary)' }}>Scam Probability</h2>
              <ScamMeter probability={result.scam_confidence_score ?? result.scam_probability} riskLevel={normalizedRiskLevel} />
            </div>

            <div className="glass-card p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Trust Breakdown</h2>
              <TrustBreakdown data={result.trust_breakdown} />
            </div>

            <div className="glass-card p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--suspicious)' }} />
                Detected Flags ({result.flags?.length || 0})
              </h2>
              <div className="space-y-2">
                {(result.flags || []).map((flag, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg"
                    style={{
                      background: 'color-mix(in srgb, var(--suspicious) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--suspicious) 28%, transparent)',
                    }}
                  >
                    <span className="text-xs mt-0.5" style={{ color: 'var(--suspicious)' }}>⚠</span>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Why Is This Suspicious?</h2>
              <ExplainabilityPanel explanations={result.explanations || []} aiExplanation={result.ai_explanation} />
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--suspicious)' }} />
              Suspicious Phrases ({result.suspicious_phrases?.length || 0})
            </h2>
            {result.suspicious_phrases?.length ? (
              <div className="flex flex-wrap gap-2">
                {result.suspicious_phrases.map((phrase, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      color: 'var(--suspicious)',
                      background: 'color-mix(in srgb, var(--suspicious) 12%, transparent)',
                      border: '1px solid color-mix(in srgb, var(--suspicious) 30%, transparent)',
                    }}
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No suspicious phrases detected.</p>
            )}
          </div>

          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FileText className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
              Analyzed Text (Highlighted Risk Phrases)
            </h2>
            <HighlightedText html={result.highlighted_text} plainText={text} />
          </div>

          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Shield className="w-5 h-5" style={{ color: 'var(--safe)' }} />
              Safety Recommendations
            </h2>
            <div className="space-y-3">
              {(result.recommendations || []).map((rec, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl"
                  style={{
                    background: 'color-mix(in srgb, var(--safe) 10%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--safe) 24%, transparent)',
                  }}
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--safe)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
