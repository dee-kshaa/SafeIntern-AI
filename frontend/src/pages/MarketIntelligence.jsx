import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  Cpu,
  Database,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatCard from '../components/StatCard';
import {
  getMarketAnalytics,
  getPipelineStatus,
  getPriorityRecommendation,
} from '../services/api';

const PIE_COLORS = ['#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#14B8A6'];

const tooltipStyle = {
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  color: 'var(--text-primary)',
};

export default function MarketIntelligence() {
  const [analytics, setAnalytics] = useState(null);
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [advisorResponse, setAdvisorResponse] = useState(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [analyticsData, pipelineData] = await Promise.all([
          getMarketAnalytics(),
          getPipelineStatus(),
        ]);
        setAnalytics(analyticsData);
        setPipeline(pipelineData);
        setSelectedCandidate(analyticsData?.recommendation_candidates?.[0] || null);
      } catch {
        setError('Could not load market intelligence data. Please ensure backend is running.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const summary = analytics?.summary || {};
  const recommendationCandidates = analytics?.recommendation_candidates || [];

  const scatterData = useMemo(
    () => (analytics?.trust_vs_scam_scatter || []).slice(0, 200),
    [analytics]
  );

  const getDecisionSupport = async () => {
    if (!selectedCandidate) return;
    setAdvisorLoading(true);
    try {
      const response = await getPriorityRecommendation(selectedCandidate);
      setAdvisorResponse(response);
    } catch {
      setAdvisorResponse(null);
    } finally {
      setAdvisorLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="glass-card p-10 text-center" style={{ color: 'var(--text-muted)' }}>Loading market intelligence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto">
        <div className="glass-card p-6" style={{ color: 'var(--fraudulent)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-7xl mx-auto">
      <div
        className="glass-card p-6 mb-8 animate-fade-in transition-theme"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-accent) 16%, transparent))' }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Market Intelligence</h1>
        <p style={{ color: 'var(--text-muted)' }}>Internship Intelligence Platform for data-driven application prioritization</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Listings" value={summary.total_listings || 0} icon={Briefcase} color="primary" />
        <StatCard title="Avg Stipend" value={`₹${Math.round(summary.average_stipend_inr || 0)}`} icon={BarChart3} color="accent" />
        <StatCard title="Avg Trust Score" value={`${summary.average_trust_score || 0}`} icon={ShieldCheck} color="success" />
        <StatCard title="High Risk Listings" value={summary.high_risk_listings || 0} subtitle={`${summary.high_risk_percentage || 0}% of market`} icon={AlertTriangle} color="danger" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Database className="w-5 h-5" style={{ color: 'var(--color-primary)' }} /> Pipeline Status
          </h2>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p><span style={{ color: 'var(--text-muted)' }}>Cloud Storage:</span> {pipeline?.cloud_pipeline?.cloud_storage?.mode || 'unknown'}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>BigQuery Table:</span> {pipeline?.cloud_pipeline?.bigquery?.table || 'N/A'}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>Rows Loaded:</span> {pipeline?.cloud_pipeline?.bigquery?.rows_loaded || 0}</p>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Cpu className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /> GPU Status
          </h2>
          <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <p><span style={{ color: 'var(--text-muted)' }}>Accelerated:</span> {pipeline?.gpu?.gpu_accelerated ? 'Yes' : 'No (Pandas Fallback)'}</p>
            <p><span style={{ color: 'var(--text-muted)' }}>Backend:</span> {pipeline?.gpu?.acceleration_backend || 'pandas'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Scam Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={analytics?.scam_trends || []}>
              <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 20%, transparent)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="avg_scam_risk" stroke="#EF4444" name="Avg Scam Risk" strokeWidth={2} />
              <Line type="monotone" dataKey="avg_trust" stroke="#10B981" name="Avg Trust" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Hiring Companies</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.top_hiring_companies || []}>
              <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 20%, transparent)" />
              <XAxis dataKey="company" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Skills</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.top_skills || []} layout="vertical">
              <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 20%, transparent)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis type="category" dataKey="skill" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={90} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Salary Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={analytics?.salary_distribution || []}>
              <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 20%, transparent)" />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8B5CF6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analytics?.category_breakdown || []} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={85}>
                {(analytics?.category_breakdown || []).map((entry, idx) => (
                  <Cell key={entry.category} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Deadline Urgency</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={analytics?.deadline_urgency || []} dataKey="count" nameKey="bucket" cx="50%" cy="50%" innerRadius={45} outerRadius={85}>
                {(analytics?.deadline_urgency || []).map((entry, idx) => (
                  <Cell key={entry.bucket} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 mb-8">
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Trust vs Scam Scatter Plot</h2>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart>
            <CartesianGrid stroke="color-mix(in srgb, var(--text-muted) 20%, transparent)" />
            <XAxis type="number" dataKey="trust" name="Trust" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <YAxis type="number" dataKey="scam_risk" name="Scam Risk" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Listings" data={scatterData} fill="#22C55E" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'var(--color-accent)' }} /> Gemini Decision Support
        </h2>

        {recommendationCandidates.length === 0 ? (
          <p style={{ color: 'var(--text-faint)' }}>No recommendation candidates available.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <select
                className="theme-input rounded-xl px-3 py-2 text-sm flex-1"
                value={selectedCandidate?.id || ''}
                onChange={(event) => {
                  const next = recommendationCandidates.find((item) => String(item.id) === event.target.value);
                  setSelectedCandidate(next || null);
                  setAdvisorResponse(null);
                }}
              >
                {recommendationCandidates.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.company} • {item.category} • ₹{item.stipend_inr}
                  </option>
                ))}
              </select>
              <button
                onClick={getDecisionSupport}
                disabled={advisorLoading || !selectedCandidate}
                className="btn-gradient px-5 py-2.5 rounded-xl text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${advisorLoading ? 'animate-spin' : ''}`} />
                {advisorLoading ? 'Analyzing...' : 'Get Recommendation'}
              </button>
            </div>

            {selectedCandidate && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                  <p style={{ color: 'var(--text-faint)' }}>Trust Score</p>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedCandidate.trust_score}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                  <p style={{ color: 'var(--text-faint)' }}>Scam Risk</p>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedCandidate.scam_risk_score}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                  <p style={{ color: 'var(--text-faint)' }}>Deadline</p>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{selectedCandidate.deadline_in_days} days</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                  <p style={{ color: 'var(--text-faint)' }}>Stipend</p>
                  <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>₹{selectedCandidate.stipend_inr}</p>
                </div>
              </div>
            )}

            {advisorResponse && (
              <div className="space-y-2 rounded-xl p-4" style={{ background: 'var(--bg-input)' }}>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold">Why risky:</span> {advisorResponse.why_risky}
                </p>
                <p className="text-sm" style={{ color: advisorResponse.should_prioritize ? 'var(--safe)' : 'var(--suspicious)' }}>
                  <span className="font-semibold">Should prioritize:</span> {advisorResponse.should_prioritize ? 'Yes' : 'No'}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-semibold">Missing skills:</span>{' '}
                  {(advisorResponse.missing_skills || []).length > 0
                    ? advisorResponse.missing_skills.join(', ')
                    : 'None identified'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
