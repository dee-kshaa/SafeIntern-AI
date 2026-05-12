import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, TrendingUp, Search, FileText } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { analyzeText, getReports } from '../services/api';

const RISK_COLORS = {
  Genuine: 'var(--safe)',
  Suspicious: 'var(--suspicious)',
  'Likely Scam': 'var(--fraudulent)',
};

const normalizeRiskLevel = (level) => (
  level === 'Safe' ? 'Genuine' :
  ['High Risk', 'Critical Risk'].includes(level) ? 'Likely Scam' :
  level || 'Suspicious'
);

export default function Dashboard() {
  const [reports, setReports] = useState([]);
  const [quickText, setQuickText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [quickResult, setQuickResult] = useState(null);

  useEffect(() => {
    getReports().then(setReports).catch(() => {});
  }, []);

  const handleQuickScan = async () => {
    if (!quickText.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeText(quickText);
      setQuickResult(result);
    } catch {
      setQuickResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const totalScans = reports.length;
  const scamsDetected = reports.filter((r) => normalizeRiskLevel(r.analysis?.risk_level) === 'Likely Scam').length;
  const safeListings = reports.filter((r) => normalizeRiskLevel(r.analysis?.risk_level) === 'Genuine').length;
  const avgRisk = reports.length > 0
    ? Math.round(reports.reduce((acc, r) => acc + (r.analysis?.scam_probability || 0), 0) / reports.length)
    : 0;

  const riskDistribution = Object.entries(
    reports.reduce((acc, r) => {
      const level = normalizeRiskLevel(r.analysis?.risk_level);
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const trustAvg = reports.length > 0 ? {
    payment_risk: Math.round(reports.reduce((a, r) => a + (r.analysis?.trust_breakdown?.payment_risk || 0), 0) / reports.length),
    recruiter_authenticity: Math.round(reports.reduce((a, r) => a + (r.analysis?.trust_breakdown?.recruiter_authenticity || 0), 0) / reports.length),
    company_presence: Math.round(reports.reduce((a, r) => a + (r.analysis?.trust_breakdown?.company_presence || 0), 0) / reports.length),
    language_credibility: Math.round(reports.reduce((a, r) => a + (r.analysis?.trust_breakdown?.language_credibility || 0), 0) / reports.length),
  } : null;

  const radarData = trustAvg ? [
    { subject: 'Payment Safety', value: 100 - trustAvg.payment_risk },
    { subject: 'Recruiter Auth', value: trustAvg.recruiter_authenticity },
    { subject: 'Company Presence', value: trustAvg.company_presence },
    { subject: 'Language Trust', value: trustAvg.language_credibility },
  ] : [];

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto">
      <div
        className="glass-card p-6 mb-8 animate-fade-in transition-theme"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent))' }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Welcome to SafeIntern AI</h1>
        <p style={{ color: 'var(--text-muted)' }}>Your AI-powered internship scam detection dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Scans" value={totalScans} icon={Search} color="primary" />
        <StatCard title="Scams Detected" value={scamsDetected} icon={AlertTriangle} color="danger" />
        <StatCard title="Safe Listings" value={safeListings} icon={CheckCircle} color="success" />
        <StatCard title="Avg Risk Score" value={`${avgRisk}%`} icon={TrendingUp} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Search className="w-5 h-5" style={{ color: 'var(--color-primary)' }} /> Quick Scan
          </h2>
          <textarea
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Paste internship text here for a quick scan..."
            className="w-full h-32 rounded-xl p-3 text-sm resize-none theme-input"
          />
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <button
              onClick={handleQuickScan}
              disabled={analyzing || !quickText.trim()}
              className="btn-gradient px-6 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Quick Scan'}
              <Search className="w-4 h-4" />
            </button>
            {quickResult && (
              <div className="flex items-center gap-3">
                <RiskBadge level={quickResult.risk_level} />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{quickResult.scam_probability}% risk</span>
                <Link to="/analyzer" className="text-sm" style={{ color: 'var(--color-primary)' }}>Full Analysis →</Link>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Risk Distribution</h2>
          {riskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name] || 'var(--color-primary)'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ color: 'var(--text-muted)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-sm" style={{ color: 'var(--text-faint)' }}>No data yet</div>
          )}
        </div>
      </div>

      {radarData.length > 0 && (
        <div className="glass-card p-6 mb-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Average Trust Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="color-mix(in srgb, var(--text-muted) 22%, transparent)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
              <Radar name="Trust" dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} /> Recent Reports
          </h2>
          <Link to="/reports" className="text-sm" style={{ color: 'var(--color-primary)' }}>View All →</Link>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-faint)' }}>
            No reports yet. <Link to="/analyzer" style={{ color: 'var(--color-primary)' }}>Analyze your first posting</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map((report) => (
              <div
                key={report.id}
                className="flex items-center gap-4 p-3 rounded-xl hover-lift transition-theme"
                style={{ background: 'var(--bg-input)' }}
              >
                <RiskBadge level={normalizeRiskLevel(report.analysis?.risk_level)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{report.text}</p>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{report.analysis?.scam_probability || 0}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
