export default function RiskBadge({ level, size = 'md' }) {
  const normalizedLevel =
    level === 'Safe' ? 'Genuine' :
    ['High Risk', 'Critical Risk'].includes(level) ? 'Likely Scam' :
    level || 'Suspicious';

  const configs = {
    'Genuine':    { color: 'var(--safe)',        bgAlpha: '0.12', borderAlpha: '0.35' },
    'Suspicious': { color: 'var(--suspicious)',  bgAlpha: '0.12', borderAlpha: '0.35' },
    'Likely Scam':{ color: 'var(--fraudulent)',  bgAlpha: '0.12', borderAlpha: '0.35' },
  };
  const cfg = configs[normalizedLevel] || configs['Genuine'];
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold transition-theme ${sizeClasses}`}
      style={{
        color: cfg.color,
        background: `color-mix(in srgb, ${cfg.color} ${parseFloat(cfg.bgAlpha) * 100}%, transparent)`,
        borderColor: `color-mix(in srgb, ${cfg.color} ${parseFloat(cfg.borderAlpha) * 100}%, transparent)`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ background: cfg.color }}
      />
      {normalizedLevel}
    </span>
  );
}

