import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff, X } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { voiceCallApi } from '../services/voiceCallApi';
import { connectClientVoiceCallSocket } from '../services/voiceCallSocket';
import { startCallTone } from '../services/voiceCallTone';

const VoiceCallContext = createContext(null);
const TERMINAL_STATUSES = new Set(['rejected', 'cancelled', 'missed', 'ended', 'failed']);

export function useVoiceCalls() {
  const context = useContext(VoiceCallContext);
  if (!context) throw new Error('useVoiceCalls must be used within VoiceCallProvider');
  return context;
}

export function VoiceCallProvider({ children }) {
  const { userData } = useAuth();
  const [call, setCall] = useState(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const callRef = useRef(null);

  const updateCall = useCallback((nextCall) => {
    const value = typeof nextCall === 'function' ? nextCall(callRef.current) : nextCall;
    callRef.current = value;
    setCall(value);
  }, []);

  useEffect(() => {
    if (call?.status !== 'ringing') return undefined;
    return startCallTone(call.direction === 'incoming' ? 'incoming' : 'outgoing');
  }, [call?.call_id, call?.direction, call?.status]);

  useEffect(() => {
    if (!userData?.token || !userData?.username) {
      updateCall(null);
      return undefined;
    }

    let active = true;
    const acceptIncomingCall = (incomingCall) => {
      if (
        !active ||
        !incomingCall?.call_id ||
        incomingCall.status !== 'ringing' ||
        (callRef.current && !TERMINAL_STATUSES.has(callRef.current.status))
      ) {
        if (incomingCall?.call_id) {
          console.info('Ignoring incoming voice-call event because another call is active or the invitation is not ringing.', {
            call_id: incomingCall.call_id,
            status: incomingCall.status,
          });
        }
        return;
      }
      console.info('Received incoming voice-call invitation.', { call_id: incomingCall.call_id });
      setError('');
      updateCall({ ...incomingCall, direction: 'incoming' });
    };
    const socket = connectClientVoiceCallSocket();
    const checkForMissedIncomingCall = async () => {
      try {
        const response = await voiceCallApi.getIncoming();
        if (response?.data?.call_id) {
          console.info('Recovered incoming voice-call invitation from the server.', {
            call_id: response.data.call_id,
          });
        }
        acceptIncomingCall(response?.data);
      } catch (requestError) {
        console.error('Unable to restore an incoming voice call after reconnect:', requestError);
      }
    };
    const onAuthenticated = (response) => {
      if (response?.authenticated) {
        checkForMissedIncomingCall();
      } else {
        console.error('Client voice-call socket authentication failed.');
        socket.disconnect();
      }
    };
    const onConnectError = (connectError) => {
      console.error('Client voice-call socket connection failed:', connectError);
    };
    const recoverWhenVisible = () => {
      if (document.visibilityState === 'visible') checkForMissedIncomingCall();
    };
    const onConnect = () => {
      socket.emit(
        'voice_call_auth',
        { username: userData.username, token: userData.token },
        onAuthenticated,
      );
    };
    socket.on('connect', onConnect);
    socket.on('voice_call_incoming', acceptIncomingCall);
    socket.on('connect_error', onConnectError);
    window.addEventListener('focus', recoverWhenVisible);
    document.addEventListener('visibilitychange', recoverWhenVisible);
    return () => {
      active = false;
      socket.off('connect', onConnect);
      socket.off('voice_call_incoming', acceptIncomingCall);
      socket.off('connect_error', onConnectError);
      window.removeEventListener('focus', recoverWhenVisible);
      document.removeEventListener('visibilitychange', recoverWhenVisible);
      socket.disconnect();
    };
  }, [userData?.token, userData?.username, updateCall]);

  useEffect(() => {
    if (!call?.call_id || TERMINAL_STATUSES.has(call.status)) return undefined;

    let active = true;
    let timer;
    let requestInProgress = false;
    const pollStatus = async () => {
      if (!active || requestInProgress) return;
      requestInProgress = true;
      try {
        const response = await voiceCallApi.getClientCall(call.call_id);
        if (active) {
          setError('');
          updateCall((current) => current
            ? { ...current, ...response.data, direction: current.direction }
            : current);
        }
      } catch (pollError) {
        if (active) {
          setError(pollError?.message || 'Unable to refresh the call status.');
          console.error('Unable to refresh voice-call status:', pollError);
        }
      } finally {
        requestInProgress = false;
        if (active) timer = window.setTimeout(pollStatus, 1800);
      }
    };

    pollStatus();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [call?.call_id, call?.status, updateCall]);

  const startCall = useCallback(async (staff) => {
    if (!staff?.username) {
      toast.error('This assigned staff member does not have an OOMS username.');
      return;
    }
    if (callRef.current && !TERMINAL_STATUSES.has(callRef.current.status)) {
      toast.error('Finish your current voice call before starting another.');
      return;
    }
    setWorking(true);
    setError('');
    try {
      const capability = await voiceCallApi.clientCapability(staff.username);
      if (!capability?.data?.can_call) {
        throw new Error(capability?.data?.reason || 'This staff member is unavailable for an in-app call.');
      }
      const response = await voiceCallApi.createClientCall(staff.username);
      if (!response?.data?.call_id) throw new Error('The server did not create a call invitation.');
      updateCall({
        ...response.data,
        status: response.data.status || 'ringing',
        other_participant_name: staff.name || response.data.other_participant_name || 'Assigned staff',
        direction: 'outgoing',
      });
    } catch (callError) {
      const message = callError?.message || 'Could not start this call.';
      setError(message);
      toast.error(message);
    } finally {
      setWorking(false);
    }
  }, [updateCall]);

  const respondToCall = useCallback(async (action) => {
    const current = callRef.current;
    if (!current?.call_id || current.direction !== 'incoming') return;
    setWorking(true);
    setError('');
    try {
      const response = await voiceCallApi.respondToClientCall(current.call_id, action);
      updateCall({ ...current, status: response.data.status });
    } catch (responseError) {
      setError(responseError?.message || 'Unable to respond to this call.');
    } finally {
      setWorking(false);
    }
  }, [updateCall]);

  const endCall = useCallback(async () => {
    const current = callRef.current;
    if (!current?.call_id) return;
    setWorking(true);
    setError('');
    try {
      const response = await voiceCallApi.endClientCall(current.call_id);
      updateCall({
        ...current,
        status: response.data.status,
        ended_by_name: response.data.ended_by_name,
      });
    } catch (endError) {
      setError(endError?.message || 'Unable to end this call.');
    } finally {
      setWorking(false);
    }
  }, [updateCall]);

  const dismissCall = useCallback(() => {
    if (callRef.current && !TERMINAL_STATUSES.has(callRef.current.status)) return;
    setError('');
    updateCall(null);
  }, [updateCall]);

  return (
    <VoiceCallContext.Provider value={{ call, working, error, setError, startCall, respondToCall, endCall, dismissCall }}>
      {children}
    </VoiceCallContext.Provider>
  );
}

export function ClientStaffCallButton({ staff }) {
  const { call, working, startCall } = useVoiceCalls();
  const [availability, setAvailability] = useState({
    checking: true,
    canCall: false,
    reason: '',
  });
  const activeCall = call && !TERMINAL_STATUSES.has(call.status);
  useEffect(() => {
    let active = true;
    if (!staff?.username) {
      setAvailability({
        checking: false,
        canCall: false,
        reason: 'Staff username is unavailable.',
      });
      return () => {
        active = false;
      };
    }

    setAvailability({ checking: true, canCall: false, reason: '' });
    voiceCallApi.clientCapability(staff.username)
      .then((response) => {
        if (!active) return;
        setAvailability({
          checking: false,
          canCall: Boolean(response?.data?.can_call),
          reason: response?.data?.reason || '',
        });
      })
      .catch((availabilityError) => {
        if (!active) return;
        console.error('Unable to check assigned staff voice-call availability:', availabilityError);
        setAvailability({
          checking: false,
          canCall: false,
          reason: availabilityError?.message || 'Unable to check staff availability.',
        });
      });

    return () => {
      active = false;
    };
  }, [staff?.username]);

  const disabled = working || Boolean(activeCall) || availability.checking || !availability.canCall;
  const title = availability.checking
    ? 'Checking whether this assigned staff member is online...'
    : availability.canCall
      ? `Call ${staff.name || 'assigned staff'}`
      : availability.reason === 'staff_offline'
        ? 'This assigned staff member is offline.'
        : availability.reason || 'This assigned staff member is unavailable for calls.';

  return (
    <button
      type="button"
      onClick={() => startCall(staff)}
      disabled={disabled}
      title={title}
      aria-label={`Call ${staff.name || staff.username || 'assigned staff'}`}
      className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
    >
      <Phone size={14} />
      {working && !activeCall
        ? 'Calling…'
        : activeCall
          ? 'Call in progress'
          : availability.checking
            ? 'Checking…'
            : availability.canCall
              ? 'Call'
              : 'Offline'}
    </button>
  );
}

const STATUS_LABELS = {
  ringing: 'Ringing…',
  accepted: 'Connecting audio…',
  rejected: 'Call declined',
  cancelled: 'Call cancelled',
  missed: 'Call missed',
  ended: 'Call ended',
  failed: 'Call failed',
};

export function VoiceCallOverlay() {
  const { call, working, error, setError, respondToCall, endCall, dismissCall } = useVoiceCalls();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioMount = useRef(null);
  const roomRef = useRef(null);
  const callId = call?.call_id;
  const status = call?.status;
  const terminal = Boolean(status && TERMINAL_STATUSES.has(status));
  const incoming = call?.direction === 'incoming';
  const endedStatus = status === 'ended' || status === 'cancelled';

  useEffect(() => {
    if (!callId || status !== 'accepted') return undefined;

    let active = true;
    let room;
    const attachedTracks = new Set();
    const disconnect = () => {
      attachedTracks.forEach((track) => track.detach().forEach((element) => element.remove()));
      attachedTracks.clear();
      if (roomRef.current === room) roomRef.current = null;
      room?.disconnect();
      if (active) setConnected(false);
    };
    const connect = async () => {
      setConnecting(true);
      setError('');
      try {
        const response = await voiceCallApi.getClientToken(callId);
        if (!active) return;
        room = new Room({ adaptiveStream: false, dynacast: false });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind !== Track.Kind.Audio) return;
          const element = track.attach();
          element.autoplay = true;
          element.style.display = 'none';
          audioMount.current?.appendChild(element);
          const playback = element.play?.();
          if (playback?.catch) playback.catch(() => setError('Allow audio playback in your browser to hear the caller.'));
          attachedTracks.add(track);
        });
        room.on(RoomEvent.TrackUnsubscribed, (track) => {
          track.detach().forEach((element) => element.remove());
          attachedTracks.delete(track);
        });
        room.on(RoomEvent.Disconnected, () => {
          if (active) setConnected(false);
        });
        await room.connect(response.data.server_url, response.data.token);
        if (!active) {
          disconnect();
          return;
        }
        await room.localParticipant.setMicrophoneEnabled(true);
        setMuted(false);
        setConnected(true);
      } catch (connectError) {
        if (active) {
          setError(connectError?.message || 'Unable to connect call audio.');
          console.error('Voice-call audio connection failed:', connectError);
        }
      } finally {
        if (active) setConnecting(false);
      }
    };
    connect();
    return () => {
      active = false;
      disconnect();
      setConnecting(false);
    };
  }, [callId, status, setError]);

  useEffect(() => {
    if (!terminal) return undefined;
    const room = roomRef.current;
    if (!room) return undefined;
    room.removeAllListeners();
    room.disconnect();
    roomRef.current = null;
    setConnected(false);
    return undefined;
  }, [terminal]);

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.localParticipant.setMicrophoneEnabled(muted);
      setMuted(!muted);
    } catch (muteError) {
      setError(muteError?.message || 'Unable to change microphone state.');
    }
  };

  if (!call) return null;
  const otherName = call.other_participant_name || 'OOMS team member';
  const label = connected ? 'Voice call connected' : connecting ? 'Connecting audio…' : STATUS_LABELS[status] || 'Voice call';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-label="Voice call">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
          <Phone size={30} />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">{otherName}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{label}</p>
        {endedStatus && call.ended_by_name ? (
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {status === 'cancelled' ? 'Call cancelled' : 'Call ended'} by {call.ended_by_name}
          </p>
        ) : null}
        <div ref={audioMount} className="hidden" aria-hidden="true" />
        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300" role="alert">{error}</p> : null}

        {status === 'ringing' && incoming ? (
          <div className="mt-7 flex justify-center gap-5">
            <button type="button" onClick={() => respondToCall('decline')} disabled={working} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" aria-label="Decline call">
              <PhoneOff size={22} />
            </button>
            <button type="button" onClick={() => respondToCall('accept')} disabled={working} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50" aria-label="Accept call">
              <Phone size={22} />
            </button>
          </div>
        ) : null}
        {status === 'ringing' && !incoming ? (
          <button type="button" onClick={endCall} disabled={working} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            <PhoneOff size={17} /> Cancel call
          </button>
        ) : null}
        {status === 'accepted' ? (
          <div className="mt-7 flex justify-center gap-4">
            <button type="button" onClick={toggleMute} disabled={!connected} className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200" aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}>
              {muted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button type="button" onClick={endCall} disabled={working} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" aria-label="End call">
              <PhoneOff size={20} />
            </button>
          </div>
        ) : null}
        {terminal ? (
          <button type="button" onClick={dismissCall} className="mt-7 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            <X size={17} /> Close
          </button>
        ) : null}
      </div>
    </div>
  );
}
