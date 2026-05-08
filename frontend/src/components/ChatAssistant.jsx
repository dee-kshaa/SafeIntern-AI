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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full btn-gradient flex items-center justify-center glow-indigo shadow-lg transition-all duration-300 hover:scale-110"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass-card flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: '500px' }}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-primary/10">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-white text-sm">SafeIntern AI</div>
              <div className="text-xs text-white/50">Scam Detection Assistant</div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '280px' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white/10 text-white/90 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-3 py-2 rounded-xl flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
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
                className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60 hover:bg-primary/20 hover:text-primary transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 pt-2 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about internship safety..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading}
                className="p-2 bg-primary rounded-xl text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
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
