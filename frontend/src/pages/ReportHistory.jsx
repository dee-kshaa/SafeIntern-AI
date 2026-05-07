import { useState, useEffect } from 'react';
import { Search, Trash2, Eye, X, Filter } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import TrustBreakdown from '../components/TrustBreakdown';
import ExplainabilityPanel from '../components/ExplainabilityPanel';
import { getReports, deleteReport } from '../services/api';

const RISK_LEVELS = ['All', 'Safe', 'Suspicious', 'High Risk', 'Critical Risk'];

export default function ReportHistory() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getReports().then(d => { setReports(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await deleteReport(id);
    setReports(prev => prev.filter(r => r.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = reports.filter(r => {
    const matchSearch = !search || r.text.toLowerCase().includes(search.toLowerCase());
    const matchLevel = filterLevel === 'All' || r.analysis?.risk_level === filterLevel;
    return matchSearch && matchLevel;
  });

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-6xl mx-auto">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white mb-2">Report History</h1>
        <p className="text-white/60">All your previous scam analyses</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-white/40" />
          {RISK_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterLevel === level ? 'bg-primary text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-white/40">
          {reports.length === 0 ? 'No reports yet. Go analyze some postings!' : 'No reports match your filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <div key={report.id} className="glass-card p-4 hover:border-white/20 transition-all group">
              <div className="flex items-center gap-4 flex-wrap">
                <RiskBadge level={report.analysis?.risk_level || 'Safe'} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">{report.text}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {new Date(report.created_at).toLocaleString()} &bull; {report.source} &bull; {report.analysis?.scam_probability || 0}% risk
                  </p>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setSelected(report)}
                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-primary/20 hover:text-primary transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 rounded-lg bg-white/10 text-white/60 hover:bg-danger/20 hover:text-danger transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <RiskBadge level={selected.analysis?.risk_level} size="lg" />
                <span className="text-white/60 text-sm">{selected.analysis?.scam_probability}% risk</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/10 text-white/60">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Summary</h3>
                <p className="text-white/80 text-sm">{selected.analysis?.summary}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Original Text</h3>
                <p className="text-white/70 text-sm bg-white/5 rounded-xl p-3 max-h-32 overflow-y-auto">{selected.text}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Trust Breakdown</h3>
                <TrustBreakdown data={selected.analysis?.trust_breakdown} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Explanations</h3>
                <ExplainabilityPanel explanations={selected.analysis?.explanations || []} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-2 uppercase tracking-wide">Flags</h3>
                <div className="space-y-1">
                  {(selected.analysis?.flags || []).map((f, i) => (
                    <div key={i} className="text-warning/80 text-sm flex items-center gap-2">
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
