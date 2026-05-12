import { useState, useEffect } from 'react';
import { Search, Trash2, Eye, X, Filter } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import TrustBreakdown from '../components/TrustBreakdown';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import { getReports, deleteReport } from '../services/api';

const RISK_LEVELS = ['All', 'Genuine', 'Suspicious', 'Likely Scam'];
const normalizeRiskLevel = (level) => (
  level === 'Safe' ? 'Genuine' :
  ['High Risk', 'Critical Risk'].includes(level) ? 'Likely Scam' :
  level || 'Suspicious'
);

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getReports().then((d) => { setReports(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await deleteReport(id);
    setReports((prev) => prev.filter((r) => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = reports.filter((r) => {
    const matchSearch = !search || r.text.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'All' || normalizeRiskLevel(r.analysis?.risk_level) === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Report History</h1>
        <p style={{ color: 'var(--text-muted)' }}>All your previous scam analyses</p>
      </div>

      <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl pl-9 pr-4 py-2 text-sm theme-input"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4" style={{ color: 'var(--text-faint)' }} />
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-theme"
              style={
                filterLevel === level
                  ? { background: 'var(--color-primary)', color: '#fff' }
                  : { background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }
              }
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-faint)' }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center" style={{ color: 'var(--text-faint)' }}>
          {reports.length === 0 ? 'No reports yet. Go analyze some postings!' : 'No reports match your filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="glass-card p-4 group hover-lift">
              <div className="flex items-center gap-4 flex-wrap">
                <RiskBadge level={normalizeRiskLevel(report.analysis?.risk_level)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{report.text}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                    {new Date(report.created_at).toLocaleString()} • {report.source} • {report.analysis?.scam_probability || 0}% risk
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelected(report)}
                    className="p-2 rounded-lg transition-theme"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 rounded-lg transition-theme"
                    style={{ background: 'var(--bg-input)', color: 'var(--fraudulent)', border: '1px solid var(--border-color)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelected(null)}
        >
          <div
            className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <RiskBadge level={normalizeRiskLevel(selected.analysis?.risk_level)} size="lg" />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.analysis?.scam_probability}% risk</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Summary</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selected.analysis?.summary}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Original Text</h3>
                <p className="text-sm rounded-xl p-3 max-h-32 overflow-y-auto" style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}>{selected.text}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Trust Breakdown</h3>
                <TrustBreakdown data={selected.analysis?.trust_breakdown} />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Explanations</h3>
                <ExplainabilityPanel
                  explanations={selected.analysis?.explanations || []}
                  aiExplanation={selected.analysis?.ai_explanation}
                />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Flags</h3>
                <div className="space-y-1">
                  {(selected.analysis?.flags || []).map((f, i) => (
                    <div key={i} className="text-sm flex items-center gap-2" style={{ color: 'var(--suspicious)' }}>
                      <span>⚠</span> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
