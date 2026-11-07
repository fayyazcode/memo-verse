'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Copy, Footprints, Sprout, Sword, Swords, Trophy, WifiOff } from 'lucide-react';
import PlatformBadgeGuard from './PlatformBadgeGuard';
import { Bow } from './WeaponSwitch';
import { arenaEndpoint, useArena } from '@/arena/client';
import type { ArenaSkin, Point } from '@/arena/rules';
import './arena.css';
const ArenaScene = dynamic(() => import('./ArenaScene'), {
  ssr: false,
  loading: () => <div className="arena-loading">Preparing the arena…</div>,
});
export default function Arena() {
  const net = useArena(),
    netRef = useRef(net);
  netRef.current = net;
  const [name, setName] = useState('Little Wanderer'),
    [code, setCode] = useState(''),
    [mode, setMode] = useState<'create' | 'join' | 'match'>('match'),
    [available, setAvailable] = useState(true),
    [copied, setCopied] = useState(false);
  const skin = useRef<ArenaSkin>('meadow'),
    keys = useRef(new Set<string>()),
    stickInput = useRef<Point>({ x: 0, z: 0 }),
    held = useRef(false),
    pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, z: 0 });
  const room = net.room,
    me = room?.players.find((p) => p.id === net.id),
    opponent = room?.players.find((p) => p.id !== net.id);
  const fighting = room?.phase === 'fighting' && net.status === 'connected';
  useEffect(() => {
    setAvailable(!!arenaEndpoint());
    const invite = new URLSearchParams(location.search).get('room');
    if (invite) {
      setCode(invite.toUpperCase());
      setMode('join');
    }
    try {
      setName(localStorage.getItem('momo-arena-name') ?? 'Little Wanderer');
      const settings = JSON.parse(localStorage.getItem('momo-settings') ?? '{}');
      if (['meadow', 'explorer', 'starlight', 'sunset', 'river'].includes(settings.skin))
        skin.current = settings.skin;
    } catch {}
  }, []);
  useEffect(() => {
    keys.current.clear();
    stickInput.current = { x: 0, z: 0 };
    held.current = false;
    setKnob({ x: 0, z: 0 });
    const clear = () => {
      keys.current.clear();
      held.current = false;
      stickInput.current = { x: 0, z: 0 };
      setKnob({ x: 0, z: 0 });
      netRef.current.move({ x: 0, z: 0 });
    };
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.matches('input,select,textarea') || !fighting) return;
      if (
        [
          'KeyW',
          'KeyA',
          'KeyS',
          'KeyD',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
          'Space',
          'KeyH',
          'KeyG',
        ].includes(e.code)
      )
        e.preventDefault();
      keys.current.add(e.code);
      if (e.code === 'KeyG' && !e.repeat) netRef.current.send({ type: 'weapon' });
      if (['Space', 'KeyH'].includes(e.code)) {
        held.current = true;
        if (!e.repeat) netRef.current.send({ type: 'attack' });
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
      if (['Space', 'KeyH'].includes(e.code)) held.current = false;
    };
    let frames = 0;
    const interval = setInterval(() => {
      if (!fighting || document.hidden) return;
      const k = keys.current,
        dx =
          stickInput.current.x +
          (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) -
          (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0),
        dz =
          stickInput.current.z +
          (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) -
          (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0),
        yaw = Math.atan2(14, 20),
        length = Math.max(1, Math.hypot(dx, dz));
      netRef.current.move({
        x: (dx * Math.cos(yaw) + dz * Math.sin(yaw)) / length,
        z: (dz * Math.cos(yaw) - dx * Math.sin(yaw)) / length,
      });
      if (held.current && frames++ % 4 === 0) netRef.current.send({ type: 'attack' });
    }, 50);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      clearInterval(interval);
      clear();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    };
  }, [fighting]);
  const release = () => {
    pointer.current = null;
    stickInput.current = { x: 0, z: 0 };
    setKnob({ x: 0, z: 0 });
  };
  const steer = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const b = e.currentTarget.getBoundingClientRect(),
      x = (e.clientX - b.left - b.width / 2) / (b.width * 0.32),
      z = (e.clientY - b.top - b.height / 2) / (b.height * 0.32),
      len = Math.max(1, Math.hypot(x, z));
    stickInput.current = { x: x / len, z: z / len };
    setKnob({ x: (x / len) * b.width * 0.27, z: (z / len) * b.height * 0.27 });
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/arena?room=${room?.code}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const match = room && room.phase !== 'waiting';
  return (
    <main className={`arena-page ${match ? 'in-match' : ''}`}>
      <PlatformBadgeGuard />
      <header className="arena-topbar">
        <Link href="/" onClick={() => net.leave()} aria-label="Return to adventure">
          <ArrowLeft size={18} />
          Adventure
        </Link>
        <span>
          <Swords size={18} /> Versus Arena
        </span>
        {room && <button onClick={() => net.leave()}>{match ? 'Leave duel' : 'Leave room'}</button>}
      </header>
      {!room && net.queued ? (
        <section className="arena-waiting">
          <div className="arena-emblem">
            <Swords size={38} />
          </div>
          <h1>Finding your challenger…</h1>
          <p>
            {net.status === 'reconnecting'
              ? 'Reconnecting to the match queue…'
              : 'Waiting for another player to choose Quick Match.'}
          </p>
          <p>Unranked 1 vs 1 · Equal health and weapons</p>
          <button className="arena-primary" onClick={() => net.leave()}>
            Cancel search
          </button>
          {net.error && (
            <p role="alert" className="arena-error">
              {net.error}
            </p>
          )}
        </section>
      ) : !room ? (
        <div className="arena-lobby">
          <div className="arena-emblem">
            <Sprout size={42} />
          </div>
          <p className="arena-eyebrow">FRIENDLY DUELS</p>
          <h1>Meet in the arena.</h1>
          <p>
            Challenge a friend to a real-time sword and bow duel. Equal health, equal weapons. Your
            adventure stays safe.
          </p>
          <div className="arena-room-tabs" role="group" aria-label="Arena room action">
            {(['match', 'create', 'join'] as const).map((m) => (
              <button key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>
                {m === 'match' ? 'Quick Match' : m === 'create' ? 'Create room' : 'Join friend'}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                localStorage.setItem('momo-arena-name', name);
              } catch {}
              net.enter(mode, name, code.trim().toUpperCase(), skin.current);
            }}
          >
            <label>
              Your arena name
              <input
                aria-label="Fighter name"
                maxLength={18}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="nickname"
              />
            </label>
            {mode === 'join' && (
              <label>
                Room code
                <input
                  aria-label="Room code"
                  maxLength={7}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="7-character code"
                  autoCapitalize="characters"
                  spellCheck={false}
                  required
                />
              </label>
            )}
            <button
              className="arena-primary"
              disabled={!available || ['connecting', 'reconnecting'].includes(net.status)}
            >
              {net.status === 'connecting'
                ? 'Connecting…'
                : mode === 'match'
                  ? 'Find opponent'
                  : mode === 'create'
                    ? 'Create private room'
                    : 'Join room'}
            </button>
          </form>
          {!available && (
            <p role="status">
              Online arena is not available on this site yet. You can return to your adventure.
            </p>
          )}
          {net.error && (
            <p className="arena-error" role="alert">
              {net.error}
            </p>
          )}
          <small>
            Public matches or private rooms · Three-minute rounds · No lost items or coins
            <br />
            Leaving a live duel counts as a forfeit.
          </small>
        </div>
      ) : (
        <>
          {!match ? (
            <section className="arena-waiting">
              <p className="arena-eyebrow">{room.publicMatch ? 'QUICK MATCH' : 'PRIVATE ROOM'}</p>
              <h1>{room.publicMatch ? 'Your match is ready' : 'Invite your challenger'}</h1>
              {!room.publicMatch && (
                <div className="arena-invite">
                  <strong aria-label="Your room code">{room.code}</strong>
                  <button aria-label="Copy arena invitation" onClick={() => void copy()}>
                    <Copy size={18} />
                    {copied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
              )}
              <div className="arena-player-list">
                {[room.players[0], room.players[1]].map((p, i) => (
                  <article key={i}>
                    <span className={`arena-player-dot team-${i}`} />
                    <div>
                      <b>{p ? p.name : 'Waiting for a friend'}</b>
                      <small>
                        {p
                          ? p.connected
                            ? p.ready
                              ? 'Ready'
                              : 'Getting ready'
                            : 'Disconnected'
                          : 'Share your room code to join'}
                      </small>
                    </div>
                    {p?.id === net.id && <span>You</span>}
                  </article>
                ))}
              </div>
              {me && (
                <button className="arena-loadout" onClick={() => net.send({ type: 'weapon' })}>
                  {me.weapon === 'sword' ? <Sword size={22} /> : <Bow size={22} />}{' '}
                  {me.weapon === 'sword' ? 'Sword' : 'Bow'} equipped · Switch
                </button>
              )}
              <button
                className="arena-primary"
                disabled={
                  room.players.length !== 2 ||
                  !room.players.every((p) => p.connected) ||
                  !!me?.ready
                }
                onClick={() => net.send({ type: 'ready' })}
              >
                {me?.ready
                  ? 'Waiting for opponent…'
                  : room.players.length < 2
                    ? 'Waiting for opponent…'
                    : 'Ready to fight'}
              </button>
              <p>
                Move with the joystick or WASD. Hold Attack or H / Space to fight. Tap your weapon
                or press G to switch.
              </p>
            </section>
          ) : (
            <>
              <div className="arena-health-row">
                {[me, opponent].map((p, i) => (
                  <section
                    key={i}
                    className={`arena-health team-${room.players.findIndex((f) => f.id === p?.id)}`}
                    data-hurt={!!p?.hurt}
                  >
                    <b>
                      {i === 0 ? 'You' : (p?.name ?? 'Opponent')}{' '}
                      <small>{p?.weapon === 'bow' ? 'Bow' : 'Sword'}</small>
                    </b>
                    <div
                      role="progressbar"
                      aria-label={i === 0 ? 'Your arena health' : 'Opponent arena health'}
                      aria-valuenow={p?.hp ?? 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <i style={{ width: `${p?.hp ?? 0}%` }} />
                    </div>
                    <span>{p?.hp ?? 0} / 100</span>
                  </section>
                ))}
              </div>
              <span className="arena-clock">
                {Math.floor(Math.ceil(room.remaining) / 60)}:
                {String(Math.ceil(room.remaining) % 60).padStart(2, '0')} · Round {room.round}
              </span>
              <div className="arena-stage">
                <ArenaScene room={room} myId={net.id} />
              </div>
              {room.phase === 'countdown' && (
                <div className="arena-centre-message" role="status">
                  <b>{Math.ceil(room.countdown)}</b>
                  <span>Get ready</span>
                </div>
              )}
              {(room.phase === 'paused' || net.status === 'reconnecting') && (
                <div className="arena-centre-message" role="status">
                  <WifiOff size={30} />
                  <strong>Duel paused</strong>
                  <span>
                    {net.status === 'reconnecting'
                      ? 'Reconnecting…'
                      : 'Waiting for your opponent to reconnect…'}
                  </span>
                </div>
              )}
              {room.phase === 'finished' && (
                <section className="arena-results" role="status">
                  <Trophy size={36} />
                  <h2>
                    {!room.winner ? 'Draw!' : room.winner === net.id ? 'You won!' : 'Opponent wins'}
                  </h2>
                  <p>
                    {room.reason === 'disconnect'
                      ? 'The opponent disconnected.'
                      : room.reason === 'left'
                        ? 'The opponent left the duel.'
                        : room.reason === 'time'
                          ? 'Time is up.'
                          : 'The round is complete.'}
                  </p>
                  <button
                    className="arena-primary"
                    disabled={!room.players.every((p) => p.connected) || !!me?.ready}
                    onClick={() => net.send({ type: 'ready' })}
                  >
                    {me?.ready
                      ? 'Waiting for rematch…'
                      : opponent?.connected
                        ? 'Ready for rematch'
                        : 'Opponent has left'}
                  </button>
                  <button onClick={() => net.leave()}>Back to arena lobby</button>
                </section>
              )}
              {room.phase !== 'finished' && (
                <div className="arena-controls" aria-label="Arena battle controls">
                  <div
                    className="arena-joystick"
                    role="group"
                    aria-label="Arena movement joystick"
                    onPointerDown={(e) => {
                      if (!fighting || pointer.current !== null) return;
                      pointer.current = e.pointerId;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      steer(e);
                    }}
                    onPointerMove={steer}
                    onPointerUp={release}
                    onPointerCancel={release}
                    onLostPointerCapture={release}
                  >
                    <span style={{ transform: `translate(${knob.x}px,${knob.z}px)` }}>
                      <Footprints size={24} />
                    </span>
                  </div>
                  <div className="arena-combat-buttons">
                    <button
                      aria-label="Switch arena weapon"
                      disabled={!fighting}
                      onClick={() => net.send({ type: 'weapon' })}
                    >
                      {me?.weapon === 'bow' ? <Bow size={24} /> : <Sword size={24} />}
                      <small>{me?.weapon === 'bow' ? 'Bow' : 'Sword'}</small>
                    </button>
                    <button
                      className="arena-attack"
                      aria-label="Arena attack"
                      disabled={!fighting}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        held.current = true;
                        net.send({ type: 'attack' });
                      }}
                      onPointerUp={() => (held.current = false)}
                      onPointerCancel={() => (held.current = false)}
                      onLostPointerCapture={() => (held.current = false)}
                    >
                      {me?.weapon === 'bow' ? <Bow size={28} /> : <Swords size={28} />}
                      <small>
                        {me && me.cooldown > 0
                          ? `${me.cooldown.toFixed(1)}s`
                          : me?.weapon === 'bow'
                            ? 'Shoot'
                            : 'Attack'}
                      </small>
                    </button>
                  </div>
                  <small className="arena-keyboard-hint">
                    WASD / arrows to move · Hold H / Space to attack · G switches weapons
                  </small>
                </div>
              )}
            </>
          )}
          {net.status === 'reconnecting' && !match && (
            <p className="arena-network-note" role="status">
              Reconnecting to your room…
            </p>
          )}
          {net.error && (
            <p className="arena-network-note arena-error" role="alert">
              {net.error}
            </p>
          )}
        </>
      )}
    </main>
  );
}
