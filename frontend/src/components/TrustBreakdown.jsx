import { useEffect, useState } from 'react';

const metrics = [
  { key: 'payment_risk', label: 'Payment Risk', invertColor: true },
  { key: 'recruiter_authenticity', label: 'Recruiter Authenticity', invertColor: false },
  { key: 'company_presence', label: 'Company Presence', invertColor: false },
  { key: 'language_credibility', label: 'Language Credibility', invertColor: false },
];

function getBarColorVar(value, invert) {
  const adjusted = invert ? (100 - value) : value;
  if (adjusted >= 70) return 'var(--safe)';
  if (adjusted >= 40) return 'var(--suspicious)';
  return 'var(--fraudulent)';
}

export default function TrustBreakdown({ data }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!data) return null;

  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const value = data[metric.key] ?? 50;
        const colorVar = getBarColorVar(value, metric.invertColor);
        return (
          <div key={metric.key}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{value}%</span>
            </div>
            <div
              className="h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(128,128,128,0.15)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animated ? `${value}%` : '0%',
                  background: colorVar,
                  boxShadow: `0 0 6px ${colorVar}55`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

