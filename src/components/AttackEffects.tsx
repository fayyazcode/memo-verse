'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { CREATURES } from '@/game/data';
import { playerRuntime, companionRuntime } from '@/game/input';
export default function AttackEffects() {
  const slash = useRef<THREE.Group>(null),
    orb = useRef<THREE.Mesh>(null);
  const start = useMemo(() => new THREE.Vector3(), []),
    end = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const now = Date.now();
    if (slash.current) {
      const active = playerRuntime.action === 'attack' && now < playerRuntime.actionUntil;
      slash.current.visible = active;
      if (active) {
        const t = (now - playerRuntime.actionStarted) / 650;
        slash.current.position.set(
          playerRuntime.position[0],
          playerRuntime.position[1] + 0.2,
          playerRuntime.position[2]
        );
        slash.current.rotation.y = playerRuntime.heading;
        slash.current.rotation.z = -0.8 + t * 1.6;
        slash.current.scale.setScalar(0.6 + Math.sin(Math.PI * t) * 0.4);
      }
    }
    if (orb.current) {
      const active = now < companionRuntime.attackUntil && !!useGame.getState().save.active;
      orb.current.visible = active;
      if (active) {
        const t = Math.min(1, (now - companionRuntime.attackStarted) / 650);
        const id = useGame.getState().save.active!;
        (orb.current.material as THREE.MeshBasicMaterial).color.set(
          companionRuntime.elemental ? CREATURES[id].color : '#fff0c3'
        );
        start.set(...companionRuntime.position).y += 0.6;
        end.set(...companionRuntime.target).y += 0.6;
        const delta = end.clone().sub(start);
        if (delta.length() > 5) end.copy(start).add(delta.setLength(5));
        orb.current.position.copy(start).lerp(end, t);
        orb.current.scale.setScalar(
          (companionRuntime.elemental ? 0.25 : 0.13) * Math.sin(Math.PI * t)
        );
      }
    }
  });
  return (
    <>
      <group ref={slash} visible={false}>
        <mesh position={[0, 0.1, 0.75]} rotation={[0, 0, -0.5]}>
          <torusGeometry args={[0.6, 0.035, 6, 24, Math.PI * 1.15]} />
          <meshBasicMaterial color="#fff2bc" transparent opacity={0.75} depthWrite={false} />
        </mesh>
      </group>
      <mesh ref={orb} visible={false}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#fff0c3" />
      </mesh>
    </>
  );
}
