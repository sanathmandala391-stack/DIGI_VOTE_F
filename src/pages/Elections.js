// Elections.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getElections } from '../services/api';

const Elections = () => {
 const [elections, setElections] = useState([]);
 const [loading, setLoading] = useState(true);
 const [filter, setFilter] = useState('ALL');

 useEffect(() => {
 getElections().then(res => setElections(res.data || [])).catch(() => {}).finally(() => setLoading(false));
 }, []);

 const filtered = filter === 'ALL' ? elections : elections.filter(e => e.electionStatus === filter);

 return (
 <div>
 <div className="page-banner">
 <div className="container">
 <h2> Elections</h2>
 <p>View all scheduled, active, and completed elections.</p>
 </div>
 </div>
 <div className="container" style={{ marginTop: '24px' }}>
 <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
 {['ALL', 'ACTIVE', 'UPCOMING', 'CLOSED'].map(f => (
 <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
 onClick={() => setFilter(f)}>
 {f === 'ACTIVE' ? '' : f === 'UPCOMING' ? '' : f === 'CLOSED' ? '' : ''} {f}
 </button>
 ))}
 </div>

 {loading && <div className="text-center" style={{ padding: '36px' }}><span className="spinner spinner-navy"></span></div>}

 <div className="grid-2">
 {filtered.map(e => (
 <div className="el-card" key={e.id}>
 <div className="el-card-head">
 <div>
 <h3>{e.title}</h3>
 <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '11px', marginTop: '3px' }}>
 ID: ECI-{String(e.id).padStart(4, '0')}
 </p>
 </div>
 <span className={`badge badge-${e.electionStatus.toLowerCase()}`}>
 {e.electionStatus === 'ACTIVE' && <span className="live-dot"></span>}
 {e.electionStatus}
 </span>
 </div>
 <div className="el-card-body">
 <p style={{ fontSize: '13px', color: '#4A3C20', marginBottom: '10px' }}>
 {e.description || 'No description.'}
 </p>
 <div style={{ fontSize: '12px', color: '#7A6B4F' }}>
 <div>Start: {e.startTime ? new Date(e.startTime).toLocaleString('en-IN') : '—'}</div>
 <div>End: {e.endTime ? new Date(e.endTime).toLocaleString('en-IN') : '—'}</div>
 </div>
 </div>
 <div className="el-card-foot">
 {e.electionStatus === 'ACTIVE' && <Link to="/vote" className="btn btn-sm btn-success"> Vote Now</Link>}
 {e.electionStatus === 'CLOSED' && <Link to="/results" className="btn btn-sm btn-primary"> Results</Link>}
 {e.electionStatus === 'UPCOMING' && <span style={{ fontSize: '12px', color: '#7A6B4F' }}>Voting not started</span>}
 </div>
 </div>
 ))}
 </div>

 {!loading && filtered.length === 0 && (
 <div className="card">
 <div className="card-body text-center" style={{ padding: '36px' }}>
 <div style={{ fontSize: '40px', marginBottom: '10px' }}></div>
 <p>No elections in this category.</p>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};

export default Elections;
