import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientsAPI, visitsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

export default function PatientEHR() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [village, setVillage] = useState('');
  const [villages, setVillages] = useState([]);
  const [severity, setSeverity] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:'', age:'', gender:'Unknown', village:'', phone:'', conditions:'', asha_id:'' });

  const load = () => {
    setLoading(true);
    patientsAPI.list({ q, village, severity, sort: 'urgency' })
      .then(d => setPatients(d.patients || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [q, village, severity]);
  useEffect(() => { patientsAPI.villages().then(d => setVillages(d.villages || [])).catch(console.error); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const register = async () => {
    if (!form.name.trim()) { toast.warning('Patient name is required'); return; }
    setSubmitting(true);
    try {
      const res = await patientsAPI.register({ ...form, age: parseInt(form.age) || 0, force_create: true });
      toast.success(`Patient registered: ${res.patient_id}`);
      setShowRegister(false);
      setForm({ name:'', age:'', gender:'Unknown', village:'', phone:'', conditions:'', asha_id:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setSubmitting(false); }
  };

  const urgencyColor = (s) => ({ Critical: '#ef4444', Severe: '#f97316', Moderate: '#f59e0b', Mild: '#22c55e' }[s] || '#94a3b8');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 className="page-title">👥 Patient EHR Registry</h1>
            <p className="page-subtitle">All registered patients — sorted by urgency</p>
          </div>
          <button className="btn btn-amber" onClick={() => setShowRegister(true)}>+ Register Patient</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <input className="form-input" placeholder="🔍 Search name / phone..." value={q} onChange={e => setQ(e.target.value)} style={{ flex: '1 1 240px', maxWidth: 320 }} />
          <select className="form-select" value={village} onChange={e => setVillage(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 220 }}>
            <option value="">All Villages</option>
            {villages.map(v => <option key={v.village} value={v.village}>{v.village} ({v.cnt})</option>)}
          </select>
          <select className="form-select" value={severity} onChange={e => setSeverity(e.target.value)} style={{ flex: '1 1 160px', maxWidth: 180 }}>
            <option value="">All Severity</option>
            <option value="Critical">Critical</option>
            <option value="Severe">Severe</option>
            <option value="Moderate">Moderate</option>
            <option value="Mild">Mild</option>
          </select>
        </div>

        {/* Patient Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {[...Array(6)].map((_, i) => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
            <div style={{ fontSize: 56, marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.5rem' }}>No patients found</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Register your first patient to get started</p>
            <button className="btn btn-amber" onClick={() => setShowRegister(true)}>+ Register Patient</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {patients.map(p => {
              const score = p.urgency_score || 0;
              const triageLevel = score >= 15 ? 'RED' : score >= 8 ? 'AMBER' : 'GREEN';
              const borderColor = { RED: 'rgba(239,68,68,0.5)', AMBER: 'rgba(245,158,11,0.5)', GREEN: 'rgba(34,197,94,0.3)' }[triageLevel];
              return (
                <div key={p.id} onClick={() => navigate(`/asha/visit/${p.id}`)} style={{
                  background: 'var(--bg-surface)', border: `1px solid ${borderColor}`,
                  borderRadius: 'var(--radius-lg)', padding: '1.25rem', cursor: 'pointer',
                  transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${borderColor.replace('0.5', '0.2')}`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
                >
                  {/* Urgency bar at top */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: urgencyColor(p.severity_level) }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', marginTop: '0.25rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', marginBottom: 2 }}>{p.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{p.id} • Age {p.age} • {p.gender}</div>
                    </div>
                    <span className={`badge badge-${triageLevel === 'RED' ? 'red' : triageLevel === 'AMBER' ? 'amber' : 'green'}`}>{triageLevel}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {p.village && <span className="badge badge-gray">📍 {p.village}</span>}
                    {p.severity_level && <span className="badge badge-gray" style={{ color: urgencyColor(p.severity_level) }}>⚡ {p.severity_level}</span>}
                    {p.stock_available === 'No' && <span className="badge badge-red">💊 No Meds</span>}
                  </div>
                  {p.conditions && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '0.75rem' }} className="truncate">🩺 {p.conditions}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
                      {p.last_consultation_date ? `Last visit: ${p.last_consultation_date}` : 'No visits recorded'}
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--teal)', fontWeight: 600 }}>Log Visit →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Register Modal */}
        {showRegister && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem' }} onClick={() => setShowRegister(false)}>
            <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>+ Register New Patient</h3>
                <button className="btn-icon" onClick={() => setShowRegister(false)}>✕</button>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Ramesh Kumar" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input className="form-input" type="number" placeholder="35" value={form.age} onChange={e => set('age', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Unknown</option><option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Village</label>
                  <input className="form-input" placeholder="Village name" value={form.village} onChange={e => set('village', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="Mobile number" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Known Conditions</label>
                <input className="form-input" placeholder="e.g. Diabetes, Hypertension" value={form.conditions} onChange={e => set('conditions', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">ASHA Worker ID</label>
                <input className="form-input" placeholder="Your ASHA ID" value={form.asha_id} onChange={e => set('asha_id', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowRegister(false)}>Cancel</button>
                <button className="btn btn-amber" style={{ flex: 2 }} onClick={register} disabled={submitting}>
                  {submitting ? <><InlineLoader size={16} color="#0a0e1a" /> Registering...</> : '✓ Register Patient'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
