import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientsAPI, visitsAPI, chatbotAPI } from '../services/api';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

const SYMPTOMS = ['Fever', 'Cough', 'Shortness of breath', 'Chest pain', 'Dizziness', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Headache', 'Weakness', 'Swelling', 'Rash', 'Convulsions'];
const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VisitLog() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('log'); // log | history
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [form, setForm] = useState({
    asha_id: '', bp_systolic: '', bp_diastolic: '',
    temperature: '', weight: '', spo2: '', blood_glucose: '',
    symptoms: [], notes: '',
  });
  const [triageResult, setTriageResult] = useState(null);
  const [triageLoading, setTriageLoading] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([patientsAPI.get(patientId), visitsAPI.byPatient(patientId)])
      .then(([pd, vd]) => { setPatient(pd.patient); setVisits(vd.visits || []); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [patientId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleSym = (s) => set('symptoms', form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s]);

  const startVoice = () => {
    if (!SpeechAPI) return;
    const rec = new SpeechAPI();
    rec.lang = 'hi-IN';
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (e) => set('notes', (form.notes + ' ' + e.results[0][0].transcript).trim());
    rec.start();
  };

  const runQuickTriage = async () => {
    setTriageLoading(true);
    try {
      const res = await chatbotAPI.triage({
        age: patient?.age, gender: patient?.gender,
        symptoms: form.symptoms, notes: form.notes,
        bp_systolic: form.bp_systolic, bp_diastolic: form.bp_diastolic,
        temperature: form.temperature, spo2: form.spo2, blood_glucose: form.blood_glucose,
      });
      setTriageResult(res);
    } catch { toast.error('Triage failed'); }
    finally { setTriageLoading(false); }
  };

  const submitVisit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        patient_id: patientId,
        asha_id: form.asha_id,
        symptoms: form.symptoms,
        notes: form.notes,
        bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        spo2: form.spo2 ? parseInt(form.spo2) : null,
        blood_glucose: form.blood_glucose ? parseFloat(form.blood_glucose) : null,
        triage_result: triageResult?.level || 'GREEN',
        triage_reason: triageResult?.reason || '',
        triage_action: triageResult?.action || '',
        local_id: `local_${patientId}_${Date.now()}`,
      };
      const res = await visitsAPI.log(payload);
      toast.success(`Visit logged! ${triageResult ? `Triage: ${triageResult.level}` : ''}`);
      if (res.ai_summary) toast.info(`AI Summary: ${res.ai_summary.slice(0, 100)}...`, { autoClose: 6000 });
      navigate('/asha/patients');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save visit');
    } finally { setSubmitting(false); }
  };

  const triageColors = { RED: 'var(--red)', AMBER: 'var(--amber)', GREEN: 'var(--green)' };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><InlineLoader size={40} /></div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container-sm" style={{ paddingTop: '2rem' }}>

        {/* Patient banner */}
        {patient && (
          <div style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.1), rgba(124,58,237,0.08))', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-xl)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
              {patient.gender === 'Female' ? '👩' : '👨'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 'var(--text-lg)' }}>{patient.name}</div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                {patient.id} • Age {patient.age} • {patient.village} • {patient.severity_level || 'Mild'}
              </div>
              {patient.conditions && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--amber)', marginTop: 2 }}>🩺 {patient.conditions}</div>}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button className={`tab ${tab === 'log' ? 'active' : ''}`} onClick={() => setTab('log')}>📝 Log Visit</button>
          <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>📋 History ({visits.length})</button>
        </div>

        {/* Log Visit Tab */}
        {tab === 'log' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Vitals */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Vital Signs
              </h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">BP Systolic</label>
                  <input className="form-input" type="number" placeholder="120 mmHg" value={form.bp_systolic} onChange={e => set('bp_systolic', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">BP Diastolic</label>
                  <input className="form-input" type="number" placeholder="80 mmHg" value={form.bp_diastolic} onChange={e => set('bp_diastolic', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Temperature (°C)</label>
                  <input className="form-input" type="number" step="0.1" placeholder="37.0" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">SpO2 (%)</label>
                  <input className="form-input" type="number" placeholder="98" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Blood Glucose (mg/dL)</label>
                  <input className="form-input" type="number" placeholder="100" value={form.blood_glucose} onChange={e => set('blood_glucose', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input className="form-input" type="number" placeholder="65" value={form.weight} onChange={e => set('weight', e.target.value)} />
                </div>
              </div>
            </div>

            {/* Symptoms */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>🤒 Symptoms</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {SYMPTOMS.map(s => (
                  <button key={s} onClick={() => toggleSym(s)} style={{
                    padding: '0.4rem 0.9rem', borderRadius: 'var(--radius-full)',
                    border: `1px solid ${form.symptoms.includes(s) ? 'var(--teal)' : 'var(--glass-border)'}`,
                    background: form.symptoms.includes(s) ? 'rgba(0,212,170,0.15)' : 'var(--bg-elevated)',
                    color: form.symptoms.includes(s) ? 'var(--teal)' : 'var(--text-muted)',
                    fontSize: 'var(--text-xs)', fontWeight: form.symptoms.includes(s) ? 700 : 400,
                    cursor: 'pointer', transition: 'all 0.15s ease',
                  }}>
                    {form.symptoms.includes(s) ? '✓ ' : ''}{s}
                  </button>
                ))}
              </div>

              {/* Notes with voice */}
              <label className="form-label">Observations & Notes</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <textarea className="form-input" rows={3} placeholder="Describe what you see, patient complaints, relevant history..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ flex: 1, resize: 'vertical' }} />
                <button onClick={startVoice} title="Voice input (Hindi)" style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: '50%',
                  border: `1px solid ${listening ? 'var(--red)' : 'var(--glass-border)'}`,
                  background: listening ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
                  cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: listening ? '0 0 0 6px rgba(239,68,68,0.2)' : 'none',
                }}>🎤</button>
              </div>
              {listening && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginBottom: '0.5rem' }}>🔴 Listening... speak in Hindi or English</div>}
            </div>

            {/* Quick Triage */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: triageResult ? '1rem' : 0 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>🚨 Quick AI Triage</h3>
                <button className="btn btn-ghost btn-sm" onClick={runQuickTriage} disabled={triageLoading}>
                  {triageLoading ? <><InlineLoader size={14} /> Analyzing...</> : '⚡ Run Triage'}
                </button>
              </div>
              {triageResult && (
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem', border: `1px solid ${triageColors[triageResult.level]}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'var(--text-2xl)', color: triageColors[triageResult.level] }}>{triageResult.level}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>— {triageResult.reason}</span>
                  </div>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>✅ {triageResult.action}</p>
                </div>
              )}
            </div>

            {/* ASHA ID + Submit */}
            <div className="card">
              <div className="form-group">
                <label className="form-label">Your ASHA Worker ID</label>
                <input className="form-input" placeholder="ASHA-XXXX" value={form.asha_id} onChange={e => set('asha_id', e.target.value)} />
              </div>
              <button className="btn btn-primary btn-lg full-width" onClick={submitVisit} disabled={submitting}>
                {submitting ? <><InlineLoader size={18} color="#0a0e1a" /> Saving Visit...</> : '💾 Save Visit Record'}
              </button>
            </div>
          </div>
        )}

        {/* History Tab */}
        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {visits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 48, marginBottom: '1rem' }}>📋</div>
                <p style={{ color: 'var(--text-muted)' }}>No visits recorded yet. Log the first visit.</p>
              </div>
            ) : visits.map(v => (
              <div key={v.id} className="card" style={{ borderLeft: `3px solid ${triageColors[v.triage_result] || 'var(--text-dim)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{new Date(v.visit_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>ASHA: {v.asha_id || 'Unknown'}</div>
                  </div>
                  <span className={`badge badge-${v.triage_result === 'RED' ? 'red' : v.triage_result === 'AMBER' ? 'amber' : 'green'}`}>{v.triage_result}</span>
                </div>
                {Array.isArray(v.symptoms) && v.symptoms.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
                    {v.symptoms.map(s => <span key={s} className="badge badge-gray">{s}</span>)}
                  </div>
                )}
                {v.ai_summary && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>AI: {v.ai_summary}</p>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap', fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}>
                  {v.bp_systolic && <span>BP: {v.bp_systolic}/{v.bp_diastolic}</span>}
                  {v.temperature && <span>Temp: {v.temperature}°C</span>}
                  {v.spo2 && <span>SpO2: {v.spo2}%</span>}
                  {v.blood_glucose && <span>Glucose: {v.blood_glucose}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
