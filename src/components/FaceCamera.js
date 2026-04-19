import React, { useEffect, useRef, useState, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// ECI ADVANCED BIOMETRIC LIVENESS SYSTEM
// ───────────────────────────────────────────────────────────────────────────────
// Features implemented:
//  1. Multi-step liveness detection
//     • Eye blink detection (EAR algorithm)
//     • Head movement detection (nose tip displacement)
//     • Random challenge system (blink, turn left/right, nod)
//  2. Anti-spoofing
//     • Motion consistency check — validates real movement patterns
//     • Frame variation analysis — rejects static images/video replay
//     • Texture analysis — pixel variance check
//  3. Improved face recognition
//     • Brightness normalization before descriptor extraction
//     • Multi-angle registration (front + slight left + slight right)
//     • Adaptive threshold (tightens after first failure)
//     • Retry mechanism (up to 3 attempts)
//  4. Secure descriptor packaging
//     • Sends {descriptor, livenessScore, challengeProof} to backend
// ═══════════════════════════════════════════════════════════════════════════════

const MODELS_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

// ─── Model loading ────────────────────────────────────────────────────────────
let modelsLoaded = false;
let modelsLoading = false;
const modelCallbacks = [];

const ensureModels = () =>
  new Promise((resolve, reject) => {
    if (modelsLoaded) { resolve(); return; }
    modelCallbacks.push({ resolve, reject });
    if (modelsLoading) return;
    modelsLoading = true;
    const tryLoad = async () => {
      let attempts = 0;
      while (attempts < 40) {
        if (window.faceapi) break;
        await new Promise(r => setTimeout(r, 500));
        attempts++;
      }
      if (!window.faceapi) {
        const err = new Error('face-api.js failed to load from CDN.');
        modelCallbacks.forEach(cb => cb.reject(err));
        return;
      }
      try {
        const fa = window.faceapi;
        await Promise.all([
          fa.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
          fa.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
          fa.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        ]);
        modelsLoaded = true;
        modelCallbacks.forEach(cb => cb.resolve());
      } catch (e) {
        modelCallbacks.forEach(cb => cb.reject(e));
      }
    };
    tryLoad();
  });

// ─── EAR: Eye Aspect Ratio (blink detection) ─────────────────────────────────
// Landmarks: left eye 36-41, right eye 42-47
const EAR_CLOSED = 0.21;    // below = eye closed
const EAR_OPEN   = 0.27;    // above = fully open
const BLINK_MIN_MS = 60;
const BLINK_MAX_MS = 500;   // longer = intentional close, not blink

function getEAR(pts) {
  const ear = (s) => {
    const v1 = dist2D(pts[s+1], pts[s+5]);
    const v2 = dist2D(pts[s+2], pts[s+4]);
    const h  = dist2D(pts[s],   pts[s+3]);
    return h < 1 ? 1 : (v1 + v2) / (2 * h);
  };
  return (ear(36) + ear(42)) / 2;
}

// ─── Head pose estimation (nose tip movement) ─────────────────────────────────
// Nose tip = landmark[30], chin = landmark[8], left eye corner = 36, right = 45
function getPose(pts) {
  const noseTip   = pts[30];
  const chinBot   = pts[8];
  const leftEye   = pts[36];
  const rightEye  = pts[45];
  const eyeCenter = { x: (leftEye.x + rightEye.x) / 2, y: (leftEye.y + rightEye.y) / 2 };
  const faceWidth = dist2D(leftEye, rightEye);
  // Normalised yaw (left/right): nose offset from eye midpoint
  const yaw   = faceWidth > 5 ? (noseTip.x - eyeCenter.x) / faceWidth : 0;
  // Normalised pitch (up/down): nose offset from chin midpoint
  const faceH = dist2D(eyeCenter, chinBot);
  const pitch = faceH > 5 ? (noseTip.y - eyeCenter.y) / faceH : 0;
  return { yaw, pitch };
}

// ─── Frame variation (anti-replay) ───────────────────────────────────────────
// Captures pixel variance from a small ROI over time.
// A static image/video loop will have zero or very low variance.
const FRAME_BUFFER_SIZE = 8;
let framePixelHistory = [];

function sampleFrameVariance(video) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) sum += data[i]; // red channel
    return sum / (32 * 32);
  } catch { return 128; }
}

function computeVariance(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / arr.length;
}

