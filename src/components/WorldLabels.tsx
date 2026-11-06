'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerRuntime } from '@/game/input';
import { useGame } from '@/game/store';
import { missionGuidance } from '@/game/guidance';
import { trackedMission } from '@/game/ui';
import type { Vec3 } from '@/game/data';
type Entry = {
  anchor: THREE.Group;
  element: HTMLDivElement;
  interactionId?: string;
  dirty: boolean;
  width: number;
  height: number;
};
const entries = new Set<Entry>();
// Native browser text stays sharp independently of WebGL DPR, zoom and projection.
export function WorldLabel({
  text,
  position,
  color = '#fff7df',
  size = 0.43,
  interactionId,
}: {
  text: string;
  position: Vec3;
  color?: string;
  size?: number;
  interactionId?: string;
}) {
  const anchor = useRef<THREE.Group>(null),
    entry = useRef<Entry | null>(null);
  useEffect(() => {
    if (!anchor.current) return;
    const element = document.createElement('div');
    element.className = 'world-label';
    element.style.display = 'none';
    const value: Entry = {
      interactionId,
      anchor: anchor.current,
      element,
      dirty: true,
      width: 0,
      height: 0,
    };
    entry.current = value;
    entries.add(value);
    document.getElementById('world-label-layer')?.append(element);
    return () => {
      entries.delete(value);
      element.remove();
      entry.current = null;
    };
  }, [interactionId]);
  useEffect(() => {
    if (!entry.current) return;
    entry.current.element.textContent = text;
    entry.current.element.style.color = color;
    entry.current.element.style.fontSize = `${Math.max(14, Math.min(18, Math.round((size / 0.4) * 14)))}px`;
    entry.current.dirty = true;
  }, [text, color, size]);
  return <group ref={anchor} position={position} />;
}
const point = new THREE.Vector3();
export function WorldLabelLayout() {
  useFrame(({ camera, size }) => {
    camera.updateMatrixWorld();
    const state = useGame.getState(),
      host = document.getElementById('world-label-layer');
    const arrow = document.getElementById('mission-direction');
    if (arrow) {
      const quest = trackedMission(state.save, state.settings.trackedQuest);
      const hint = quest ? missionGuidance(state.save, quest.id)[0] : null;
      const distance = hint
        ? Math.hypot(
            hint.position[0] - playerRuntime.position[0],
            hint.position[2] - playerRuntime.position[2]
          )
        : 0;
      arrow.hidden =
        !hint ||
        distance < 3 ||
        !state.started ||
        !!state.panel ||
        !!state.dialogue ||
        state.build ||
        document.hidden;
      if (hint && !arrow.hidden) {
        point.set(hint.position[0], hint.position[1] + 0.8, hint.position[2]).project(camera);
        const tx = point.x,
          ty = point.y,
          behind = point.z > 1;
        point
          .set(playerRuntime.position[0], playerRuntime.position[1], playerRuntime.position[2])
          .project(camera);
        const dx = (tx - point.x) * size.width * (behind ? -1 : 1),
          dy = -(ty - point.y) * size.height * (behind ? -1 : 1);
        const angle = Math.atan2(dy, dx),
          radius = 70;
        arrow.style.left = `${Math.max(28, Math.min(size.width - 28, ((point.x + 1) * size.width) / 2 + Math.cos(angle) * radius))}px`;
        arrow.style.top = `${Math.max(64, Math.min(size.height - 160, ((1 - point.y) * size.height) / 2 + Math.sin(angle) * radius))}px`;
        arrow.style.setProperty('--direction', `${angle + Math.PI / 2}rad`);
        arrow.setAttribute(
          'aria-label',
          `${hint.label} · ${Math.round(distance)} metres. Open mission`
        );
        const label = arrow.querySelector('small');
        if (label) label.textContent = `${Math.round(distance)}m`;
      }
    }
    const candidates: { entry: Entry; x: number; y: number; distance: number }[] = [];
    for (const entry of entries) {
      const el = entry.element;
      if (!el.parentElement) host?.append(el);
      if (
        !state.started ||
        state.panel ||
        state.dialogue ||
        document.hidden ||
        !entry.interactionId ||
        entry.interactionId !== state.target
      ) {
        if (el.style.display !== 'none') el.style.display = 'none';
        continue;
      }
      entry.anchor.updateWorldMatrix(true, false);
      entry.anchor.getWorldPosition(point);
      const distance = Math.hypot(
        point.x - playerRuntime.position[0],
        point.z - playerRuntime.position[2]
      );
      point.project(camera);
      if (
        distance > 4.5 ||
        point.z < -1 ||
        point.z > 1 ||
        Math.abs(point.x) > 1.1 ||
        Math.abs(point.y) > 1.1
      ) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = 'block';
      if (entry.dirty) {
        entry.width = el.offsetWidth;
        entry.height = el.offsetHeight;
        entry.dirty = false;
      }
      candidates.push({
        entry,
        x: ((point.x + 1) * size.width) / 2,
        y: ((1 - point.y) * size.height) / 2,
        distance,
      });
    }
    point
      .set(playerRuntime.position[0], playerRuntime.position[1] + 0.2, playerRuntime.position[2])
      .project(camera);
    const player = {
      x: ((point.x + 1) * size.width) / 2 - 34,
      y: ((1 - point.y) * size.height) / 2 - 45,
      width: 68,
      height: 90,
    };
    const placed: { x: number; y: number; width: number; height: number }[] = [player];
    if (candidates.length)
      for (const node of document.querySelectorAll(
        '.game-top, .player-card, .tracked-mission, .companion-summary, .right-hud > button, .coin-pill, .touch-actions, .virtual-joystick, .hotbar, .interaction'
      )) {
        const rect = node.getBoundingClientRect();
        if (rect.width && rect.height)
          placed.push({ x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      }
    for (const c of candidates.sort((a, b) => a.distance - b.distance)) {
      const e = c.entry;
      let w = e.width,
        h = e.height,
        x = Math.round(Math.max(8, Math.min(size.width - w - 8, c.x - w / 2))),
        y = Math.round(c.y - h),
        fit = false;
      if (
        x < player.x + player.width + 4 &&
        x + w + 4 > player.x &&
        y < player.y + player.height + 4 &&
        y + h + 4 > player.y
      ) {
        const leftSpace = player.x - 14,
          rightSpace = size.width - player.x - player.width - 14;
        const goLeft = c.x < player.x + player.width / 2;
        const available = Math.floor(goLeft ? leftSpace : rightSpace);
        if (available >= 100) {
          if (w > available) {
            e.element.style.maxWidth = `${available}px`;
            w = e.element.offsetWidth;
            h = e.element.offsetHeight;
            e.width = w;
            e.height = h;
          }
          x = Math.round(goLeft ? player.x - w - 6 : player.x + player.width + 6);
          y = Math.round(c.y - h);
        }
      }
      for (let attempt = 0; attempt < 8; attempt++) {
        const overlap = placed.some(
          (r) =>
            x < r.x + r.width + 4 && x + w + 4 > r.x && y < r.y + r.height + 4 && y + h + 4 > r.y
        );
        if (!overlap) {
          fit = true;
          break;
        }
        y -= h + 4;
      }
      if (!fit || y < 58) {
        x = Math.round(Math.max(8, Math.min(size.width - w - 8, c.x - w / 2)));
        y = Math.round(player.y + player.height + 10);
        fit = !placed.some(
          (r) =>
            x < r.x + r.width + 4 && x + w + 4 > r.x && y < r.y + r.height + 4 && y + h + 4 > r.y
        );
      }
      if (!fit || y < 58 || y + h > size.height - 70) {
        e.element.style.display = 'none';
        continue;
      }
      e.element.style.transform = `translate(${x}px,${y}px)`;
      placed.push({ x, y, width: w, height: h });
    }
  });
  return null;
}
