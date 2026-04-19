import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, loginWithFaceDescriptor, getProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceCamera from '../components/FaceCamera';

const Login = () => {
  const [tab, setTab] = useState('password');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await login(form.email, form.password);
      const token = res.data.token;
      if (!token) { setError('Login failed. Invalid credentials.'); return; }
      localStorage.setItem('token', token);
      const profileRes = await getProfile();
      loginUser(token, profileRes.data);
      navigate(profileRes.data?.role === 'ADMIN' ? '/admin' : '/vote');
    } catch (err) {
      setError(err.response?.data || 'Login failed. Please verify your credentials.');
    } finally { setLoading(false); }
  };

  const handleFaceDescriptor = async (payload) => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithFaceDescriptor(payload);
      const token = res.data.token;
      localStorage.setItem('token', token);
      const profileRes = await getProfile();
      loginUser(token, profileRes.data);
      navigate(profileRes.data?.role === 'ADMIN' ? '/admin' : '/vote');
    } catch {
      setError('Face not recognised. Please register your face first or use password login.');
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-banner">
        <div className="container">
          <h2>Voter Login</h2>
          <p>Login with your password or biometric face recognition to access the voting system.</p>
        </div>
      </div>
      <div className="container" style={{ maxWidth: '500px', margin: '28px auto', padding: '0 20px' }}>
        <div className="card">
          <div className="card-header"><h3>Authentication Portal</h3></div>
          <div className="card-body">
            <div className="notice mb-2">
              <h4>Advisory</h4>
              <p>Only registered voters may login. You must register your face during account creation before using biometric login.</p>
            </div>
            <div className="tab-bar">
              <button className={`tab-btn ${tab === 'password' ? 'active' : ''}`} onClick={() => { setTab('password'); setError(''); }}>Password Login</button>
              <button className={`tab-btn ${tab === 'face' ? 'active' : ''}`} onClick={() => { setTab('face'); setError(''); }}>Biometric Login</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            {tab === 'password' && (
              <form onSubmit={handlePasswordLogin}>
                <div className="form-group">
                  <label>Email Address <span className="req">*</span></label>
                  <input name="email" type="email" className="form-control" placeholder="Enter your registered email" value={form.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label>Password <span className="req">*</span></label>
                  <input name="password" type="password" className="form-control" placeholder="Enter your password" value={form.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                  {loading ? <><span className="spinner"></span>&nbsp; Authenticating...</> : 'Login to System'}
                </button>
              </form>
            )}
            {tab === 'face' && (
              <div>
                <p style={{ fontSize: '13px', color: '#6B5C40', marginBottom: '14px' }}>
                  Look into the camera and blink naturally. The system will verify your face and log you in.
                </p>
                <FaceCamera autoCapture={true} onDescriptor={handleFaceDescriptor} onError={msg => setError(msg)} buttonLabel="Login with Face" />
                {loading && <div className="alert alert-info mt-2"><span className="spinner spinner-navy"></span>&nbsp; Verifying identity...</div>}
              </div>
            )}
            <div className="divider" />
            <p className="text-center" style={{ fontSize: '13px', color: '#6B5C40' }}>
              New voter? <Link to="/register">Register here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
