import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, Search, FileText } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { analyzeText, getReports } from '../services/api';

const RISK_COLORS = {
  'Genuine': '#22c55e',
  'Suspicious': '#f59e0b',
  'Likely Scam': '#ef4444',
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
  const scamsDetected = reports.filter(r => normalizeRiskLevel(r.analysis?.risk_level) === 'Likely Scam').length;
  const safeListings = reports.filter(r => normalizeRiskLevel(r.analysis?.risk_level) === 'Genuine').length;
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
      {/* Welcome Banner */}
      <div className="glass-card p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 animate-fade-in">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome to SafeIntern AI</h1>
        <p className="text-white/60">Your AI-powered internship scam detection dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Scans" value={totalScans} icon={Search} color="primary" />
        <StatCard title="Scams Detected" value={scamsDetected} icon={AlertTriangle} color="danger" />
        <StatCard title="Safe Listings" value={safeListings} icon={CheckCircle} color="success" />
        <StatCard title="Avg Risk Score" value={`${avgRisk}%`} icon={TrendingUp} color="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Scan */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" /> Quick Scan
          </h2>
          <textarea
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder="Paste internship text here for a quick scan..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-3 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 resize-none"
          />
          <div className="flex items-center gap-4 mt-3">
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
                <span className="text-white/60 text-sm">{quickResult.scam_probability}% risk</span>
                <Link to="/analyzer" className="text-primary text-sm hover:underline">Full Analysis →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Risk Distribution</h2>
          {riskDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value">
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={RISK_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f0f2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-white/40 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      {radarData.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Average Trust Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 12 }} />
              <Radar name="Trust" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Reports */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Recent Reports
          </h2>
          <Link to="/reports" className="text-primary text-sm hover:underline">View All →</Link>
        </div>
        {reports.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            No reports yet. <Link to="/analyzer" className="text-primary hover:underline">Analyze your first posting</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.slice(0, 5).map((report) => (
              <div key={report.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <RiskBadge level={normalizeRiskLevel(report.analysis?.risk_level)} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{report.text}</p>
                  <p className="text-white/40 text-xs">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-white/60 text-sm font-bold">{report.analysis?.scam_probability || 0}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
