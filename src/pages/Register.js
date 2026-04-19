// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { register, login, registerFaceDescriptor, getProfile } from '../services/api';
// import { useAuth } from '../context/AuthContext';
// import FaceCamera from '../components/FaceCamera';

// // REGISTRATION FLOW 
// // Step 1: Fill account details
// // Step 2: Capture face with blink (MANDATORY — cannot skip, cannot proceed without)
// // Step 3: Success screen
// // Face is captured and saved IN THE SAME FLOW — not separately later.
// // If face is duplicate or missing, registration is blocked completely.

// const Register = () => {
//  const [step, setStep] = useState(1);
//  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'VOTER' });
//  const [tempUser, setTempUser] = useState(null); // { id, token }
//  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
//  const [loading, setLoading] = useState(false);
//  const [error, setError] = useState('');
//  const [faceError, setFaceError] = useState('');
//  const [agreed, setAgreed] = useState(false);
//  const { loginUser } = useAuth();
//  const navigate = useNavigate();

//  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

//  // STEP 1: Validate form and create account (but NOT logged in yet) 
//  const handleStep1 = async (e) => {
//  e.preventDefault();
//  setError('');
//  if (!agreed) { setError('You must accept the declaration to continue.'); return; }
//  if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
//  if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }

//  setLoading(true);
//  try {
//  await register({ name: form.name, email: form.email, password: form.password, role: form.role });
//  const loginRes = await login(form.email, form.password);
//  const token = loginRes.data.token;
//  localStorage.setItem('token', token);
//  const profileRes = await getProfile();
//  setTempUser({ id: profileRes.data.id, token, data: profileRes.data });
//  setStep(2);
//  } catch (err) {
//  setError(typeof err.response?.data === 'string'
//  ? err.response.data
//  : 'Registration failed. This email may already be registered.');
//  } finally { setLoading(false); }
//  };

//  // STEP 2: Face captured — save it and complete registration 
//  const handleFaceCaptured = (descriptor) => {
//  setCapturedDescriptor(descriptor);
//  setFaceError('');
//  };

//  const handleSubmitFace = async () => {
//  if (!capturedDescriptor) {
//  setFaceError('Please capture your face first by clicking Start Camera and blinking.');
//  return;
//  }
//  setLoading(true);
//  setFaceError('');
//  try {
//  await registerFaceDescriptor(tempUser.id, capturedDescriptor);  // payload object
//  // Face saved successfully — log the user in properly
//  const profileRes = await getProfile();
//  loginUser(tempUser.token, profileRes.data);
//  setStep(3);
//  } catch (err) {
//  const msg = typeof err.response?.data === 'string' ? err.response.data : '';
//  if (msg.toLowerCase().includes('face') || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('unique')) {
//  setFaceError(
//  'This face is already registered with another account. ' +
//  'Each voter must register with a unique face. ' +
//  'If you believe this is an error, contact helpdesk@eci.gov.in'
//  );
//  } else {
//  setFaceError('Face could not be saved. Please try again in good lighting conditions.');
//  }
//  setCapturedDescriptor(null); // force re-capture
//  } finally { setLoading(false); }
//  };

//  // STEP 3: Complete 
//  if (step === 3) {
//  return (
//  <div>
//  <div className="page-banner">
//  <div className="container">
//  <h2> Voter Registration</h2>
//  </div>
//  </div>
//  <div className="container" style={{ maxWidth: '560px', margin: '36px auto', padding: '0 20px' }}>
//  <div className="card">
//  <div style={{ background: 'linear-gradient(135deg,#138808,#0F6B06)', padding: '32px 28px', textAlign: 'center' }}>
//  <div style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,.15)', border: '3px solid #FFD700', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '34px' }}>
 
