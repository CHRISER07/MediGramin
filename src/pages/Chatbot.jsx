import React, { useState, useEffect, useRef } from 'react';
import { chatbotAPI } from '../services/api';
import { InlineLoader } from '../components/Loader';

const LANGS = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'hi', label: '🇮🇳 हिंदी' },
  { code: 'ta', label: '🏛️ தமிழ்' },
  { code: 'te', label: '🌿 తెలుగు' },
  { code: 'bn', label: '🌸 বাংলা' },
  { code: 'mr', label: '🦁 मराठी' },
  { code: 'kn', label: '🌴 ಕನ್ನಡ' },
];

const QUICK_PROMPTS = [
  { text: 'Fever in child under 5 — what to do?', icon: '🌡️' },
  { text: 'Normal blood pressure range?', icon: '❤️' },
  { text: 'Signs of severe dehydration?', icon: '💧' },
  { text: 'When to call 108 ambulance?', icon: '🚑' },
  { text: 'How to manage diabetes at home?', icon: '💉' },
  { text: 'Danger signs in pregnancy?', icon: '🤰' },
];

const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Chatbot() {
  const [lang, setLang] = useState('hi');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '🙏 Namaskar! I\'m your medical AI assistant. Ask me any health question in your language. For emergencies always call 108.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const langCode = LANGS.find(l => l.code === lang)?.code || 'en';
  const speechLang = { en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN', bn: 'bn-IN', mr: 'mr-IN', kn: 'kn-IN' }[lang] || 'hi-IN';

  const startListening = () => {
    if (!SpeechAPI) { alert('Voice not supported in this browser. Use Chrome.'); return; }
    const rec = new SpeechAPI();
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => { setInput(e.results[0][0].transcript); };
    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLang;
    utter.rate = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    try {
      const res = await chatbotAPI.chat(msg, lang);
      const reply = res.reply || 'Could not get a response.';
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: '⚠️ AI is temporarily unavailable. Please try again or visit the nearest PHC.' }]);
    } finally { setLoading(false); }
  };

  const clearChat = () => {
    window.speechSynthesis?.cancel();
    setMessages([{ role: 'ai', text: '🙏 New conversation started. Ask me any health question!' }]);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)', paddingTop: 72 }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(0,212,170,0.08) 100%)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 0', flexShrink: 0,
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #8b5cf6, var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🤖</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>MediGramin Health AI</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--teal)', fontWeight: 600 }}>● Powered by Gemini 2.0</div>
              </div>
            </div>
            {/* Language selector */}
            <select value={lang} onChange={e => setLang(e.target.value)} className="form-select" style={{ width: 'auto', minWidth: 140 }}>
              {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
            {speaking && <button className="btn btn-ghost btn-sm" onClick={() => window.speechSynthesis?.cancel()}>⏹ Stop</button>}
            <button className="btn btn-ghost btn-sm" onClick={clearChat}>🗑️ Clear</button>
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', padding: '0.65rem 0', overflowX: 'auto', flexShrink: 0 }}>
        <div className="container" style={{ display: 'flex', gap: '0.5rem' }}>
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p.text)} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap',
              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)', fontSize: 'var(--text-xs)', cursor: 'pointer',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              {p.icon} {p.text}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 0' }}>
        <div className="container-sm" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', animation: 'fadeInUp 0.3s ease both' }}>
              {m.role === 'ai' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginRight: '0.65rem', marginTop: 4 }}>🤖</div>
              )}
              <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ maxWidth: '75%', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                {m.text}
                {m.role === 'ai' && (
                  <button onClick={() => speak(m.text)} style={{ display: 'block', marginTop: '0.5rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)', cursor: 'pointer', padding: 0 }}>
                    🔊 Listen
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, var(--teal))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: '18px 18px 18px 4px', padding: '0.75rem 1.1rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                {[0,1,2].map(j => <div key={j} style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: `typing 1.2s ${j * 0.2}s ease infinite` }} />)}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', padding: '1rem 0', flexShrink: 0 }}>
        <div className="container-sm">
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
            {/* Voice button */}
            <button onClick={listening ? stopListening : startListening} style={{
              width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: listening ? 'linear-gradient(135deg, var(--red), #dc2626)' : 'var(--bg-elevated)',
              color: listening ? 'white' : 'var(--text-muted)',
              boxShadow: listening ? '0 0 0 8px rgba(239,68,68,0.2)' : 'none',
              transition: 'all 0.2s ease', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              🎤
            </button>

            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={lang === 'hi' ? 'यहाँ सवाल टाइप करें... (Enter दबाएं)' : 'Type your health question... (Enter to send)'}
              className="form-input" rows={2} style={{ flex: 1, resize: 'none', minHeight: 48, maxHeight: 120 }}
            />
            <button className="btn btn-primary" onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ height: 48, flexShrink: 0 }}>
              {loading ? <InlineLoader size={18} color="#0a0e1a" /> : '➤'}
            </button>
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: '0.5rem', textAlign: 'center' }}>
            🎤 Voice input • 🔊 Voice output • 7 Indian languages • Not a substitute for medical advice
          </div>
        </div>
      </div>

      <style>{`@keyframes typing { 0%, 60%, 100% { transform: translateY(0) } 30% { transform: translateY(-8px) } }`}</style>
    </div>
  );
}
