import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const PHC_NAV = [
  { path: '/dashboard',  label: 'Dashboard',  icon: '📊' },
  { path: '/inventory',  label: 'Inventory',  icon: '💊' },
  { path: '/router',     label: 'Patient Map', icon: '🗺️' },
  { path: '/analytics',  label: 'Analytics',  icon: '📈' },
  { path: '/orders',     label: 'Orders',     icon: '📦' },
];

const ASHA_NAV = [
  { path: '/asha',              label: 'Home',         icon: '🏠' },
  { path: '/asha/patients',     label: 'Patients',     icon: '👤' },
  { path: '/asha/triage',       label: 'Triage AI',    icon: '🚨' },
  { path: '/asha/prescriptions',label: 'Prescriptions',icon: '📋' },
];

const SHARED_NAV = [
  { path: '/chatbot',      label: 'Health AI', icon: '🤖' },
  { path: '/appointments', label: 'Appointments', icon: '📅' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [role, setRole] = useState(() => localStorage.getItem('mg_role') || 'phc');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => { setOpen(false); }, [location]);

  const isLanding = location.pathname === '/';
  const navItems = [...(role === 'phc' ? PHC_NAV : ASHA_NAV), ...SHARED_NAV];

  const switchRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('mg_role', newRole);
    navigate(newRole === 'phc' ? '/dashboard' : '/asha');
  };

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled || open ? 'rgba(10,14,26,0.97)' : 'rgba(10,14,26,0.7)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
      transition: 'all 0.3s ease',
    }}>
      <div className="container" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--teal), #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, lineHeight: 1,
          }}>⚕</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-lg)', color: 'var(--text-primary)', lineHeight: 1.2 }}>MediGramin</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>RURAL HEALTHCARE</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="md-hide" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          // show on desktop
        >
          {!isLanding && navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-sm)', fontWeight: 500,
              color: location.pathname === item.path ? 'var(--teal)' : 'var(--text-muted)',
              background: location.pathname === item.path ? 'rgba(0,212,170,0.08)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Role switcher */}
          {!isLanding && (
            <div style={{
              display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)',
              padding: '0.2rem', border: '1px solid var(--glass-border)',
            }}>
              {['phc', 'asha'].map(r => (
                <button key={r} onClick={() => switchRole(r)} style={{
                  padding: '0.35rem 0.85rem', border: 'none', borderRadius: 8,
                  fontSize: 'var(--text-xs)', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: role === r ? (r === 'phc' ? 'var(--teal)' : 'var(--amber)') : 'transparent',
                  color: role === r ? '#0a0e1a' : 'var(--text-muted)',
                }}>
                  {r === 'phc' ? '🏥 PHC' : '👩‍⚕️ ASHA'}
                </button>
              ))}
            </div>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setOpen(!open)} style={{
            display: 'none', // shown via media query below
            width: 40, height: 40, border: 'none', background: 'var(--glass)',
            borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)',
            alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }} id="mobile-menu-btn" aria-label="Toggle menu">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div style={{
          background: 'rgba(10,14,26,0.98)', borderTop: '1px solid var(--glass-border)',
          padding: '1rem 1.5rem 1.5rem',
        }}>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.85rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-base)', fontWeight: 500,
              color: location.pathname === item.path ? 'var(--teal)' : 'var(--text-secondary)',
              background: location.pathname === item.path ? 'rgba(0,212,170,0.08)' : 'transparent',
              textDecoration: 'none', marginBottom: '0.25rem',
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span> {item.label}
            </Link>
          ))}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            {['phc', 'asha'].map(r => (
              <button key={r} onClick={() => switchRole(r)} style={{
                flex: 1, padding: '0.65rem', border: 'none', borderRadius: 8,
                fontWeight: 600, cursor: 'pointer', fontSize: 'var(--text-sm)',
                background: role === r ? (r === 'phc' ? 'var(--teal)' : 'var(--amber)') : 'var(--bg-elevated)',
                color: role === r ? '#0a0e1a' : 'var(--text-muted)',
              }}>
                {r === 'phc' ? '🏥 PHC Admin' : '👩‍⚕️ ASHA Worker'}
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .md-hide { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
