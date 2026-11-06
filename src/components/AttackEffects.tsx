'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerRuntime } from '@/game/input';
export default function AttackEffects() {
  const slash = useRef<THREE.Group>(null);
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
  });
  return (
    <>
      <group ref={slash} visible={false}>
        <mesh position={[0, 0.1, 0.75]} rotation={[0, 0, -0.5]}>
          <torusGeometry args={[0.6, 0.035, 6, 24, Math.PI * 1.15]} />
          <meshBasicMaterial color="#fff2bc" transparent opacity={0.75} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
