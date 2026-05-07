import { Link } from 'react-router-dom';
import { Shield, Search, Eye, MessageCircle, TrendingUp, ChevronRight, Star, Users, AlertTriangle } from 'lucide-react';

const stats = [
  { value: '50K+', label: 'Scams Detected', icon: AlertTriangle, color: 'text-danger' },
  { value: '98%', label: 'Accuracy Rate', icon: Star, color: 'text-warning' },
  { value: '10K+', label: 'Students Protected', icon: Users, color: 'text-success' },
];

const features = [
  {
    icon: Shield,
    title: 'AI Scam Detection',
    desc: 'Advanced ML models analyze job postings for scam indicators with 98% accuracy.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Eye,
    title: 'OCR Analysis',
    desc: 'Upload screenshots directly. Our OCR engine extracts and analyzes text from images.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: MessageCircle,
    title: 'AI Safety Chat',
    desc: 'Get instant answers about whether a posting is safe from our AI assistant.',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
  },
  {
    icon: TrendingUp,
    title: 'Trust Analytics',
    desc: 'Detailed breakdown of recruiter authenticity, company presence, and language credibility.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen animated-gradient bg-grid">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-secondary/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-10 left-1/3 w-56 h-56 bg-accent/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            AI-Powered Internship Safety Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
            <span className="gradient-text">SafeIntern</span>
            <span className="text-white"> AI</span>
          </h1>

          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Protect yourself from fake internship scams. Our AI analyzes job postings,
            detects red flags, and keeps students safe from fraudulent recruiters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/analyzer"
              className="btn-gradient px-8 py-4 rounded-2xl font-bold text-white text-lg flex items-center gap-2 glow-indigo"
            >
              <Search className="w-5 h-5" />
              Analyze Now
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/dashboard"
              className="px-8 py-4 rounded-2xl font-bold text-white/80 text-lg border border-white/20 hover:bg-white/10 transition-all flex items-center gap-2"
            >
              View Dashboard
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="glass-card p-6 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <Icon className={`w-6 h-6 ${stat.color} mb-2 mx-auto`} />
                  <div className="text-3xl font-black text-white">{stat.value}</div>
                  <div className="text-white/60 text-sm">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Why SafeIntern AI?</h2>
        <p className="text-white/60 text-center mb-12 max-w-xl mx-auto">
          Comprehensive protection against all types of internship and job scams
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="glass-card p-6 hover:border-white/20 hover:scale-105 transition-all duration-300 animate-slide-up cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Banner */}
      <div className="py-16 px-4 max-w-4xl mx-auto">
        <div className="glass-card p-10 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Stay Safe?</h2>
          <p className="text-white/60 mb-8">Analyze any internship posting in seconds. It&apos;s free.</p>
          <Link
            to="/analyzer"
            className="btn-gradient px-8 py-4 rounded-2xl font-bold text-white inline-flex items-center gap-2 glow-indigo"
          >
            <Shield className="w-5 h-5" />
            Start Analyzing
          </Link>
        </div>
      </div>
    </div>
  );
}
