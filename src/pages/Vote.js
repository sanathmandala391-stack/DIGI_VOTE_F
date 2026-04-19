import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getElections, getCandidatesByElection, castVote, loginWithFaceDescriptor, getProfile, getResults } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceCamera from '../components/FaceCamera';

const Vote = () => {
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [elections, setElections] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [liveCounts, setLiveCounts] = useState({});
  const [selectedElection, setSelectedElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [faceVerified, setFaceVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    getElections().then(res => setElections((res.data || []).filter(e => e.electionStatus === 'ACTIVE'))).catch(() => setError('Failed to load elections.'));
  }, []);

  useEffect(() => {
    if (selectedElection) {
      getCandidatesByElection(selectedElection.id).then(res => setCandidates(res.data || [])).catch(() => setError('Failed to load candidates.'));
    }
  }, [selectedElection]);

  useEffect(() => {
    if (!selectedElection || step < 3) return;
    const fetch = () => getResults(selectedElection.id).then(res => { setLiveCounts(res.data || {}); setTotalVotes(Object.values(res.data || {}).reduce((a, b) => a + Number(b), 0)); }).catch(() => {});
    fetch();
    const t = setInterval(fetch, 5000);
    return () => clearInterval(t);
  }, [selectedElection, step]);

  const handleFaceVerified = async (payload) => {
    setError('');
    try {
      const res = await loginWithFaceDescriptor(payload);
      localStorage.setItem('token', res.data.token);
      const profileRes = await getProfile();
      loginUser(res.data.token, profileRes.data);
      setFaceVerified(true);
      setStep(3);
    } catch { setError('Face not recognised. Ensure your face is registered in your profile.'); }
  };

  const handleCastVote = async () => {
    if (!selectedElection || !selectedCandidate) return;
    setLoading(true); setError('');
    try { await castVote(selectedElection.id, selectedCandidate.id); setStep(5); }
    catch (err) { setError(err.response?.data || 'Failed to cast vote.'); }
    finally { setLoading(false); }
  };

  if (step === 5) return (
    <div className="container" style={{ maxWidth: '520px', margin: '36px auto' }}>
      <div className="card">
        <div className="card-body vote-success">
          <div className="checkmark">&#10003;</div>
          <h2 style={{ color: '#138808', marginBottom: '8px', fontFamily: "'Noto Serif',serif" }}>Vote Cast Successfully</h2>
          <p style={{ color: '#3D3020', marginBottom: '5px' }}>Your vote for <strong>{selectedCandidate?.name}</strong> ({selectedCandidate?.party}) has been recorded.</p>
          <p style={{ color: '#6B5C40', fontSize: '12px', marginBottom: '20px' }}>
            Election: {selectedElection?.title}<br />
            Voter ID: ECI-{String(user?.id || '').padStart(6, '0')}<br />
            Timestamp: {new Date().toLocaleString('en-IN')}
          </p>
          <div style={{ background: '#F0FBF0', border: '1px solid #138808', borderRadius: '5px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: '#0A4D06' }}>
            Your vote is encrypted and stored securely. Thank you for participating in the democratic process.
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/results')}>View Results</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Return to Home</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-banner">
        <div className="container">
          <h2>Cast Your Vote</h2>
          <p>Biometric face verification is required before voting. Your identity is confirmed securely.</p>
        </div>
      </div>
      <div className="container" style={{ maxWidth: '700px', margin: '24px auto', padding: '0 20px' }}>
        <div className="step-bar">
          {[{n:1,lbl:'Select Election'},{n:2,lbl:'Face Verify'},{n:3,lbl:'Choose Candidate'},{n:4,lbl:'Confirm'}].map(s => (
            <div key={s.n} className={`step-item ${step===s.n?'active':step>s.n?'done':'pending'}`}>
              <span className="step-num">{step > s.n ? '&#10003;' : s.n}</span>
              <span className="step-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {step === 1 && (
          <div className="card">
            <div className="card-header"><h3>Step 1 — Select Active Election</h3></div>
            <div className="card-body">
              {elections.length === 0
                ? <div className="text-center" style={{ padding: '28px' }}><p>No active elections at the moment.</p></div>
                : elections.map(e => (
                  <div key={e.id} className={`cand-card ${selectedElection?.id===e.id?'selected':''}`} onClick={() => setSelectedElection(e)}>
                    <div style={{ width:'44px',height:'44px',borderRadius:'6px',background:'linear-gradient(135deg,#003580,#0047A8)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:'12px',fontWeight:'700',flexShrink:0,letterSpacing:'.5px' }}>VOTE</div>
                    <div><div className="cand-name">{e.title}</div><div className="cand-party">{e.description}</div></div>
                    {selectedElection?.id===e.id && <span style={{ marginLeft:'auto',color:'#138808',fontWeight:'900',fontSize:'18px' }}>&#10003;</span>}
                  </div>
                ))
              }
              <button className="btn btn-primary btn-full mt-2" disabled={!selectedElection} onClick={() => setStep(2)}>Continue to Verification</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <div className="card-header"><h3>Step 2 — Biometric Identity Verification</h3></div>
            <div className="card-body">
              <div className="notice">
                <h4>Identity Verification Required</h4>
                <p>Your face must match your registered biometric data before you may vote. Look into the camera and blink once to confirm liveness.</p>
              </div>
              <FaceCamera autoCapture={true} onDescriptor={handleFaceVerified} onError={msg => setError(msg)} buttonLabel="Verify and Continue" />
              <div style={{ marginTop: '10px' }}>
                <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid-2" style={{ alignItems: 'start' }}>
            <div className="card">
              <div className="card-header"><h3>Step 3 — Select Candidate</h3></div>
              <div className="card-body">
                <p style={{ fontSize: '12px', color: '#6B5C40', marginBottom: '14px' }}>
                  Identity verified &mdash; Election: <strong>{selectedElection?.title}</strong>
                </p>
                {candidates.length === 0
                  ? <p style={{ color: '#6B5C40' }}>No candidates found.</p>
                  : candidates.map(c => (
                    <div key={c.id} className={`cand-card ${selectedCandidate?.id===c.id?'selected':''}`} onClick={() => setSelectedCandidate(c)}>
                      <div className="cand-avatar">{c.name?.charAt(0)}</div>
                      <div><div className="cand-name">{c.name}</div><div className="cand-party">{c.party}</div></div>
                      {selectedCandidate?.id===c.id && <span style={{ marginLeft:'auto',color:'#138808',fontWeight:'900',fontSize:'18px' }}>&#10003;</span>}
                    </div>
                  ))
                }
                <button className="btn btn-primary btn-full mt-2" disabled={!selectedCandidate} onClick={() => setStep(4)}>Review and Confirm</button>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3><span className="live-dot"></span> Live Vote Count</h3></div>
              <div className="card-body">
                <p style={{ fontSize: '11px', color: '#6B5C40', marginBottom: '12px' }}>Updates every 5 seconds &mdash; Total: <strong>{totalVotes}</strong> votes cast</p>
                {Object.keys(liveCounts).length === 0
                  ? <p style={{ color: '#6B5C40', fontSize: '13px' }}>No votes recorded yet.</p>
                  : Object.entries(liveCounts).sort((a,b)=>Number(b[1])-Number(a[1])).map(([name,count]) => {
                      const pct = totalVotes > 0 ? Math.round((Number(count)/totalVotes)*100) : 0;
                      return (
                        <div className="result-item" key={name}>
                          <div className="result-row"><span className="result-name">{name}</span><span className="result-pct">{count} ({pct}%)</span></div>
                          <div className="result-bar"><div className="result-fill" style={{ width:`${pct}%` }} /></div>
                        </div>
                      );
                    })
                }
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card">
            <div className="card-header"><h3>Step 4 — Confirm Your Vote</h3></div>
            <div className="card-body">
              <div className="alert alert-warning">Once submitted, your vote cannot be changed or withdrawn.</div>
              <div style={{ background: '#F9F6F0', border: '1px solid #D4C9A8', borderRadius: '6px', padding: '18px', marginBottom: '18px' }}>
                <h4 style={{ marginBottom: '12px', color: '#002060', borderBottom: '1px solid #D4C9A8', paddingBottom: '8px', fontSize: '15px' }}>Vote Summary</h4>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    {[['Voter ID',`ECI-${String(user?.id||'').padStart(6,'0')}`],['Name',user?.name||user?.email],['Election',selectedElection?.title],['Candidate',selectedCandidate?.name],['Party',selectedCandidate?.party],['Face Verified',faceVerified?'Yes — Biometric Confirmed':'No']].map(([l,v])=>(
                      <tr key={l}><td style={{ padding:'6px 0',color:'#6B5C40',fontWeight:'700',width:'130px' }}>{l}</td><td style={{ padding:'6px 0',color:'#1A1208' }}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display:'flex',gap:'10px' }}>
                <button className="btn btn-outline" onClick={() => setStep(3)}>Change Selection</button>
                <button className="btn btn-success" style={{ flex:1 }} onClick={handleCastVote} disabled={loading}>
                  {loading ? <><span className="spinner"></span>&nbsp; Submitting...</> : 'Submit My Vote'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Vote;
