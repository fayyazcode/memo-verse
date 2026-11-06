'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CREATURES } from '@/game/data';
import { useGame } from '@/game/store';
import { ABILITIES, memberOf, squadOf } from '@/game/squad';
import { abilityEffects, squadRuntime } from '@/game/squad-runtime';
import { playerRuntime } from '@/game/input';
// Fixed visual budget; no projectile bodies or per-frame React state.
export default function AbilityEffects() {
  const shots = useRef<(THREE.Group | null)[]>([]),
    zones = useRef<(THREE.Mesh | null)[]>([]),
    shields = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const s = useGame.getState().save,
      q = squadOf(s);
    for (let i = abilityEffects.length - 1; i >= 0; i--)
      if (s.playTime - abilityEffects[i].time > abilityEffects[i].duration)
        abilityEffects.splice(i, 1);
    shots.current.forEach((g, i) => {
      if (!g) return;
      const e = abilityEffects[i];
      g.visible = !!e;
      if (!e) return;
      const t = Math.max(0, Math.min(1, (s.playTime - e.time) / e.duration));
      const orb = g.children[0] as THREE.Mesh,
        ring = g.children[1] as THREE.Mesh;
      const projectile = e.animation === 'projectile' || e.animation === 'dash';
      orb.visible = projectile;
      ring.visible = !projectile;
      (orb.material as THREE.MeshBasicMaterial).color.set(CREATURES[e.species].color);
      (ring.material as THREE.MeshBasicMaterial).color.set(
        e.animation === 'heal'
          ? '#91e5bb'
          : e.animation === 'warning'
            ? '#ed9b64'
            : CREATURES[e.species].color
      );
      g.position.set(...e.start).lerp(new THREE.Vector3(...e.end), projectile ? t : 1);
      g.position.y += projectile ? 0.7 : 0.08;
      orb.scale.setScalar(e.slot === 'basic' ? 0.13 : 0.3);
      ring.scale.setScalar(e.animation === 'warning' ? 5 : 0.5 + t * 2.5);
    });
    zones.current.forEach((m, i) => {
      if (!m) return;
      const z = q.zones[i];
      m.visible = !!z;
      if (!z) return;
      m.position.set(z.position[0], 0.07, z.position[2]);
      m.scale.setScalar(ABILITIES[z.species][z.slot].radius);
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.color.set(z.warning ? '#ee8e68' : CREATURES[z.species].color);
      mat.opacity = z.warning ? 0.28 + Math.sin(s.playTime * 20) * 0.15 : 0.2;
    });
    shields.current.forEach((m, i) => {
      if (!m) return;
      const id = q.equipped[i];
      const shield = i === 3 ? q.playerShield : id ? memberOf(s, id).shield : 0;
      m.visible = shield > 0;
      if (!m.visible) return;
      const p = i === 3 ? playerRuntime.position : squadRuntime[id!].position;
      m.position.set(p[0], p[1] + 0.5, p[2]);
    });
  });
  return (
    <>
      {Array.from({ length: 32 }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            shots.current[i] = g;
          }}
          visible={false}
        >
          <mesh>
            <icosahedronGeometry args={[1, 1]} />
            <meshBasicMaterial />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.7, 1, 24]} />
            <meshBasicMaterial
              transparent
              opacity={0.65}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            zones.current[i] = m;
          }}
          visible={false}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[1, 32]} />
          <meshBasicMaterial transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            shields.current[i] = m;
          }}
          visible={false}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshBasicMaterial
            color="#bddbe8"
            transparent
            opacity={0.18}
            wireframe
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
