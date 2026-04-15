import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inventoryAPI, patientsAPI, visitsAPI } from '../services/api';
import StatCard from '../components/StatCard';


export default function Dashboard() {
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [patSummary, setPatSummary] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      inventoryAPI.dashboard(),
      inventoryAPI.lowStock(),
      inventoryAPI.expiring(30),
      patientsAPI.summary(),
      visitsAPI.recent(5),
    ]).then(([invData, ls, exp, ps, rv]) => {
      setInv(invData);
      setLowStock(ls.items || []);
      setExpiring(exp.items || []);
      setPatSummary(ps);
      setRecentVisits(rv.visits || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: 'Upload Inventory CSV', icon: '📤', path: '/inventory', color: 'var(--teal)' },
    { label: 'View Patient Map', icon: '🗺️', path: '/router', color: '#8b5cf6' },
    { label: 'Run Analytics', icon: '📈', path: '/analytics', color: 'var(--amber)' },
    { label: 'AI Chatbot', icon: '🤖', path: '/chatbot', color: 'var(--green)' },
  ];

  return (
    <div className="page" style={{ padding: '72px 0 3rem' }}>
      <div className="container">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', paddingTop: '2rem' }}>
          <div>
            <h1 className="page-title">PHC Admin Dashboard</h1>
            <p className="page-subtitle">Real-time overview of your healthcare facility</p>
          </div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem 1rem' }}>
            🕐 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <StatCard label="Total Products"    value={inv?.total_products} icon="💊" accent="teal"  loading={loading} />
          <StatCard label="Low Stock Alerts"  value={inv?.low_stock_count} icon="⚠️" accent="red"   loading={loading} subtitle={`${inv?.low_stock_count || 0} items below reorder level`} />
          <StatCard label="Expiring (30 days)"value={inv?.expiring_count} icon="📅" accent="amber" loading={loading} />
          <StatCard label="Pending Orders"    value={inv?.pending_orders} icon="📦" accent="purple"loading={loading} />
        </div>

        <div className="stats-row" style={{ marginTop: 0 }}>
          <StatCard label="Total Patients"    value={patSummary?.total} icon="👥" accent="teal" loading={loading} />
          <StatCard label="Critical Patients" value={patSummary?.critical} icon="🚨" accent="red" loading={loading} />
          <StatCard label="High Urgency"      value={patSummary?.high_urgency} icon="⚡" accent="amber" loading={loading} />
          <StatCard label="No Visit (90d)"    value={patSummary?.no_visit_90_days} icon="📋" accent="purple" loading={loading} subtitle="Need follow-up" />
        </div>

        <div className="grid-2" style={{ marginBottom: '2rem' }}>
          {/* Alerts */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Active Alerts
            </h3>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '0.75rem' }} />)
            ) : (
              <>
                {lowStock.slice(0, 4).map(item => (
                  <div key={item.sku} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: 18 }}>💊</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.current_stock} units left</div>
                    </div>
                    <span className={`badge badge-${item.current_stock === 0 ? 'red' : 'amber'}`}>
                      {item.current_stock === 0 ? 'OUT' : 'LOW'}
                    </span>
                  </div>
                ))}
                {expiring.slice(0, 2).map(item => (
                  <div key={item.sku} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <span style={{ fontSize: 18 }}>📅</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{item.product_name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Expires {item.expiry_date}</div>
                    </div>
                    <span className="badge badge-amber">EXPIRING</span>
                  </div>
                ))}
                {lowStock.length === 0 && expiring.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>✅ No active alerts. All stock levels are healthy.</p>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/inventory')} style={{ marginTop: '1rem', width: '100%' }}>
                  Manage Inventory →
                </button>
              </>
            )}
          </div>

          {/* Recent Visits */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>🏠 Recent ASHA Visits</h3>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton skeleton-text" style={{ marginBottom: '0.75rem' }} />)
            ) : recentVisits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No visits recorded yet.</p>
            ) : (
              <>
                {recentVisits.map(v => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: v.triage_result === 'RED' ? 'var(--red-bg)' : v.triage_result === 'AMBER' ? 'var(--amber-bg)' : 'var(--green-bg)',
                      fontSize: 16, flexShrink: 0,
                    }}>
                      {v.triage_result === 'RED' ? '🔴' : v.triage_result === 'AMBER' ? '🟡' : '🟢'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="truncate" style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{v.patient_name || v.patient_id}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{v.village} • {new Date(v.visit_date).toLocaleDateString()}</div>
                    </div>
                    <span className={`triage-${v.triage_result}`} style={{ fontSize: 'var(--text-xs)' }}>{v.triage_result}</span>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/asha')} style={{ marginTop: '1rem', width: '100%' }}>
                  ASHA Portal →
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>⚡ Quick Actions</h3>
          <div className="grid-4">
            {quickActions.map(a => (
              <button key={a.path} onClick={() => navigate(a.path)} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem',
                padding: '1.5rem 1rem', background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)',
                cursor: 'pointer', transition: 'all 0.2s ease', color: 'var(--text-primary)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{ fontSize: 32 }}>{a.icon}</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, textAlign: 'center' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