//  </div>
//  <h2 style={{ color: '#FFD700', fontFamily: "'Noto Serif',serif", fontSize: '22px', marginBottom: '8px' }}>
//  Registration Successful
//  </h2>
//  <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '14px' }}>
//  Your voter account and biometric face data have been registered with the Election Commission of India.
//  </p>
//  </div>
//  <div className="card-body">
//  <table style={{ width: '100%', fontSize: '13px', marginBottom: '20px' }}>
//  <tbody>
//  {[
//  ['Voter ID', `ECI-${String(tempUser?.id || '').padStart(6,'0')}`],
//  ['Full Name', form.name],
//  ['Email', form.email],
//  ['Account Type', form.role],
//  ['Biometric Status', ' Face Registered'],
//  ['Status', ' Active'],
//  ].map(([l, v]) => (
//  <tr key={l} style={{ borderBottom: '1px solid #E8E0D0' }}>
//  <td style={{ padding: '8px 0', color: '#7A6B4F', fontWeight: '700', width: '140px' }}>{l}</td>
//  <td style={{ padding: '8px 0', color: '#1A1208', fontWeight: '500' }}>{v}</td>
//  </tr>
//  ))}
//  </tbody>
//  </table>
//  <div style={{ background: '#F0FBF0', border: '1px solid #138808', borderRadius: '6px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: '#0A5C04' }}>
//  Your biometric data is encrypted and stored securely. It will only be used for identity verification during voting.
//  </div>
//  <button className="btn btn-primary btn-full"
//  onClick={() => navigate(form.role === 'ADMIN' ? '/admin' : '/vote')}>
//  {form.role === 'ADMIN' ? ' Go to Admin Panel →' : ' Proceed to Vote →'}
//  </button>
//  </div>
//  </div>
//  </div>
//  </div>
//  );
//  }

//  return (
//  <div>
//  <div className="page-banner">
//  <div className="container">
//  <h2> New Voter Registration</h2>
//  <p>Complete both steps to register. Face registration is mandatory and cannot be skipped.</p>
//  </div>
//  </div>

//  <div className="container" style={{ maxWidth: '640px', margin: '28px auto', padding: '0 20px' }}>

//  {/* Step Progress Bar */}
//  <div className="step-bar mb-3">
//  {[
//  { n: 1, lbl: 'Account Details' },
//  { n: 2, lbl: 'Face Registration' },
//  { n: 3, lbl: 'Complete' },
//  ].map((s, i) => (
//  <div key={s.n} className={`step-item ${step === s.n ? 'active' : step > s.n ? 'done' : 'pending'}`}>
//  <span className="step-num">{step > s.n ? '' : s.n}</span>
//  <span className="step-lbl">{s.lbl}</span>
//  </div>
//  ))}
//  </div>

//  {/* STEP 1 */}
//  {step === 1 && (
//  <div className="card">
//  <div className="card-header">
//  <h3>Step 1 of 2 — Personal Details</h3>
//  </div>
//  <div className="card-body">
//  <div className="notice mb-2">
//  <h4> Registration Instructions</h4>
//  <p>Fill in your accurate details. Each email and face can only be registered <strong>once</strong>. After this step you will capture your face — that step is <strong>mandatory to complete registration</strong>.</p>
//  </div>

//  {error && <div className="alert alert-error"> {error}</div>}

//  <form onSubmit={handleStep1}>
//  <div className="form-group">
//  <label>Full Name (as per official ID) <span className="req">*</span></label>
//  <input name="name" className="form-control" placeholder="Enter your full legal name"
//  value={form.name} onChange={handleChange} required />
//  </div>
//  <div className="form-group">
//  <label>Email Address <span className="req">*</span></label>
//  <input name="email" type="email" className="form-control" placeholder="Enter your email address"
//  value={form.email} onChange={handleChange} required />
//  </div>
//  <div className="grid-2">
//  <div className="form-group">
//  <label>Password <span className="req">*</span></label>
//  <input name="password" type="password" className="form-control" placeholder="Minimum 6 characters"
//  value={form.password} onChange={handleChange} required />
//  </div>
//  <div className="form-group">
//  <label>Confirm Password <span className="req">*</span></label>
//  <input name="confirmPassword" type="password" className="form-control" placeholder="Re-enter password"
//  value={form.confirmPassword} onChange={handleChange} required />
//  </div>
//  </div>
//  <div className="form-group">
//  <label>Registration Type <span className="req">*</span></label>
//  <select name="role" className="form-control" value={form.role} onChange={handleChange}>
//  <option value="VOTER">Voter</option>
//  <option value="ADMIN">Election Official (Admin)</option>
//  </select>
//  </div>

//  {/* Declaration */}
//  <div style={{ background: '#F3EFE6', border: '1px solid #B8A878', borderRadius: '4px', padding: '14px', marginBottom: '16px' }}>
//  <p style={{ fontSize: '12px', color: '#4A3C20', lineHeight: '1.7', marginBottom: '10px' }}>
//  <strong>Statutory Declaration under the Representation of the People Act, 1951:</strong><br />
//  I hereby solemnly declare that I am a citizen of India, that I have attained the age of 18 years,
//  that I am not subject to any disqualification mentioned in the Constitution of India or under any
//  law, and that all the particulars furnished above are true, complete and correct to the best of my knowledge.
//  </p>
//  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
//  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
//  style={{ marginTop: '2px', flexShrink: 0, width: '15px', height: '15px' }} />
//  <span style={{ fontSize: '12px', color: '#4A3C20', fontWeight: '600' }}>
//  I accept the above declaration and agree to the Terms & Conditions of the Election Commission of India.
//  </span>
//  </label>
//  </div>

