import React, { useState, useEffect, useCallback } from 'react';
import { getElections, getResults } from '../services/api';
import { useAuth } from '../context/AuthContext';

// RESULTS PAGE 
// VOTERS: Only see results after admin closes an election.
// Until then they see: "Results Will Be Declared Soon" card.
// ADMIN: Sees live count for active elections (confidential label).
// Sees official results for closed elections.

const Results = () => {
 const { user } = useAuth();
 const isAdmin = user?.role === 'ADMIN';
 const [elections, setElections] = useState([]);
 const [selectedId, setSelectedId] = useState(null);
 const [results, setResults] = useState(null);
 const [loading, setLoading] = useState(false);
 const [totalVotes, setTotalVotes] = useState(0);
 const [lastUpdated, setLastUpdated] = useState(null);
 const [electionObj, setElectionObj] = useState(null);

 useEffect(() => {
 getElections().then(res => {
 const all = res.data || [];
 setElections(all);
 if (isAdmin && all.length > 0) setSelectedId(all[0].id);
 }).catch(() => {});
 }, [isAdmin]);

 useEffect(() => {
 if (selectedId) setElectionObj(elections.find(e => e.id === selectedId) || null);
 }, [selectedId, elections]);

 const fetchResults = useCallback((id) => {
 getResults(id)
 .then(res => {
 const data = res.data || {};
 setResults(data);
 setTotalVotes(Object.values(data).reduce((a, b) => a + Number(b), 0));
 setLastUpdated(new Date().toLocaleTimeString('en-IN'));
 setLoading(false);
 })
 .catch(() => { setResults({}); setLoading(false); });
 }, []);

 useEffect(() => {
 if (!selectedId || !electionObj || !isAdmin) return;
 setLoading(true);
 fetchResults(selectedId);
 if (electionObj.electionStatus === 'ACTIVE') {
 const interval = setInterval(() => fetchResults(selectedId), 5000);
 return () => clearInterval(interval);
 }
 }, [selectedId, electionObj, fetchResults, isAdmin]);

 const winner = results && totalVotes > 0
 ? Object.entries(results).reduce((a, b) => Number(b[1]) > Number(a[1]) ? b : a, ['', 0])
 : null;

 // VOTER VIEW 
 if (!isAdmin) {
 const closedElections = elections.filter(e => e.electionStatus === 'CLOSED');
 const activeElections = elections.filter(e => e.electionStatus === 'ACTIVE');
 const upcomingElections = elections.filter(e => e.electionStatus === 'UPCOMING');

 return (
 <div>
 {/* Page Banner */}
 <div className="page-banner">
 <div className="container">
 <h2> Election Results</h2>
 <p>Official results are declared exclusively by the Election Commission of India upon formal closure of an election.</p>
 </div>
 </div>

 <div className="container" style={{ marginTop: '28px' }}>

 {/* ACTIVE ELECTIONS — Results Declared Soon card */}
 {activeElections.map(el => (
 <div key={el.id} style={{
 background: 'linear-gradient(135deg,#002060 0%,#003580 60%,#0047A8 100%)',
 borderRadius: '10px', padding: '0', marginBottom: '20px',
 border: '1px solid #C8941A', overflow: 'hidden',
 boxShadow: '0 6px 24px rgba(0,32,96,.2)'
 }}>
 {/* Gold top strip */}
 <div style={{ height: '4px', background: 'linear-gradient(90deg,#C8941A,#FFD700,#C8941A)' }} />
 <div style={{ padding: '28px 28px' }}>
 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
 <span className="live-dot"></span>
 <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>
 Election In Progress
 </span>
 </div>
 <h3 style={{ color: '#fff', fontFamily: "'Noto Serif',serif", fontSize: '20px', marginBottom: '8px' }}>
 {el.title}
 </h3>
 <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '13px', lineHeight: '1.6' }}>
 {el.description || 'Voting is currently open for this election.'}
 </p>
 </div>
 <div style={{
 background: 'rgba(255,255,255,.08)', border: '1px solid rgba(200,148,26,.4)',
 borderRadius: '8px', padding: '18px 22px', textAlign: 'center', flexShrink: 0
 }}>
 <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
 <div style={{ color: '#FFD700', fontWeight: '800', fontSize: '14px', fontFamily: "'Noto Serif',serif", marginBottom: '4px' }}>
 Results Will Be
 </div>
 <div style={{ color: '#FFD700', fontWeight: '800', fontSize: '14px', fontFamily: "'Noto Serif',serif", marginBottom: '8px' }}>
 Declared Soon
 </div>
 <div style={{ fontSize: '10px', color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
 Pending Official Announcement
 </div>
 </div>
 </div>

 <div style={{ marginTop: '20px', background: 'rgba(0,0,0,.2)', borderRadius: '6px', padding: '12px 16px', borderLeft: '3px solid #C8941A' }}>
 <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', lineHeight: '1.6' }}>
 <strong style={{ color: 'rgba(255,255,255,.9)' }}>Confidentiality Notice:</strong> In accordance with
 the Election Commission directives, all vote tallies are sealed until the Returning Officer
 formally declares the result. Any attempt to access sealed results is an electoral offence.
 </p>
 </div>
 </div>
 </div>
 ))}

 {/* UPCOMING ELECTIONS */}
 {upcomingElections.map(el => (
 <div key={el.id} style={{
 background: '#fff', borderRadius: '10px', padding: '0',
 marginBottom: '20px', border: '1px solid #D4C9A8',
 boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'hidden'
 }}>
 <div style={{ height: '3px', background: 'linear-gradient(90deg,#003580,#0047A8)' }} />
 <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
 <div style={{ fontSize: '36px' }}></div>
 <div style={{ flex: 1 }}>
 <span className="badge badge-upcoming" style={{ marginBottom: '6px', display: 'inline-block' }}>Upcoming</span>
 <h3 style={{ color: '#002060', fontFamily: "'Noto Serif',serif", fontSize: '17px', marginBottom: '4px' }}>{el.title}</h3>
 <p style={{ color: '#7A6B4F', fontSize: '12px' }}>Voting has not yet commenced for this election. Results will be available after voting closes.</p>
 </div>
 </div>
 </div>
 ))}

 {/* NO ELECTIONS AT ALL */}
 {elections.length === 0 && (
 <div style={{
 background: 'linear-gradient(135deg,#002060,#003580)',
 borderRadius: '10px', padding: '52px 32px', textAlign: 'center',
 border: '2px solid #C8941A'
 }}>
 <div style={{ fontSize: '56px', marginBottom: '16px' }}></div>
 <h2 style={{ color: '#FFD700', fontFamily: "'Noto Serif',serif", fontSize: '22px', marginBottom: '12px' }}>
 No Elections Scheduled
 </h2>
 <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
 The Election Commission has not scheduled any elections at this time. Please check back later.
 </p>
 </div>
 )}

 {/* CLOSED ELECTIONS — Show official results */}
 {closedElections.length > 0 && (
 <div>
 <h3 style={{ fontFamily: "'Noto Serif',serif", color: '#002060', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
 <span></span> Official Declared Results
 </h3>
 {closedElections.map(el => (
 <ElectionResultCard key={el.id} election={el} />
 ))}
 </div>
 )}

 {/* About section */}
 <div className="card mt-3">
 <div className="card-header"><h3>About Result Declaration Process</h3></div>
 <div className="card-body">
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '14px', fontSize: '12px' }}>
 {[
 { icon: '⏰', q: 'When declared?', a: 'Results are declared only when the Election Commission officially closes the election.' },
 { icon: '', q: 'Who sees live counts?', a: 'Only authorised Election Officials can view live tallies during an active election.' },
 { icon: '', q: 'Certification?', a: 'Results are certified by the Returning Officer as official records of the Commission.' },
 { icon: '', q: 'Need help?', a: 'Contact helpdesk@eci.gov.in or visit your nearest Election Office.' },
 ].map(item => (
 <div key={item.q} style={{ padding: '12px', background: '#F9F6F0', borderRadius: '6px', borderTop: '3px solid #FF6200' }}>
 <div style={{ fontSize: '20px', marginBottom: '6px' }}>{item.icon}</div>
 <div style={{ fontWeight: '700', color: '#002060', marginBottom: '4px' }}>{item.q}</div>
 <div style={{ color: '#4A3C20', lineHeight: '1.5' }}>{item.a}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
 }

 // ADMIN VIEW 
 return (
 <div>
 <div className="page-banner">
 <div className="container">
 <h2> Results Panel — Admin Confidential</h2>
 <p>Live counts for active elections are visible only to you. Closing an election officially releases results to voters.</p>
 </div>
 </div>

 <div className="container" style={{ marginTop: '24px' }}>
 <div className="alert alert-warning mb-3">
 <strong>Admin Confidential View:</strong> Live vote counts below are <strong>not visible to voters</strong> until you officially close the election from the Admin Panel.
 </div>

 <div className="card mb-3">
 <div className="card-header"><h3>Select Election</h3></div>
 <div className="card-body">
 <select className="form-control" value={selectedId || ''}
 onChange={e => { setSelectedId(Number(e.target.value)); setResults(null); }}>
 <option value="">-- Select Election --</option>
 {elections.map(e => (
 <option key={e.id} value={e.id}>{e.title} [{e.electionStatus}]</option>
 ))}
 </select>
 </div>
 </div>

 {loading && <div className="text-center" style={{ padding: '28px' }}><span className="spinner spinner-navy"></span></div>}

 {results && electionObj && !loading && (
 <>
 {electionObj.electionStatus === 'ACTIVE' && (
 <div className="alert alert-info mb-2">
 <span className="live-dot"></span>
 <div>
 <strong>Live Count — Confidential (Admin Only)</strong><br />
 <span style={{ fontSize: '12px' }}>
 Voters see "Results Will Be Declared Soon". Close from Admin Panel to release.
 {lastUpdated && <> | Last updated: {lastUpdated}</>}
 </span>
 </div>
 </div>
 )}
 <AdminResultDisplay
 election={electionObj}
 results={results}
 totalVotes={totalVotes}
 winner={winner}
 isLive={electionObj.electionStatus === 'ACTIVE'}
 lastUpdated={lastUpdated}
 />
 </>
 )}
 </div>
 </div>
 );
};

// Official Result Card (Voter view — closed elections) 
const ElectionResultCard = ({ election }) => {
 const [results, setResults] = useState(null);
 const [total, setTotal] = useState(0);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 getResults(election.id)
 .then(res => {
 const data = res.data || {};
 setResults(data);
 setTotal(Object.values(data).reduce((a, b) => a + Number(b), 0));
 setLoading(false);
 })
 .catch(() => { setResults({}); setLoading(false); });
 }, [election.id]);

 const winner = results && total > 0
 ? Object.entries(results).reduce((a, b) => Number(b[1]) > Number(a[1]) ? b : a, ['', 0])
 : null;

 if (loading) return <div className="text-center" style={{ padding: '24px' }}><span className="spinner spinner-navy"></span></div>;

 const margin = (() => {
 if (!results || total === 0) return 0;
 const sorted = Object.values(results).map(Number).sort((a, b) => b - a);
 return sorted[0] - (sorted[1] || 0);
 })();

 return (
 <div style={{ marginBottom: '28px', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.1)', border: '1px solid #D4C9A8' }}>

 {/* ECI Header */}
 <div style={{ background: 'linear-gradient(135deg,#002060,#003580,#0047A8)', padding: '20px 28px' }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
 <div>
 <div style={{ fontSize: '9px', letterSpacing: '2.5px', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase', marginBottom: '6px' }}>
 Election Commission of India — Official Declaration
 </div>
 <h2 style={{ color: '#fff', fontFamily: "'Noto Serif',serif", fontSize: '19px', marginBottom: '5px' }}>{election.title}</h2>
 <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '11px' }}>
 Officially Declared:&nbsp;
 {election.endTime
 ? new Date(election.endTime).toLocaleString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
 : '—'}
 </div>
 </div>
 <div>
 <span style={{ background: '#C8941A', color: '#fff', padding: '5px 14px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>
 OFFICIALLY DECLARED
 </span>
 </div>
 </div>
 </div>

 {/* Winner Banner */}
 {winner && Number(winner[1]) > 0 && (
 <div style={{ background: 'linear-gradient(135deg,#0A5C04,#138808,#0A5C04)', padding: '24px 28px', borderLeft: '6px solid #C8941A', borderRight: '6px solid #C8941A' }}>
 <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
 <div style={{ fontSize: '50px' }}></div>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: '9px', letterSpacing: '3px', color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', marginBottom: '6px' }}>
 Declared Winner — Elected Representative
 </div>
 <div style={{ fontFamily: "'Noto Serif',serif", fontSize: '26px', color: '#FFD700', fontWeight: '700', marginBottom: '6px' }}>
 {winner[0]}
 </div>
 <div style={{ color: 'rgba(255,255,255,.85)', fontSize: '13px' }}>
 Secured <strong style={{ color: '#FFD700' }}>{winner[1]}</strong> votes out of <strong style={{ color: '#fff' }}>{total}</strong> total
 &nbsp;·&nbsp; <strong style={{ color: '#FFD700' }}>{total > 0 ? Math.round((Number(winner[1]) / total) * 100) : 0}%</strong> vote share
 &nbsp;·&nbsp; Winning margin: <strong style={{ color: '#FFD700' }}>{margin}</strong> vote{margin !== 1 ? 's' : ''}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Results Table */}
 <div style={{ background: '#fff', padding: '24px 28px' }}>
 {/* Stats row */}
 <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
 {[
 { lbl: 'Total Votes Cast', val: total, color: '#003580' },
 { lbl: 'No. of Candidates', val: Object.keys(results || {}).length, color: '#FF6200' },
 { lbl: 'Winning Margin', val: margin, color: '#138808' },
 ].map(s => (
 <div key={s.lbl} style={{ flex: 1, minWidth: '120px', padding: '12px 16px', background: '#F9F6F0', border: '1px solid #D4C9A8', borderLeft: `4px solid ${s.color}`, borderRadius: '6px' }}>
 <div style={{ fontSize: '10px', color: '#7A6B4F', textTransform: 'uppercase', letterSpacing: '.8px', fontWeight: '700', marginBottom: '4px' }}>{s.lbl}</div>
 <div style={{ fontSize: '22px', fontWeight: '700', color: '#002060', fontFamily: "'Noto Serif',serif" }}>{s.val}</div>
 </div>
 ))}
 </div>

 {/* Candidate table */}
 <div style={{ overflowX: 'auto' }}>
 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
 <thead>
 <tr style={{ background: '#002060' }}>
 {['Rank', 'Candidate Name', 'Votes Secured', 'Vote %', 'Vote Distribution'].map(h => (
 <th key={h} style={{ padding: '10px 14px', color: '#fff', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {Object.entries(results || {})
 .sort((a, b) => Number(b[1]) - Number(a[1]))
 .map(([name, count], i) => {
 const pct = total > 0 ? Math.round((Number(count) / total) * 100) : 0;
 const isWinner = winner && name === winner[0] && Number(winner[1]) > 0;
 return (
 <tr key={name} style={{ borderBottom: '1px solid #E8E0D0', background: isWinner ? '#F0FBF0' : i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
 <td style={{ padding: '12px 14px', fontWeight: '700', fontSize: '16px' }}>
 {isWinner ? '' : i === 1 ? '' : i === 2 ? '' : `#${i + 1}`}
 </td>
 <td style={{ padding: '12px 14px' }}>
 <div style={{ fontWeight: '700', color: '#002060', fontSize: '14px', fontFamily: "'Noto Serif',serif" }}>
 {name}
 {isWinner && (
 <span style={{ marginLeft: '8px', background: '#138808', color: '#fff', padding: '2px 8px', borderRadius: '3px', fontSize: '9px', letterSpacing: '1px', fontFamily: "'Source Sans 3',sans-serif" }}>
 ELECTED
 </span>
 )}
 </div>
 </td>
 <td style={{ padding: '12px 14px', fontWeight: '700', color: '#002060', fontSize: '15px', fontFamily: "'Noto Serif',serif" }}>{count}</td>
 <td style={{ padding: '12px 14px', fontWeight: '700', color: isWinner ? '#138808' : '#4A3C20', fontSize: '14px' }}>{pct}%</td>
 <td style={{ padding: '12px 14px', minWidth: '180px' }}>
 <div style={{ background: '#E8E0D0', borderRadius: '3px', overflow: 'hidden', height: '8px' }}>
 <div style={{ height: '100%', width: `${pct}%`, background: isWinner ? 'linear-gradient(90deg,#138808,#0F6B06)' : 'linear-gradient(90deg,#003580,#0047A8)', borderRadius: '3px', transition: 'width 1.2s ease' }} />
 </div>
 </td>
 </tr>
 );
 })
 }
 </tbody>
 </table>
 </div>

 {/* Footer */}
 <div style={{ marginTop: '16px', padding: '12px 14px', background: '#F9F6F0', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderTop: '2px solid #C8941A' }}>
 <span style={{ fontSize: '11px', color: '#7A6B4F' }}>
 This result has been officially declared by the Election Commission of India and constitutes a binding public record.
 </span>
 <span style={{ fontSize: '11px', color: '#7A6B4F', fontWeight: '700' }}>
 Ref: ECI-{String(election.id).padStart(4,'0')}-{new Date().getFullYear()}
 </span>
 </div>
 </div>
 </div>
 );
};

// Admin Results Display 
const AdminResultDisplay = ({ election, results, totalVotes, winner, isLive, lastUpdated }) => (
 <div className="card">
 <div className="card-header">
 <h3>{isLive ? <><span className="live-dot"></span> Live Count (Confidential)</> : 'Official Results'} — {election.title}</h3>
 </div>
 <div className="card-body">
 <div className="stat-grid mb-3">
 <div className="stat-box navy"><div className="stat-label">Total Votes</div><div className="stat-value">{totalVotes}</div></div>
 <div className="stat-box"><div className="stat-label">Candidates</div><div className="stat-value">{Object.keys(results).length}</div></div>
 <div className="stat-box green">
 <div className="stat-label">Status</div>
 <div style={{ marginTop: '6px' }}>
 <span className={`badge badge-${election.electionStatus.toLowerCase()}`}>
 {isLive && <span className="live-dot"></span>}{election.electionStatus}
 </span>
 </div>
 </div>
 </div>
 {Object.keys(results).length === 0
 ? <p style={{ color: '#7A6B4F', textAlign: 'center', padding: '20px' }}>No votes yet.</p>
 : Object.entries(results).sort((a, b) => Number(b[1]) - Number(a[1])).map(([name, count], i) => {
 const pct = totalVotes > 0 ? Math.round((Number(count) / totalVotes) * 100) : 0;
 const isWin = !isLive && winner && name === winner[0] && Number(winner[1]) > 0;
 return (
 <div className={`result-item ${isWin ? 'winner' : ''}`} key={name} style={{ marginBottom: '16px' }}>
 <div className="result-row">
 <span className="result-name">{isWin && ' '}{i + 1}. {name}
 {isWin && <span style={{ fontSize: '10px', background: '#138808', color: '#fff', padding: '1px 6px', borderRadius: '3px', marginLeft: '7px' }}>WINNER</span>}
 </span>
 <span className="result-pct">{count} ({pct}%)</span>
 </div>
 <div className="result-bar"><div className="result-fill" style={{ width: `${pct}%` }} /></div>
 </div>
 );
 })
 }
 {isLive && lastUpdated && <p style={{ fontSize: '11px', color: '#7A6B4F', textAlign: 'right', marginTop: '10px' }}><span className="live-dot"></span> Updated: {lastUpdated}</p>}
 </div>
 </div>
);

export default Results;
