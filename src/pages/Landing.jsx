import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Animated counter hook
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start || !target) return;
    const step = target / (duration / 16);
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [start, target, duration]);
  return count;
}

// Intersection observer hook
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// CSS particles
function Particles() {
  const particles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 3 + 1}px`,
    dur: `${Math.random() * 15 + 8}s`,
    delay: `${Math.random() * 10}s`,
    color: i % 3 === 0 ? 'rgba(0,212,170,0.7)' : i % 3 === 1 ? 'rgba(124,58,237,0.5)' : 'rgba(245,158,11,0.5)',
  }));
  return (
    <div className="particles" aria-hidden="true">
      {particles.map(p => (
        <div key={p.id} className="particle" style={{
          left: p.left, width: p.size, height: p.size,
          background: p.color, bottom: '-10px',
          animationDuration: p.dur, animationDelay: p.delay,
        }} />
      ))}
    </div>
  );
}

// Problem card
function ProblemCard({ icon, title, stat, desc, delay = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className="card card-hover" style={{
      animation: inView ? `fadeInUp 0.6s ease ${delay}ms both` : 'none',
      borderTop: '2px solid var(--red)', padding: '2rem',
    }}>
      <div style={{ fontSize: 40, marginBottom: '1rem' }}>{icon}</div>
      <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--red)', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>{stat}</div>
      <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>{title}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// Feature card
function FeatureCard({ icon, title, desc, accent, delay = 0 }) {
  const [ref, inView] = useInView();
  const colors = { teal: 'var(--teal)', amber: 'var(--amber)', purple: '#8b5cf6', green: 'var(--green)' };
  const col = colors[accent] || colors.teal;
  return (
    <div ref={ref} className="card card-hover" style={{
      animation: inView ? `fadeInUp 0.6s ease ${delay}ms both` : 'none',
      borderLeft: `3px solid ${col}`, padding: '1.75rem',
    }}>
      <div style={{ fontSize: 36, marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.65rem', fontSize: 'var(--text-xl)' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// Impact counter
function ImpactCounter({ value, label, suffix = '', prefix = '', accent = 'teal' }) {
  const [ref, inView] = useInView();
  const count = useCounter(value, 2500, inView);
  const colors = { teal: 'var(--teal)', amber: 'var(--amber)', green: 'var(--green)', purple: '#8b5cf6' };
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
        fontFamily: 'var(--font-display)', fontWeight: 900,
        color: colors[accent],
        lineHeight: 1,
        animation: inView ? 'countUp 0.5s ease both' : 'none',
      }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [ref1, inView1] = useInView(0.1);
  const [ref2, inView2] = useInView(0.1);
  const [ref3, inView3] = useInView(0.1);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleRole = (role) => {
    localStorage.setItem('mg_role', role);
    navigate(role === 'phc' ? '/dashboard' : '/asha');
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,212,170,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(124,58,237,0.07) 0%, transparent 60%), var(--bg-primary)',
      }}>
        <Particles />

        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: '10%', right: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,170,0.05) 0%, transparent 70%)',
          filter: 'blur(40px)', animation: 'float 8s ease-in-out infinite',
        }} aria-hidden="true" />
        <div style={{
          position: 'absolute', bottom: '15%', left: '3%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)',
          filter: 'blur(40px)', animation: 'float 10s ease-in-out infinite reverse',
        }} aria-hidden="true" />

        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', paddingTop: '80px', paddingBottom: '80px' }}>

          {/* Eyebrow */}
          <div className="animate-fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 'var(--radius-full)', padding: '0.4rem 1.2rem', marginBottom: '2rem', fontSize: 'var(--text-sm)', color: 'var(--teal)', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, background: 'var(--teal)', borderRadius: '50%', animation: 'pulseGlow 2s ease infinite' }} />
            Powered by Gemini AI • Built for Bharat
          </div>

          {/* Headline */}
          <h1 className="animate-fade-up delay-100" style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.1, marginBottom: '1.5rem', maxWidth: 900, margin: '0 auto 1.5rem' }}>
            Rural Healthcare,{' '}
            <span className="gradient-text">Reimagined</span>
            <br />for Every Village
          </h1>

          {/* Subline */}
          <p className="animate-fade-up delay-200" style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--text-muted)', maxWidth: 680, margin: '0 auto 3rem', lineHeight: 1.7 }}>
            AI-powered tools for ASHA workers and PHC administrators across India.
            Smart patient routing, real-time inventory, multilingual medical AI — built for the last mile.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button className="btn btn-primary btn-xl" onClick={() => handleRole('phc')}
              style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-display)' }}>
              🏥 PHC Admin Portal →
            </button>
            <button className="btn btn-amber btn-xl" onClick={() => handleRole('asha')}
              style={{ fontSize: 'var(--text-base)', fontFamily: 'var(--font-display)' }}>
              👩‍⚕️ ASHA Worker Portal →
            </button>
          </div>

          {/* Floating stat pills */}
          <div className="animate-fade-up delay-400" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '250+ Villages', icon: '🗺️' },
              { label: '45K+ Patients', icon: '👥' },
              { label: 'Gemini AI', icon: '🤖' },
              { label: 'Hindi + 6 Languages', icon: '🌐' },
              { label: 'Works Offline', icon: '📶' },
            ].map((pill, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--glass)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-full)', padding: '0.45rem 1rem',
                fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)',
                backdropFilter: 'blur(8px)',
              }}>
                <span>{pill.icon}</span> {pill.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT ──────────────────────────────────────────── */}
      <section ref={ref1} style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem', animation: inView1 ? 'fadeInUp 0.6s ease both' : 'none' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
              The Crisis We're <span className="gradient-text-amber">Solving</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
              698 million rural Indians face preventable healthcare challenges every day.
            </p>
          </div>
          <div className="grid-3">
            <ProblemCard icon="📄" title="ASHA Workers Use Paper" stat="72%" desc="of ASHA workers still use paper registers. Patient history is lost, follow-ups are missed, and urgent cases go unnoticed." delay={0} />
            <ProblemCard icon="💊" title="Medicine Stockouts" stat="1 in 3" desc="PHCs experience critical medicine shortages every month. No system predicts when Paracetamol or ORS will run out." delay={100} />
            <ProblemCard icon="🗣️" title="Language Barrier" stat="68%" desc="patients speak only their local language. Medical forms are in English. Vital symptoms are lost in translation." delay={200} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section ref={ref2} style={{ padding: '6rem 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem', animation: inView2 ? 'fadeInUp 0.6s ease both' : 'none' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
              How <span className="gradient-text">MediGramin Works</span>
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { n: '01', icon: '📊', title: 'Upload Patient Data', desc: 'ASHA workers log patient vitals and symptoms via voice or text — even offline.' },
              { n: '02', icon: '🤖', title: 'Gemini AI Analyzes', desc: 'AI triages urgency (Red/Amber/Green), clusters patients geographically, predicts medicine needs.' },
              { n: '03', icon: '✅', title: 'Take Informed Action', desc: 'Visit the most urgent patient first. Order medicines before stockout. Generate prescriptions with QR.' },
            ].map((step, i) => (
              <React.Fragment key={i}>
                <div className="card" style={{
                  flex: '1 1 260px', maxWidth: 320, padding: '2rem', textAlign: 'center',
                  animation: inView2 ? `fadeInUp 0.6s ease ${i * 150}ms both` : 'none',
                }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--teal)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '1rem' }}>STEP {step.n}</div>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>{step.icon}</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem' }}>{step.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
                {i < 2 && (
                  <div style={{ fontSize: 28, color: 'var(--text-dim)', flexShrink: 0 }} className="md-hide">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
              Every Feature <span className="gradient-text">Solves a Real Problem</span>
            </h2>
          </div>
          <div className="grid-4">
            <FeatureCard icon="🗺️" title="Smart Patient Routing" accent="teal" desc="ML clustering sorts patients by urgency and geography. ASHA worker visits most critical patients first." delay={0} />
            <FeatureCard icon="💊" title="Inventory + Predictions" accent="amber" desc="30-day ML forecast prevents stockouts before they happen. Low stock alerts, expiry tracking, reorder with one click." delay={100} />
            <FeatureCard icon="🚨" title="AI Triage" accent="red" desc="Gemini AI classifies patients as Red (immediate)/Amber (24h)/Green (routine) based on symptoms and vitals." delay={200} />
            <FeatureCard icon="🌐" title="Hindi + 6 Languages" accent="purple" desc="Medical chatbot answers in Hindi, Tamil, Telugu, Bengali, Marathi, Kannada. Voice input and output included." delay={300} />
            <FeatureCard icon="📋" title="E-Prescriptions" accent="green" desc="Digital prescriptions with QR codes. Pharmacist scans to verify. No more handwriting errors." delay={0} />
            <FeatureCard icon="📶" title="Works Offline" accent="teal" desc="Visit records save locally when offline. Automatic background sync when connection restores." delay={100} />
            <FeatureCard icon="📈" title="Analytics Dashboard" accent="amber" desc="PHC admin sees stock trends, patient cluster burden, expiry heatmap, and weekly operational reports." delay={200} />
            <FeatureCard icon="📅" title="Appointments" accent="purple" desc="Book doctor slots for referred patients. Reduce wait times at PHC. QR confirmation." delay={300} />
          </div>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ────────────────────────────────────────────────── */}
      <section ref={ref3} style={{ padding: '6rem 0', background: 'linear-gradient(135deg, rgba(0,212,170,0.05) 0%, rgba(124,58,237,0.05) 100%)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem', animation: inView3 ? 'fadeInUp 0.6s ease both' : 'none' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', marginBottom: '1rem' }}>
              Built for <span className="gradient-text">Real Impact</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '3rem', maxWidth: 900, margin: '0 auto' }}>
            <ImpactCounter value={250} suffix="+" label="Villages Covered" accent="teal" />
            <ImpactCounter value={45000} suffix="+" label="Patients Tracked" accent="amber" />
            <ImpactCounter value={800} suffix="+" label="ASHA Workers" accent="green" />
            <ImpactCounter value={98} suffix="%" label="Satisfaction Rate" accent="purple" />
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', background: 'var(--bg-secondary)' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.5rem)' }}>
              Voices from the <span className="gradient-text">Field</span>
            </h2>
          </div>
          <div className="card" style={{ padding: '2.5rem', minHeight: 180, position: 'relative' }}>
            {testimonials.map((t, i) => (
              <div key={i} style={{ display: i === activeTestimonial ? 'block' : 'none', animation: 'fadeIn 0.5s ease' }}>
                <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', lineHeight: 1.8, marginBottom: '1.5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{t.quote}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{t.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
            {/* Dots */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} style={{
                  width: i === activeTestimonial ? 24 : 8, height: 8, borderRadius: 4,
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s ease',
                  background: i === activeTestimonial ? 'var(--teal)' : 'var(--text-dim)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '6rem 0', textAlign: 'center', background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,170,0.06) 0%, transparent 70%)' }}>
        <div className="container">
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.5rem)', marginBottom: '1.5rem' }}>
            Start Managing Healthcare{' '}
            <span className="gradient-text">Today</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-lg)', marginBottom: '3rem', maxWidth: 600, margin: '0 auto 3rem' }}>
            Free, open-source, built for rural India. No cloud subscription required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-xl" onClick={() => handleRole('phc')}>🏥 Enter PHC Dashboard</button>
            <button className="btn btn-amber btn-xl" onClick={() => handleRole('asha')}>👩‍⚕️ Enter ASHA Portal</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', padding: '2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: 'var(--text-sm)' }}>
          © 2025 MediGramin — Built with ❤️ for Rural India • Gemini AI • Open Source
        </p>
      </footer>
    </div>
  );
}

const testimonials = [
  {
    icon: '👩',
    quote: 'Pehle kagaz pe likhti thi, bahut time lagta tha. Ab app se seedha priority pata chal jaata hai — kaun patient pehle jaana hai. Mera kaam aadha ho gaya.',
    name: 'Sunita Devi',
    role: 'ASHA Worker, Jharkhand • Serving 42 households',
  },
  {
    icon: '👨‍⚕️',
    quote: 'We had three medicine stockouts last year. Since using MediGramin inventory predictions, we haven\'t had a single stockout. The 30-day forecast is remarkably accurate.',
    name: 'Dr. Rajesh Mehta',
    role: 'PHC Medical Officer, Bihar',
  },
  {
    icon: '👴',
    quote: 'Meri bahu ne chatbot se diabetes ke baare mein Hindi mein poocha — seedha jawaab mila. Hume PHC jaane ki zaroorat nahi padi us baar.',
    name: 'Govind Prasad',
    role: 'Patient, Chhattisgarh',
  },
];
