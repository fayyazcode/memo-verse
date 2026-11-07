'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowUp,
  Footprints,
  Hand,
  Hammer,
  Map,
  PawPrint,
  Sprout,
  Sparkles,
  Swords,
} from 'lucide-react';
import { useGame } from '@/game/store';
import { MONSTERS } from '@/game/hunting';
import { squadOf } from '@/game/squad';
import { NPCS, OBJECTS } from '@/game/data';
import { villagerPose } from '@/game/villagers';
import { navigation, motion } from '@/game/input';
import { joystickVector, resetTouch, touchInput, touchLook } from '@/game/touch';
export default function TouchControls() {
  const visitor = useGame((s) => s.visitor);
  const trayOpen = useGame((s) => s.abilityTrayOpen);
  const target = useGame((s) => s.target);
  const gateOpen = useGame(
    (s) => !!s.target?.startsWith('gate:') && s.save.flags.includes('open:' + s.target)
  );
  const huntAction = useGame((s) => {
    const i = MONSTERS.findIndex((m) => m.id === s.target);
    if (i < 0) return null;
    const h = squadOf(s.save).hunting!;
    return h.hp[i] > 0 ? 'Fight' : h.loot[i] ? 'Collect' : 'Wait';
  });
  const atHome = useGame(
    (s) =>
      !!s.target &&
      NPCS.some((n) => n.id === s.target) &&
      villagerPose(s.target, s.save.playTime).indoors
  );
  const busy = useGame((s) => !!s.panel || !!s.dialogue),
    build = useGame((s) => s.build);
  const stick = useRef<HTMLDivElement>(null),
    pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 }),
    [running, setRunning] = useState(false),
    [removing, setRemoving] = useState(false);
  const clear = () => {
    resetTouch();
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    setRunning(false);
    setRemoving(false);
  };
  useEffect(() => {
    clear();
  }, [busy]);
  useEffect(() => {
    const clearInput = () => clear();
    const down = (e: globalThis.PointerEvent) => {
      if (e.pointerType !== 'touch' || (e.target as HTMLElement).tagName !== 'CANVAS') return;
      const s = useGame.getState();
      if (s.panel || s.dialogue || !s.started || touchLook.pointer !== null) return;
      touchLook.pointer = e.pointerId;
      touchLook.x = touchLook.startX = e.clientX;
      touchLook.y = touchLook.startY = e.clientY;
      touchLook.dragged = false;
    };
    const move = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== touchLook.pointer) return;
      const dx = e.clientX - touchLook.x,
        dy = e.clientY - touchLook.y;
      touchLook.x = e.clientX;
      touchLook.y = e.clientY;
      if (Math.hypot(e.clientX - touchLook.startX, e.clientY - touchLook.startY) > 8)
        touchLook.dragged = true;
      if (touchLook.dragged) {
        navigation.destination = null;
        motion.yaw -= dx * 0.005 * useGame.getState().settings.sensitivity;
        if (useGame.getState().settings.perspective === 'classic')
          motion.pitch = Math.max(0.15, Math.min(1.1, motion.pitch + dy * 0.004));
      }
    };
    const up = (e: globalThis.PointerEvent) => {
      if (e.pointerId === touchLook.pointer) touchLook.pointer = null;
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', clearInput);
    window.addEventListener('blur', clearInput);
    window.addEventListener('resize', clearInput);
    document.addEventListener('visibilitychange', clearInput);
    return () => {
      resetTouch();
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', clearInput);
      window.removeEventListener('blur', clearInput);
      window.removeEventListener('resize', clearInput);
      document.removeEventListener('visibilitychange', clearInput);
    };
  }, []);
  const steer = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const rect = stick.current!.getBoundingClientRect();
    const v = joystickVector(
      e.clientX - rect.left - rect.width / 2,
      e.clientY - rect.top - rect.height / 2,
      rect.width * 0.35
    );
    touchInput.x = v.x;
    touchInput.z = v.z;
    navigation.destination = null;
    setKnob({ x: v.x * rect.width * 0.3, y: v.z * rect.height * 0.3 });
  };
  const release = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    touchInput.x = touchInput.z = 0;
    setKnob({ x: 0, y: 0 });
  };
  if (busy) return null;
  const action = useGame.getState();
  return (
    <div className="touch-controls" aria-label="Touch game controls" data-building={build}>
      <div
        ref={stick}
        className="virtual-joystick"
        role="group"
        aria-label="Movement joystick"
        onPointerDown={(e) => {
          if (pointer.current !== null) return;
          pointer.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          steer(e);
        }}
        onPointerMove={steer}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span className="joystick-ring" />
        <span className="joystick-knob" style={{ transform: `translate(${knob.x}px,${knob.y}px)` }}>
          <Footprints size={22} />
        </span>
        <small>MOVE</small>
      </div>
      <div className="touch-utilities">
        <button
          aria-label="Toggle sprint"
          aria-pressed={running}
          onClick={() => {
            touchInput.sprint = !running;
            setRunning(!running);
          }}
        >
          <Footprints size={17} />
          Run
        </button>
      </div>
      <div className="touch-actions" hidden={trayOpen}>
        {!build && (
          <span className="action-sprout" aria-hidden="true">
            <Sprout size={22} />
          </span>
        )}
        {build ? (
          <>
            <button
              aria-label="Place blocks"
              aria-pressed={!removing}
              onClick={() => {
                touchInput.remove = false;
                setRemoving(false);
              }}
            >
              <Hammer size={22} />
              <small>Place</small>
            </button>
            <button
              aria-label="Remove blocks"
              aria-pressed={removing}
              onClick={() => {
                touchInput.remove = true;
                setRemoving(true);
              }}
            >
              <Hand size={22} />
              <small>Remove</small>
            </button>
            <button
              aria-label="Rotate building view"
              onClick={() => {
                motion.yaw += Math.PI / 2;
              }}
            >
              <Map size={22} />
              <small>Turn view</small>
            </button>
            <button
              aria-label="Exit building mode"
              onClick={() => {
                useGame.setState({ build: false });
                touchInput.remove = false;
                setRemoving(false);
              }}
            >
              <ArrowUp size={22} />
              <small>Exit build</small>
            </button>
          </>
        ) : (
          <>
            <button
              className="touch-attack"
              aria-label="Basic attack"
              onClick={() => action.attack()}
            >
              <Swords size={19} />
              <small>Attack</small>
            </button>
            <button
              className="touch-ability"
              aria-label="Open companion abilities"
              onClick={() => {
                if (!action.save.active) {
                  action.open('creatures');
                  return;
                }
                useGame.setState({ abilityTrayOpen: true });
              }}
            >
              <Sparkles size={19} />
              <small>Ability</small>
            </button>
            <button
              className="touch-interact"
              data-available={!!target}
              disabled={(!!visitor && visitor === target) || huntAction === 'Wait'}
              aria-label={
                target?.startsWith('gate:')
                  ? gateOpen
                    ? 'Close wooden gate'
                    : 'Open wooden gate'
                  : 'Interact or gather'
              }
              onClick={() => {
                navigation.destination = null;
                action.interact();
              }}
            >
              <Hand size={23} />
              <small>
                {visitor && visitor === target
                  ? 'Coming…'
                  : atHome
                    ? 'Knock'
                    : target?.startsWith('gate:')
                      ? gateOpen
                        ? 'Close'
                        : 'Open'
                      : huntAction
                        ? huntAction
                        : NPCS.some((n) => n.id === target)
                          ? 'Talk'
                          : OBJECTS.find((o) => o.id === target)?.kind === 'resource' || !target
                            ? 'Gather'
                            : 'Use'}
              </small>
            </button>
            <button
              className="touch-jump"
              aria-label="Jump"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                touchInput.jump = true;
              }}
              onPointerUp={() => (touchInput.jump = false)}
              onPointerCancel={() => (touchInput.jump = false)}
              onLostPointerCapture={() => (touchInput.jump = false)}
            >
              <ArrowUp size={24} />
              <small>Jump</small>
            </button>
          </>
        )}
      </div>
      <span className="touch-camera-hint">
        {build
          ? `Tap the world to ${removing ? 'remove' : 'place'} blocks`
          : 'Drag to look · tap to move'}
      </span>
    </div>
  );
}
