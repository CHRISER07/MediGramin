import React, { useState, useEffect } from 'react';
import { inventoryAPI, patientsAPI, visitsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';


const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.75rem 1rem' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color, fontWeight: 700, fontSize: 14 }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

export default function Analytics() {
  const [inv, setInv] = useState(null);
  const [patSum, setPatSum] = useState(null);
  const [recentVisits, setRecentVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inventory');

  useEffect(() => {
    Promise.all([
      inventoryAPI.dashboard(),
      patientsAPI.summary(),
      visitsAPI.recent(50),
    ]).then(([i, p, v]) => {
      setInv(i);
      setPatSum(p);
      setRecentVisits(v.visits || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Visit triage breakdown
  const triageCounts = recentVisits.reduce((acc, v) => {
    acc[v.triage_result] = (acc[v.triage_result] || 0) + 1;
    return acc;
  }, {});
  const triageData = [
    { name: 'RED', value: triageCounts.RED || 0 },
    { name: 'AMBER', value: triageCounts.AMBER || 0 },
    { name: 'GREEN', value: triageCounts.GREEN || 0 },
  ];
  const triageColors = { RED: '#ef4444', AMBER: '#f59e0b', GREEN: '#22c55e' };

  // Visits by day (last 7 days)
  const visitsByDay = {};
  recentVisits.forEach(v => {
    const d = v.visit_date?.slice(0, 10);
    if (d) visitsByDay[d] = (visitsByDay[d] || 0) + 1;
  });
  const visitTrend = Object.entries(visitsByDay).sort().slice(-7).map(([date, count]) => ({
    date: date.slice(5), count
  }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>

        <div style={{ marginBottom: '2rem' }}>
          <h1 className="page-title">📈 Analytics & Reports</h1>
          <p className="page-subtitle">Operational insights for your PHC</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <StatCard label="Total Products" value={inv?.total_products} icon="💊" accent="teal" loading={loading} />
          <StatCard label="Total Value" value={inv ? `₹${Math.round(inv.total_value || 0).toLocaleString()}` : null} icon="💰" accent="green" loading={loading} />
          <StatCard label="Total Patients" value={patSum?.total} icon="👥" accent="amber" loading={loading} />
          <StatCard label="Recent Visits" value={recentVisits.length} icon="🏠" accent="purple" loading={loading} />
        </div>

        <div className="tabs">
          {['inventory', 'patients', 'visits'].map((t, i) => (
            <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {['💊 Inventory', '👥 Patients', '🏠 Visits'][i]}
            </button>
          ))}
        </div>

        {/* Inventory Analytics */}
        {tab === 'inventory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2">
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Stock by Category</h3>
                {loading ? <div className="skeleton" style={{ height: 250 }} /> : inv?.categories?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={inv.categories}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="category" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="units" fill="var(--teal)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '4rem' }}>No data yet</p>}
              </div>

              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Inventory Health</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'In Stock (OK)', value: (inv?.total_products || 0) - (inv?.low_stock_count || 0), color: 'var(--green)', icon: '✅' },
                    { label: 'Low Stock', value: inv?.low_stock_count || 0, color: 'var(--amber)', icon: '⚠️' },
                    { label: 'Expiring (30d)', value: inv?.expiring_count || 0, color: 'var(--red)', icon: '📅' },
                    { label: 'Pending Orders', value: inv?.pending_orders || 0, color: '#8b5cf6', icon: '📦' },
                  ].map((s, i) => {
                    const total = inv?.total_products || 1;
                    const pct = Math.min(100, Math.round((s.value / total) * 100));
                    return (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                          <span style={{ fontSize: 'var(--text-sm)' }}>{s.icon} {s.label}</span>
                          <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: s.color, borderRadius: 3, transition: 'width 1s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Analytics */}
        {tab === 'patients' && (
          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Patient Severity Distribution</h3>
              {patSum ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Critical', value: patSum.critical || 0 },
                        { name: 'High Urgency', value: (patSum.high_urgency || 0) - (patSum.critical || 0) },
                        { name: 'Normal', value: (patSum.total || 0) - (patSum.high_urgency || 0) },
                      ]} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}>
                        {['#ef4444', '#f59e0b', '#22c55e'].map((color, i) => <Cell key={i} fill={color} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                    {[{ l: 'Critical', c: '#ef4444' }, { l: 'High Urgency', c: '#f59e0b' }, { l: 'Normal', c: '#22c55e' }].map(x => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: x.c }} /> {x.l}
                      </div>
                    ))}
                  </div>
                </>
              ) : <div className="skeleton" style={{ height: 220 }} />}
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Patient Overview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { label: 'Total Registered', value: patSum?.total, icon: '👥', color: 'var(--teal)' },
                  { label: 'Critical Patients', value: patSum?.critical, icon: '🚨', color: 'var(--red)' },
                  { label: 'High Urgency', value: patSum?.high_urgency, icon: '⚡', color: 'var(--amber)' },
                  { label: 'No Visit (90d)', value: patSum?.no_visit_90_days, icon: '📋', color: '#8b5cf6' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{s.label}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', color: s.color }}>{s.value ?? '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Visit Analytics */}
        {tab === 'visits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2">
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Visits Trend (Last 7 Days)</h3>
                {visitTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={visitTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="count" stroke="var(--amber)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--amber)' }} name="Visits" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No visit data yet</div>}
              </div>

              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Triage Breakdown</h3>
                {recentVisits.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={triageData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                          {triageData.map((entry, i) => <Cell key={i} fill={triageColors[entry.name]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
                      {triageData.map(t => (
                        <div key={t.name} style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 800, fontSize: 'var(--text-xl)', color: triageColors[t.name] }}>{t.value}</div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{t.name}</div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No visit data yet</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
