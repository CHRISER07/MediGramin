import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { InlineLoader } from '../components/Loader';

const DOCTORS = [
  { name: 'Dr. Rajesh Sharma', speciality: 'General Medicine', slots: ['09:00', '09:30', '10:00', '11:00', '11:30', '14:00', '14:30', '15:00'] },
  { name: 'Dr. Priya Nair', speciality: 'Gynaecology & Obstetrics', slots: ['09:00', '09:30', '10:00', '10:30', '11:00'] },
  { name: 'Dr. Amit Verma', speciality: 'Paediatrics', slots: ['10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'] },
  { name: 'Dr. Sunita Mishra', speciality: 'Community Health', slots: ['08:30', '09:00', '09:30', '10:00', '14:00'] },
];

export default function Appointments() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [booked, setBooked] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Minimum date = today
  const today = new Date().toISOString().slice(0, 10);

  const book = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !patientName) {
      toast.warning('Fill all required fields');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800)); // Simulate API call
    const confirmId = 'APT-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    setBooked({ doctor: selectedDoctor, date: selectedDate, slot: selectedSlot, patient: patientName, phone, reason, id: confirmId });
    setSubmitting(false);
    toast.success(`Appointment confirmed: ${confirmId}`);
  };

  const reset = () => {
    setBooked(null); setSelectedDoctor(null); setSelectedDate(''); setSelectedSlot('');
    setPatientName(''); setPhone(''); setReason('');
  };

  if (booked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', animation: 'fadeInUp 0.5s ease' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 1.5rem', animation: 'pulseGlow 2s ease infinite' }}>✅</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'var(--text-2xl)', marginBottom: '0.5rem' }}>Appointment Booked!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Confirmation ID: <code style={{ color: 'var(--teal)', fontWeight: 700 }}>{booked.id}</code></p>
          <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
            {[
              ['👤 Patient', booked.patient],
              ['📞 Phone', booked.phone || 'Not provided'],
              ['👨‍⚕️ Doctor', booked.doctor.name],
              ['🏥 Speciality', booked.doctor.speciality],
              ['📅 Date', new Date(booked.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })],
              ['🕐 Time', booked.slot],
              ['📝 Reason', booked.reason || 'General consultation'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', minWidth: 120 }}>{label}</div>
                <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={reset}>+ Book Another</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => window.print()}>🖨️ Print Slip</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingTop: 72, paddingBottom: '3rem' }}>
      <div className="container-sm" style={{ paddingTop: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', marginBottom: '0.5rem' }}>📅 Book Appointment</h1>
          <p style={{ color: 'var(--text-muted)' }}>Schedule a doctor visit at your PHC</p>
        </div>

        {/* Doctor Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem' }}>Step 1 — Select Doctor</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {DOCTORS.map((doc, i) => (
              <button key={i} onClick={() => { setSelectedDoctor(doc); setSelectedSlot(''); }} style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)',
                border: `1px solid ${selectedDoctor?.name === doc.name ? 'var(--teal)' : 'var(--glass-border)'}`,
                background: selectedDoctor?.name === doc.name ? 'rgba(0,212,170,0.08)' : 'var(--bg-surface)',
                cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left',
              }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${['#00d4aa','#f59e0b','#8b5cf6','#22c55e'][i % 4]}, ${['#7c3aed','#ef4444','#0ea5e9','#f59e0b'][i % 4]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>👨‍⚕️</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{doc.name}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{doc.speciality}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--teal)', marginTop: 2 }}>{doc.slots.length} slots available today</div>
                </div>
                {selectedDoctor?.name === doc.name && <span style={{ color: 'var(--teal)', fontSize: 20 }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {selectedDoctor && (
          <>
            {/* Date + Slot */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Step 2 — Pick Date & Time</h3>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" min={today} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
              </div>
              {selectedDate && (
                <div>
                  <label className="form-label">Available Slots</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {selectedDoctor.slots.map(slot => (
                      <button key={slot} onClick={() => setSelectedSlot(slot)} style={{
                        padding: '0.45rem 1rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: `1px solid ${selectedSlot === slot ? 'var(--teal)' : 'var(--glass-border)'}`,
                        background: selectedSlot === slot ? 'rgba(0,212,170,0.15)' : 'var(--bg-elevated)',
                        color: selectedSlot === slot ? 'var(--teal)' : 'var(--text-muted)',
                        fontWeight: selectedSlot === slot ? 700 : 400,
                        fontSize: 'var(--text-sm)', transition: 'all 0.15s ease',
                      }}>
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem' }}>Step 3 — Patient Details</h3>
              <div className="form-group">
                <label className="form-label">Patient Name *</label>
                <input className="form-input" placeholder="Full name" value={patientName} onChange={e => setPatientName(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="Mobile number" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Visit</label>
                <textarea className="form-input" rows={2} placeholder="e.g. Follow-up for diabetes, fever since 3 days..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <button className="btn btn-amber btn-lg full-width" onClick={book} disabled={submitting || !selectedSlot || !selectedDate}>
                {submitting ? <><InlineLoader size={18} color="#0a0e1a" /> Booking...</> : '✅ Confirm Appointment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
