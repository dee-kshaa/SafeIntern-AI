export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorStyles = {
    primary: { color: 'var(--color-primary)', bg: 'color-mix(in srgb, var(--color-primary) 14%, transparent)' },
    success: { color: 'var(--safe)', bg: 'color-mix(in srgb, var(--safe) 14%, transparent)' },
    danger: { color: 'var(--fraudulent)', bg: 'color-mix(in srgb, var(--fraudulent) 14%, transparent)' },
    warning: { color: 'var(--suspicious)', bg: 'color-mix(in srgb, var(--suspicious) 14%, transparent)' },
    accent: { color: 'var(--color-accent)', bg: 'color-mix(in srgb, var(--color-accent) 18%, transparent)' },
  };

  const cs = colorStyles[color] || colorStyles.primary;

  return (
    <div className="glass-card p-6 hover-lift transition-theme group cursor-default animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl transition-transform group-hover:scale-110" style={{ background: cs.bg }}>
          <Icon className="w-6 h-6" style={{ color: cs.color }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={
              trend >= 0
                ? { background: 'color-mix(in srgb, var(--safe) 15%, transparent)', color: 'var(--safe)' }
                : { background: 'color-mix(in srgb, var(--fraudulent) 15%, transparent)', color: 'var(--fraudulent)' }
            }
          >
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{value}</div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{title}</div>
      {subtitle && <div className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{subtitle}</div>}
    </div>
  );
}
