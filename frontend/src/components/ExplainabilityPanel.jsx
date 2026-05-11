import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  medium: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  low: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
};

export default function ExplainabilityPanel({ explanations = [], aiExplanation = null }) {
  if (!explanations.length && !aiExplanation) {
    return (
      <div className="text-center py-6 text-white/50">
        No specific issues detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {aiExplanation && (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/10">
          <div className="font-semibold text-sm text-primary mb-2">{aiExplanation.title || 'AI Explanation'}</div>
          <p className="text-white/80 text-sm mb-3">{aiExplanation.summary}</p>
          <ul className="space-y-1">
            {(aiExplanation.reasons || []).map((reason, index) => (
              <li key={index} className="text-white/70 text-sm flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {explanations.map((exp, idx) => {
        const config = severityConfig[exp.severity] || severityConfig.low;
        const Icon = config.icon;
        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border ${config.bg} ${config.border} animate-fade-in`}
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
              <div>
                <div className={`font-semibold text-sm ${config.color} mb-1`}>{exp.title}</div>
                <div className="text-white/70 text-sm">{exp.description}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
