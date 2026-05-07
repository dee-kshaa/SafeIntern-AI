import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityConfig = {
  high: { icon: AlertTriangle, color: 'text-danger', bg: 'bg-danger/10', border: 'border-danger/30' },
  medium: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  low: { icon: Info, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
};

export default function ExplainabilityPanel({ explanations = [] }) {
  if (!explanations.length) {
    return (
      <div className="text-center py-6 text-white/50">
        No specific issues detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