//  <button type="submit" className="btn btn-primary btn-full" disabled={loading || !agreed}>
//  {loading
//  ? <><span className="spinner"></span> Creating Account...</>
//  : 'Continue to Face Registration →'}
//  </button>
//  </form>

//  <div className="divider" />
//  <p className="text-center" style={{ fontSize: '13px', color: '#7A6B4F' }}>
//  Already registered? <Link to="/login">Login here</Link>
//  </p>
//  </div>
//  </div>
//  )}

//  {/* STEP 2 */}
//  {step === 2 && (
//  <div className="card">
//  <div className="card-header">
//  <h3>Step 2 of 2 — Biometric Face Registration</h3>
//  </div>
//  <div className="card-body">

//  {/* Hard warning — cannot skip */}
//  <div style={{
//  background: 'linear-gradient(135deg,#002060,#003580)',
//  borderRadius: '6px', padding: '14px 16px', marginBottom: '16px',
//  display: 'flex', alignItems: 'flex-start', gap: '12px'
//  }}>
//  <span style={{ fontSize: '22px', flexShrink: 0 }}></span>
//  <div>
//  <div style={{ color: '#FFD700', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
//  Mandatory Step — Cannot Be Skipped
//  </div>
//  <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '12px', lineHeight: '1.6' }}>
//  Your biometric face data is required to complete registration.
//  Without face registration you <strong style={{ color: '#FF9944' }}>cannot login or vote</strong>.
//  Each face must be unique — duplicate faces are rejected automatically.
//  </div>
//  </div>
//  </div>

//  {faceError && (
//  <div className="alert alert-error mb-2">
//  {faceError}
//  </div>
//  )}

//  {capturedDescriptor && !faceError && (
//  <div className="alert alert-success mb-2">
//  Face captured successfully with liveness verification. Click "Complete Registration" below.
//  </div>
//  )}

//  <FaceCamera
//  onDescriptor={handleFaceCaptured}
//  onError={(msg) => setFaceError(msg)}
//  buttonLabel=" Capture My Face"
//  />

//  {/* Submit button — only enabled after face captured */}
//  <div style={{ marginTop: '16px' }}>
//  <button
//  className="btn btn-success btn-full btn-lg"
//  disabled={!capturedDescriptor || loading}
//  onClick={handleSubmitFace}
//  >
//  {loading
//  ? <><span className="spinner"></span> Saving Biometric Data...</>
//  : !capturedDescriptor
//  ? '⏳ Waiting for Face Capture...'
//  : ' Complete Registration'}
//  </button>
//  {!capturedDescriptor && (
//  <p style={{ fontSize: '11px', color: '#C0392B', textAlign: 'center', marginTop: '8px', fontWeight: '600' }}>
//  ↑ You must capture your face above before completing registration
//  </p>
//  )}
//  </div>

//  <div style={{ marginTop: '14px', padding: '10px 14px', background: '#FEF9E7', border: '1px solid #F5C518', borderRadius: '4px', fontSize: '11px', color: '#7D6008' }}>
//  <strong>Privacy:</strong> Your face data is encrypted using military-grade encryption and stored
//  securely on ECI servers. It is used solely for voter identity verification and is never shared
//  with any third party. Reference: IT Act 2000, Section 43A.
//  </div>
//  </div>
//  </div>
//  )}
//  </div>
//  </div>
//  );
// };

// export default Register;





import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register, login, registerFaceDescriptor, getProfile } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FaceCamera from '../components/FaceCamera';

// REGISTRATION FLOW
// Step 1: Fill account details (if ADMIN selected → must enter secret code 24047)
// Step 2: Capture face with blink (MANDATORY — cannot skip)
// Step 3: Success screen

const ADMIN_SECRET_CODE = '24047';

