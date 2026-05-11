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

  const getColor = (prob) => {
    if (prob <= GENUINE_THRESHOLD) return '#22c55e';
    if (prob <= SUSPICIOUS_THRESHOLD) return '#f59e0b';
    return '#ef4444';
  };

  const color = getColor(normalizedProbability);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="12"
          />
          <circle
            cx="100" cy="100" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white">{animated}%</span>
          <span className="text-xs text-white/60 mt-1">Scam Risk</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm text-white/60 mb-1">Risk Assessment</div>
        <div className="font-bold text-lg" style={{ color }}>{normalizedRiskLevel}</div>
      </div>
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
          <span>Fraud Confidence</span>
          <span>{animated}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${animated}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}
