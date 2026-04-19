import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getElections, getResults } from '../services/api';

// Winner announcement marquee — appears only when admin closes an election
const WinnerMarquee = () => {
  const [text, setText] = useState('');
  const [visible, setVisible] = useState(false);

  const build = async () => {
    try {
      const res = await getElections();
      const closed = (res.data || []).filter(e => e.electionStatus === 'CLOSED');
      if (!closed.length) { setVisible(false); return; }
      const parts = [];
      for (const el of closed) {
        try {
          const rRes = await getResults(el.id);
          const data = rRes.data || {};
          const total = Object.values(data).reduce((a, b) => a + Number(b), 0);
          if (!total) continue;
          const [name, votes] = Object.entries(data).reduce((a, b) => Number(b[1]) > Number(a[1]) ? b : a, ['', 0]);
          if (!name) continue;
          const pct = Math.round((Number(votes) / total) * 100);
          const dt = el.endTime ? new Date(el.endTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
          parts.push(`RESULT DECLARED  |  ${el.title.toUpperCase()}  |  WINNER : ${name.toUpperCase()}  |  VOTES SECURED : ${votes} of ${total} (${pct}%)  |  Declared on ${dt}  |  Congratulations to the Elected Representative  |  Satyameva Jayate`);
        } catch {}
      }
      if (!parts.length) { setVisible(false); return; }
      const joined = parts.join('          *          ');
      setText(joined + '          *          ' + joined);
      setVisible(true);
    } catch { setVisible(false); }
  };

  useEffect(() => { build(); const t = setInterval(build, 60000); return () => clearInterval(t); }, []);
  if (!visible) return null;

  return (
    <div style={{ background: 'linear-gradient(90deg,#0A5C04,#138808,#0A5C04)', borderBottom: '3px solid #C8941A', overflow: 'hidden', height: '34px', display: 'flex', alignItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, zIndex: 2, background: '#C8941A', padding: '0 14px', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', boxShadow: '4px 0 8px rgba(0,0,0,.3)' }}>
        <span style={{ fontSize: '10px', fontWeight: '800', color: '#002060', letterSpacing: '1.5px', textTransform: 'uppercase' }}>ECI  RESULT</span>
      </div>
      <div style={{ paddingLeft: '120px', overflow: 'hidden', width: '100%' }}>
        <div style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: "'Noto Serif',serif", fontWeight: '700', fontSize: '12.5px', color: '#FFD700', letterSpacing: '0.4px', animation: 'marqueeScroll 55s linear infinite' }}>
          {text}
        </div>
      </div>
      <style>{`@keyframes marqueeScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  );
};

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const upd = () => setDateTime(new Date().toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }));
    upd();
    const t = setInterval(upd, 1000);
    return () => clearInterval(t);
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const act = (p) => location.pathname === p ? 'active' : '';

  return (
    <div className="app">
      <div className="tricolor" />

      <header className="site-header">
        <div className="header-inner">
          <div className="logo-area">
            {/* Official ECI Logo */}
            <div className="emblem-wrap">
              <img src="/eci-logo.png" alt="Election Commission of India" className="eci-logo" />
            </div>
            <div className="header-divider" />
            <div className="header-text">
              <div className="ministry">Government of India &nbsp;&bull;&nbsp; Ministry of Law and Justice</div>
              <h1>Election Commission of India</h1>
              <div className="sub">Digital Face Recognition Voting System (DFRVS) &mdash; Pilot Programme</div>
            </div>
          </div>
          <div className="header-right">
            <div className="dt">{dateTime}</div>
            {user && (
              <div style={{ marginTop: '6px', fontSize: '12px', color: 'rgba(255,255,255,.75)' }}>
                Welcome, <strong style={{ color: '#FFD700' }}>{user.name || user.email}</strong>
                {isAdmin && <span style={{ marginLeft: '7px', background: '#FF6200', padding: '2px 8px', borderRadius: '3px', fontSize: '10px', fontWeight: '800', letterSpacing: '.5px' }}>ADMIN</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="site-nav">
        <div className="nav-inner">
          <ul>
            <li><Link to="/" className={act('/')}>Home</Link></li>
            <li><Link to="/elections" className={act('/elections')}>Elections</Link></li>
            {user && !isAdmin && <li><Link to="/vote" className={act('/vote')}>Cast Vote</Link></li>}
            {user && <li><Link to="/results" className={act('/results')}>Results</Link></li>}
            {user && !isAdmin && <li><Link to="/profile" className={act('/profile')}>My Profile</Link></li>}
            {isAdmin && <li><Link to="/admin" className={act('/admin')}>Admin Panel</Link></li>}
            {!user && <li><Link to="/register" className={act('/register')}>Register</Link></li>}
            {!user && <li><Link to="/login" className={act('/login')}>Login</Link></li>}
            {user && <li><button onClick={() => { logoutUser(); navigate('/login'); }}>Logout</button></li>}
          </ul>
          {user && (
            <div className="nav-voter">
              Voter ID: ECI-{String(user.id || '').padStart(6, '0')}
            </div>
          )}
        </div>
      </nav>

      <WinnerMarquee />

      <main className="main">{children}</main>

      <footer className="site-footer">
        <div className="footer-logos">
          <img src="/eci-logo.png" alt="ECI" style={{ height: '40px', opacity: .7 }} />
        </div>
        <div className="footer-text">
          <strong>Election Commission of India</strong> &mdash; Digital Face Recognition Voting System (Pilot)<br />
          Nirvachan Sadan, Ashoka Road, New Delhi &mdash; 110001 &nbsp;|&nbsp; Tel: 1800-111-950 (Toll Free)
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,.45)' }}>
          &copy; {new Date().getFullYear()} Election Commission of India. All rights reserved. &nbsp;|&nbsp;
          <a href="#!">Privacy Policy</a> &nbsp;|&nbsp;
          <a href="#!">Terms of Use</a> &nbsp;|&nbsp;
          <a href="#!">Accessibility Statement</a> &nbsp;|&nbsp;
          <a href="#!">Help &amp; Support</a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
