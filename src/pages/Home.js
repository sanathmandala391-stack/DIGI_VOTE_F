import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getElections } from '../services/api';

const images = [
  { src: '/voting1.jpg', caption: 'Every vote counts — exercise your democratic right today' },
  { src: '/voting2.jpg', caption: 'Democracy is the foundation of our great nation' },
  { src: '/voting3.jpg', caption: 'Your vote is your voice — make it count' },
];

const Slideshow = () => {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setCurrent(p => (p + 1) % images.length); setFade(true); }, 500);
    }, 4000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <img src={images[current].src} alt={images[current].caption}
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: fade ? 1 : 0, transition: 'opacity 0.6s ease-in-out', display: 'block' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(0,32,96,.5) 0%,rgba(0,32,96,.72) 100%)' }} />
      <div style={{ position: 'absolute', bottom: '18px', left: 0, right: 0, textAlign: 'center', opacity: fade ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
        <span style={{ background: 'rgba(0,0,0,.45)', color: 'rgba(255,255,255,.82)', padding: '5px 16px', borderRadius: '20px', fontSize: '12px', letterSpacing: '0.3px', fontStyle: 'italic' }}>
          {images[current].caption}
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: '50px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px' }}>
        {images.map((_, i) => (
          <button key={i} onClick={() => { setFade(false); setTimeout(() => { setCurrent(i); setFade(true); }, 400); }}
            style={{ width: i === current ? '22px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: i === current ? '#FFD700' : 'rgba(255,255,255,.45)', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { user } = useAuth();
  const [activeCount, setActiveCount] = useState(0);
  const [totalElections, setTotalElections] = useState(0);
  useEffect(() => {
    getElections().then(res => {
      const all = res.data || [];
      setTotalElections(all.length);
      setActiveCount(all.filter(e => e.electionStatus === 'ACTIVE').length);
    }).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero with Slideshow */}
      <div style={{ position: 'relative', height: '490px', overflow: 'hidden' }}>
        <Slideshow />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px', zIndex: 2 }}>
          {activeCount > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(19,136,8,.85)', border: '1px solid rgba(255,255,255,.3)', borderRadius: '3px', padding: '5px 16px', fontSize: '12px', color: '#fff', marginBottom: '16px', fontWeight: '700', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              <span className="live-dot"></span>
              {activeCount} Election{activeCount > 1 ? 's' : ''} Active — Voting Open
            </div>
          )}
          <div style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)', marginBottom: '10px' }}>
            Empowering Democracy Through Technology
          </div>
          <h1 style={{ fontFamily: "'Noto Serif',serif", fontSize: '36px', color: '#fff', marginBottom: '14px', lineHeight: '1.25', textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>
            Digital Face Recognition<br />Voting System
          </h1>
          <p style={{ color: 'rgba(255,255,255,.82)', fontSize: '15px', maxWidth: '520px', margin: '0 auto 28px', lineHeight: '1.7', textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
            A secure, transparent and efficient platform powered by biometric facial recognition.
            One voter, one vote — guaranteed by liveness detection.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {!user ? (
              <>
                <Link to="/register" className="btn btn-saffron btn-lg">Register as Voter</Link>
                <Link to="/login" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>Login to Vote</Link>
              </>
            ) : (
              <>
                <Link to="/vote" className="btn btn-saffron btn-lg">Cast Your Vote</Link>
                <Link to="/results" className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>View Results</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: 'linear-gradient(90deg,#001848,#002060,#001848)', padding: '14px 22px', borderBottom: '3px solid #C8941A' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Elections', value: totalElections },
            { label: 'Active Now', value: activeCount },
            { label: 'Face Verified', value: '100%' },
            { label: 'Liveness Auth', value: 'ACTIVE' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontFamily: "'Noto Serif',serif", fontWeight: '700', fontSize: '20px', color: '#FFD700' }}>{s.value}</div>
              <div style={{ fontSize: '10px', opacity: .6, textTransform: 'uppercase', letterSpacing: '1.2px', marginTop: '3px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        {/* Notice */}
        <div className="notice mt-3 mb-3">
          <h4>Important Notice</h4>
          <p>This is a pilot project of the Election Commission of India. Face registration with liveness detection (blink verification) is mandatory during account creation. For assistance, contact: <strong>helpdesk@eci.gov.in</strong> or call <strong>1800-111-950</strong> (Toll Free).</p>
        </div>

        {/* How it works */}
        <div className="card mb-3">
          <div className="card-header"><h3>How Digital Face Voting Works</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: '16px' }}>
              {[
                { n: '01', t: 'Register Account', d: 'Create your voter account with full name and valid email address.' },
                { n: '02', t: 'Blink Verification', d: 'Blink to prove liveness, then capture your unique face — mandatory step.' },
                { n: '03', t: 'Face Verification', d: 'Blink and face match required before each vote is cast — no spoofing.' },
                { n: '04', t: 'Cast Vote', d: 'Select your preferred candidate after identity is confirmed.' },
                { n: '05', t: 'Vote Recorded', d: 'Your vote is encrypted and stored. Duplicate voting is prevented.' },
                { n: '06', t: 'Result Declaration', d: 'Admin officially closes election and results are published.' },
              ].map(s => (
                <div key={s.n} style={{ padding: '16px', background: '#F9F6F0', border: '1px solid #D4C9A8', borderRadius: '6px', borderTop: '3px solid #FF6200' }}>
                  <div style={{ fontSize: '9px', color: '#FF6200', fontWeight: '800', letterSpacing: '1.5px', marginBottom: '8px' }}>STEP {s.n}</div>
                  <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#002060', fontFamily: "'Noto Serif',serif", marginBottom: '6px' }}>{s.t}</div>
                  <p style={{ fontSize: '12px', color: '#6B5C40', lineHeight: '1.55' }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security features */}
        <div className="card mb-3">
          <div className="card-header"><h3>Security and Integrity Features</h3></div>
          <div className="card-body">
            <div className="grid-2">
              <div>
                <h4 style={{ marginBottom: '13px', fontSize: '14px', color: '#003580', borderBottom: '2px solid #E0D8C8', paddingBottom: '7px' }}>Anti-Fraud Security</h4>
                {[
                  'Blink detection — proves real person, not a photograph',
                  'face-api.js neural network face recognition',
                  'Unique face enforcement — no duplicate registrations',
                  'JWT token-based secure sessions',
                  'One voter, one vote — enforced at database level',
                  'All votes encrypted at rest',
                ].map(f => (
                  <div key={f} style={{ padding: '7px 0 7px 12px', borderBottom: '1px solid #E8E0D0', fontSize: '13px', color: '#3D3020', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#138808', fontWeight: '700' }}>+</span>{f}
                  </div>
                ))}
              </div>
              <div>
                <h4 style={{ marginBottom: '13px', fontSize: '14px', color: '#003580', borderBottom: '2px solid #E0D8C8', paddingBottom: '7px' }}>Administrative Controls</h4>
                {[
                  'Create and manage elections with full details',
                  'Add and approve candidates per election',
                  'Start voting at the designated time',
                  'Seal results — only admin can release officially',
                  'Confidential live vote count (admin-only)',
                  'Official result announcement with winner record',
                ].map(f => (
                  <div key={f} style={{ padding: '7px 0 7px 12px', borderBottom: '1px solid #E8E0D0', fontSize: '13px', color: '#3D3020', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: '#003580', fontWeight: '700' }}>+</span>{f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ECI Info bar */}
        <div style={{ background: 'linear-gradient(135deg,#002060,#003580)', borderRadius: '8px', padding: '22px 28px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap', border: '1px solid #C8941A' }}>
          <img src="/eci-logo.png" alt="ECI" style={{ height: '56px', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#FFD700', fontFamily: "'Noto Serif',serif", fontWeight: '700', fontSize: '17px', marginBottom: '5px' }}>Election Commission of India</div>
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: '13px', lineHeight: '1.65' }}>
              The Election Commission of India is an autonomous constitutional authority responsible for
              administering Union and State election processes in India. The body administers elections to the
              Lok Sabha, Rajya Sabha, State Legislative Assemblies and the offices of the President and Vice-President.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
