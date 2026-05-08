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
      {/* Hero */}
      <div className="text-center mb-16 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black gradient-text mb-4">About SafeIntern AI</h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
          We&apos;re on a mission to protect students from the growing epidemic of fake internship
          and job scams that prey on their aspirations and trust.
        </p>
      </div>

      {/* Mission */}
      <div className="glass-card p-8 mb-8 bg-gradient-to-br from-primary/10 to-secondary/10 animate-slide-up">
        <div className="flex items-start gap-4">
          <Target className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
            <p className="text-white/70 leading-relaxed">
              Every year, thousands of students fall victim to fake internship scams &mdash; losing money, time, and confidence.
              SafeIntern AI uses cutting-edge artificial intelligence to analyze job postings and detect fraud patterns
              before students can be harmed. We believe technology should empower, not exploit.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { value: '50,000+', label: 'Scams Detected', color: 'text-danger' },
          { value: '98%', label: 'Detection Accuracy', color: 'text-success' },
          { value: '10,000+', label: 'Students Protected', color: 'text-accent' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className={`text-4xl font-black ${stat.color} mb-2`}>{stat.value}</div>
            <div className="text-white/60 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-warning" /> How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="glass-card p-6 text-center relative animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-4xl mb-4">{step.icon}</div>
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-xs text-primary font-bold">
                {i + 1}
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-white/60 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
          <Code className="w-6 h-6 text-accent" /> Tech Stack
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {techStack.map((tech, i) => (
            <div key={i} className="glass-card p-4 hover:border-white/20 transition-all">
              <div className="font-semibold text-white text-sm mb-1">{tech.name}</div>
              <div className="text-white/50 text-xs">{tech.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Creator */}
      <div className="glass-card p-8 text-center bg-gradient-to-br from-secondary/10 to-accent/10">
        <Heart className="w-8 h-8 text-danger mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Built with ❤️ for Students</h2>
        <p className="text-white/60 max-w-lg mx-auto text-sm leading-relaxed">
          SafeIntern AI is an open-source project dedicated to fighting internship fraud.
          If you&apos;ve been affected by a scam, report it at cybercrime.gov.in.
          Together, we can make the internet safer for job seekers.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-white/40 text-xs">
          <Users className="w-4 h-4" />
          <span>Made for every student looking for their first opportunity</span>
        </div>
      </div>
    </div>
  );
}
