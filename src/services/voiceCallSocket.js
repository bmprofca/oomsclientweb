import { io } from 'socket.io-client';

const API_BASE = (
  process.env.REACT_APP_VOICE_CALLS_API_URL ||
  `${(process.env.REACT_APP_BASE_API_URL || 'https://server.ooms.in/client')
    .replace(/\/client\/?$/, '')
    .replace(/\/$/, '')}/api/v1/voice-calls`
).replace(/\/$/, '');

export function connectClientVoiceCallSocket() {
  const socket = io(new URL(API_BASE).origin, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    timeout: 10000,
    autoConnect: false,
  });

  socket.connect();
  return socket;
}

export function requestClientVoiceCallCapability(staffUsername) {
  return new Promise((resolve, reject) => {
    const raw = localStorage.getItem('ooms_user_data');
    let user;
    try {
      user = raw ? JSON.parse(raw) : null;
    } catch {
      reject(new Error('Saved OOMS session is invalid. Please sign in again.'));
      return;
    }
    if (!user?.token || !user?.username) {
      reject(new Error('Sign in to OOMS to use voice calling.'));
      return;
    }

    const socket = io(new URL(API_BASE).origin, {
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
    });
    const timer = window.setTimeout(() => {
      socket.disconnect();
      reject(new Error('The voice-call server did not respond in time.'));
    }, 12000);
    const finish = (error, response) => {
      window.clearTimeout(timer);
      socket.disconnect();
      if (error) reject(error);
      else resolve(response);
    };
    socket.on('connect', () => {
      socket.emit(
        'voice_call_auth',
        { username: user.username, token: user.token },
        (authResponse) => {
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
        },
      );
    });
    socket.on('connect_error', (error) => finish(error));
  });
}
