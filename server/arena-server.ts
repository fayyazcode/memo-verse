import http from 'node:http';
import { randomBytes, randomUUID } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import {
  addPlayer,
  ARENA,
  attack,
  connected,
  createRoom,
  finish,
  move,
  setReady,
  snapshot,
  switchWeapon,
  tickRoom,
  type ArenaSkin,
  type Room,
} from '../src/arena/rules';

type Session = {
  token: string;
  id: string;
  room: string;
  socket: WebSocket | null;
  disconnected: number | null;
  seq: number;
};
export function startArenaServer({
  port = 3020,
  host = '127.0.0.1',
  origins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3011',
    'http://127.0.0.1:3011',
  ],
} = {}) {
  const rooms = new Map<string, Room>(),
    sessions = new Map<string, Session>();
  const queue = new Map<string, { session: Session; name: string; skin: ArenaSkin }>();
  const newCode = () => {
    let code = '';
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
      code = Array.from(randomBytes(7), (n) => alphabet[n % alphabet.length]).join('');
    } while (rooms.has(code));
    return code;
  };
  const clients = new Map<
    WebSocket,
    { session: Session | null; budget: number; reset: number; alive: boolean; created: number }
  >();
  const attempts = new Map<string, { count: number; reset: number }>();
  const httpServer = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: 2048, perMessageDeflate: false });
  const send = (ws: WebSocket, data: unknown) => {
    if (ws.readyState === WebSocket.OPEN) {
      if (ws.bufferedAmount > 128000) {
        ws.close(1013, 'Connection too slow');
        return;
      }
      ws.send(JSON.stringify(data));
    }
  };
  const reject = (ws: WebSocket, message: string, reset = false) =>
    send(ws, { type: 'error', message, reset });
  const broadcast = (room: Room) => {
    const view = snapshot(room);
    for (const session of sessions.values())
      if (session.room === room.code && session.socket)
        send(session.socket, { type: 'state', room: view });
  };
  const matchQueued = () => {
    const waiting = [...queue.values()].filter(
      (q) => q.session.socket?.readyState === WebSocket.OPEN
    );
    while (waiting.length >= 2 && rooms.size < 100) {
      const pair = [waiting.shift()!, waiting.shift()!],
        room = createRoom(newCode(), true);
      rooms.set(room.code, room);
      for (const entry of pair) {
        queue.delete(entry.session.token);
        entry.session.room = room.code;
        addPlayer(room, entry.session.id, entry.name, entry.skin);
      }
      broadcast(room);
    }
  };
  const leave = (session: Session, reason: 'left' | 'disconnect') => {
    queue.delete(session.token);
    const room = rooms.get(session.room);
    if (room) {
      if (['fighting', 'countdown', 'paused'].includes(room.phase))
        finish(
          room,
          room.players.find((p) => p.id !== session.id && p.connected)?.id ?? null,
          reason
        );
      else if (room.phase === 'waiting') {
        room.players = room.players.filter((p) => p.id !== session.id);
        room.players.forEach((p) => (p.ready = false));
      }
      connected(room, session.id, false);
      broadcast(room);
      if (!room.players.some((p) => p.connected)) rooms.delete(room.code);
    }
    sessions.delete(session.token);
    session.socket = null;
  };
  httpServer.on('upgrade', (req, socket, head) => {
    if (req.url !== '/arena' || !origins.includes(req.headers.origin ?? '')) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      return;
    }
    const ip = req.socket.remoteAddress ?? 'unknown',
      now = Date.now();
    let attempt = attempts.get(ip);
    if (!attempt || attempt.reset < now) {
      attempt = { count: 0, reset: now + 60000 };
      attempts.set(ip, attempt);
    }
    if (++attempt.count > 60 || clients.size >= 200) {
      socket.end('HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\n\r\n');
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });
  wss.on('connection', (ws) => {
    const client = {
      session: null as Session | null,
      budget: 0,
      reset: Date.now() + 1000,
      alive: true,
      created: Date.now(),
    };
    clients.set(ws, client);
    ws.on('pong', () => {
      client.alive = true;
    });
    ws.on('error', () => {});
    ws.on('message', (bytes, isBinary) => {
      const now = Date.now();
      if (now >= client.reset) {
        client.reset = now + 1000;
        client.budget = 0;
      }
      if (++client.budget > 60) {
        ws.close(1008, 'Too many actions');
        return;
      }
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(bytes.toString());
        if (isBinary || !data || typeof data !== 'object' || Array.isArray(data)) throw Error();
      } catch {
        reject(ws, 'That arena action was not understood.');
        return;
      }
      if (data.type === 'resume') {
        if (client.session) {
          reject(ws, 'Already in an arena room.');
          return;
        }
        const session = typeof data.token === 'string' ? sessions.get(data.token) : undefined;
        if (
          !session ||
          (!rooms.has(session.room) && !queue.has(session.token)) ||
          (session.disconnected !== null && now - session.disconnected > ARENA.reconnect * 1000)
        ) {
          reject(ws, 'Your room is no longer available. Create or join another room.', true);
          return;
        }
        const previous = session.socket;
        session.socket = ws;
        session.disconnected = null;
        session.seq = -1;
        client.session = session;
        if (previous && previous !== ws) previous.close(4001, 'Session resumed elsewhere');
        const room = rooms.get(session.room);
        if (room) connected(room, session.id, true);
        send(ws, { type: 'welcome', id: session.id, token: session.token });
        if (room) broadcast(room);
        else {
          send(ws, { type: 'queued' });
          matchQueued();
        }
        return;
      }
      if (data.type === 'create' || data.type === 'join' || data.type === 'match') {
        if (client.session) {
          reject(ws, 'Leave your current room first.');
          return;
        }
        const name =
          typeof data.name === 'string'
            ? data.name
                .replace(/[^\p{L}\p{N} _-]/gu, '')
                .trim()
                .slice(0, 18)
            : '';
        if (!name) {
          reject(ws, 'Enter a name for your fighter.');
          return;
        }
        const skin: ArenaSkin =
          typeof data.skin === 'string' &&
          ['meadow', 'explorer', 'starlight', 'sunset', 'river'].includes(data.skin)
            ? (data.skin as ArenaSkin)
            : 'meadow';
        if (data.type === 'match') {
          if (queue.size >= 100) {
            reject(ws, 'The match queue is busy. Try again shortly.');
            return;
          }
          const session: Session = {
            token: randomBytes(32).toString('hex'),
            id: randomUUID(),
            room: '',
            socket: ws,
            disconnected: null,
            seq: -1,
          };
          sessions.set(session.token, session);
          client.session = session;
          queue.set(session.token, { session, name, skin });
          send(ws, { type: 'welcome', id: session.id, token: session.token });
          send(ws, { type: 'queued' });
          matchQueued();
          return;
        }
        let room: Room | undefined;
        if (data.type === 'create') {
          if (rooms.size >= 100) {
            reject(ws, 'The arena is busy. Please try again shortly.');
            return;
          }
          const code = newCode();
          room = createRoom(code);
          rooms.set(code, room);
        } else {
          if (typeof data.code !== 'string' || !/^[A-Z2-9]{7}$/.test(data.code)) {
            reject(ws, 'Enter the seven-character room code.');
            return;
          }
          room = rooms.get(data.code);
          if (!room) {
            reject(ws, 'Room not found. Check the code or ask your friend to create a room.');
            return;
          }
        }
        const session: Session = {
          token: randomBytes(32).toString('hex'),
          id: randomUUID(),
          room: room.code,
          socket: ws,
          disconnected: null,
          seq: -1,
        };
        if (!addPlayer(room, session.id, name, skin)) {
          reject(ws, 'That room is full or the duel has already started.');
          return;
        }
        sessions.set(session.token, session);
        client.session = session;
        send(ws, { type: 'welcome', id: session.id, token: session.token });
        broadcast(room);
        return;
      }
      if (data.type === 'leave' && client.session?.socket === ws) {
        leave(client.session, 'left');
        client.session = null;
        send(ws, { type: 'left' });
        return;
      }
      const session = client.session,
        room = session ? rooms.get(session.room) : null;
      if (!session || !room || session.socket !== ws) {
        reject(ws, 'Create or join a room first.');
        return;
      }
      switch (data.type) {
        case 'move':
          if (
            typeof data.seq !== 'number' ||
            !Number.isSafeInteger(data.seq) ||
            data.seq <= session.seq ||
            data.seq > Number.MAX_SAFE_INTEGER - 1 ||
            typeof data.x !== 'number' ||
            typeof data.z !== 'number' ||
            !Number.isFinite(data.x) ||
            !Number.isFinite(data.z) ||
            Math.abs(data.x) > 1 ||
            Math.abs(data.z) > 1
          )
            return;
          session.seq = data.seq;
          move(room, session.id, { x: data.x, z: data.z });
          break;
        case 'attack':
          attack(room, session.id);
          break;
        case 'weapon':
          switchWeapon(room, session.id);
          break;
        case 'ready':
          setReady(room, session.id);
          break;
        case 'leave':
          leave(session, 'left');
          client.session = null;
          send(ws, { type: 'left' });
          break;
        default:
          reject(ws, 'Unsupported arena action.');
      }
    });
    ws.on('close', () => {
      clients.delete(ws);
      const session = client.session;
      if (session && session.socket === ws) {
        session.socket = null;
        session.disconnected = Date.now();
        const room = rooms.get(session.room);
        if (room) {
          connected(room, session.id, false);
          broadcast(room);
        }
      }
    });
  });
  let counter = 0;
  const loop = setInterval(() => {
    for (const room of rooms.values()) {
      tickRoom(room, 0.05);
      if (counter % 2 === 0) broadcast(room);
    }
    const now = Date.now();
    for (const session of sessions.values())
      if (session.disconnected !== null && now - session.disconnected >= ARENA.reconnect * 1000)
        leave(session, 'disconnect');
    // Do not retain unused browser connections, abandoned lobbies or IP counters forever.
    for (const [ws, client] of clients) {
      if (!client.session && now - client.created > 60000) ws.close(1000, 'Room request timed out');
      if (client.session && !client.session.room && now - client.created > 5 * 60000) {
        send(ws, {
          type: 'error',
          message: 'The search timed out. You can search again.',
          reset: true,
        });
        leave(client.session, 'left');
        client.session = null;
      }
      if (client.session) {
        const room = rooms.get(client.session.room);
        if (
          room &&
          ['waiting', 'finished'].includes(room.phase) &&
          now - client.created > 15 * 60000
        ) {
          leave(client.session, 'left');
          ws.close(1000, 'Room expired');
        }
      }
    }
    if (counter % 20 === 0) matchQueued();
    if (counter++ % 200 === 0) {
      for (const [ip, a] of attempts) if (a.reset < now) attempts.delete(ip);
      for (const [ws, client] of clients) {
        if (!client.alive) {
          ws.terminate();
          continue;
        }
        client.alive = false;
        ws.ping();
      }
    }
  }, 50);
  httpServer.listen(port, host);
  return {
    server: httpServer,
    rooms,
    close: async () => {
      clearInterval(loop);
      for (const ws of clients.keys()) ws.terminate();
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    },
  };
}
