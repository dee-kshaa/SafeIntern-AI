import { useEffect, useState } from 'react';

const GENUINE_THRESHOLD = 25;
const SUSPICIOUS_THRESHOLD = 55;

export default function ScamMeter({ probability = 0, riskLevel = 'Safe' }) {
  const [animated, setAnimated] = useState(0);
  const normalizedProbability = Math.max(0, Math.min(100, Number(probability) || 0));
  const normalizedRiskLevel =
    riskLevel === 'Safe' ? 'Genuine' :
    ['High Risk', 'Critical Risk'].includes(riskLevel) ? 'Likely Scam' :
    riskLevel || 'Suspicious';

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(normalizedProbability), 100);
    return () => clearTimeout(timer);
  }, [normalizedProbability]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animated / 100) * circumference;

  // Use CSS variables for fraud confidence colors (theme-aware)
  const getColor = (prob) => {
    if (prob <= GENUINE_THRESHOLD) return 'var(--safe)';
    if (prob <= SUSPICIOUS_THRESHOLD) return 'var(--suspicious)';
    return 'var(--fraudulent)';
  };

  const colorVar = getColor(normalizedProbability);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="rgba(128,128,128,0.15)"
            strokeWidth="12"
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={colorVar}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 10px ${colorVar})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: 'var(--text-primary)' }}>{animated}%</span>
          <span className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Scam Risk</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Risk Assessment</div>
        <div className="font-bold text-lg" style={{ color: colorVar }}>{normalizedRiskLevel}</div>
      </div>

      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Fraud Confidence</span>
          <span>{animated}%</span>
        </div>
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(128,128,128,0.15)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            role="progressbar"
            aria-label="Fraud confidence score"
            aria-valuenow={animated}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              width: `${animated}%`,
              background: colorVar,
              boxShadow: `0 0 8px ${colorVar}`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

