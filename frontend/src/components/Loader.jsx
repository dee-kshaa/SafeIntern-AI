import { Shield } from 'lucide-react';

export default function Loader({ message = 'Analyzing...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary animate-pulse" />
        </div>
      </div>
      <div className="text-white/70 text-sm font-medium">{message}</div>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
