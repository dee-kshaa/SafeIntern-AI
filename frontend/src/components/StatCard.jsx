export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorStyles = {
    primary: { color: 'var(--color-primary)', bg: isDark => isDark ? 'rgba(142,36,170,0.2)' : 'rgba(102,85,118,0.12)' },
    success: { color: 'var(--safe)', bg: isDark => isDark ? 'rgba(45,212,191,0.15)' : 'rgba(13,148,136,0.1)' },
    danger:  { color: 'var(--fraudulent)', bg: isDark => isDark ? 'rgba(244,63,94,0.15)' : 'rgba(225,29,72,0.1)' },
    warning: { color: 'var(--suspicious)', bg: isDark => isDark ? 'rgba(251,146,60,0.15)' : 'rgba(234,88,12,0.1)' },
    accent:  { color: 'var(--color-accent)', bg: isDark => isDark ? 'rgba(200,77,161,0.15)' : 'rgba(196,169,168,0.15)' },
  };

  const cs = colorStyles[color] || colorStyles.primary;

  return (
    <div className="glass-card p-6 hover-lift transition-theme group cursor-default">
      <div className="flex items-start justify-between mb-4">
        <div
          className="p-3 rounded-xl transition-transform group-hover:scale-110"
          style={{ background: 'rgba(var(--color-primary-rgb, 142,36,170), 0.15)', color: cs.color }}
        >
          <Icon className="w-6 h-6" style={{ color: cs.color }} />
        </div>
        {trend !== undefined && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={
              trend >= 0
                ? { background: 'rgba(45,212,191,0.15)', color: 'var(--safe)' }
                : { background: 'rgba(244,63,94,0.15)', color: 'var(--fraudulent)' }
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

