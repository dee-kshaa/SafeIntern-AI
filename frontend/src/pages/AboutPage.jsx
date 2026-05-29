import { Shield, Target, Zap, Users, Code, Heart } from 'lucide-react';

const steps = [
  { icon: '📋', title: 'Paste or Upload', desc: 'Copy the suspicious internship text or upload a screenshot.' },
  { icon: '🤖', title: 'AI Analysis', desc: 'Our AI (powered by Gemma via Ollama) analyzes for scam indicators.' },
  { icon: '🛡️', title: 'Get Results', desc: 'Receive detailed risk assessment with explanations and recommendations.' },
];

const techStack = [
  { name: 'React + Vite', desc: 'Fast, modern frontend' },
  { name: 'TailwindCSS', desc: 'Utility-first styling' },
  { name: 'FastAPI', desc: 'Python backend API' },
  { name: 'Gemma 3 (Ollama)', desc: 'Local AI model' },
  { name: 'Recharts', desc: 'Data visualization' },
  { name: 'Pytesseract', desc: 'OCR text extraction' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20 pb-12 px-4 max-w-5xl mx-auto">
      <div className="text-center mb-16 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
          <Shield className="w-10 h-10" style={{ color: 'var(--color-primary)' }} />
        </div>
        <h1 className="text-4xl font-black gradient-text mb-4">About SafeIntern AI</h1>
        <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          We&apos;re on a mission to protect students from the growing epidemic of fake internship
          and job scams that prey on their aspirations and trust.
        </p>
      </div>

      <div className="glass-card p-8 mb-8 animate-slide-up" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, transparent), color-mix(in srgb, var(--color-accent) 12%, transparent))' }}>
        <div className="flex items-start gap-4">
          <Target className="w-8 h-8 flex-shrink-0 mt-1" style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Our Mission</h2>
            <p className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Every year, thousands of students fall victim to fake internship scams — losing money, time, and confidence.
              SafeIntern AI uses cutting-edge artificial intelligence to analyze job postings and detect fraud patterns
              before students can be harmed. We believe technology should empower, not exploit.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { value: 'Multi-Signal', label: 'Risk Detection', color: 'var(--fraudulent)' },
          { value: 'Rule + AI', label: 'Hybrid Analysis Engine', color: 'var(--safe)' },
          { value: 'Student-First', label: 'Safety Guidance', color: 'var(--color-accent)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 text-center animate-slide-up hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="text-4xl font-black mb-2" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Zap className="w-6 h-6" style={{ color: 'var(--suspicious)' }} /> How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="glass-card p-6 text-center relative animate-slide-up hover-lift" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-4xl mb-4">{step.icon}</div>
              <div
                className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)', color: 'var(--color-primary)' }}
              >
                {i + 1}
              </div>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-center mb-8 flex items-center justify-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Code className="w-6 h-6" style={{ color: 'var(--color-accent)' }} /> Tech Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {techStack.map((tech, i) => (
            <div key={i} className="glass-card p-4 hover-lift transition-theme">
              <div className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{tech.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-8 text-center" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 12%, transparent), color-mix(in srgb, var(--color-accent) 14%, transparent))' }}>
        <Heart className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--fraudulent)' }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Built with ❤️ for Students</h2>
        <p className="max-w-lg mx-auto text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          SafeIntern AI is an open-source project dedicated to fighting internship fraud.
          If you&apos;ve been affected by a scam, report it at cybercrime.gov.in.
          Together, we can make the internet safer for job seekers.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
          <Users className="w-4 h-4" />
          <span>Made for every student looking for their first opportunity</span>
        </div>
      </div>
    </div>
  );
}