const Register = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'VOTER',
  });
  const [adminCode, setAdminCode] = useState('');
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCodeError, setAdminCodeError] = useState('');
  const [tempUser, setTempUser] = useState(null); // { id, token, data }
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [faceError, setFaceError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Show / hide admin code field when role changes
    if (name === 'role') {
      setAdminCode('');
      setAdminCodeError('');
      setShowAdminCode(value === 'ADMIN');
    }
  };

  // ─── STEP 1: Validate + create account ────────────────────────────────────
  const handleStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setAdminCodeError('');

    if (!agreed) {
      setError('You must accept the declaration to continue.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    // ── Admin secret code check ──────────────────────────────────────────────
    if (form.role === 'ADMIN') {
      if (!adminCode.trim()) {
        setAdminCodeError('Admin registration requires a secret authorisation code.');
        return;
      }
      if (adminCode.trim() !== ADMIN_SECRET_CODE) {
        setAdminCodeError(
          'Invalid authorisation code. Contact the Chief Election Officer for access.'
        );
        setAdminCode('');
        return;
      }
    }

    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      const loginRes = await login(form.email, form.password);
      const token = loginRes.data['login-Token:'] || loginRes.data.token;
      localStorage.setItem('token', token);
      const profileRes = await getProfile();
      setTempUser({ id: profileRes.data.id, token, data: profileRes.data });
      setStep(2);
    } catch (err) {
      setError(
        typeof err.response?.data === 'string'
          ? err.response.data
          : 'Registration failed. This email may already be registered.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Face captured ─────────────────────────────────────────────────
  const handleFaceCaptured = (descriptor) => {
    setCapturedDescriptor(descriptor);
    setFaceError('');
  };

  const handleSubmitFace = async () => {
    if (!capturedDescriptor) {
      setFaceError('Please capture your face first by clicking Start Camera and blinking.');
      return;
    }
    setLoading(true);
    setFaceError('');
    try {
      await registerFaceDescriptor(tempUser.id, capturedDescriptor);
      const profileRes = await getProfile();
      loginUser(tempUser.token, profileRes.data);
      setStep(3);
    } catch (err) {
      const msg = typeof err.response?.data === 'string' ? err.response.data : '';
      if (
        msg.toLowerCase().includes('face') ||
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('unique')
      ) {
        setFaceError(
          'This face is already registered with another account. ' +
            'Each voter must register with a unique face. ' +
            'If you believe this is an error, contact helpdesk@eci.gov.in'
        );
      } else {
        setFaceError('Face could not be saved. Please try again in good lighting conditions.');
      }
      setCapturedDescriptor(null);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 3: Success ───────────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div>
        <div className="page-banner">
          <div className="container">
            <h2>🗳️ Voter Registration</h2>
          </div>
        </div>
        <div className="container" style={{ maxWidth: '560px', margin: '36px auto', padding: '0 20px' }}>
          <div className="card">
            <div
              style={{
                background: 'linear-gradient(135deg,#138808,#0F6B06)',
                padding: '32px 28px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '72px', height: '72px',
                  background: 'rgba(255,255,255,.15)',
                  border: '3px solid #FFD700',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: '34px',
                }}
              >
                ✅
              </div>
              <h2
                style={{
                  color: '#FFD700', fontFamily: "'Noto Serif',serif",
                  fontSize: '22px', marginBottom: '8px',
                }}
              >
                Registration Successful
              </h2>
              <p style={{ color: 'rgba(255,255,255,.85)', fontSize: '14px' }}>
                Your {form.role === 'ADMIN' ? 'administrator' : 'voter'} account and biometric face
                data have been registered with the Election Commission of India.
              </p>
            </div>

            <div className="card-body">
              <table style={{ width: '100%', fontSize: '13px', marginBottom: '20px' }}>
                <tbody>
                  {[
                    ['Voter ID', `ECI-${String(tempUser?.id || '').padStart(6, '0')}`],
                    ['Full Name', form.name],
                    ['Email', form.email],
                    ['Account Type', form.role === 'ADMIN' ? '🔐 Election Official (Admin)' : '🗳️ Voter'],
                    ['Biometric Status', '✅ Face Registered'],
                    ['Status', '✅ Active'],
                  ].map(([l, v]) => (
                    <tr key={l} style={{ borderBottom: '1px solid #E8E0D0' }}>
                      <td style={{ padding: '8px 0', color: '#7A6B4F', fontWeight: '700', width: '140px' }}>{l}</td>
                      <td style={{ padding: '8px 0', color: '#1A1208', fontWeight: '500' }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div
                style={{
                  background: '#F0FBF0', border: '1px solid #138808',
                  borderRadius: '6px', padding: '12px 14px',
                  marginBottom: '18px', fontSize: '12px', color: '#0A5C04',
                }}
              >
                Your biometric data is encrypted and stored securely. It will only be used for
                identity verification during voting.
              </div>

              <button
                className="btn btn-primary btn-full"
                onClick={() => navigate(form.role === 'ADMIN' ? '/admin' : '/vote')}
              >
                {form.role === 'ADMIN' ? '⚙️ Go to Admin Panel →' : '🗳️ Proceed to Vote →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── STEPS 1 & 2 ──────────────────────────────────────────────────────────
  return (
    <div>
      <div className="page-banner">
        <div className="container">
          <h2>📝 New Voter Registration</h2>
          <p>
            Complete both steps to register. Face registration is mandatory and cannot be skipped.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '640px', margin: '28px auto', padding: '0 20px' }}>

        {/* Step Progress Bar */}
        <div className="step-bar mb-3">
          {[
            { n: 1, lbl: 'Account Details' },
            { n: 2, lbl: 'Face Registration' },
            { n: 3, lbl: 'Complete' },
          ].map((s) => (
            <div
              key={s.n}
              className={`step-item ${step === s.n ? 'active' : step > s.n ? 'done' : 'pending'}`}
            >
              <span className="step-num">{step > s.n ? '✓' : s.n}</span>
              <span className="step-lbl">{s.lbl}</span>
            </div>
          ))}
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="card">
            <div className="card-header">
              <h3>Step 1 of 2 — Personal Details</h3>
            </div>
            <div className="card-body">
              <div className="notice mb-2">
                <h4>📋 Registration Instructions</h4>
                <p>
                  Fill in your accurate details. Each email and face can only be registered{' '}
                  <strong>once</strong>. After this step you will capture your face — that step is{' '}
                  <strong>mandatory to complete registration</strong>.
                </p>
              </div>

              {error && (
                <div className="alert alert-error">⚠️ {error}</div>
              )}

              <form onSubmit={handleStep1}>
                <div className="form-group">
                  <label>
                    Full Name (as per official ID) <span className="req">*</span>
                  </label>
                  <input
                    name="name" className="form-control"
                    placeholder="Enter your full legal name"
                    value={form.name} onChange={handleChange} required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Email Address <span className="req">*</span>
                  </label>
                  <input
                    name="email" type="email" className="form-control"
                    placeholder="Enter your email address"
                    value={form.email} onChange={handleChange} required
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label>Password <span className="req">*</span></label>
                    <input
                      name="password" type="password" className="form-control"
                      placeholder="Minimum 6 characters"
                      value={form.password} onChange={handleChange} required
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password <span className="req">*</span></label>
                    <input
                      name="confirmPassword" type="password" className="form-control"
                      placeholder="Re-enter password"
                      value={form.confirmPassword} onChange={handleChange} required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Registration Type <span className="req">*</span></label>
                  <select
                    name="role" className="form-control"
                    value={form.role} onChange={handleChange}
                  >
                    <option value="VOTER">Voter</option>
                    <option value="ADMIN">Election Official (Admin)</option>
                  </select>
                </div>

                {/* ── Admin Secret Code Field — shown only when ADMIN selected ── */}
                {form.role === 'ADMIN' && (
                  <div
                    className="form-group"
                    style={{
                      background: 'linear-gradient(135deg,#002060,#003580)',
                      borderRadius: '6px', padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <label
                      style={{ color: '#FFD700', fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '8px' }}
                    >
                      🔐 Admin Authorisation Code <span style={{ color: '#FF6B6B' }}>*</span>
                    </label>
                    <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '11px', marginBottom: '10px', lineHeight: '1.5' }}>
                      Administrator registration is restricted. Enter the secret code provided
                      by the Chief Election Officer to proceed.
                    </p>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter authorisation code"
                      value={adminCode}
                      onChange={(e) => {
                        setAdminCode(e.target.value);
                        setAdminCodeError('');
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: adminCodeError ? '1px solid #FF6B6B' : '1px solid rgba(255,255,255,0.25)',
                        color: 'white',
                        letterSpacing: '4px',
                        fontWeight: '700',
                        fontSize: '16px',
                      }}
                      maxLength={10}
                    />
                    {adminCodeError && (
                      <div
                        style={{
                          marginTop: '8px', fontSize: '12px', color: '#FF9999',
                          display: 'flex', alignItems: 'flex-start', gap: '6px',
                        }}
                      >
                        <span>⛔</span>
                        <span>{adminCodeError}</span>
                      </div>
                    )}
                    {adminCode && !adminCodeError && adminCode === ADMIN_SECRET_CODE && (
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#6BFF6B' }}>
                        ✅ Code verified — Admin access granted
                      </div>
                    )}
                  </div>
                )}

                {/* Declaration */}
                <div
                  style={{
                    background: '#F3EFE6', border: '1px solid #B8A878',
                    borderRadius: '4px', padding: '14px', marginBottom: '16px',
                  }}
                >
                  <p style={{ fontSize: '12px', color: '#4A3C20', lineHeight: '1.7', marginBottom: '10px' }}>
                    <strong>
                      Statutory Declaration under the Representation of the People Act, 1951:
                    </strong>
                    <br />
                    I hereby solemnly declare that I am a citizen of India, that I have attained
                    the age of 18 years, that I am not subject to any disqualification mentioned in
                    the Constitution of India or under any law, and that all the particulars
                    furnished above are true, complete and correct to the best of my knowledge.
                  </p>
                  <label
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
                  >
                    <input
                      type="checkbox" checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      style={{ marginTop: '2px', flexShrink: 0, width: '15px', height: '15px' }}
                    />
                    <span style={{ fontSize: '12px', color: '#4A3C20', fontWeight: '600' }}>
                      I accept the above declaration and agree to the Terms & Conditions of the
                      Election Commission of India.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={loading || !agreed}
                >
                  {loading ? (
                    <><span className="spinner" /> Creating Account...</>
                  ) : (
                    'Continue to Face Registration →'
                  )}
                </button>
              </form>

              <div className="divider" />
              <p className="text-center" style={{ fontSize: '13px', color: '#7A6B4F' }}>
                Already registered? <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <h3>Step 2 of 2 — Biometric Face Registration</h3>
            </div>
            <div className="card-body">

              {/* Hard warning */}
              <div
                style={{
                  background: 'linear-gradient(135deg,#002060,#003580)',
                  borderRadius: '6px', padding: '14px 16px', marginBottom: '16px',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                }}
              >
                <span style={{ fontSize: '22px', flexShrink: 0 }}>🔒</span>
                <div>
                  <div style={{ color: '#FFD700', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    Mandatory Step — Cannot Be Skipped
                  </div>
                  <div style={{ color: 'rgba(255,255,255,.8)', fontSize: '12px', lineHeight: '1.6' }}>
                    Your biometric face data is required to complete registration. Without face
                    registration you{' '}
                    <strong style={{ color: '#FF9944' }}>cannot login or vote</strong>. Each face
                    must be unique — duplicate faces are rejected automatically.
                  </div>
                </div>
              </div>

              {faceError && (
                <div className="alert alert-error mb-2">⚠️ {faceError}</div>
              )}

              {capturedDescriptor && !faceError && (
                <div className="alert alert-success mb-2">
                  ✅ Face captured successfully with liveness verification. Click "Complete
                  Registration" below.
                </div>
              )}

              <FaceCamera
                onDescriptor={handleFaceCaptured}
                onError={(msg) => setFaceError(msg)}
                buttonLabel="📸 Capture My Face"
              />

              <div style={{ marginTop: '16px' }}>
                <button
                  className="btn btn-success btn-full btn-lg"
                  disabled={!capturedDescriptor || loading}
                  onClick={handleSubmitFace}
                >
                  {loading ? (
                    <><span className="spinner" /> Saving Biometric Data...</>
                  ) : !capturedDescriptor ? (
                    '⏳ Waiting for Face Capture...'
                  ) : (
                    '✅ Complete Registration'
                  )}
                </button>
                {!capturedDescriptor && (
                  <p
                    style={{
                      fontSize: '11px', color: '#C0392B',
                      textAlign: 'center', marginTop: '8px', fontWeight: '600',
                    }}
                  >
                    ↑ You must capture your face above before completing registration
                  </p>
                )}
              </div>

              <div
                style={{
                  marginTop: '14px', padding: '10px 14px',
                  background: '#FEF9E7', border: '1px solid #F5C518',
                  borderRadius: '4px', fontSize: '11px', color: '#7D6008',
                }}
              >
                <strong>Privacy:</strong> Your face data is encrypted using military-grade
                encryption and stored securely on ECI servers. It is used solely for voter identity
                verification and is never shared with any third party. Reference: IT Act 2000,
                Section 43A.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;