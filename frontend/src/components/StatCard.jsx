export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary', trend }) {
  const colorClasses = {
    primary: 'text-primary bg-primary/20',
    success: 'text-success bg-success/20',
    danger: 'text-danger bg-danger/20',
    warning: 'text-warning bg-warning/20',
    accent: 'text-accent bg-accent/20',
  };

  return (
    <div className="glass-card p-6 hover:border-white/20 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]} group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend >= 0 ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-white/80">{title}</div>
      {subtitle && <div className="text-xs text-white/50 mt-1">{subtitle}</div>}
    </div>
  );
}
