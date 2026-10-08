import { io } from 'socket.io-client';

const API_BASE = (
  process.env.REACT_APP_VOICE_CALLS_API_URL ||
  `${(process.env.REACT_APP_BASE_API_URL || 'https://server.ooms.in/client')
    .replace(/\/client\/?$/, '')
    .replace(/\/$/, '')}/api/v1/voice-calls`
).replace(/\/$/, '');

export function getClientVoiceCallSessionId() {
  let sessionId = sessionStorage.getItem('ooms_voice_call_session_id');
  if (!sessionId) {
    sessionId = `web:${window.crypto.randomUUID()}`;
    sessionStorage.setItem('ooms_voice_call_session_id', sessionId);
  }
  return sessionId;
}

export function connectClientVoiceCallSocket() {
  const user = readClientSession();
  const socket = io(new URL(API_BASE).origin, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    timeout: 10000,
    autoConnect: false,
  });
  socket.on('connect', () => {
    socket.emit('voice_call_auth', {
      username: user.username,
      token: user.token,
      voice_call_session_id: getClientVoiceCallSessionId(),
    }, (response) => {
      if (!response?.authenticated) {
        console.error('Client voice-call socket authentication failed.');
        socket.disconnect();
      }
    });
  });
  socket.connect();
  return socket;
}

function readClientSession() {
  const raw = localStorage.getItem('ooms_user_data');
  let user;
  try {
    user = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error('Saved OOMS session is invalid. Please sign in again.');
  }
  if (!user?.token || !user?.username) {
    throw new Error('Sign in to OOMS to use voice calling.');
  }
  return user;
}

function createCapabilitySocket(reconnection) {
  return io(new URL(API_BASE).origin, {
    transports: ['websocket', 'polling'],
    reconnection,
    reconnectionDelay: 1000,
    timeout: 10000,
  });
}

export function requestClientVoiceCallCapability(staffUsername) {
  const user = readClientSession();
  return new Promise((resolve, reject) => {
    const socket = createCapabilitySocket(false);
    let settled = false;
    const timer = window.setTimeout(() => finish(new Error('The voice-call server did not respond in time.')), 12000);
    const finish = (error, response) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      socket.disconnect();
      if (error) reject(error);
      else resolve(response);
    };
    socket.on('connect', () => {
      socket.emit('voice_call_auth', {
        username: user.username,
        token: user.token,
      }, (authResponse) => {
        if (!authResponse?.authenticated) {
          finish(new Error('Client voice-call socket authentication failed.'));
          return;
        }
        socket.emit(
          'voice_call_capability_check',
          { recipient_username: staffUsername, recipient_panel: 'enduser' },
          (response) => {
            if (!response?.success) {
              finish(new Error(response?.message || 'Could not check call availability.'));
              return;
            }
            finish(null, response);
          },
        );
      });
    });
    socket.on('connect_error', finish);
  });
}

export function watchClientVoiceCallCapability(staffUsername, onUpdate) {
  const user = readClientSession();
  return new Promise((resolve, reject) => {
    const socket = createCapabilitySocket(true);
    const subscriptionId = `web_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let active = true;
    let initialResolved = false;
    const timer = window.setTimeout(() => fail(new Error('The voice-call server did not respond in time.')), 12000);
    const unsubscribe = () => {
      if (!active) return;
      active = false;
      window.clearTimeout(timer);
      socket.emit('voice_call_capability_unwatch', subscriptionId);
      socket.disconnect();
    };
    const fail = (error) => {
      if (initialResolved) {
        onUpdate?.({ success: false, message: error?.message });
        return;
      }
      initialResolved = true;
      active = false;
      window.clearTimeout(timer);
      socket.disconnect();
      reject(error);
    };
    const subscribe = () => {
      socket.emit(
        'voice_call_capability_watch',
        {
          subscription_id: subscriptionId,
          recipient_username: staffUsername,
          recipient_panel: 'enduser',
        },
        (response) => {
          if (!active) return;
          if (!response?.success) {
            fail(new Error(response?.message || 'Could not check call availability.'));
          } else if (!initialResolved) {
            initialResolved = true;
            window.clearTimeout(timer);
            resolve({ capability: response, unsubscribe });
          } else {
            onUpdate?.(response);
          }
        },
      );
    };
    socket.on('connect', () => {
      socket.emit('voice_call_auth', {
        username: user.username,
        token: user.token,
      }, (response) => {
        if (!response?.authenticated) {
          fail(new Error('Client voice-call socket authentication failed.'));
          return;
        }
        subscribe();
      });
    });
    socket.on('voice_call_capability_update', (update) => {
      if (active && update?.subscription_id === subscriptionId) onUpdate?.(update);
    });
    socket.on('connect_error', fail);
    socket.connect();
  });
}
