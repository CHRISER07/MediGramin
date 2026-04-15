import React from 'react';

/**
 * Full-page loading spinner used during lazy page loads.
 */
export default function Loader({ message = 'Loading...' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      background: 'var(--bg-primary)',
    }}>
      {/* Animated spinner ring */}
      <div style={{
        width: 52,
        height: 52,
        border: '3px solid rgba(0,212,170,0.15)',
        borderTop: '3px solid var(--teal)',
        borderRadius: '50%',
        animation: 'rotate 0.9s linear infinite',
      }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{message}</p>
    </div>
  );
}

/**
 * Inline spinner for buttons / card sections.
 */
export function InlineLoader({ size = 20, color = 'var(--teal)' }) {
  return (
    <div
      className="animate-spin"
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(0,212,170,0.2)`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}
