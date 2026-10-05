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
