import axios from 'axios';

// const BASE_URL = 'https://digi-vote-b.onrender.com';//updated Backend

const BASE_URL = 'http://localhost:8080';


const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (email, password) => api.post('/auth/login', { email, password });

// Face - sends full biometric payload (multi-descriptor + liveness proof)
// payload = { descriptors, primaryDescriptor, livenessScore, challengeProof }
export const registerFaceDescriptor = (userId, payload) =>
  api.post('/face/register', { userId, ...payload });

export const loginWithFaceDescriptor = (payload) =>
  api.post('/face/login', { ...payload });

// User
export const getProfile = () => api.get('/user/profile');

// Elections
export const getElections = () => api.get('/elections');
export const getElectionById = (id) => api.get(`/elections/${id}`);

// Candidates
export const getCandidatesByElection = (electionId) =>
  api.get(`/candidates/election/${electionId}`);

// Vote
export const castVote = (electionId, candidateId) =>
  api.post('/vote/castVote', { electionId, candidateId });

// Results
export const getResults = (electionId) => api.get(`/results/${electionId}`);

// Admin
export const adminCreateElection = (data) => api.post('/admin/election', data);
export const adminAddCandidate = (electionId, candidate) =>
  api.post(`/admin/candidate?electionId=${electionId}`, candidate);
export const adminStartElection = (id) => api.put(`/admin/election/start/${id}`);
export const adminEndElection = (id) => api.put(`/admin/election/end/${id}`);
export const adminGetElections = () => api.get('/admin/elections');

export default api;
