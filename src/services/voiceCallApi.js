import {
  requestClientVoiceCallCapability,
  watchClientVoiceCallCapability,
} from './voiceCallSocket';

const SERVER_BASE_URL = (
  process.env.REACT_APP_BASE_API_URL || 'https://server.ooms.in/client'
).replace(/\/client\/?$/, '').replace(/\/$/, '');
const API_BASE = (
  process.env.REACT_APP_VOICE_CALLS_API_URL ||
  `${SERVER_BASE_URL}/api/v1/voice-calls`
).replace(/\/$/, '');

function getSessionHeaders() {
  const raw = localStorage.getItem('ooms_user_data');
  if (!raw) throw new Error('Sign in to OOMS to use voice calling.');

  let user;
  try {
    user = JSON.parse(raw);
  } catch {
    throw new Error('Saved OOMS session is invalid. Please sign in again.');
  }

  if (!user?.token || !user?.username) {
    throw new Error('Your OOMS session is missing required call credentials. Please sign in again.');
  }

  const headers = {
    token: user.token,
    username: user.username,
    'Content-Type': 'application/json',
  };
  const mobile = user.mobile;
  const countryCode = user?.country_code || user?.countrycode || user?.countryCode;
  if (mobile) headers.mobile = mobile;
  if (countryCode) headers.countrycode = countryCode;
  return headers;
}

async function request(path, { method = 'GET', body, idempotencyKey } = {}) {
  const headers = getSessionHeaders();
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('The voice-call server did not respond in time. Please try again.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error('The voice-call server returned an invalid response.');
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.message || 'Voice call request failed.');
  }
  return payload;
}

export const voiceCallApi = {
  getHistory: ({ page = 1, limit = 25, status, direction } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    if (direction) params.set('direction', direction);
    return request(`/client/history?${params.toString()}`);
  },
  getIncoming: () => request('/client/incoming'),
  getClientCall: (callId) => request(`/client/${encodeURIComponent(callId)}`),
  clientCapability: (staffUsername) =>
    requestClientVoiceCallCapability(staffUsername),
  watchClientCapability: (staffUsername, onUpdate) =>
    watchClientVoiceCallCapability(staffUsername, onUpdate),
  createClientCall: (staffUsername) =>
    request('/client/create', {
      method: 'POST',
      body: { staff_username: staffUsername },
      idempotencyKey: `web_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`,
    }),
  respondToClientCall: (callId, action) =>
    request(`/client/${encodeURIComponent(callId)}/respond`, {
      method: 'POST',
      body: { action },
    }),
  getClientToken: (callId) =>
    request(`/client/${encodeURIComponent(callId)}/token`, { method: 'POST' }),
  endClientCall: (callId) =>
    request(`/client/${encodeURIComponent(callId)}/end`, { method: 'POST' }),
};
