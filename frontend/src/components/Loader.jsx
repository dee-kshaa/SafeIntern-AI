import { Shield } from 'lucide-react';

export default function Loader({ message = 'Analyzing...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 animate-fade-in">
      <div className="relative">
        <div
          className="w-16 h-16 rounded-full border-2 animate-spin"
          style={{ borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)', borderTopColor: 'var(--color-primary)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-6 h-6 animate-pulse" style={{ color: 'var(--color-primary)' }} />
        </div>
      </div>
      <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{message}</div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: 'var(--color-primary)', animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
