'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '@/game/store';
import { playerRuntime } from '@/game/input';
export default function AttackEffects() {
  const arrows = useGame((s) => s.arrows);
  const hurt = useRef<THREE.Mesh>(null);
  const slash = useRef<THREE.Group>(null);
  useFrame(() => {
    const now = Date.now();
    if (hurt.current) {
      hurt.current.visible = now < playerRuntime.hurtUntil;
      hurt.current.position.set(playerRuntime.position[0], 0.08, playerRuntime.position[2]);
    }
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
      <mesh ref={hurt} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.8, 24]} />
        <meshBasicMaterial color="#db745b" transparent opacity={0.8} depthWrite={false} />
      </mesh>
      {arrows.map((arrow, i) => (
        <group
          key={i}
          position={arrow.position}
          quaternion={new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(...arrow.direction)
          )}
        >
          <mesh>
            <cylinderGeometry args={[0.018, 0.018, 0.65, 5]} />
            <meshStandardMaterial color="#c7a16c" />
          </mesh>
          <mesh position={[0, 0.39, 0]}>
            <coneGeometry args={[0.065, 0.16, 4]} />
            <meshStandardMaterial color="#d7e0d3" />
          </mesh>
          <mesh position={[0, -0.28, 0]}>
            <boxGeometry args={[0.13, 0.12, 0.015]} />
            <meshBasicMaterial color="#f4eec9" />
          </mesh>
        </group>
      ))}
      <group ref={slash} visible={false}>
        <mesh position={[0, 0.1, 0.75]} rotation={[0, 0, -0.5]}>
          <torusGeometry args={[0.6, 0.035, 6, 24, Math.PI * 1.15]} />
          <meshBasicMaterial color="#fff2bc" transparent opacity={0.75} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
