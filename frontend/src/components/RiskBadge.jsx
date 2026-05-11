export default function RiskBadge({ level, size = 'md' }) {
  const normalizedLevel =
    level === 'Safe' ? 'Genuine' :
    ['High Risk', 'Critical Risk'].includes(level) ? 'Likely Scam' :
    level || 'Suspicious';

  const configs = {
    'Genuine': { bg: 'bg-success/20', text: 'text-success', border: 'border-success/40', dot: 'bg-success' },
    'Suspicious': { bg: 'bg-warning/20', text: 'text-warning', border: 'border-warning/40', dot: 'bg-warning' },
    'Likely Scam': { bg: 'bg-danger/20', text: 'text-danger', border: 'border-danger/40', dot: 'bg-danger' },
  };
  const config = configs[normalizedLevel] || configs.Genuine;
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      {normalizedLevel}
    </span>
  );
}
