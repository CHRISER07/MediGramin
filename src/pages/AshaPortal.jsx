import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../services/api';

export default function AshaPortal() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const ashaName = localStorage.getItem('asha_name') || 'ASHA Worker';
  const time = new Date().getHours();
  const greeting = time < 12 ? 'Suprabhat' : time < 17 ? 'Namaskar' : 'Shubh Sandhya';

  useEffect(() => {
    patientsAPI.summary().then(setSummary).catch(console.error);
    patientsAPI.list({ limit: 6, sort: 'urgency' }).then(d => setRecentPatients(d.patients || [])).catch(console.error);
  }, []);

  const tools = [
    { label: 'Patient EHR',      sublabel: 'Register & view patients',  icon: '👤', path: '/asha/patients',      color: '#00d4aa', bg: 'rgba(0,212,170,0.1)' },
    { label: 'AI Triage',        sublabel: 'Check urgency level',        icon: '🚨', path: '/asha/triage',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Prescriptions',    sublabel: 'View & create Rx',           icon: '📋', path: '/asha/prescriptions',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Health AI Chat',   sublabel: 'Ask in your language',        icon: '🤖', path: '/chatbot',             color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { label: 'Appointments',     sublabel: 'Book doctor visits',          icon: '📅', path: '/appointments',        color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { label: 'PHC Dashboard',    sublabel: 'Admin overview',              icon: '📊', path: '/dashboard',           color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72 }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(239,68,68,0.06) 100%)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '2.5rem 0',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--amber), #ef4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
              flexShrink: 0,
            }}>👩‍⚕️</div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>ASHA WORKER PORTAL</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: 4 }}>
                {greeting}, {ashaName}! 🙏
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            {[
              { label: 'Your Patients', val: summary?.total ?? '—', color: 'var(--teal)' },
              { label: 'Critical', val: summary?.critical ?? '—', color: 'var(--red)' },
              { label: 'Need Follow-up', val: summary?.no_visit_90_days ?? '—', color: 'var(--amber)' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)', padding: '0.65rem 1.25rem',
                backdropFilter: 'blur(8px)',
              }}>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.val}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* Tool Grid */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)', marginBottom: '1.25rem' }}>Quick Access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {tools.map((t, i) => (
              <button key={i} onClick={() => navigate(t.path)} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1.25rem', background: t.bg,
                border: `1px solid ${t.color}25`,
                borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                transition: 'all 0.2s ease', textAlign: 'left',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = t.color + '55'; e.currentTarget.style.boxShadow = `0 8px 24px ${t.color}15`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = t.color + '25'; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 'var(--text-base)' }}>{t.label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 2 }}>{t.sublabel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* High Priority Patients */}
        {recentPatients.length > 0 && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>🚨 Priority Patients Today</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/asha/patients')}>View All →</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentPatients.map(p => {
                const score = p.urgency_score || 0;
                const level = score >= 15 ? 'RED' : score >= 8 ? 'AMBER' : 'GREEN';
                return (
                  <div key={p.id} onClick={() => navigate(`/asha/visit/${p.id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '0.85rem', borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)',
                    cursor: 'pointer', transition: 'all 0.2s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,170,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                      background: level === 'RED' ? 'rgba(239,68,68,0.15)' : level === 'AMBER' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                    }}>
                      {level === 'RED' ? '🔴' : level === 'AMBER' ? '🟡' : '🟢'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }} className="truncate">{p.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {p.village} • Age {p.age} • {p.severity_level}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className={`badge badge-${level === 'RED' ? 'red' : level === 'AMBER' ? 'amber' : 'green'}`}>{level}</span>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>Score: {score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
