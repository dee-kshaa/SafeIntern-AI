import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

const severityConfig = {
  high: {
    icon: AlertTriangle,
    colorVar: 'var(--fraudulent)',
    bgAlpha: '0.1',
    borderAlpha: '0.3',
  },
  medium: {
    icon: AlertCircle,
    colorVar: 'var(--suspicious)',
    bgAlpha: '0.1',
    borderAlpha: '0.3',
  },
  low: {
    icon: Info,
    colorVar: 'var(--safe)',
    bgAlpha: '0.1',
    borderAlpha: '0.3',
  },
};

export default function ExplainabilityPanel({ explanations = [], aiExplanation = null }) {
  if (!explanations.length && !aiExplanation) {
    return (
      <div className="text-center py-6" style={{ color: 'var(--text-faint)' }}>
        No specific issues detected
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {aiExplanation && (
        <div
          className="p-4 rounded-xl border"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
            background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
          }}
        >
          <div className="font-semibold text-sm mb-2" style={{ color: 'var(--color-primary)' }}>
            {aiExplanation.title || 'AI Explanation'}
          </div>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{aiExplanation.summary}</p>
          <ul className="space-y-1">
            {(aiExplanation.reasons || []).map((reason, index) => (
              <li key={index} className="text-sm flex items-start gap-2" style={{ color: 'var(--text-muted)' }}>
                <span className="mt-0.5" style={{ color: 'var(--color-primary)' }}>•</span>
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
            className="p-4 rounded-xl border animate-fade-in"
            style={{
              animationDelay: `${idx * 0.1}s`,
              background: `color-mix(in srgb, ${config.colorVar} 10%, transparent)`,
              borderColor: `color-mix(in srgb, ${config.colorVar} 30%, transparent)`,
            }}
          >
            <div className="flex items-start gap-3">
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: config.colorVar }} />
              <div>
                <div className="font-semibold text-sm mb-1" style={{ color: config.colorVar }}>{exp.title}</div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{exp.description}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

