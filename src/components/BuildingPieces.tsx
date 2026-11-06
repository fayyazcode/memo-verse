'use client';
import { useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RigidBody, CuboidCollider, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import type { Block } from '@/game/rules';
import { playerRuntime } from '@/game/input';
import { useGame } from '@/game/store';
import { WorldLabel } from './WorldLabels';
type Handlers = {
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove: (e: ThreeEvent<PointerEvent>) => void;
};
export function HousingWall({ block: b, ...handlers }: { block: Block } & Handlers) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const p = playerRuntime.position;
    const fade = playerRuntime.sheltered && Math.hypot(p[0] - b.x - 0.5, p[2] - b.z - 0.5) < 2.8;
    if (material.current)
      material.current.opacity = THREE.MathUtils.damp(
        material.current.opacity,
        fade ? 0.2 : 1,
        10,
        dt
      );
  });
  return (
    <mesh position={[b.x + 0.5, b.y + 0.5, b.z + 0.5]} {...handlers} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial ref={material} color="#b2936e" transparent roughness={0.9} />
    </mesh>
  );
}
export function RoofTile({ block: b, ...handlers }: { block: Block } & Handlers) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    const p = playerRuntime.position,
      near = p[1] < b.y + 1 && Math.hypot(p[0] - b.x - 0.5, p[2] - b.z - 0.5) < 1.6;
    if (material.current)
      material.current.opacity = THREE.MathUtils.damp(
        material.current.opacity,
        near ? 0.2 : 1,
        10,
        dt
      );
  });
  return (
    <mesh position={[b.x + 0.5, b.y + 0.2, b.z + 0.5]} {...handlers} castShadow receiveShadow>
      <boxGeometry args={[1, 0.25, 1]} />
      <meshStandardMaterial ref={material} color="#887152" transparent roughness={0.9} />
    </mesh>
  );
}
export function WoodenGate({ block: b, ...handlers }: { block: Block } & Handlers) {
  const id = `gate:${b.x}:${b.y}:${b.z}`;
  const open = useGame((s) => s.save.flags.includes('open:' + id));
  const body = useRef<RapierRigidBody>(null),
    angle = useRef(open ? -Math.PI / 2 : 0),
    quaternion = useRef(new THREE.Quaternion());
  const base = ((b.rotation ?? 0) * Math.PI) / 2;
  const initialRotation = useRef(base + (open ? -Math.PI / 2 : 0)).current;
  useFrame((_, dt) => {
    angle.current = THREE.MathUtils.damp(angle.current, open ? -Math.PI / 2 : 0, 10, dt);
    quaternion.current.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, base + angle.current);
    body.current?.setNextKinematicRotation(quaternion.current);
  });
  return (
    <group {...handlers} userData={{ interactionId: id }}>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={b.rotation ? [b.x + 0.5, b.y, b.z + 1] : [b.x, b.y, b.z + 0.5]}
        rotation={[0, initialRotation, 0]}
        userData={{ interactionId: id, cameraBuilding: true }}
      >
        <CuboidCollider args={[0.47, 0.85, 0.065]} position={[0.5, 0.85, 0]} />
        <group userData={{ interactionId: id }}>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((x) => (
            <mesh key={x} position={[x, 0.85, 0]} castShadow>
              <boxGeometry args={[0.12, 1.7, 0.1]} />
              <meshStandardMaterial color="#ba9668" />
            </mesh>
          ))}
          {[0.4, 1.25].map((y) => (
            <mesh key={y} position={[0.5, y, 0.04]} castShadow>
              <boxGeometry args={[1, 0.12, 0.14]} />
              <meshStandardMaterial color="#8d704e" />
            </mesh>
          ))}
          <mesh position={[0.85, 0.9, 0.14]}>
            <boxGeometry args={[0.13, 0.09, 0.1]} />
            <meshStandardMaterial color="#646e60" />
          </mesh>
          <WorldLabel interactionId={id} text="Wooden gate" position={[0.5, 2, 0]} size={0.43} />
        </group>
      </RigidBody>
    </group>
  );
}
