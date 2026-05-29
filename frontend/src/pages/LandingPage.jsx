import { Link } from 'react-router-dom';
import { Shield, Search, Eye, MessageCircle, TrendingUp, ChevronRight, FileText, Users, AlertTriangle } from 'lucide-react';

const stats = [
  { value: 'Multi-Signal', label: 'Risk Detection', icon: AlertTriangle, color: 'var(--fraudulent)' },
  { value: 'Transparent', label: 'Risk Explanations', icon: FileText, color: 'var(--suspicious)' },
  { value: 'Student-First', label: 'Safety Guidance', icon: Users, color: 'var(--safe)' },
];

const features = [
  { icon: Shield, title: 'AI Scam Detection', desc: 'Deterministic checks and AI reasoning analyze job postings for scam indicators with clear justification.', color: 'var(--color-primary)' },
  { icon: Eye, title: 'OCR Analysis', desc: 'Upload screenshots directly. Our OCR engine extracts and analyzes text from images.', color: 'var(--color-accent)' },
  { icon: MessageCircle, title: 'AI Safety Chat', desc: 'Get instant answers about whether a posting is safe from our AI assistant.', color: 'var(--color-primary-light)' },
  { icon: TrendingUp, title: 'Trust Analytics', desc: 'Detailed breakdown of recruiter authenticity, company presence, and language credibility.', color: 'var(--safe)' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-gradient bg-grid">
      <div className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float pointer-events-none" style={{ background: 'var(--orb1)' }} />
        <div className="absolute top-40 right-1/4 w-48 h-48 rounded-full blur-3xl animate-float pointer-events-none" style={{ background: 'var(--orb2)', animationDelay: '2s' }} />
        <div className="absolute bottom-10 left-1/3 w-56 h-56 rounded-full blur-3xl animate-float pointer-events-none" style={{ background: 'var(--orb3)', animationDelay: '4s' }} />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 18%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-primary) 36%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            <Shield className="w-4 h-4" />
            AI-Powered Internship Safety Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            <span className="gradient-text">SafeIntern</span>
            <span style={{ color: 'var(--text-primary)' }}> AI</span>
          </h1>

          <p className="text-xl mb-10 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Protect yourself from fake internship scams. Our AI analyzes job postings,
            detects red flags, and keeps students safe from fraudulent recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/analyzer" className="btn-gradient px-8 py-4 rounded-2xl font-bold text-white text-lg flex items-center gap-2 glow-primary">
              <Search className="w-5 h-5" /> Analyze Now <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-2xl font-bold text-lg border transition-theme flex items-center gap-2"
              style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-color)', background: 'var(--bg-input)' }}
            >
              View Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="glass-card p-6 animate-slide-up hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
                  <Icon className="w-6 h-6 mb-2 mx-auto" style={{ color: stat.color }} />
                  <div className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ color: 'var(--text-primary)' }}>Why SafeIntern AI?</h2>
        <p className="text-center mb-12 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          Comprehensive protection against all types of internship and job scams
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="glass-card p-6 hover-lift transition-theme animate-slide-up cursor-pointer" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)' }}>
                  <Icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="py-16 px-4 max-w-4xl mx-auto">
        <div
          className="glass-card p-10 text-center"
          style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 18%, transparent), color-mix(in srgb, var(--color-accent) 16%, transparent))' }}
        >
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Ready to Stay Safe?</h2>
          <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Analyze any internship posting in seconds. It&apos;s free.</p>
          <Link to="/analyzer" className="btn-gradient px-8 py-4 rounded-2xl font-bold text-white inline-flex items-center gap-2 glow-primary">
            <Shield className="w-5 h-5" /> Start Analyzing
          </Link>
        </div>
      </div>
    </div>
  );
}
