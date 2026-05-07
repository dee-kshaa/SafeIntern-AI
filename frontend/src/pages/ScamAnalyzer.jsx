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
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'] },
    maxFiles: 1,
  });

  const handleAnalyze = async () => {
    setError('');
    setResult(null);
    setAnalyzing(true);
    setSaved(false);
    try {
      let data;
      if (activeTab === 'text') {
        if (!text.trim()) { setError('Please enter some text to analyze.'); setAnalyzing(false); return; }
        data = await analyzeText(text, 'text');
      } else {
        if (!uploadedFile) { setError('Please upload an image.'); setAnalyzing(false); return; }
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
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          Scam Analyzer
        </h1>
        <p className="text-white/60">Paste text or upload a screenshot to analyze for scam indicators</p>
      </div>

      {/* Tabs */}
      <div className="glass-card p-6 mb-6 animate-slide-up">
        <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('text')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'text' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Paste Text
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'image' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" /> Upload Image
          </button>
        </div>

        {activeTab === 'text' ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste the internship/job posting text here...\n\nExample: 'We are hiring interns! Earn \u20b950,000/month from home. Pay \u20b92000 registration fee to get started. Contact us on WhatsApp: +91XXXXXXXXXX. Limited seats! Apply within 24 hours.'`}
            className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 resize-none transition-colors"
          />
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 hover:border-primary/50 hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-white/40 mx-auto mb-4" />
            {uploadedFile ? (
              <div>
                <p className="text-success font-medium">{uploadedFile.name}</p>
                <p className="text-white/40 text-sm mt-1">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-white/60 mb-1">{isDragActive ? 'Drop the image here' : 'Drag & drop a screenshot here'}</p>
                <p className="text-white/40 text-sm">or click to browse &bull; PNG, JPG, JPEG supported</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="btn-gradient px-8 py-3 rounded-xl text-white font-bold flex items-center gap-2 glow-indigo disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing...</>
            ) : (
              <><Search className="w-5 h-5" /> Analyze Now</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {analyzing && (
        <div className="glass-card p-8 animate-fade-in">
          <Loader message="AI is scanning for scam indicators..." />
        </div>
      )}

      {/* Results */}
      {result && !analyzing && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary Banner */}
          <div className={`glass-card p-6 border-l-4 ${
            result.risk_level === 'Safe' ? 'border-success' :
            result.risk_level === 'Suspicious' ? 'border-warning' :
            result.risk_level === 'High Risk' ? 'border-orange-500' : 'border-danger'
          }`}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {result.risk_level === 'Safe' ? (
                  <CheckCircle className="w-10 h-10 text-success flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-danger flex-shrink-0" />
                )}
                <div>
                  <RiskBadge level={result.risk_level} size="lg" />
                  <p className="text-white/80 text-sm mt-2 max-w-2xl">{result.summary}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saved}
                  className={`px-5 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                    saved ? 'bg-success/20 text-success border border-success/30' : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {saved ? 'Saved!' : 'Save Report'}
                </button>
              </div>
            </div>
          </div>

          {/* Main Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scam Meter */}
            <div className="glass-card p-6 flex flex-col items-center">
              <h2 className="text-lg font-bold text-white mb-6 self-start">Scam Probability</h2>
              <ScamMeter probability={result.scam_probability} riskLevel={result.risk_level} />
            </div>

            {/* Trust Breakdown */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-6">Trust Breakdown</h2>
              <TrustBreakdown data={result.trust_breakdown} />
            </div>

            {/* Flags */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                Detected Flags ({result.flags?.length || 0})
              </h2>
              <div className="space-y-2">
                {(result.flags || []).map((flag, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20">
                    <span className="text-warning text-xs mt-0.5">⚠</span>
                    <span className="text-white/80 text-sm">{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Why Suspicious */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4">Why Is This Suspicious?</h2>
              <ExplainabilityPanel explanations={result.explanations || []} />
            </div>
          </div>

          {/* Highlighted Text */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Analyzed Text (Highlighted Risk Phrases)
            </h2>
            <HighlightedText html={result.highlighted_text} plainText={text} />
          </div>

          {/* Recommendations */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-success" />
              Safety Recommendations
            </h2>
            <div className="space-y-3">
              {(result.recommendations || []).map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-white/80 text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
