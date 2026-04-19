import React, { useState, useRef, useEffect } from 'react';

// ── ECI HELP ASSISTANT ─────────────────────────────────────────────────────────
// Keyword-based intelligent chatbot for the ECI Digital Voting System.
// No API required — all responses are local. Covers 100+ real user questions.

const KB = [
  // ── REGISTRATION ────────────────────────────────────────────────────────────
  { keys: ['register','sign up','new account','create account','join','enrollment','enrol'], ans: 'To register as a voter, click "Register" in the navigation bar. You will be asked to fill in your full name, email address, password, and then capture your face with blink verification. Both steps are mandatory.' },
  { keys: ['how to register','registration process','steps to register'], ans: 'Registration has two steps: (1) Fill in your personal details and accept the statutory declaration. (2) Capture your face with blink verification — this is mandatory and cannot be skipped.' },
  { keys: ['face registration','register face','biometric registration','enroll face'], ans: 'During Step 2 of registration, you will be asked to start your camera, look into it, and blink once naturally. The system will detect your blink to confirm liveness and then save your face securely.' },
  { keys: ['blink','liveness','proof of life','real person'], ans: 'The blink verification ensures you are a real person and not a photograph or screen. Simply look at the camera and blink once — the system detects the blink automatically and captures your face.' },
  { keys: ['registration failed','cannot register','registration error'], ans: 'If registration fails, check that: (1) Your email is not already registered. (2) Your face is unique and not already used by another account. (3) Your camera has permission. Contact helpdesk@eci.gov.in if the issue persists.' },
  { keys: ['duplicate face','face already registered','same face'], ans: 'Each voter must register with a unique face. If the system detects your face is already linked to another account, registration will be rejected. This prevents multiple accounts for one person. Contact helpdesk@eci.gov.in for assistance.' },
  { keys: ['email already','email taken','email exists'], ans: 'Each email address can only be registered once. If your email is already registered, try logging in with your password. If you forgot your password, contact helpdesk@eci.gov.in.' },
  { keys: ['what details','information needed','what do i need to register'], ans: 'You need: (1) Your full name as per official ID. (2) A valid email address. (3) A password (minimum 6 characters). (4) A working camera for face registration.' },
  { keys: ['age requirement','minimum age','how old','18 years'], ans: 'You must be at least 18 years of age to register as a voter, as required by the Constitution of India and the Representation of the People Act, 1951.' },
  { keys: ['declaration','statutory declaration','terms and conditions'], ans: 'During registration, you must accept a statutory declaration confirming you are a citizen of India, above 18 years of age, and that all information provided is accurate. False information is an electoral offence.' },

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  { keys: ['login','sign in','log in','access account'], ans: 'You can login in two ways: (1) Password Login — enter your registered email and password. (2) Biometric Login — look into the camera and blink once for face recognition.' },
  { keys: ['forgot password','reset password','password recovery'], ans: 'If you have forgotten your password, please contact the ECI helpdesk at helpdesk@eci.gov.in or call 1800-111-950 (Toll Free) for assistance with account recovery.' },
  { keys: ['face login','biometric login','login with face'], ans: 'For biometric login, go to the Login page, select the "Biometric Login" tab, click Start Camera, look directly at the camera in good lighting, and blink once. You will be logged in automatically.' },
  { keys: ['wrong password','invalid password','password incorrect'], ans: 'If your password is incorrect, please try again carefully. Passwords are case-sensitive. If you have forgotten your password, contact helpdesk@eci.gov.in.' },
  { keys: ['account locked','account blocked','cannot login'], ans: 'If you are unable to login, ensure your email and password are correct. If your face is not being recognised, try password login instead. For further assistance, contact helpdesk@eci.gov.in.' },
  { keys: ['logout','sign out','end session'], ans: 'To logout, click the "Logout" button in the navigation bar. Always logout after voting, especially on shared devices.' },
  { keys: ['session expired','token expired','logged out automatically'], ans: 'Your session expires after 1 hour for security. Please login again to continue. This is a security feature to protect your account.' },

  // ── VOTING ───────────────────────────────────────────────────────────────────
  { keys: ['how to vote','cast vote','voting process','steps to vote'], ans: 'To vote: (1) Go to "Cast Vote". (2) Select the active election. (3) Complete face verification — look at camera and blink. (4) Select your preferred candidate. (5) Review your choice and submit. Your vote is final.' },
  { keys: ['face verification','verify face before voting','biometric before vote'], ans: 'Before casting your vote, you must complete biometric face verification. Look into the camera and blink once. The system will match your face with your registered biometric data.' },
  { keys: ['select candidate','choose candidate','how to select'], ans: 'After face verification, a list of candidates for the active election will be displayed. Click on your preferred candidate to select them. A tick mark will appear. Then click "Review and Confirm".' },
  { keys: ['confirm vote','submit vote','final vote'], ans: 'On the confirmation screen, review your vote summary carefully — voter ID, election, candidate name, and face verification status. Once you click "Submit My Vote", your vote is final and cannot be changed.' },
  { keys: ['can i change vote','change my vote','undo vote'], ans: 'No. Once your vote is submitted, it is final and cannot be changed or withdrawn. This is in accordance with electoral laws. Please review your choice carefully before submitting.' },
  { keys: ['vote twice','vote again','multiple votes','duplicate vote'], ans: 'The system strictly prevents duplicate voting. Each voter can cast only one vote per election. If you attempt to vote again, the system will display an error message.' },
  { keys: ['vote not recorded','vote failed','voting error'], ans: 'If your vote was not recorded, check your internet connection and try again. Do not attempt to vote twice. If the issue persists, contact helpdesk@eci.gov.in immediately.' },
  { keys: ['active election','current election','election in progress'], ans: 'Active elections are those currently open for voting. Go to "Cast Vote" to see all active elections. If no elections are listed, there are currently no active elections.' },
  { keys: ['when can i vote','voting time','voting hours','voting schedule'], ans: 'Voting is available during the period when an election is in ACTIVE status. The election administrator starts and ends the voting period. Check the Elections page for current status.' },
  { keys: ['no election','no active election','nothing to vote'], ans: 'If no active elections are showing, either no election has been started yet, or the election period has ended. Check the Elections page for upcoming elections.' },

  // ── FACE RECOGNITION ─────────────────────────────────────────────────────────
  { keys: ['face not recognised','face not detected','face error','face recognition failed'], ans: 'If your face is not being recognised: (1) Ensure good lighting — avoid backlight. (2) Look directly at the camera. (3) Remove glasses if possible. (4) Only one person should be in the frame. (5) Try blinking clearly and naturally.' },
  { keys: ['camera not working','camera access denied','no camera','camera permission'], ans: 'If the camera is not working: (1) Click "Allow" when the browser asks for camera permission. (2) Check browser settings — go to Settings > Privacy > Camera and allow access for this site. (3) Ensure no other application is using the camera.' },
  { keys: ['how does face recognition work','face api','face technology'], ans: 'The system uses face-api.js, a neural network library that runs entirely in your browser. It analyses 128 facial points (landmarks) and creates a unique biometric descriptor. This is compared with your registered face using Euclidean distance matching.' },
  { keys: ['is face data safe','face privacy','face data stored','biometric security'], ans: 'Your face data (biometric descriptor — 128 numerical values) is encrypted and stored securely on ECI servers. It is used solely for voter identity verification and is never shared with any third party. Reference: IT Act 2000, Section 43A.' },
  { keys: ['can i use photo','photo attack','spoof face'], ans: 'No. The blink detection liveness check prevents photo attacks. A printed photograph or screen image cannot blink, so it will be rejected by the system. You must be physically present in front of the camera.' },
  { keys: ['glasses','remove glasses','spectacles'], ans: 'Glasses can sometimes interfere with face detection. If the system is having difficulty recognising you, try removing your glasses temporarily. Ensure good, even lighting and look directly at the camera.' },
  { keys: ['dark room','lighting','brightness'], ans: 'Good lighting is essential for face recognition. Ensure: (1) Your face is well-lit from the front. (2) There is no strong backlight (like a window behind you). (3) The room is not too dark. (4) Natural daylight or a front-facing lamp works best.' },

  // ── RESULTS ──────────────────────────────────────────────────────────────────
  { keys: ['results','election results','who won','winner'], ans: 'Election results are officially declared only when the Election Commission administrator formally closes the election. Until then, results are sealed. Once declared, you can view them on the Results page.' },
  { keys: ['when results','results announced','result date','result time'], ans: 'Results are announced when the Election Commission administrator officially closes the election. There is no fixed time — the administrator decides when to formally release the results.' },
  { keys: ['live count','live votes','real time count'], ans: 'Live vote counts are confidential and visible only to the Election Commission administrator. Voters will see a "Results Will Be Declared Soon" message until the election is officially closed and results are released.' },
  { keys: ['results not showing','cannot see results','results page empty'], ans: 'If results are not showing, it means the Election Commission has not yet officially declared them. Results are released only after the administrator formally closes the election. Please check back later.' },
  { keys: ['result marquee','scrolling banner','winner announcement'], ans: 'When results are officially declared, a scrolling announcement banner appears at the top of every page showing the winner\'s name, votes secured, and declaration date.' },
  { keys: ['how many voted','total votes','voter turnout'], ans: 'Total vote count is displayed on the Results page after the election is officially declared. During the election, this information is confidential and visible only to the administrator.' },

  // ── ELECTIONS ────────────────────────────────────────────────────────────────
  { keys: ['upcoming election','future election','next election'], ans: 'Upcoming elections are those created by the administrator but not yet started. You can view them on the Elections page. You cannot vote in an upcoming election — voting begins only when the administrator starts it.' },
  { keys: ['closed election','completed election','finished election'], ans: 'Closed elections are those that have ended. Their official results are publicly available on the Results page. You cannot vote in a closed election.' },
  { keys: ['election status','what is active','what is upcoming','what is closed'], ans: 'Elections have three statuses: UPCOMING (created, not yet open for voting), ACTIVE (currently open — you can vote), CLOSED (ended — results officially declared).' },
  { keys: ['how many candidates','number of candidates','candidate list'], ans: 'The list of candidates for each election is set by the administrator. Go to "Cast Vote" and select the election to see all candidates. A minimum of 2 candidates is required before voting can begin.' },
  { keys: ['candidate information','who are candidates','candidate details'], ans: 'Candidate details including name and party affiliation are available on the Cast Vote page when you select an active election. Select your preferred candidate to proceed.' },

  // ── ADMIN ─────────────────────────────────────────────────────────────────────
  { keys: ['admin','administrator','admin panel'], ans: 'The Admin Panel is accessible only to authorised Election Officials. It allows creation and management of elections, adding candidates, starting/ending elections, and viewing confidential live vote counts.' },
  { keys: ['who is admin','admin access','admin rights'], ans: 'Admin access is granted only to authorised Election Commission officials. If you need admin access, contact your Election Commission supervisor.' },
  { keys: ['create election','how to create election'], ans: 'Administrators can create elections from the Admin Panel under the "Create Election" tab. Enter the title and description. The election starts with UPCOMING status.' },
  { keys: ['add candidate','how to add candidate'], ans: 'Administrators add candidates from the Admin Panel under the "Add Candidates" tab. Select the target election, enter the candidate name and party. At least 2 candidates must be added before starting.' },
  { keys: ['start election','how to start voting','begin election'], ans: 'Administrators start an election from the Admin Panel. The election must have at least 2 candidates and be in UPCOMING status. Once started, it becomes ACTIVE and voting opens.' },
  { keys: ['end election','close election','stop voting','announce results'], ans: 'Administrators end an election by clicking "End and Release Results" in the Admin Panel. This closes voting and officially releases results to all voters. This action cannot be undone.' },

  // ── SECURITY & PRIVACY ───────────────────────────────────────────────────────
  { keys: ['is my vote secret','secret ballot','anonymous vote','vote privacy'], ans: 'Yes. Your vote is secret. The system records that you voted (to prevent duplicates) but your specific choice is stored separately in an encrypted format and cannot be linked back to you individually.' },
  { keys: ['is it secure','security','safe to vote','data security'], ans: 'Yes. The system uses: JWT tokens for secure sessions, BCrypt encryption for passwords, biometric liveness detection, unique face enforcement, database-level duplicate prevention, and encrypted vote storage.' },
  { keys: ['data privacy','personal data','my information'], ans: 'Your personal data (name, email, biometric descriptor) is stored on ECI servers under the provisions of the IT Act 2000. It is used only for voter identity verification and is never sold or shared with third parties.' },
  { keys: ['gdpr','data protection','information act'], ans: 'This system complies with the Information Technology Act 2000, Section 43A (Data Protection) and relevant provisions of the Constitution of India regarding the right to privacy.' },
  { keys: ['hack','hacking','security breach','fraud'], ans: 'The system has multiple anti-fraud measures: blink detection prevents photo attacks, unique face enforcement prevents multiple accounts, JWT tokens prevent session hijacking, and database constraints prevent duplicate votes.' },

  // ── TECHNICAL ───────────────────────────────────────────────────────────────
  { keys: ['browser','which browser','supported browser','chrome firefox'], ans: 'The system works best on Google Chrome or Mozilla Firefox (latest version). Internet Explorer is not supported. Ensure your browser is up to date for the best experience.' },
  { keys: ['mobile','phone','smartphone','tablet'], ans: 'The system is accessible on mobile devices with a camera. Use Chrome or Firefox on Android, or Safari on iOS. Ensure camera permissions are granted to the browser.' },
  { keys: ['internet','connection required','offline','no internet'], ans: 'An internet connection is required to use this system. The face recognition models (~6 MB) are loaded once on first use and cached by the browser for faster subsequent use.' },
  { keys: ['slow','loading','website slow','taking long'], ans: 'Slow performance may be due to: (1) Slow internet connection. (2) First-time loading of face recognition models (~6 MB). (3) High server load. Try refreshing the page or checking your internet connection.' },
  { keys: ['model loading','face model','loading models'], ans: 'Face recognition models (~6 MB) are loaded from a CDN on first use. This may take 10-20 seconds depending on your internet speed. Subsequent uses are faster as the models are cached in your browser.' },
  { keys: ['error 403','forbidden','access denied'], ans: 'A 403 error means you do not have permission to access that resource. This may occur if your session has expired. Please logout and login again. If the issue persists, contact support.' },
  { keys: ['error 404','not found','page not found'], ans: 'A 404 error means the page or resource was not found. Use the navigation menu to access valid pages. If you believe this is an error, contact helpdesk@eci.gov.in.' },
  { keys: ['error 500','server error','internal error'], ans: 'A 500 error indicates a server-side issue. Please try again after a few minutes. If the problem persists, contact helpdesk@eci.gov.in with the time and details of the error.' },

  // ── VOTER ID ─────────────────────────────────────────────────────────────────
  { keys: ['voter id','my voter id','eci id','voter number'], ans: 'Your digital Voter ID is shown in the navigation bar after login (e.g., ECI-000001). It is also displayed on the My Profile page and in your vote confirmation receipt.' },
  { keys: ['voter card','physical voter card','voter id card'], ans: 'This is a digital voting platform. Your digital Voter ID (ECI-XXXXXX) serves as your identifier in this system. For physical Voter ID cards, visit the official Election Commission website at eci.gov.in.' },

  // ── PROFILE ──────────────────────────────────────────────────────────────────
  { keys: ['my profile','profile page','account details','view account'], ans: 'Your profile page shows your voter ID, name, email, account type, and face registration status. You can also update your face registration from this page if needed.' },
  { keys: ['update face','change face','re-register face','update biometric'], ans: 'You can update your face registration from the My Profile page. Click "Update Face Registration" and follow the camera instructions. Your old face data will be replaced.' },
  { keys: ['change email','update email','change password','update password'], ans: 'For changes to your email or password, please contact the ECI helpdesk at helpdesk@eci.gov.in or call 1800-111-950. For security reasons, these changes cannot be made through the web interface.' },
  { keys: ['delete account','remove account','deregister'], ans: 'Account deletion requests must be submitted in writing to the Election Commission. Contact helpdesk@eci.gov.in. Note that you cannot deregister during an active election period.' },

  // ── ECI INFORMATION ──────────────────────────────────────────────────────────
  { keys: ['what is eci','election commission','about eci'], ans: 'The Election Commission of India (ECI) is an autonomous constitutional authority responsible for administering Union and State election processes. It was established on 25 January 1950 under Article 324 of the Constitution of India.' },
  { keys: ['address','office address','eci office','nirvachan sadan'], ans: 'Election Commission of India, Nirvachan Sadan, Ashoka Road, New Delhi — 110001. Phone: 1800-111-950 (Toll Free). Email: complaints@eci.gov.in.' },
  { keys: ['helpdesk','support','contact','help'], ans: 'For technical support: Email helpdesk@eci.gov.in or call 1800-111-950 (Toll Free, available 24x7 during election periods). For general enquiries: complaints@eci.gov.in.' },
  { keys: ['toll free','helpline','phone number','1800'], ans: 'ECI Toll Free Helpline: 1800-111-950 (available 24x7 during election periods). For technical support: helpdesk@eci.gov.in.' },
  { keys: ['pilot','pilot project','dfrvs'], ans: 'DFRVS (Digital Face Recognition Voting System) is a pilot project of the Election Commission of India to modernise the voting process using biometric face recognition technology.' },
  { keys: ['what is digital voting','e-voting','electronic voting','online voting'], ans: 'Digital voting allows eligible voters to cast their vote electronically using biometric face recognition instead of paper ballots. This system ensures accuracy, prevents fraud, and enables real-time results.' },
  { keys: ['representation of people act','electoral law','voting rights'], ans: 'The right to vote in India is governed by the Constitution of India (Article 326) and the Representation of the People Act, 1951. All citizens above 18 years are eligible to vote in elections.' },

  // ── COMMON QUESTIONS ─────────────────────────────────────────────────────────
  { keys: ['is this official','official website','government website'], ans: 'Yes, this is an official pilot project of the Election Commission of India. The system is administered by authorised ECI officials. For the main ECI website, visit eci.gov.in.' },
  { keys: ['cost','free','fee','charge','payment'], ans: 'Voter registration and voting are completely free of charge. There are no fees of any kind. If anyone asks you to pay for voting or registration, please report it to helpdesk@eci.gov.in immediately.' },
  { keys: ['complaint','report problem','raise issue','grievance'], ans: 'To raise a complaint or report a problem: Email complaints@eci.gov.in or call 1800-111-950. You can also report electoral malpractice through the official ECI website at eci.gov.in.' },
  { keys: ['who can vote','eligible voters','voting eligibility'], ans: 'Any citizen of India who: (1) Is 18 years or above. (2) Is not disqualified under the Constitution or any law. (3) Has registered on this platform with a unique face. is eligible to vote.' },
  { keys: ['notification','email notification','sms','alert'], ans: 'Currently, the system does not send email or SMS notifications. Please check the Elections page regularly for upcoming and active elections, or contact your local Election Office for schedules.' },
  { keys: ['rti','right to information','information request'], ans: 'For RTI (Right to Information) requests regarding this system, please contact the Central Public Information Officer (CPIO), Election Commission of India, Nirvachan Sadan, New Delhi — 110001.' },
  { keys: ['differently abled','disability','accessibility'], ans: 'This system is designed to be accessible. If you require special assistance due to a disability, contact helpdesk@eci.gov.in or call 1800-111-950 for personalised support.' },
  { keys: ['multiple devices','different computer','different phone'], ans: 'You can login from any device with a camera and internet connection. Your face registration is linked to your account, not to a specific device.' },
  { keys: ['incognito','private browsing','cache','cookies'], ans: 'The system works in both normal and private/incognito browsing mode. However, face recognition models may need to reload each time in incognito mode as cached data is not retained.' },
  { keys: ['how long','duration','time to vote'], ans: 'The voting process typically takes 2-3 minutes: 30 seconds to select the election, 30-60 seconds for face verification, and 1 minute to select and confirm your vote.' },
  { keys: ['receipt','confirmation','proof of vote'], ans: 'After successfully casting your vote, a confirmation screen displays your voter ID, election name, candidate name, party, and timestamp. Take a screenshot for your records.' },
  { keys: ['recount','audit','vote verification'], ans: 'All votes are recorded in an encrypted database with timestamps. The Election Commission can conduct audits as required by law. Individual vote choices remain confidential in accordance with secret ballot principles.' },
  { keys: ['power cut','power failure','internet goes out','connection lost'], ans: 'If you lose power or internet during voting, your vote may not have been recorded. After reconnecting, login and attempt to vote again. The system will inform you if your vote was already recorded.' },
  { keys: ['what if two candidates same votes','tie','draw'], ans: 'In case of a tie in vote count, the matter is handled in accordance with the applicable electoral rules and the discretion of the Returning Officer. The system displays the exact vote count for all candidates.' },
  { keys: ['how many elections','total elections','election count'], ans: 'You can view all elections (upcoming, active, and closed) on the Elections page. The total count is also visible in the Admin Panel statistics for authorised officials.' },
  { keys: ['candidate party','political party','party name'], ans: 'Each candidate\'s party affiliation is displayed alongside their name during the voting process. Candidate and party information is set by the Election Commission administrator.' },
  { keys: ['hello','hi','hey','greetings','good morning','good evening'], ans: 'Welcome to the ECI Digital Voting System Help Assistant. I can answer your questions about voter registration, face recognition, casting votes, election results, and more. How may I assist you?' },
  { keys: ['thank','thanks','thank you','thnx'], ans: 'You are welcome. If you have any further questions about the ECI Digital Voting System, please do not hesitate to ask. For complex issues, contact helpdesk@eci.gov.in or call 1800-111-950.' },
  { keys: ['bye','goodbye','exit','done'], ans: 'Thank you for using the ECI Help Assistant. If you need further assistance, contact helpdesk@eci.gov.in or call 1800-111-950. Satyameva Jayate.' },
];

