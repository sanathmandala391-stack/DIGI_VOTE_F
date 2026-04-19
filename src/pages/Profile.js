import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerFaceDescriptor } from '../services/api';
import FaceCamera from '../components/FaceCamera';

const Profile = () => {
 const { user } = useAuth();
 const [success, setSuccess] = useState('');
 const [error, setError] = useState('');
 const [updating, setUpdating] = useState(false);
 const [showReRegister, setShowReRegister] = useState(false);

 const handleNewFace = async (descriptor) => {
 setUpdating(true); setError(''); setSuccess('');
 try {
 await registerFaceDescriptor(user.id, descriptor);
 setSuccess('Face updated successfully!');
 setShowReRegister(false);
 } catch {
 setError('Failed to update face. Try again.');
 } finally { setUpdating(false); }
 };

 return (
 <div>
 <div className="page-banner">
 <div className="container">
 <h2> My Voter Profile</h2>
 <p>View your voter information and manage face recognition data.</p>
 </div>
 </div>

 <div className="container" style={{ marginTop: '24px' }}>
 <div className="grid-2">
 {/* Profile Info */}
 <div className="card">
 <div className="card-header"><h3>Voter Information</h3></div>
 <div className="card-body">
 <div style={{ textAlign: 'center', marginBottom: '18px' }}>
 <div style={{
 width: '76px', height: '76px', borderRadius: '50%',
 background: 'linear-gradient(135deg,#003580,#0047A8)',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 margin: '0 auto 10px', fontSize: '30px', color: '#fff', fontWeight: '700',
 fontFamily: "'Noto Serif',serif", border: '3px solid #C8941A'
 }}>
 {user?.name?.charAt(0)?.toUpperCase() || '?'}
 </div>
 <h3 style={{ fontFamily: "'Noto Serif',serif", color: '#002060' }}>{user?.name}</h3>
 <span className={`badge ${user?.role === 'ADMIN' ? 'badge-active' : 'badge-upcoming'}`}>
 {user?.role}
 </span>
 </div>

 <table style={{ width: '100%', fontSize: '13px' }}>
 <tbody>
 {[
 ['Voter ID', `ECI-${String(user?.id || '').padStart(6, '0')}`],
 ['Full Name', user?.name || '—'],
 ['Email', user?.email],
 ['Role', user?.role],
 ['Face Status', user?.faceEmbedding ? ' Registered' : ' Not registered'],
 ].map(([l, v]) => (
 <tr key={l} style={{ borderBottom: '1px solid #E8E0D0' }}>
 <td style={{ padding: '8px 0', color: '#7A6B4F', fontWeight: '700', width: '130px' }}>{l}</td>
 <td style={{ padding: '8px 0', color: '#1A1208' }}>{v}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Face Info */}
 <div className="card">
 <div className="card-header"><h3> Face Recognition</h3></div>
 <div className="card-body">
 {user?.faceEmbedding ? (
 <div>
 <div className="alert alert-success mb-2">
 Your face is registered and ready for voting verification.
 </div>
 <p style={{ fontSize: '13px', color: '#4A3C20', marginBottom: '16px' }}>
 Your face was registered during account creation. It is used to verify
 your identity when casting votes.
 </p>
 {!showReRegister
 ? <button className="btn btn-outline btn-full" onClick={() => setShowReRegister(true)}>
 Update Face Registration
 </button>
 : <>
 <p style={{ fontSize: '12px', color: '#7D6008', marginBottom: '12px' }}>
 Updating your face will replace the existing registration.
 </p>
 {error && <div className="alert alert-error"> {error}</div>}
 {success && <div className="alert alert-success"> {success}</div>}
 <FaceCamera
 onDescriptor={handleNewFace}
 onError={(msg) => setError(msg)}
 buttonLabel=" Update Face"
 />
 <button className="btn btn-outline btn-sm mt-2" onClick={() => setShowReRegister(false)}>
 Cancel
 </button>
 </>
 }
 </div>
 ) : (
 <div>
 <div className="alert alert-warning mb-2">
 No face registered. You must register your face to vote.
 </div>
 {error && <div className="alert alert-error"> {error}</div>}
 {success && <div className="alert alert-success"> {success}</div>}
 <FaceCamera
 onDescriptor={handleNewFace}
 onError={(msg) => setError(msg)}
 buttonLabel=" Register My Face"
 />
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Voting Rules */}
 <div className="card mt-3">
 <div className="card-header"><h3> Voting Rules & Guidelines</h3></div>
 <div className="card-body">
 <div className="grid-2">
 <div>
 {[
 'You can only vote once per election',
 'Face verification is mandatory before voting',
 'Your vote is secret and encrypted',
 'Votes cannot be changed after submission',
 ].map(r => (
 <div key={r} style={{ padding: '7px 0', borderBottom: '1px solid #E8E0D0', fontSize: '13px', display: 'flex', gap: '7px' }}>
 <span style={{ color: '#003580' }}>•</span> {r}
 </div>
 ))}
 </div>
 <div>
 {[
 'Results are announced when admin closes election',
 'Live vote count visible during active elections',
 'Admin controls election start and end times',
 'For issues contact: helpdesk@eci.gov.in',
 ].map(r => (
 <div key={r} style={{ padding: '7px 0', borderBottom: '1px solid #E8E0D0', fontSize: '13px', display: 'flex', gap: '7px' }}>
 <span style={{ color: '#003580' }}>•</span> {r}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

export default Profile;
