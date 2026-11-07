'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  RigidBody,
  CuboidCollider,
  CapsuleCollider,
  type RapierRigidBody,
} from '@react-three/rapier';
import * as THREE from 'three';
import { MONSTERS, MEADOW } from '@/game/hunting';
import { useGame } from '@/game/store';
import { squadOf } from '@/game/squad';
import { WorldLabel } from './WorldLabels';
function Timber({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number, number];
}) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#a48b60" />
    </mesh>
  );
}
export default function MonsterMeadow() {
  return (
    <group>
      <mesh position={[19.5, 0.018, 26.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[13, 15]} />
        <meshStandardMaterial color="#a9bb7e" />
      </mesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[13, 0.5, 26.5]} args={[0.1, 0.5, 7.5]} />
        <CuboidCollider position={[26, 0.5, 26.5]} args={[0.1, 0.5, 7.5]} />
        <CuboidCollider position={[19.5, 0.5, 34]} args={[6.5, 0.5, 0.1]} />
        <CuboidCollider position={[15.75, 0.5, 19]} args={[2.75, 0.5, 0.1]} />
        <CuboidCollider position={[23.75, 0.5, 19]} args={[2.25, 0.5, 0.1]} />
      </RigidBody>
      {[13, 26].map((x) => (
        <group key={x}>
          {[19, 22, 25, 28, 31, 34].map((z) => (
            <Timber key={z} position={[x, 0.55, z]} size={[0.18, 1.1, 0.18]} />
          ))}
          {[0.35, 0.8].map((y) => (
            <Timber key={y} position={[x, y, 26.5]} size={[0.12, 0.1, 15]} />
          ))}
        </group>
      ))}
      {[19, 34].map((z) => (
        <group key={z}>
          {[13, 16, 18.5, 21.5, 24, 26].map((x) => (
            <Timber key={x} position={[x, 0.55, z]} size={[0.18, 1.1, 0.18]} />
          ))}
          {[0.35, 0.8].map((y) => (
            <group key={y}>
              {z === 19 ? (
                <>
                  <Timber position={[15.75, y, z]} size={[5.5, 0.1, 0.12]} />
                  <Timber position={[23.75, y, z]} size={[4.5, 0.1, 0.12]} />
                </>
              ) : (
                <Timber position={[19.5, y, z]} size={[13, 0.1, 0.12]} />
              )}
            </group>
          ))}
        </group>
      ))}
      <group position={[23, 0, 17.7]} userData={{ interactionId: 'meadowBoard' }}>
        <Timber position={[0, 0.7, 0]} size={[0.16, 1.4, 0.16]} />
        <Timber position={[0, 1.6, 0]} size={[2.6, 0.8, 0.15]} />
        <mesh position={[0, 1.6, 0.1]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.1, 0.55, 0.07]} />
          <meshStandardMaterial color="#f6e8ad" />
        </mesh>
        <WorldLabel
          interactionId="meadowBoard"
          text="Monster Meadow"
          position={[0, 2.25, 0]}
          size={0.4}
        />
      </group>
      <mesh position={[20, 0.025, 19]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.8, 3]} />
        <meshStandardMaterial color="#d2c6a0" />
      </mesh>
      {MONSTERS.map((m, i) => (
        <WildMonster key={m.id} index={i} />
      ))}
    </group>
  );
}
function WildMonster({ index: i }: { index: number }) {
  const m = MONSTERS[i];
  const hp = useGame((s) => squadOf(s.save).hunting!.hp[i]);
  const loot = useGame((s) => squadOf(s.save).hunting!.loot[i]);
  const timer = useGame((s) => Math.ceil(squadOf(s.save).hunting!.respawn[i]));
  const body = useRef<RapierRigidBody>(null),
    model = useRef<THREE.Group>(null),
    warning = useRef<THREE.Mesh>(null),
    legs = useRef<(THREE.Mesh | null)[]>([]);
  const displayed = useRef(new THREE.Vector3(...m.pos)),
    last = useRef(new THREE.Vector3(...m.pos)),
    travel = useRef(0);
  useFrame((_, dt) => {
    const s = useGame.getState(),
      h = squadOf(s.save).hunting!;
    displayed.current.lerp(
      new THREE.Vector3(...h.positions[i]),
      1 - Math.exp(-12 * Math.min(dt, 0.1))
    );
    body.current?.setNextKinematicTranslation(displayed.current);
    const dx = displayed.current.x - last.current.x,
      dz = displayed.current.z - last.current.z,
      distance = Math.hypot(dx, dz);
    travel.current += distance;
    if (model.current) {
      if (distance > 0.001) model.current.rotation.y = Math.atan2(dx, dz);
      model.current.rotation.x = h.windup[i] > 0 ? -0.16 : 0;
    }
    legs.current.forEach((leg, n) => {
      if (leg)
        leg.rotation.x =
          distance > 0.001 ? Math.sin(travel.current * 8 + (n % 2) * Math.PI) * 0.5 : 0;
    });
    if (warning.current) {
      warning.current.visible = h.windup[i] > 0;
      warning.current.scale.setScalar(1 + h.windup[i] * 0.5);
    }
    last.current.copy(displayed.current);
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      position={m.pos}
      colliders={false}
      userData={{ interactionId: m.id }}
    >
      <CapsuleCollider args={[0.18, 0.4]} position={[0, 0.5, 0]} sensor={hp === 0} />
      <group userData={{ interactionId: m.id }}>
        {hp > 0 ? (
          <group ref={model}>
            <mesh position={[0, 0.57, 0]} scale={[0.65, 0.55, 0.55]} castShadow>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={m.color} roughness={0.9} />
            </mesh>
            {[-1, 1].map((v) => (
              <group key={v}>
                <mesh position={[v * 0.24, 0.7, 0.49]}>
                  <sphereGeometry args={[0.065, 10, 8]} />
                  <meshStandardMaterial color="#253e32" />
                </mesh>
                <mesh position={[v * 0.24, 0.81, 0.48]} rotation={[0, 0, v * 0.35]}>
                  <boxGeometry args={[0.2, 0.045, 0.07]} />
                  <meshStandardMaterial color="#516244" />
                </mesh>
                <mesh position={[v * 0.43, 1.04, 0]} rotation={[0, 0, -v * 0.35]}>
                  <coneGeometry args={[0.13, 0.42, 5]} />
                  <meshStandardMaterial color="#e6d7aa" />
                </mesh>
              </group>
            ))}
            {[-1, 1].flatMap((x) =>
              [-1, 1].map((z) => (
                <mesh
                  key={`${x}:${z}`}
                  ref={(r) => {
                    legs.current[x + 1 + (z + 1) / 2] = r;
                  }}
                  position={[x * 0.36, 0.19, z * 0.29]}
                  castShadow
                >
                  <capsuleGeometry args={[0.13, 0.18, 4, 8]} />
                  <meshStandardMaterial color="#647851" />
                </mesh>
              ))
            )}
            <mesh position={[0, 0.42, 0.52]}>
              <boxGeometry args={[0.22, 0.035, 0.04]} />
              <meshStandardMaterial color="#516244" />
            </mesh>
          </group>
        ) : loot ? (
          <group>
            <mesh position={[0, 0.3, 0]} castShadow>
              <sphereGeometry args={[0.27, 12, 8]} />
              <meshStandardMaterial color="#c9ad72" />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <torusGeometry args={[0.14, 0.045, 6, 12]} />
              <meshStandardMaterial color="#6f8f50" />
            </mesh>
          </group>
        ) : null}
        <mesh ref={warning} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
          <ringGeometry args={[1.4, 1.55, 32]} />
          <meshBasicMaterial color="#e5a85d" transparent opacity={0.85} />
        </mesh>
        <WorldLabel
          kind={hp > 0 ? 'enemy' : 'object'}
          interactionId={m.id}
          text={hp > 0 ? m.name : loot ? 'Loot pouch · Collect' : `Returning in ${timer}s`}
          level={hp > 0 ? m.level : undefined}
          hp={hp > 0 ? hp : undefined}
          maxHp={hp > 0 ? m.hp : undefined}
          position={[0, 1.7, 0]}
          size={0.4}
        />
      </group>
    </RigidBody>
  );
}
