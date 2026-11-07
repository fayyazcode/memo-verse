import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { once } from 'node:events';
import { startArenaServer } from '../server/arena-server';
import type { RoomView } from '../src/arena/rules';
type Message = {
  type: string;
  id?: string;
  token?: string;
  message?: string;
  reset?: boolean;
  room?: RoomView;
};
const running: ReturnType<typeof startArenaServer>[] = [];
const sockets: WebSocket[] = [];
afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.terminate();
  for (const app of running.splice(0)) await app.close();
});
async function server() {
  const app = startArenaServer({ port: 0 });
  running.push(app);
  if (!app.server.listening) await once(app.server, 'listening');
  return { app, url: `ws://127.0.0.1:${(app.server.address() as { port: number }).port}/arena` };
}
async function peer(url: string) {
  const ws = new WebSocket(url, { origin: 'http://127.0.0.1:3000' });
  sockets.push(ws);
  const messages: Message[] = [];
  ws.on('message', (b) => messages.push(JSON.parse(b.toString())));
  await once(ws, 'open');
  const send = (m: unknown) => ws.send(JSON.stringify(m));
  const wait = async (predicate: (m: Message) => boolean, timeout = 6000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const match = messages.findLast(predicate);
      if (match) return match;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw Error('Arena message timed out');
  };
  return { ws, send, wait, messages };
}
describe('real arena WebSocket transport', () => {
  it('connects two private players, rejects a third, ignores forged stats and resumes only the owning session', async () => {
    const { url } = await server(),
      a = await peer(url),
      b = await peer(url),
      third = await peer(url);
    a.send({ type: 'create', name: 'Aster', skin: { toString: null, valueOf: null } });
    const welcome = await a.wait((m) => m.type === 'welcome');
    const initial = (await a.wait((m) => m.type === 'state')).room!;
    expect(initial.players[0].skin).toBe('meadow');
    b.send({ type: 'join', code: initial.code, name: 'Birch' });
    const second = await b.wait((m) => m.type === 'welcome');
    await a.wait((m) => m.room?.players.length === 2);
    third.send({ type: 'join', code: initial.code, name: 'Third' });
    expect((await third.wait((m) => m.type === 'error')).message).toContain('full');
    a.send({ type: 'setHealth', hp: 0, target: second.id });
    expect((await a.wait((m) => m.type === 'error')).message).toContain('Unsupported');
    a.send({ type: 'move', x: 999, z: 0, seq: 1 });
    a.send({ type: 'ready' });
    b.send({ type: 'ready' });
    const fighting = (await a.wait((m) => m.room?.phase === 'fighting')).room!;
    expect(fighting.players.map((p) => p.hp)).toEqual([100, 100]);
    expect(fighting.players[0].position.x).toBe(-4);
    expect(JSON.stringify(fighting).includes(welcome.token!)).toBe(false);
    b.ws.close();
    await a.wait((m) => m.room?.phase === 'paused');
    const wrong = await peer(url);
    wrong.send({ type: 'resume', token: 'wrong' });
    expect((await wrong.wait((m) => m.type === 'error')).reset).toBe(true);
    const resumed = await peer(url);
    resumed.send({ type: 'resume', token: second.token });
    expect((await resumed.wait((m) => m.type === 'welcome')).id).toBe(second.id);
    await resumed.wait((m) => m.room?.phase === 'fighting');
    resumed.send({ type: 'leave' });
    const result = (await a.wait((m) => m.room?.phase === 'finished')).room!;
    expect(result.winner).toBe(welcome.id);
    expect(result.reason).toBe('left');
  }, 20000);
  it('pairs only connected public searchers and keeps private rooms outside matchmaking', async () => {
    const { url } = await server(),
      privatePlayer = await peer(url),
      a = await peer(url),
      b = await peer(url),
      cancelled = await peer(url);
    privatePlayer.send({ type: 'create', name: 'Private' });
    const privateRoom = (await privatePlayer.wait((m) => m.type === 'state')).room!;
    cancelled.send({ type: 'match', name: 'Cancelled' });
    await cancelled.wait((m) => m.type === 'queued');
    cancelled.send({ type: 'leave' });
    await cancelled.wait((m) => m.type === 'left');
    a.send({ type: 'match', name: 'Public A' });
    await a.wait((m) => m.type === 'queued');
    expect(a.messages.some((m) => m.type === 'state')).toBe(false);
    b.send({ type: 'match', name: 'Public B' });
    const room = (await a.wait((m) => m.type === 'state')).room!;
    expect(room.publicMatch).toBe(true);
    expect(room.players.map((p) => p.name)).toEqual(['Public A', 'Public B']);
    expect(room.code).not.toBe(privateRoom.code);
    expect((await privatePlayer.wait((m) => m.type === 'state')).room!.players).toHaveLength(1);
    expect((await b.wait((m) => m.type === 'state')).room!.code).toBe(room.code);
  });
  it('enforces origin and payload limits and survives malformed messages', async () => {
    const { url } = await server();
    const bad = new WebSocket(url, { origin: 'https://untrusted.example' });
    sockets.push(bad);
    bad.on('error', () => {});
    const response = await new Promise<number>((resolve) =>
      bad.once('unexpected-response', (_, res) => {
        resolve(res.statusCode!);
        res.resume();
      })
    );
    expect(response).toBe(403);
    const a = await peer(url);
    a.ws.send('{bad');
    expect((await a.wait((m) => m.type === 'error')).message).toContain('not understood');
    a.send({ type: 'create', name: 'Still works' });
    await a.wait((m) => m.type === 'state');
    const oversized = await peer(url);
    const closed = once(oversized.ws, 'close');
    oversized.ws.send('x'.repeat(3000));
    expect((await closed)[0]).toBe(1009);
  });
  it('freezes a disconnected duel and awards a forfeit only after the reconnect grace expires', async () => {
    const { url } = await server(),
      a = await peer(url),
      b = await peer(url);
    a.send({ type: 'create', name: 'A' });
    const host = await a.wait((m) => m.type === 'welcome'),
      room = (await a.wait((m) => m.type === 'state')).room!;
    b.send({ type: 'join', code: room.code, name: 'B' });
    await b.wait((m) => m.type === 'welcome');
    a.send({ type: 'ready' });
    b.send({ type: 'ready' });
    await a.wait((m) => m.room?.phase === 'fighting');
    b.ws.terminate();
    const paused = (await a.wait((m) => m.room?.phase === 'paused')).room!;
    const result = (await a.wait((m) => m.room?.phase === 'finished', 18000)).room!;
    expect(result.winner).toBe(host.id);
    expect(result.reason).toBe('disconnect');
    expect(result.remaining).toBe(paused.remaining);
  }, 25000);
});
