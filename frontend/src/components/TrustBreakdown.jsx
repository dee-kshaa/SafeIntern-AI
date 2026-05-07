import { useEffect, useState } from 'react';

const metrics = [
  { key: 'payment_risk', label: 'Payment Risk', invertColor: true },
  { key: 'recruiter_authenticity', label: 'Recruiter Authenticity', invertColor: false },
  { key: 'company_presence', label: 'Company Presence', invertColor: false },
  { key: 'language_credibility', label: 'Language Credibility', invertColor: false },
];

function getBarColor(value, invert) {
  const adjusted = invert ? (100 - value) : value;
  if (adjusted >= 70) return 'from-success to-success/70';
  if (adjusted >= 40) return 'from-warning to-warning/70';
  return 'from-danger to-danger/70';
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
        const colorClass = getBarColor(value, metric.invertColor);
        return (
          <div key={metric.key}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">{metric.label}</span>
              <span className="text-sm font-bold text-white">{value}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${colorClass} progress-glow transition-all duration-1000 ease-out`}
                style={{ width: animated ? `${value}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