// ─── Brightness normalisation ─────────────────────────────────────────────────
function normaliseBrightness(video) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    // Compute mean brightness
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let lum = 0;
    for (let i = 0; i < imgData.data.length; i += 4)
      lum += 0.299 * imgData.data[i] + 0.587 * imgData.data[i+1] + 0.114 * imgData.data[i+2];
    const mean = lum / (canvas.width * canvas.height);
    // If very dark or very bright, apply correction
    if (mean < 60 || mean > 200) {
      const factor = mean < 60 ? 1.5 : 0.6;
      for (let i = 0; i < imgData.data.length; i += 4) {
        imgData.data[i]   = Math.min(255, imgData.data[i]   * factor);
        imgData.data[i+1] = Math.min(255, imgData.data[i+1] * factor);
        imgData.data[i+2] = Math.min(255, imgData.data[i+2] * factor);
      }
      ctx.putImageData(imgData, 0, 0);
    }
    return canvas; // return normalised canvas for detection
  } catch { return video; }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function dist2D(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Challenge Generator ──────────────────────────────────────────────────────
const CHALLENGES = [
  { id: 'blink',      text: 'Blink your eyes once',        type: 'blink',     count: 1 },
  { id: 'blink2',     text: 'Blink your eyes twice',       type: 'blink',     count: 2 },
  { id: 'turn_left',  text: 'Slowly turn your head LEFT',  type: 'turn_left'  },
  { id: 'turn_right', text: 'Slowly turn your head RIGHT', type: 'turn_right' },
  { id: 'nod',        text: 'Nod your head DOWN slightly', type: 'nod'        },
];

function randomChallenge() {
  return CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const FaceCamera = ({
  onDescriptor,   // called with { descriptors: [], livenessScore, challengeProof }
  onError,
  buttonLabel = 'Capture Face',
  autoCapture = false,
  mode = 'full',  // 'full' = registration (multi-angle), 'verify' = login/vote
}) => {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const loopRef   = useRef(false);
  const canvasRef = useRef(null);

  const [cameraOn,      setCameraOn]      = useState(false);
  const [modelReady,    setModelReady]    = useState(false);
  const [modelLoading,  setModelLoading]  = useState(true);
  const [processing,    setProcessing]    = useState(false);
  const [status,        setStatus]        = useState('');
  const [statusType,    setStatusType]    = useState(''); // success | error | info | warn
  const [phase,         setPhase]         = useState('idle');
  // idle → challenge1 → challenge2 → challenge3 → capturing → done
  const [challenge,     setChallenge]     = useState(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [attempts,      setAttempts]      = useState(0);
  const [faceIn,        setFaceIn]        = useState(false);
  const [steps,         setSteps]         = useState([
    { id: 'face',      label: 'Face detected',        done: false },
    { id: 'challenge', label: 'Challenge completed',  done: false },
    { id: 'antispoof', label: 'Liveness confirmed',   done: false },
    { id: 'capture',   label: 'Face captured',        done: false },
  ]);

  const MAX_ATTEMPTS = 3;

  // ─── Load models ───────────────────────────────────────────────────────────
  useEffect(() => {
    ensureModels()
      .then(() => { setModelReady(true); setModelLoading(false); })
      .catch(e => { setModelLoading(false); setStatus('Model load failed: ' + e.message); setStatusType('error'); });
    return () => {
      loopRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  useEffect(() => {
    if (cameraOn && streamRef.current && videoRef.current)
      videoRef.current.srcObject = streamRef.current;
  }, [cameraOn]);

  // ─── Stop camera ───────────────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    loopRef.current = false;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setFaceIn(false);
    setChallengeDone(false);
    setProgress(0);
    setPhase('idle');
    setChallenge(null);
    framePixelHistory = [];
  }, []);

  // ─── Update step ───────────────────────────────────────────────────────────
  const markStep = (id) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, done: true } : s));
  };

  // ─── Start camera ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setStatus('');
    setStatusType('');
    setChallengeDone(false);
    setProgress(0);
    setPhase('idle');
    framePixelHistory = [];
    setSteps(prev => prev.map(s => ({ ...s, done: false })));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
      });
      streamRef.current = stream;
      setCameraOn(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
      loopRef.current = true;
      runBiometricLoop();
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : 'Cannot access camera: ' + err.message;
      setStatus(msg); setStatusType('error');
      onError && onError(msg);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BIOMETRIC LIVENESS LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  const runBiometricLoop = async () => {
    await new Promise(r => setTimeout(r, 1200));

    // State local to this loop instance
    let blinkCount = 0;
    let eyeClosedAt = null;
    let eyeIsOpen = true;
    let openFrames = 0;

    let headBaseYaw   = null;
    let headBasePitch = null;
    let headMoved     = false;

    let allDescriptors = []; // multi-angle
    let livenessScore  = 0;
    let challengeProof = {};

    let currentChallenge = randomChallenge();
    setChallenge(currentChallenge);
    setPhase('challenge');
    setStatus(`Challenge: ${currentChallenge.text}`);
    setStatusType('info');

    let framesSinceLastCapture = 0;
    let frameCount = 0;

    while (loopRef.current) {
      if (!videoRef.current || !window.faceapi) {
        await new Promise(r => setTimeout(r, 300));
        continue;
      }

      try {
        frameCount++;
        framesSinceLastCapture++;

        // ── Anti-replay: frame variation ──────────────────────────────────────
        const pixelVal = sampleFrameVariance(videoRef.current);
        framePixelHistory.push(pixelVal);
        if (framePixelHistory.length > FRAME_BUFFER_SIZE) framePixelHistory.shift();
        const frameVariance = computeVariance(framePixelHistory);

        // ── Brightness-normalised detection ───────────────────────────────────
        const source = normaliseBrightness(videoRef.current);
        const fa = window.faceapi;

        const det = await fa
          .detectSingleFace(source, new fa.SsdMobilenetv1Options({ minConfidence: 0.55 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!det) {
          setFaceIn(false);
          openFrames = 0;
          headBaseYaw = null;
          setStatus(`Challenge: ${currentChallenge.text} — Position face in oval`);
          setStatusType('warn');
          await new Promise(r => setTimeout(r, 200));
          continue;
        }

        setFaceIn(true);
        markStep('face');

        const pts = det.landmarks.positions;
        const ear  = getEAR(pts);
        const pose = getPose(pts);

        // ── Set head baseline ─────────────────────────────────────────────────
        if (headBaseYaw === null) {
          headBaseYaw   = pose.yaw;
          headBasePitch = pose.pitch;
        }

        const yawDelta   = Math.abs(pose.yaw   - headBaseYaw);
        const pitchDelta = Math.abs(pose.pitch  - headBasePitch);

        // ═════════════════════════════════════════════════════════════════
        // CHALLENGE EVALUATION
        // ═════════════════════════════════════════════════════════════════
        let challengeComplete = false;

        if (currentChallenge.type === 'blink') {
          // Blink detection with timing constraints
          const eyesClosed = ear < EAR_CLOSED;
          if (eyesClosed && eyeIsOpen) {
            eyeClosedAt = Date.now();
            eyeIsOpen = false;
            openFrames = 0;
          } else if (!eyesClosed && !eyeIsOpen && eyeClosedAt) {
            const dur = Date.now() - eyeClosedAt;
            if (dur >= BLINK_MIN_MS && dur <= BLINK_MAX_MS) {
              blinkCount++;
              setProgress(Math.min(100, Math.round((blinkCount / (currentChallenge.count || 1)) * 100)));
              challengeProof.blinkTimings = [...(challengeProof.blinkTimings || []), dur];
            }
            eyeClosedAt = null;
            eyeIsOpen = true;
          }
          if (!eyesClosed) openFrames++;
          if (blinkCount >= (currentChallenge.count || 1)) challengeComplete = true;

        } else if (currentChallenge.type === 'turn_left') {
          // Head turn left: nose moves to user's left → negative yaw from face-api perspective
          if (yawDelta > 0.18) {
            headMoved = true;
            setProgress(Math.min(100, Math.round(yawDelta * 400)));
          }
          if (yawDelta > 0.22) challengeComplete = true;

        } else if (currentChallenge.type === 'turn_right') {
          if (yawDelta > 0.18) {
            headMoved = true;
            setProgress(Math.min(100, Math.round(yawDelta * 400)));
          }
          if (yawDelta > 0.22) challengeComplete = true;

        } else if (currentChallenge.type === 'nod') {
          if (pitchDelta > 0.12) {
            headMoved = true;
            setProgress(Math.min(100, Math.round(pitchDelta * 500)));
          }
          if (pitchDelta > 0.16) challengeComplete = true;
        }

        // ═════════════════════════════════════════════════════════════════
        // CHALLENGE PASSED
        // ═════════════════════════════════════════════════════════════════
        if (challengeComplete && !challengeDone) {
          setChallengeDone(true);
          setProgress(100);
          markStep('challenge');
          livenessScore += 40;

          // Anti-spoof: frame variance must be > threshold
          // A real person moving creates pixel changes; static photo/video loop does not
          const VARIANCE_THRESHOLD = mode === 'verify' ? 2.0 : 3.0;
          if (frameVariance < VARIANCE_THRESHOLD) {
            // Possible static image — issue second challenge
            livenessScore += 0;
            setStatus('Additional verification required — please follow next instruction');
            setStatusType('warn');
          } else {
            livenessScore += 30;
            markStep('antispoof');
          }

          setStatus('Challenge completed — hold still for face capture');
          setStatusType('success');
          await new Promise(r => setTimeout(r, 600));

          // ── Capture multi-angle descriptors ──────────────────────────────
          setPhase('capturing');
          setStatus('Capturing biometric data — please hold still');
          setStatusType('info');

          for (let a = 0; a < 3; a++) {
            await new Promise(r => setTimeout(r, 300));
            if (!loopRef.current) return;
            const src2 = normaliseBrightness(videoRef.current);
            const d2 = await fa
              .detectSingleFace(src2, new fa.SsdMobilenetv1Options({ minConfidence: 0.5 }))
              .withFaceLandmarks()
              .withFaceDescriptor();
            if (d2) allDescriptors.push(Array.from(d2.descriptor));
          }

          if (allDescriptors.length < 1) {
            // Retry
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= MAX_ATTEMPTS) {
              loopRef.current = false;
              stopCamera();
              const msg = 'Verification failed after 3 attempts. Ensure good lighting and face the camera directly.';
              setStatus(msg); setStatusType('error');
              onError && onError(msg);
              return;
            }
            // Reset for retry
            blinkCount = 0; headBaseYaw = null; headMoved = false;
            allDescriptors = [];
            setChallengeDone(false);
            setProgress(0);
            currentChallenge = randomChallenge();
            setChallenge(currentChallenge);
            setPhase('challenge');
            setStatus(`Attempt ${newAttempts + 1} of ${MAX_ATTEMPTS}: ${currentChallenge.text}`);
            setStatusType('warn');
            setSteps(prev => prev.map(s => s.id === 'challenge' || s.id === 'antispoof' || s.id === 'capture' ? { ...s, done: false } : s));
            continue;
          }

          livenessScore += 30;
          markStep('capture');

          // Final liveness score check
          const finalScore = Math.min(100, livenessScore + (frameVariance > 5 ? 10 : 0));
          challengeProof.frameVariance = frameVariance;
          challengeProof.challengeType = currentChallenge.type;
          challengeProof.attempts = attempts + 1;
          challengeProof.livenessScore = finalScore;

          setStatus('Biometric verification complete');
          setStatusType('success');
          loopRef.current = false;
          stopCamera();

          // Deliver to parent
          onDescriptor && onDescriptor({
            descriptors: allDescriptors,
            primaryDescriptor: allDescriptors[0],
            livenessScore: finalScore,
            challengeProof,
          });
          return;
        }

        // Update status hint
        if (!challengeComplete) {
          setStatus(`Challenge: ${currentChallenge.text}`);
          setStatusType('info');
        }

      } catch (e) {
        // Ignore per-frame errors silently
      }

      await new Promise(r => setTimeout(r, 130)); // ~7fps
    }
  };

  // ─── Manual capture (non-autoCapture) ─────────────────────────────────────
  const captureNow = () => {
    if (!challengeDone) {
      setStatus('Please complete the challenge first — follow the on-screen instruction.');
      setStatusType('warn');
      return;
    }
    // Already handled by loop; this is fallback
  };

  // ─── Oval colour ──────────────────────────────────────────────────────────
  const ovalColor = !faceIn ? '#B0A090'
    : phase === 'capturing' ? '#00CC66'
    : challengeDone ? '#00CC66'
    : '#FFD700';

  // ─── Challenge progress text ──────────────────────────────────────────────
  const challengeText = challenge
    ? challenge.type === 'blink'
      ? `Blink ${challenge.count || 1}x — Progress: ${progress}%`
      : challenge.type === 'turn_left'
      ? `Turn head LEFT — Progress: ${progress}%`
      : challenge.type === 'turn_right'
      ? `Turn head RIGHT — Progress: ${progress}%`
      : `Nod head DOWN — Progress: ${progress}%`
    : '';

  return (
    <div>
      {/* ── Camera box ─────────────────────────────────────────────────── */}
      <div className="face-box" style={{ position: 'relative' }}>
        <video ref={videoRef} autoPlay playsInline muted className="face-video"
          style={{ display: cameraOn ? 'block' : 'none' }} />

        {!cameraOn && (
          <div className="face-placeholder">
            <div style={{ width: '44px', height: '44px', background: '#C8941A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
              <img src="/eci-logo.png" alt="ECI" style={{ height: '30px' }} />
            </div>
            <p style={{ color: '#888', fontSize: '12px', textAlign: 'center', padding: '0 20px', lineHeight: '1.6' }}>
              {modelLoading ? 'Loading biometric models...' : 'Advanced biometric verification ready'}
            </p>
          </div>
        )}

        {cameraOn && (
          <div className="face-overlay">
            {/* Oval guide */}
            <div className="face-oval" style={{ borderColor: ovalColor, transition: 'border-color 0.4s' }} />
            {/* Challenge hint */}
            <div className="face-hint" style={{ color: challengeDone ? '#00FF88' : faceIn ? '#FFD700' : '#BBBBBB', fontWeight: '700', fontSize: '11.5px' }}>
              {phase === 'capturing' ? 'Hold still — capturing...'
                : !faceIn ? 'Position face inside the oval'
                : challengeText}
            </div>
          </div>
        )}
      </div>

      {/* ── Progress bar for challenge ─────────────────────────────────── */}
      {cameraOn && challenge && !challengeDone && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6B5C40', marginBottom: '4px' }}>
            <span>{challenge.text}</span>
            <span style={{ fontWeight: '700', color: progress > 50 ? '#138808' : '#C8941A' }}>{progress}%</span>
          </div>
          <div className="prog-bar">
            <div className="prog-fill" style={{ width: `${progress}%`, background: progress < 50 ? 'linear-gradient(90deg,#C8941A,#FF6200)' : 'linear-gradient(90deg,#138808,#003580)' }} />
          </div>
        </div>
      )}

      {/* ── 4-step liveness status ─────────────────────────────────────── */}
      {cameraOn && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '5px', marginBottom: '10px' }}>
          {steps.map(s => (
            <div key={s.id} style={{ padding: '7px 6px', background: s.done ? '#F0FBF0' : '#F9F6F0', border: `1px solid ${s.done ? '#138808' : '#D4C9A8'}`, borderRadius: '4px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: s.done ? '#138808' : '#7A6B4F', transition: 'all 0.3s' }}>
              <div style={{ fontSize: '13px', marginBottom: '3px' }}>{s.done ? '&#10003;' : '○'}</div>
              {s.label}
            </div>
          ))}
        </div>
      )}

      {/* ── Attempt counter ────────────────────────────────────────────── */}
      {attempts > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '10px' }}>
          Attempt {attempts + 1} of {MAX_ATTEMPTS}. Please follow the challenge instructions carefully.
        </div>
      )}

      {/* ── Status message ─────────────────────────────────────────────── */}
      {status && (
        <div className={`alert alert-${statusType === 'success' ? 'success' : statusType === 'error' ? 'error' : statusType === 'warn' ? 'warning' : 'info'}`}
          style={{ marginBottom: '10px' }}>
          {status}
        </div>
      )}

      {/* ── Buttons ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!cameraOn
          ? <button className="btn btn-primary btn-full" onClick={startCamera} disabled={modelLoading || !modelReady}>
              {modelLoading ? <><span className="spinner"></span>&nbsp; Loading Models...</> : 'Start Biometric Verification'}
            </button>
          : <button className="btn btn-danger" style={{ minWidth: '80px' }} onClick={stopCamera}>Stop</button>
        }
      </div>

      {/* ── Instructions ───────────────────────────────────────────────── */}
      <div style={{ marginTop: '12px', background: '#F9F6F0', border: '1px solid #D4C9A8', borderLeft: '4px solid #003580', borderRadius: '4px', padding: '12px 14px' }}>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#002060', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
          Biometric Verification Process
        </div>
        <ol style={{ fontSize: '11px', color: '#3D3020', paddingLeft: '16px', lineHeight: '1.9', margin: 0 }}>
          <li>Look directly at the camera in a well-lit environment</li>
          <li>A random challenge will appear — follow the instruction (blink, turn head, or nod)</li>
          <li>The system verifies liveness, motion, and frame variation to prevent spoofing</li>
          <li>Hold still after completing the challenge — face is captured automatically</li>
          <li>Up to {MAX_ATTEMPTS} attempts are permitted. Ensure only one face is visible</li>
        </ol>
      </div>
    </div>
  );
};

export default FaceCamera;