const SUGGESTIONS = [
  'How to register?', 'How to vote?', 'Face not recognised', 'When are results?',
  'Forgot password', 'Contact ECI', 'Is my vote secret?', 'What is blink check?',
];

const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const getAnswer = (input) => {
  const q = input.toLowerCase().trim();
  if (!q) return null;

  // Score each KB entry
  let best = null, bestScore = 0;
  for (const entry of KB) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.split(' ').length * 2;
      else if (key.split(' ').some(w => q.includes(w))) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  if (best && bestScore > 0) return best.ans;

  return 'I am sorry, I could not find a specific answer to your query. For detailed assistance, please contact the ECI helpdesk at helpdesk@eci.gov.in or call 1800-111-950 (Toll Free). You may also browse the Elections page or your Profile for more information.';
};

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Namaste. Welcome to the ECI Digital Voting System Help Assistant. I can assist you with voter registration, face verification, casting votes, election results, and more. How may I help you?', time: getTime() }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    const userMsg = { from: 'user', text: q, time: getTime() };
    const ans = getAnswer(q);
    const botMsg = { from: 'bot', text: ans, time: getTime() };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleKey = e => { if (e.key === 'Enter') send(); };

  return (
    <>
      {/* FAB button */}
      <button className="chatbot-fab" onClick={() => setOpen(o => !o)} title="ECI Help Assistant" aria-label="Open Help Assistant">
        {open
          ? <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          : <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
        }
      </button>

      {/* Chat Window */}
      {open && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-head">
            <img src="/eci-logo.png" alt="ECI" />
            <div className="chatbot-head-text">
              <h4>ECI Help Assistant</h4>
              <p>Digital Voting System Support</p>
            </div>
            <button className="chatbot-close" onClick={() => setOpen(false)} aria-label="Close">&times;</button>
          </div>

          {/* Messages */}
          <div className="chatbot-msgs">
            {messages.map((m, i) => (
              <div key={i} className={m.from === 'bot' ? 'msg-bot' : 'msg-user'}>
                {m.text}
                <span className="msg-time">{m.time}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick chips */}
          <div className="chatbot-suggestions">
            {SUGGESTIONS.map(s => (
              <button key={s} className="chatbot-chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          {/* Input row */}
          <div className="chatbot-input-row">
            <input
              className="chatbot-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your question..."
              aria-label="Type your question"
            />
            <button className="chatbot-send" onClick={() => send()}>Send</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
