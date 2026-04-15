import React, { useState } from 'react';
import { chatbotAPI, visitsAPI } from '../services/api';
import { InlineLoader } from '../components/Loader';
import { toast } from 'react-toastify';

const SYMPTOM_OPTIONS = [
  'Fever', 'Cough', 'Shortness of breath', 'Chest pain', 'Dizziness',
  'Weakness', 'Vomiting', 'Diarrhea', 'Abdominal pain', 'Headache',
  'Convulsions', 'Loss of consciousness', 'Excessive bleeding', 'Jaundice',
  'High blood pressure', 'Low blood pressure', 'Swelling in legs', 'Rash',
];

const LEVEL_CONFIG = {
  RED:   { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.4)',  icon: '🔴', label: 'CRITICAL — Immediate Action', glow: 'rgba(239,68,68,0.3)' },
  AMBER: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.4)', icon: '🟡', label: 'MODERATE — PHC Visit Today', glow: 'rgba(245,158,11,0.3)' },
  GREEN: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',  border: 'rgba(34,197,94,0.4)',  icon: '🟢', label: 'ROUTINE — Monitor at Home', glow: 'rgba(34,197,94,0.3)' },
};

export default function Triage() {
  const [step, setStep] = useState(1); // 1=patient, 2=vitals, 3=symptoms, 4=result
  const [form, setForm] = useState({ age: '', gender: 'Unknown', symptoms: [], notes: '', bp_systolic: '', bp_diastolic: '', temperature: '', spo2: '', blood_glucose: '', weight: '', patient_id: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSymptom = (s) => {
    set('symptoms', form.symptoms.includes(s) ? form.symptoms.filter(x => x !== s) : [...form.symptoms, s]);
  };

  const runTriage = async () => {
    setLoading(true);
    try {
      const payload = {
        age: parseInt(form.age) || 0,
        gender: form.gender,
        symptoms: form.symptoms,
        notes: form.notes,
        bp_systolic: form.bp_systolic ? parseInt(form.bp_systolic) : null,
        bp_diastolic: form.bp_diastolic ? parseInt(form.bp_diastolic) : null,
        temperature: form.temperature ? parseFloat(form.temperature) : null,
        spo2: form.spo2 ? parseInt(form.spo2) : null,
        blood_glucose: form.blood_glucose ? parseFloat(form.blood_glucose) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
      };
      const res = await chatbotAPI.triage(payload);
      setResult(res);
      setStep(4);
    } catch { toast.error('Triage failed. Check connection.'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setStep(1); setForm({ age:'',gender:'Unknown',symptoms:[],notes:'',bp_systolic:'',bp_diastolic:'',temperature:'',spo2:'',blood_glucose:'',weight:'',patient_id:'' }); setResult(null); };

  const cfg = result ? LEVEL_CONFIG[result.level] : null;

  const stepLabel = ['', 'Patient Info', 'Vitals', 'Symptoms & Notes', 'Result'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container-sm" style={{ paddingTop: '2rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-full)', padding: '0.35rem 1rem', fontSize: 'var(--text-sm)', color: 'var(--red)', fontWeight: 600, marginBottom: '1rem' }}>
            🚨 AI Triage System
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>
            Patient Triage Assessment
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Fill in patient details to get Red / Amber / Green classification</p>
        </div>

        {/* Progress stepper */}
        {step < 4 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '2rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', padding: '0.5rem', border: '1px solid var(--glass-border)' }}>
            {[1,2,3].map(s => (
              <React.Fragment key={s}>
                <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem 0.5rem', borderRadius: 'var(--radius-md)', background: step >= s ? 'var(--red)' : 'transparent', color: step >= s ? 'white' : 'var(--text-muted)', fontSize: 'var(--text-xs)', fontWeight: 700, transition: 'all 0.2s ease' }}>
                  {s}. {stepLabel[s]}
                </div>
                {s < 3 && <div style={{ width: 1, height: 24, background: 'var(--glass-border)' }} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Step 1: Patient Info */}
        {step === 1 && (
          <div className="card" style={{ animation: 'fadeInUp 0.4s ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.5rem', fontSize: 'var(--text-xl)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>👤 Patient Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Patient Age *</label>
                <input className="form-input" type="number" min={0} max={120} placeholder="e.g. 35" value={form.age} onChange={e => set('age', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option>Unknown</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Patient ID (optional)</label>
              <input className="form-input" placeholder="PID-XXXX if already registered" value={form.patient_id} onChange={e => set('patient_id', e.target.value)} />
            </div>
            <button className="btn btn-danger btn-lg full-width" onClick={() => setStep(2)} disabled={!form.age}>
              Next: Record Vitals →
            </button>
          </div>
        )}

        {/* Step 2: Vitals */}
        {step === 2 && (
          <div className="card" style={{ animation: 'fadeInUp 0.4s ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem', fontSize: 'var(--text-xl)' }}>📊 Vital Signs</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>Fill what is available. Leave blank if not measured.</p>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">BP Systolic (mmHg)</label>
                <input className="form-input" type="number" placeholder="e.g. 120" value={form.bp_systolic} onChange={e => set('bp_systolic', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">BP Diastolic (mmHg)</label>
                <input className="form-input" type="number" placeholder="e.g. 80" value={form.bp_diastolic} onChange={e => set('bp_diastolic', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Temperature (°C)</label>
                <input className="form-input" type="number" step="0.1" placeholder="e.g. 37.5" value={form.temperature} onChange={e => set('temperature', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">SpO2 (%)</label>
                <input className="form-input" type="number" min={50} max={100} placeholder="e.g. 98" value={form.spo2} onChange={e => set('spo2', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Blood Glucose (mg/dL)</label>
                <input className="form-input" type="number" placeholder="e.g. 110" value={form.blood_glucose} onChange={e => set('blood_glucose', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Weight (kg)</label>
                <input className="form-input" type="number" placeholder="e.g. 65" value={form.weight} onChange={e => set('weight', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-danger" style={{ flex: 2 }} onClick={() => setStep(3)}>Next: Symptoms →</button>
            </div>
          </div>
        )}

        {/* Step 3: Symptoms */}
        {step === 3 && (
          <div className="card" style={{ animation: 'fadeInUp 0.4s ease' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.5rem', fontSize: 'var(--text-xl)' }}>🤒 Symptoms & Observations</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: '1.5rem' }}>Select all symptoms observed. Selected: <strong style={{ color: 'var(--teal)' }}>{form.symptoms.length}</strong></p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {SYMPTOM_OPTIONS.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)} style={{
                  padding: '0.45rem 1rem', borderRadius: 'var(--radius-full)',
                  border: `1px solid ${form.symptoms.includes(s) ? 'var(--red)' : 'var(--glass-border)'}`,
                  background: form.symptoms.includes(s) ? 'rgba(239,68,68,0.15)' : 'var(--bg-elevated)',
                  color: form.symptoms.includes(s) ? 'var(--red)' : 'var(--text-muted)',
                  fontSize: 'var(--text-sm)', fontWeight: form.symptoms.includes(s) ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}>
                  {form.symptoms.includes(s) ? '✓ ' : ''}{s}
                </button>
              ))}
            </div>
            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea className="form-input" rows={3} placeholder="Describe observations, duration of symptoms, relevant history..." value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(2)}>← Back</button>
              <button className="btn btn-danger" style={{ flex: 2 }} onClick={runTriage} disabled={loading}>
                {loading ? <><InlineLoader size={18} color="white" /> Analyzing with AI...</> : '🚨 Run AI Triage →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Result */}
        {step === 4 && result && cfg && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            {/* Big result card */}
            <div style={{
              background: cfg.bg, border: `2px solid ${cfg.border}`,
              borderRadius: 'var(--radius-xl)', padding: '2.5rem', textAlign: 'center',
              marginBottom: '1.5rem',
              boxShadow: `0 0 40px ${cfg.glow}`,
            }}>
              <div style={{ fontSize: 64, marginBottom: '0.75rem', animation: 'pulseGlow 2s ease infinite' }}>{cfg.icon}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: cfg.color, fontWeight: 800, letterSpacing: '0.15em', marginBottom: '0.5rem' }}>TRIAGE LEVEL</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: cfg.color, marginBottom: '0.5rem' }}>{result.level}</div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{cfg.label}</div>

              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: cfg.color, fontWeight: 700, marginBottom: '0.35rem' }}>CLINICAL REASON</div>
                <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{result.reason}</p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', textAlign: 'left', marginBottom: '1rem' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: cfg.color, fontWeight: 700, marginBottom: '0.35rem' }}>ASHA WORKER ACTION</div>
                <p style={{ fontSize: 'var(--text-sm)', lineHeight: 1.7, color: 'var(--text-secondary)', fontWeight: 500 }}>{result.action}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  🚗 {result.transport}
                </span>
                <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-full)', padding: '0.4rem 1rem', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  📅 Follow-up: {result.follow_up}
                </span>
              </div>
            </div>

            {result.level === 'RED' && (
              <a href="tel:108" style={{ display: 'block', textDecoration: 'none' }}>
                <button className="btn btn-danger btn-xl full-width" style={{ animation: 'pulseGlow 1.5s ease infinite', fontSize: 'var(--text-lg)' }}>
                  📞 CALL 108 AMBULANCE NOW
                </button>
              </a>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={resetForm}>🔄 New Triage</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.location.href = '/asha/patients'}>💾 Save to Patient</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
