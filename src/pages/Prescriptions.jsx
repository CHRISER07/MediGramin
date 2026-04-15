import React, { useState, useEffect } from 'react';
import { patientsAPI, prescriptionsAPI } from '../services/api';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

const COMMON_MEDS = ['Paracetamol 500mg', 'Amoxicillin 250mg', 'ORS Sachet', 'Iron-Folic Acid', 'Metformin 500mg', 'Amlodipine 5mg', 'Antacid', 'Vitamin D3', 'Omeprazole 20mg', 'Cetirizine 10mg'];

export default function Prescriptions() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRx, setPatientRx] = useState([]);
  const [loadingRx, setLoadingRx] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [patSearch, setPatSearch] = useState('');
  const [qrModal, setQrModal] = useState(null); // { qr_hash, patient_name, ... }
  const [qrUrl, setQrUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ doctor_name: '', diagnosis: '', instructions: '', medicines: [{ name: '', dose: '', frequency: '', duration: '' }] });
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('create'); // create | verify

  useEffect(() => {
    patientsAPI.list({ q: patSearch, limit: 20 }).then(d => setPatients(d.patients || [])).catch(console.error);
  }, [patSearch]);

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setLoadingRx(true);
    prescriptionsAPI.byPatient(p.id)
      .then(d => setPatientRx(d.prescriptions || []))
      .catch(console.error)
      .finally(() => setLoadingRx(false));
  };

  const addMed = () => setForm(f => ({ ...f, medicines: [...f.medicines, { name: '', dose: '', frequency: '', duration: '' }] }));
  const removeMed = (i) => setForm(f => ({ ...f, medicines: f.medicines.filter((_, idx) => idx !== i) }));
  const setMed = (i, k, v) => setForm(f => { const m = [...f.medicines]; m[i] = { ...m[i], [k]: v }; return { ...f, medicines: m }; });

  const showQR = (rx) => {
    // Use free QR Server API — no npm package needed
    const qrData = encodeURIComponent(`MEDIGRAMIN:${rx.qr_hash}`);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}&bgcolor=111827&color=f1f5f9&margin=10`;
    setQrUrl(url);
    setQrModal(rx);
  };

  const createRx = async () => {
    if (!selectedPatient) { toast.warning('Select a patient first'); return; }
    const validMeds = form.medicines.filter(m => m.name.trim());
    if (validMeds.length === 0) { toast.warning('Add at least one medicine'); return; }
    setSubmitting(true);
    try {
      const res = await prescriptionsAPI.create({
        patient_id: selectedPatient.id,
        doctor_name: form.doctor_name,
        diagnosis: form.diagnosis,
        instructions: form.instructions,
        medicines: validMeds,
      });
      toast.success(`Prescription created. QR: ${res.qr_hash}`);
      setShowForm(false);
      setForm({ doctor_name: '', diagnosis: '', instructions: '', medicines: [{ name: '', dose: '', frequency: '', duration: '' }] });
      prescriptionsAPI.byPatient(selectedPatient.id).then(d => setPatientRx(d.prescriptions || []));
      await showQR({ qr_hash: res.qr_hash, patient_name: res.patient_name, patient_village: res.patient_village, created_at: res.created_at, medicines: validMeds });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create prescription'); }
    finally { setSubmitting(false); }
  };

  const verifyQR = async () => {
    if (!verifyHash.trim()) return;
    setVerifying(true);
    try {
      const res = await prescriptionsAPI.verify(verifyHash.trim());
      setVerifyResult(res);
      if (res.valid) toast.success('Prescription verified ✓');
    } catch { setVerifyResult({ valid: false }); toast.error('Invalid or not found'); }
    finally { setVerifying(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <h1 className="page-title">📋 E-Prescriptions</h1>
            <p className="page-subtitle">Create digital prescriptions with QR verification</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ maxWidth: 400 }}>
          <button className={`tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>📝 Create Rx</button>
          <button className={`tab ${activeTab === 'verify' ? 'active' : ''}`} onClick={() => setActiveTab('verify')}>🔍 Verify QR</button>
        </div>

        {/* Create Rx Tab */}
        {activeTab === 'create' && (
          <div className="grid-2" style={{ alignItems: 'start' }}>

            {/* Patient selector */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>👤 Select Patient</h3>
              <input className="form-input" placeholder="🔍 Search patient..." value={patSearch} onChange={e => setPatSearch(e.target.value)} style={{ marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 320, overflowY: 'auto' }}>
                {patients.map(p => (
                  <button key={p.id} onClick={() => selectPatient(p)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)',
                    border: `1px solid ${selectedPatient?.id === p.id ? 'var(--teal)' : 'var(--glass-border)'}`,
                    background: selectedPatient?.id === p.id ? 'rgba(0,212,170,0.1)' : 'var(--bg-elevated)',
                    cursor: 'pointer', transition: 'all 0.15s ease', textAlign: 'left',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                      {p.gender === 'Female' ? '👩' : '👨'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }} className="truncate">{p.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Age {p.age} • {p.village}</div>
                    </div>
                    {selectedPatient?.id === p.id && <span style={{ color: 'var(--teal)', fontSize: 18 }}>✓</span>}
                  </button>
                ))}
              </div>

              {/* Existing Rx list */}
              {selectedPatient && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Past Prescriptions</div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New Rx</button>
                  </div>
                  {loadingRx ? <div className="skeleton skeleton-text" /> : patientRx.length === 0 ? (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No prescriptions yet.</p>
                  ) : patientRx.map(rx => (
                    <div key={rx.id} style={{ padding: '0.65rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem', border: '1px solid var(--glass-border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>{rx.created_at?.slice(0, 10)}</div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => showQR(rx)} style={{ padding: '0.2rem 0.6rem', fontSize: 10 }}>📱 QR</button>
                        </div>
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Dr. {rx.doctor_name || 'PHC'} • {rx.medicines?.length} meds</div>
                      {rx.diagnosis && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', marginTop: 2 }}>{rx.diagnosis}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescription form */}
            {showForm && selectedPatient ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>New Prescription</h3>
                  <button className="btn-icon" onClick={() => setShowForm(false)}>✕</button>
                </div>
                <div style={{ background: 'rgba(0,212,170,0.06)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1.25rem', border: '1px solid rgba(0,212,170,0.15)' }}>
                  <div style={{ fontWeight: 700 }}>{selectedPatient.name}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Age {selectedPatient.age} • {selectedPatient.village}</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor Name</label>
                  <input className="form-input" placeholder="Dr. Sharma" value={form.doctor_name} onChange={e => setForm(f => ({ ...f, doctor_name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis</label>
                  <input className="form-input" placeholder="e.g. Acute Respiratory Infection" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Medicines</label>
                    <button className="btn btn-ghost btn-sm" onClick={addMed}>+ Add Medicine</button>
                  </div>
                  {form.medicines.map((med, i) => (
                    <div key={i} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '0.5rem', border: '1px solid var(--glass-border)', position: 'relative' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <select className="form-select" value={med.name} onChange={e => setMed(i, 'name', e.target.value)} style={{ marginBottom: '0.4rem' }}>
                          <option value="">Select medicine...</option>
                          {COMMON_MEDS.map(m => <option key={m} value={m}>{m}</option>)}
                          <option value="__custom__">Custom...</option>
                        </select>
                        {(med.name === '__custom__' || !COMMON_MEDS.includes(med.name)) && med.name !== '' && (
                          <input className="form-input" placeholder="Medicine name" value={med.name === '__custom__' ? '' : med.name} onChange={e => setMed(i, 'name', e.target.value)} />
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                        <input className="form-input" placeholder="Dose (e.g. 500mg)" value={med.dose} onChange={e => setMed(i, 'dose', e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
                        <input className="form-input" placeholder="Frequency (e.g. 3x/day)" value={med.frequency} onChange={e => setMed(i, 'frequency', e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
                        <input className="form-input" placeholder="Days (e.g. 5d)" value={med.duration} onChange={e => setMed(i, 'duration', e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
                      </div>
                      {form.medicines.length > 1 && (
                        <button onClick={() => removeMed(i)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Special Instructions</label>
                  <textarea className="form-input" rows={2} placeholder="e.g. Take after food. Avoid cold drinks." value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
                </div>
                <button className="btn btn-primary full-width" onClick={createRx} disabled={submitting}>
                  {submitting ? <><InlineLoader size={16} color="#0a0e1a" /> Creating...</> : '📋 Create Prescription & Generate QR'}
                </button>
              </div>
            ) : !selectedPatient ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--glass-border)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>← </div>
                  <p>Select a patient to view<br />or create prescriptions</p>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px dashed var(--glass-border)' }}>
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>📋</div>
                  <p style={{ marginBottom: '1rem' }}>No prescription form open</p>
                  <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Prescription</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Verify Tab */}
        {activeTab === 'verify' && (
          <div className="container-sm" style={{ padding: 0 }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>🔍 Verify Prescription QR</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>Enter the 16-character QR hash to verify prescription authenticity.</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <input className="form-input" placeholder="e.g. A1B2C3D4E5F6G7H8" value={verifyHash} onChange={e => setVerifyHash(e.target.value.toUpperCase())} style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.05em' }} onKeyDown={e => e.key === 'Enter' && verifyQR()} />
                <button className="btn btn-primary" onClick={verifyQR} disabled={verifying || !verifyHash.trim()}>
                  {verifying ? <InlineLoader size={16} color="#0a0e1a" /> : '✓ Verify'}
                </button>
              </div>
              {verifyResult && (
                <div style={{ background: verifyResult.valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${verifyResult.valid ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                  <div style={{ fontSize: 'var(--text-xl)', marginBottom: '0.5rem' }}>{verifyResult.valid ? '✅ VALID' : '❌ INVALID'}</div>
                  {verifyResult.valid && (
                    <>
                      <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{verifyResult.patient_name}</div>
                      <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                        Age {verifyResult.age} • {verifyResult.village} • QR: {verifyResult.qr_hash}
                      </div>
                      {verifyResult.diagnosis && <div style={{ color: 'var(--amber)', marginBottom: '0.5rem' }}>Diagnosis: {verifyResult.diagnosis}</div>}
                      <div>
                        {(verifyResult.medicines || []).map((m, i) => (
                          <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--glass-border)', fontSize: 'var(--text-sm)' }}>
                            <strong>{m.name}</strong> — {m.dose} × {m.frequency} for {m.duration}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setQrModal(null)}>
          <div className="card" style={{ maxWidth: 360, width: '90%', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem' }}>Prescription QR Code</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '1.25rem' }}>{qrModal.patient_name} — {qrModal.created_at?.slice(0,10)}</p>
            {qrUrl && <img src={qrUrl} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto', borderRadius: 12, border: '4px solid var(--glass-border)' }} />}
            <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-sm)', color: 'var(--teal)', marginTop: '1rem', letterSpacing: '0.05em' }}>{qrModal.qr_hash}</div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Pharmacist scans this to verify</p>
            <button className="btn btn-ghost full-width" style={{ marginTop: '1rem' }} onClick={() => setQrModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
