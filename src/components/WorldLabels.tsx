'use client';
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerRuntime } from '@/game/input';
import { useGame } from '@/game/store';
import { missionGuidance } from '@/game/guidance';
import { trackedMission } from '@/game/ui';
import type { Vec3, Species } from '@/game/data';
type Entry = {
  anchor: THREE.Group;
  element: HTMLDivElement;
  interactionId?: string;
  kind: 'player' | 'companion' | 'object' | 'enemy';
  species?: Species;
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
  kind = 'object',
  species,
  level,
  hp,
  maxHp,
}: {
  text: string;
  position: Vec3;
  color?: string;
  size?: number;
  interactionId?: string;
  kind?: Entry['kind'];
  species?: Species;
  level?: number;
  hp?: number;
  maxHp?: number;
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
      kind,
      species,
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
  }, [interactionId, kind, species]);
  useEffect(() => {
    if (!entry.current) return;
    const el = entry.current.element;
    el.dataset.kind = kind;
    el.replaceChildren();
    if (kind === 'player') {
      const dot = document.createElement('span');
      dot.className = 'name-tag-dot';
      el.append(dot);
    }
    if (species) {
      const portrait = document.createElement('img');
      portrait.src = `/portraits/${species}.svg`;
      portrait.alt = '';
      portrait.className = 'name-tag-portrait';
      el.append(portrait);
    }
    const body = document.createElement('span');
    body.className = 'name-tag-body';
    const line = document.createElement('span');
    line.className = 'name-tag-line';
    const name = document.createElement('strong');
    name.className = 'name-tag-name';
    name.textContent = text;
    line.append(name);
    if (level !== undefined) {
      const rank = document.createElement('small');
      rank.className = 'name-tag-level';
      rank.textContent = `Lv. ${level}`;
      line.append(rank);
    }
    body.append(line);
    if (hp !== undefined && maxHp !== undefined) {
      const bar = document.createElement('span');
      bar.className = 'name-tag-health';
      const fill = document.createElement('i');
      fill.style.width = `${Math.max(0, Math.min(100, (hp / Math.max(1, maxHp)) * 100))}%`;
      bar.append(fill);
      bar.setAttribute('aria-label', `${hp}/${maxHp} HP`);
      body.append(bar);
    }
    el.append(body);
    el.style.color = '#294b3a';
    el.style.fontSize = `${Math.max(14, Math.min(16, Math.round((size / 0.4) * 14)))}px`;
    entry.current.dirty = true;
  }, [text, color, size, kind, species, level, hp, maxHp]);
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
        (entry.kind === 'companion'
          ? entry.species !== state.save.active
          : entry.kind !== 'player' &&
            (!entry.interactionId ||
              (entry.interactionId !== state.target &&
                !(entry.kind === 'enemy' && entry.interactionId === state.save.squad?.target))))
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
        distance > (entry.kind === 'enemy' ? 12 : entry.kind === 'companion' ? 9 : 4.5) ||
        point.z < -1 ||
        point.z > 1 ||
        Math.abs(point.x) > 1.1 ||
        Math.abs(point.y) > 1.1
      ) {
        el.style.display = 'none';
        continue;
      }
      el.style.display = 'flex';
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
    const bounds = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
    for (const dx of [-0.55, 0.55])
      for (const dy of [-0.78, 1.12])
        for (const dz of [-0.4, 0.4]) {
          point
            .set(
              playerRuntime.position[0] + dx,
              playerRuntime.position[1] + dy,
              playerRuntime.position[2] + dz
            )
            .project(camera);
          const px = ((point.x + 1) * size.width) / 2,
            py = ((1 - point.y) * size.height) / 2;
          bounds.left = Math.min(bounds.left, px);
          bounds.right = Math.max(bounds.right, px);
          bounds.top = Math.min(bounds.top, py);
          bounds.bottom = Math.max(bounds.bottom, py);
        }
    const player = {
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
    };
    const placed: { x: number; y: number; width: number; height: number; tag?: boolean }[] = [
      player,
    ];
    if (candidates.length)
      for (const node of document.querySelectorAll(
        '#mission-direction, .game-top, .player-card, .tracked-mission, .companion-summary, .right-hud > button, .coin-pill, .touch-actions, .virtual-joystick, .hotbar, .interaction'
      )) {
        const rect = node.getBoundingClientRect();
        if (rect.width && rect.height)
          placed.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height + (node.id === 'mission-direction' ? 22 : 0),
          });
      }
    for (const c of candidates.sort((a, b) => a.distance - b.distance)) {
      const e = c.entry;
      const obstacles =
        e.kind === 'player' || e.kind === 'companion' ? placed.filter((r) => r !== player) : placed;
      let w = e.width,
        h = e.height,
        x = Math.round(Math.max(8, Math.min(size.width - w - 8, c.x - w / 2))),
        y = Math.round(c.y - h),
        fit = false;
      if (
        e.kind !== 'player' &&
        e.kind !== 'companion' &&
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
        const conflict = obstacles.find(
          (r) =>
            x < r.x + r.width + 4 && x + w + 4 > r.x && y < r.y + r.height + 4 && y + h + 4 > r.y
        );
        if (!conflict) {
          fit = true;
          break;
        }
        if (conflict.tag && conflict.y + conflict.height / 2 < c.y)
          y = Math.round(conflict.y + conflict.height + 6);
        else y = Math.round(conflict.y - h - 6);
      }
      if (!fit || y < 58) {
        x = Math.round(Math.max(8, Math.min(size.width - w - 8, c.x - w / 2)));
        y = Math.round(player.y + player.height + 10);
        fit = !obstacles.some(
          (r) =>
            x < r.x + r.width + 4 && x + w + 4 > r.x && y < r.y + r.height + 4 && y + h + 4 > r.y
        );
      }
      if (!fit || y < 58 || y + h > size.height - 70) {
        e.element.style.display = 'none';
        continue;
      }
      e.element.style.transform = `translate(${x}px,${y}px)`;
      placed.push({ x, y, width: w, height: h, tag: true });
    }
  });
  return null;
}
