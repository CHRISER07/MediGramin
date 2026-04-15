import React from 'react';

/**
 * Reusable stat card with icon, value, label, and optional color accent.
 * Props: { label, value, icon, accent ('teal'|'amber'|'red'|'green'), subtitle, loading }
 */
export default function StatCard({ label, value, icon, accent = 'teal', subtitle, loading }) {
  const colors = {
    teal:   { bg: 'rgba(0,212,170,0.08)',    icon: '#00d4aa', border: 'rgba(0,212,170,0.2)' },
    amber:  { bg: 'rgba(245,158,11,0.08)',   icon: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    red:    { bg: 'rgba(239,68,68,0.08)',    icon: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    green:  { bg: 'rgba(34,197,94,0.08)',    icon: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    purple: { bg: 'rgba(139,92,246,0.08)',   icon: '#8b5cf6', border: 'rgba(139,92,246,0.2)' },
  };
  const c = colors[accent] || colors.teal;

  if (loading) {
    return (
      <div className="card" style={{ border: `1px solid ${c.border}` }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: '1rem' }} />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
      </div>
    );
  }

  return (
    <div className="card" style={{
      border: `1px solid ${c.border}`,
      background: c.bg,
      transition: 'all 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{
          width: 44, height: 44,
          borderRadius: 12,
          background: `rgba(${accent === 'teal' ? '0,212,170' : accent === 'amber' ? '245,158,11' : accent === 'red' ? '239,68,68' : accent === 'green' ? '34,197,94' : '139,92,246'},0.15)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          {icon}
        </div>
      </div>
      <div style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontFamily: 'var(--font-display)',
        fontWeight: 800,
        color: c.icon,
        lineHeight: 1,
        marginBottom: '0.35rem',
      }}>
        {value ?? '—'}
      </div>
      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      {subtitle && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{subtitle}</div>
      )}
    </div>
  );
}
