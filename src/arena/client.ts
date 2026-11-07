'use client';
import { useEffect, useRef, useState } from 'react';
import type { ArenaSkin, Point, RoomView } from './rules';
export const SESSION_KEY = 'momo-arena-session';
export function arenaEndpoint() {
  const configured = process.env.NEXT_PUBLIC_ARENA_URL;
  if (configured) {
    try {
      const u = new URL(configured);
      if (
        !['ws:', 'wss:'].includes(u.protocol) ||
        (location.protocol === 'https:' && u.protocol !== 'wss:')
      )
        return null;
      return u.href;
    } catch {
      return null;
    }
  }
  return ['localhost', '127.0.0.1'].includes(location.hostname)
    ? `ws://${location.hostname}:3020/arena`
    : null;
}
export function useArena() {
  const [queued, setQueued] = useState(false);
  const [room, setRoom] = useState<RoomView | null>(null),
    [id, setId] = useState(''),
    [status, setStatus] = useState('idle'),
    [error, setError] = useState('');
  const ws = useRef<WebSocket | null>(null),
    token = useRef<string | null>(null),
    retry = useRef<ReturnType<typeof setTimeout> | null>(null),
    attempts = useRef(0),
    intentional = useRef(false),
    seq = useRef(0);
  const roomRef = useRef(room);
  roomRef.current = room;
  const pending = useRef<unknown>(null),
    connectRef = useRef<() => void>(() => {});
  const send = (message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify(message));
  };
  const clearSession = () => {
    token.current = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  };
  const leave = () => {
    intentional.current = true;
    pending.current = null;
    if (retry.current) clearTimeout(retry.current);
    send({ type: 'leave' });
    ws.current?.close();
    clearSession();
    setRoom(null);
    setQueued(false);
    setId('');
    setStatus('idle');
  };
  const connect = () => {
    const endpoint = arenaEndpoint();
    if (!endpoint) {
      setError('Online arena is not available on this site yet. You can return to your adventure.');
      setStatus('unavailable');
      return;
    }
    intentional.current = false;
    if (
      ws.current &&
      (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)
    )
      return;
    setStatus(token.current ? 'reconnecting' : 'connecting');
    let socket: WebSocket;
    try {
      socket = new WebSocket(endpoint);
    } catch {
      setError('Could not connect to the arena. Try again shortly.');
      setStatus('offline');
      return;
    }
    ws.current = socket;
    socket.onopen = () => {
      if (ws.current !== socket) return;
      seq.current = 0;
      setStatus('connected');
      setError('');
      if (token.current) send({ type: 'resume', token: token.current });
      else if (pending.current) {
        send(pending.current);
        pending.current = null;
      }
    };
    socket.onmessage = (event) => {
      if (ws.current !== socket) return;
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === 'welcome' &&
          typeof data.id === 'string' &&
          typeof data.token === 'string'
        ) {
          setId(data.id);
          token.current = data.token;
          attempts.current = 0;
          try {
            sessionStorage.setItem(SESSION_KEY, data.token);
          } catch {}
        } else if (
          data.type === 'state' &&
          data.room &&
          Array.isArray(data.room.players) &&
          data.room.players.length <= 2
        ) {
          setQueued(false);
          setRoom(data.room);
          setStatus('connected');
          attempts.current = 0;
        } else if (data.type === 'queued') {
          setQueued(true);
          setStatus('connected');
          attempts.current = 0;
        } else if (data.type === 'error') {
          setError(String(data.message ?? 'Could not join the arena.'));
          if (data.reset || !roomRef.current) {
            if (data.reset) {
              setRoom(null);
              setQueued(false);
              setId('');
            }
            clearSession();
            setStatus('connected');
          }
        } else if (data.type === 'left') {
          clearSession();
          setRoom(null);
          setId('');
        }
      } catch {
        setError('The arena connection was interrupted. Please reconnect.');
        socket.close();
      }
    };
    socket.onerror = () => {
      if (!token.current) setError('The arena server is unavailable. Try again shortly.');
    };
    socket.onclose = (event) => {
      if (ws.current !== socket) return;
      ws.current = null;
      if (intentional.current) return;
      if (event.code === 4001) {
        intentional.current = true;
        clearSession();
        setRoom(null);
        setStatus('offline');
        setError('This fighter reconnected in another tab.');
        return;
      }
      if (token.current && attempts.current < 6) {
        setStatus('reconnecting');
        const delay = Math.min(4000, 500 * 2 ** attempts.current++);
        retry.current = setTimeout(() => connectRef.current(), delay);
      } else {
        setStatus('offline');
        setError('Connection lost. Leave the room and reconnect to play again.');
      }
    };
  };
  connectRef.current = connect;
  useEffect(() => {
    try {
      token.current = sessionStorage.getItem(SESSION_KEY);
    } catch {}
    if (token.current) connectRef.current();
    return () => {
      intentional.current = true;
      if (retry.current) clearTimeout(retry.current);
      ws.current?.close();
      ws.current = null;
    };
  }, []);
  return {
    room,
    queued,
    id,
    status,
    error,
    leave,
    send,
    move: (input: Point) => send({ type: 'move', ...input, seq: ++seq.current }),
    enter: (type: 'create' | 'join' | 'match', name: string, code: string, skin: ArenaSkin) => {
      setError('');
      const message = { type, name, code, skin };
      pending.current = message;
      if (ws.current?.readyState === WebSocket.OPEN) {
        send(message);
        pending.current = null;
      } else connect();
    },
  };
}
