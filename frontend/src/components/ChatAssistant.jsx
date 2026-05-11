import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Shield } from 'lucide-react';
import { sendChat } from '../services/api';

const quickChips = [
  'Is this safe?',
  'What are red flags?',
  'How to verify company?',
  'Should I pay fees?',
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm SafeIntern AI. I can help you identify scam internship postings. Paste suspicious text or ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const context = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
      const data = await sendChat(userMsg, context);
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I'm having trouble connecting. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full btn-gradient flex items-center justify-center glow-primary shadow-lg transition-all duration-300 hover:scale-110"
        aria-label={isOpen ? 'Close chat' : 'Open chat assistant'}
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-card flex flex-col overflow-hidden animate-slide-up"
          style={{ maxHeight: '500px' }}
        >
          {/* Header */}
          <div
            className="p-4 border-b flex items-center gap-3"
            style={{
              borderColor: 'var(--border-color)',
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
            }}
          >
            <div
              className="p-2 rounded-lg"
              style={{ background: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
            >
              <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>SafeIntern AI</div>
              <div className="text-xs" style={{ color: 'var(--text-faint)' }}>Scam Detection Assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '280px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-xs px-3 py-2 rounded-xl text-sm"
                  style={
                    msg.role === 'user'
                      ? {
                          background: 'var(--color-primary)',
                          color: '#fff',
                          borderBottomRightRadius: '4px',
                        }
                      : {
                          background: 'var(--bg-input)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderBottomLeftRadius: '4px',
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-xl flex gap-1"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}
                >
                  {[0,1,2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: 'var(--text-muted)', animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick chips */}
          <div className="px-4 py-2 flex flex-wrap gap-1">
            {quickChips.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                className="text-xs px-2 py-1 rounded-full transition-all duration-200"
                style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 15%, transparent)';
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-input)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 pt-2" style={{ borderTop: '1px solid var(--border-color)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about internship safety..."
                className="flex-1 rounded-xl px-3 py-2 text-sm theme-input transition-theme"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="p-2 rounded-xl text-white transition-all duration-200 disabled:opacity-50 hover:brightness-110"
                style={{ background: 'var(--color-primary)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

