import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getElections, adminCreateElection, adminAddCandidate, adminStartElection, adminEndElection, getCandidatesByElection } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('elections');
  const [elections, setElections] = useState([]);
  const [allCandidates, setAllCandidates] = useState({});
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [electionForm, setElectionForm] = useState({ title: '', description: '' });
  const [candidateForm, setCandidateForm] = useState({ name: '', party: '', electionId: '' });

  useEffect(() => { if (user && user.role !== 'ADMIN') navigate('/'); }, [user, navigate]);

  const fetchAll = () => {
    getElections().then(res => {
      const list = res.data || [];
      setElections(list);
      list.forEach(e => getCandidatesByElection(e.id).then(r => setAllCandidates(p => ({ ...p, [e.id]: r.data || [] }))).catch(() => {}));
    }).catch(() => {});
  };
  useEffect(() => { fetchAll(); }, []);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 4000); };

  const handleCreateElection = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await adminCreateElection(electionForm); showMsg('success', 'Election created successfully.'); setElectionForm({ title: '', description: '' }); fetchAll(); }
    catch (err) { showMsg('error', typeof err.response?.data === 'string' ? err.response.data : 'Failed to create election.'); }
    finally { setLoading(false); }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candidateForm.electionId) { showMsg('error', 'Please select an election.'); return; }
    setLoading(true);
    try { await adminAddCandidate(Number(candidateForm.electionId), { name: candidateForm.name, party: candidateForm.party }); showMsg('success', `Candidate "${candidateForm.name}" added successfully.`); setCandidateForm({ name: '', party: '', electionId: '' }); fetchAll(); }
    catch (err) { showMsg('error', typeof err.response?.data === 'string' ? err.response.data : 'Failed to add candidate.'); }
    finally { setLoading(false); }
  };

  const handleStart = async (id) => {
    try { await adminStartElection(id); showMsg('success', 'Election started. Voting is now open.'); fetchAll(); }
    catch (err) { showMsg('error', typeof err.response?.data === 'string' ? err.response.data : 'Cannot start election.'); }
  };

  const handleEnd = async (id, title) => {
    if (!window.confirm(`Close election "${title}"? This will end voting and officially release results.`)) return;
    try { await adminEndElection(id); showMsg('success', 'Election closed. Results have been officially released.'); fetchAll(); }
    catch (err) { showMsg('error', typeof err.response?.data === 'string' ? err.response.data : 'Cannot close election.'); }
  };

  const statusBadge = s => ({
    UPCOMING: <span className="badge badge-upcoming">Upcoming</span>,
    ACTIVE: <span className="badge badge-active"><span className="live-dot"></span>Active</span>,
    CLOSED: <span className="badge badge-closed">Closed</span>,
  }[s]);

  const upcoming = elections.filter(e => e.electionStatus === 'UPCOMING');
  const active = elections.filter(e => e.electionStatus === 'ACTIVE');
  const closed = elections.filter(e => e.electionStatus === 'CLOSED');

  return (
    <div>
      <div className="page-banner">
        <div className="container">
          <h2>Election Administration Panel</h2>
          <p>Manage elections, add candidates, control election lifecycle and result announcement.</p>
        </div>
      </div>
      <div className="container" style={{ marginTop: '24px' }}>
        <div className="notice mb-3">
          <h4>Admin Access</h4>
          <p>Welcome, <strong>{user?.name}</strong>. Workflow: Create election &rarr; Add candidates &rarr; Start voting &rarr; End to announce results.</p>
        </div>
        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <div className="stat-grid mb-3">
          <div className="stat-box navy"><div className="stat-label">Total Elections</div><div className="stat-value">{elections.length}</div></div>
          <div className="stat-box"><div className="stat-label">Active Now</div><div className="stat-value">{active.length}</div></div>
          <div className="stat-box green"><div className="stat-label">Completed</div><div className="stat-value">{closed.length}</div></div>
          <div className="stat-box gold"><div className="stat-label">Upcoming</div><div className="stat-value">{upcoming.length}</div></div>
        </div>

        <div className="tab-bar">
          {[{key:'elections',label:'Manage Elections'},{key:'candidates',label:'Add Candidates'},{key:'create',label:'Create Election'}].map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>

        {tab === 'elections' && (
          <div>
            {active.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#138808', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="live-dot"></span> Active Elections
                </h3>
                {active.map(e => (
                  <div className="card mb-2" key={e.id} style={{ borderLeft: '4px solid #138808' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', color: '#002060', marginBottom: '4px', fontFamily: "'Noto Serif',serif" }}>{e.title}</h4>
                          <p style={{ fontSize: '12px', color: '#6B5C40', marginBottom: '6px' }}>{e.description}</p>
                          <p style={{ fontSize: '12px', color: '#138808' }}>Started: {e.startTime ? new Date(e.startTime).toLocaleString('en-IN') : '—'} &nbsp;|&nbsp; Candidates: {(allCandidates[e.id] || []).length}</p>
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(allCandidates[e.id] || []).map(c => (<span key={c.id} style={{ background: '#E6EFF8', color: '#003580', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>{c.name} &mdash; {c.party}</span>))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          {statusBadge(e.electionStatus)}
                          <button className="btn btn-danger btn-sm" onClick={() => handleEnd(e.id, e.title)}>End &amp; Release Results</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {upcoming.length > 0 && (
              <div className="mb-3">
                <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#003580' }}>Upcoming Elections</h3>
                {upcoming.map(e => (
                  <div className="card mb-2" key={e.id} style={{ borderLeft: '4px solid #003580' }}>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h4 style={{ fontSize: '16px', color: '#002060', marginBottom: '4px', fontFamily: "'Noto Serif',serif" }}>{e.title}</h4>
                          <p style={{ fontSize: '12px', color: '#6B5C40' }}>{e.description}</p>
                          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(allCandidates[e.id] || []).length === 0
                              ? <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600' }}>No candidates added yet — minimum 2 required</span>
                              : (allCandidates[e.id] || []).map(c => (<span key={c.id} style={{ background: '#E6EFF8', color: '#003580', padding: '2px 8px', borderRadius: '3px', fontSize: '11px', fontWeight: '600' }}>{c.name} &mdash; {c.party}</span>))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                          {statusBadge(e.electionStatus)}
                          {(allCandidates[e.id] || []).length >= 2
                            ? <button className="btn btn-success btn-sm" onClick={() => handleStart(e.id)}>Start Voting</button>
                            : <span style={{ fontSize: '11px', color: '#C0392B', fontWeight: '600' }}>Need 2+ candidates</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {closed.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', marginBottom: '12px', color: '#5A4A30' }}>Completed Elections</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="gov-table">
                    <thead><tr><th>Title</th><th>Started</th><th>Closed</th><th>Candidates</th><th>Status</th></tr></thead>
                    <tbody>
                      {closed.map(e => (
                        <tr key={e.id}>
                          <td><strong>{e.title}</strong></td>
                          <td style={{ fontSize: '12px' }}>{e.startTime ? new Date(e.startTime).toLocaleDateString('en-IN') : '—'}</td>
                          <td style={{ fontSize: '12px' }}>{e.endTime ? new Date(e.endTime).toLocaleDateString('en-IN') : '—'}</td>
                          <td>{(allCandidates[e.id] || []).length}</td>
                          <td>{statusBadge(e.electionStatus)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {elections.length === 0 && <div className="card"><div className="card-body text-center" style={{ padding: '36px' }}><p>No elections yet. Create one from the &ldquo;Create Election&rdquo; tab.</p></div></div>}
          </div>
        )}

        {tab === 'candidates' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-header"><h3>Add New Candidate</h3></div>
              <div className="card-body">
                <div className="notice mb-2"><h4>Note</h4><p>Candidates can only be added to elections with UPCOMING status. Add at least 2 candidates before starting.</p></div>
                <form onSubmit={handleAddCandidate}>
                  <div className="form-group">
                    <label>Select Election <span className="req">*</span></label>
                    <select className="form-control" value={candidateForm.electionId} onChange={e => setCandidateForm({...candidateForm,electionId:e.target.value})} required>
                      <option value="">-- Select Election --</option>
                      {elections.filter(e => e.electionStatus === 'UPCOMING').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Candidate Full Name <span className="req">*</span></label>
                    <input className="form-control" placeholder="Enter candidate name" value={candidateForm.name} onChange={e => setCandidateForm({...candidateForm,name:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Political Party <span className="req">*</span></label>
                    <input className="form-control" placeholder="Enter party name" value={candidateForm.party} onChange={e => setCandidateForm({...candidateForm,party:e.target.value})} required />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <><span className="spinner"></span>&nbsp; Adding...</> : 'Add Candidate'}
                  </button>
                </form>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>All Candidates</h3></div>
              <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                {elections.filter(e => (allCandidates[e.id] || []).length > 0).map(e => (
                  <div key={e.id} style={{ padding: '14px 20px', borderBottom: '1px solid #E8E0D0' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#003580', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '7px', display: 'flex', alignItems: 'center', gap: '7px' }}>{e.title} {statusBadge(e.electionStatus)}</div>
                    {(allCandidates[e.id] || []).map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #F0ECE0' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#003580,#0047A8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{c.name.charAt(0)}</div>
                        <div><div style={{ fontSize: '13px', fontWeight: '600', color: '#1A1208' }}>{c.name}</div><div style={{ fontSize: '11px', color: '#6B5C40' }}>{c.party}</div></div>
                      </div>
                    ))}
                  </div>
                ))}
                {Object.values(allCandidates).every(l => l.length === 0) && <p style={{ color: '#6B5C40', fontSize: '13px', padding: '20px' }}>No candidates added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {tab === 'create' && (
          <div style={{ maxWidth: '520px' }}>
            <div className="card">
              <div className="card-header"><h3>Create New Election</h3></div>
              <div className="card-body">
                <div className="notice mb-2"><h4>Workflow</h4><p>1. Create election (UPCOMING)<br />2. Add candidates<br />3. Start voting when ready<br />4. End election to officially announce results</p></div>
                <form onSubmit={handleCreateElection}>
                  <div className="form-group">
                    <label>Election Title <span className="req">*</span></label>
                    <input className="form-control" placeholder="e.g. Telangana State Election 2024" value={electionForm.title} onChange={e => setElectionForm({...electionForm,title:e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea className="form-control" rows="3" placeholder="Brief description of the election..." value={electionForm.description} onChange={e => setElectionForm({...electionForm,description:e.target.value})} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <><span className="spinner"></span>&nbsp; Creating...</> : 'Create Election'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
