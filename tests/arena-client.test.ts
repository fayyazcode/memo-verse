import { afterEach, describe, expect, it, vi } from 'vitest';
import { arenaEndpoint } from '../src/arena/client';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('arena endpoint configuration', () => {
  it('discovers the local server and requires an explicit host for production play', () => {
    vi.stubEnv('NEXT_PUBLIC_ARENA_URL', '');
    vi.stubGlobal('location', { hostname: '127.0.0.1', protocol: 'http:' });
    expect(arenaEndpoint()).toBe('ws://127.0.0.1:3020/arena');
    vi.stubGlobal('location', { hostname: 'momoversee.netlify.app', protocol: 'https:' });
    expect(arenaEndpoint()).toBeNull();
  });
  it('requires a valid secure WebSocket URL on HTTPS sites', () => {
    vi.stubGlobal('location', { hostname: 'game.example', protocol: 'https:' });
    vi.stubEnv('NEXT_PUBLIC_ARENA_URL', 'ws://arena.example/arena');
    expect(arenaEndpoint()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_ARENA_URL', 'https://arena.example/arena');
    expect(arenaEndpoint()).toBeNull();
    vi.stubEnv('NEXT_PUBLIC_ARENA_URL', 'wss://arena.example/arena');
    expect(arenaEndpoint()).toBe('wss://arena.example/arena');
  });
});
