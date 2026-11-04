'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { playerRuntime } from '@/game/input';
import { CREATURES, type Species } from '@/game/data';
function Orb({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color,
  roughness = 0.75,
}: {
  position?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  roughness?: number;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial color={color} roughness={roughness} />
    </mesh>
  );
}
export function Character({
  color = '#a4d85b',
  hoodie = '#e6d8be',
  moving = false,
  running = false,
  npc = false,
}: {
  color?: string;
  hoodie?: string;
  moving?: boolean;
  running?: boolean;
  npc?: boolean;
}) {
  const root = useRef<THREE.Group>(null),
    left = useRef<THREE.Group>(null),
    right = useRef<THREE.Group>(null),
    ears = useRef<THREE.Group>(null),
    leftArm = useRef<THREE.Group>(null),
    rightArm = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime,
      speed = running ? 14 : 9;
    const swing = moving ? Math.sin(t * speed) * 0.5 : Math.sin(t * 2) * 0.025;
    if (left.current) left.current.rotation.x = swing;
    if (right.current) right.current.rotation.x = -swing;
    if (root.current)
      root.current.position.y = THREE.MathUtils.damp(
        root.current.position.y,
        moving ? Math.abs(Math.sin(t * speed)) * 0.055 : Math.sin(t * 2) * 0.02,
        12,
        dt
      );
    if (ears.current) ears.current.rotation.z = Math.sin(t * 2) * 0.025;
    const action = !npc && Date.now() < playerRuntime.actionUntil ? playerRuntime.action : 'idle';
    const air = !npc && !playerRuntime.grounded;
    [leftArm, rightArm].forEach((arm, i) => {
      if (arm.current) {
        const sign = i === 0 ? -1 : 1;
        arm.current.rotation.x =
          action === 'gather'
            ? Math.sin(t * 18) * 0.7
            : action === 'interact'
              ? -1
              : air
                ? -0.6
                : moving
                  ? -swing * 0.8 * sign
                  : 0;
        arm.current.rotation.z = sign * (action === 'celebrate' ? 2.5 : air ? 0.6 : 0.16);
      }
    });
    if (root.current) root.current.rotation.x = air ? 0.08 : action === 'gather' ? 0.12 : 0;
  });
  return (
    <group ref={root}>
      <Orb position={[0, 0.64, 0]} scale={[0.43, 0.51, 0.31]} color={hoodie} />
      <Orb position={[0, 0.91, -0.1]} scale={[0.45, 0.27, 0.32]} color={hoodie} />
      <Orb position={[0, 1.22, 0.03]} scale={[0.47, 0.4, 0.35]} color={color} />
      <group ref={ears}>
        <group position={[-0.32, 1.52, 0]} rotation={[0, 0, -0.25]}>
          <Orb scale={[0.12, 0.42, 0.105]} color={color} />
          <Orb position={[0, 0.05, 0.075]} scale={[0.06, 0.27, 0.04]} color="#c4df93" />
        </group>
        <group position={[0.32, 1.52, 0]} rotation={[0, 0, 0.25]}>
          <Orb scale={[0.12, 0.42, 0.105]} color={color} />
          <Orb position={[0, 0.05, 0.075]} scale={[0.06, 0.27, 0.04]} color="#c4df93" />
        </group>
      </group>
      {[-1, 1].map((v) => (
        <group key={v}>
          <Orb
            position={[v * 0.19, 1.27, 0.325]}
            scale={[0.105, 0.14, 0.055]}
            color="#172c25"
            roughness={0.08}
          />
          <Orb
            position={[v * 0.19 - 0.025, 1.315, 0.371]}
            scale={[0.025, 0.033, 0.015]}
            color="#fffced"
          />
          <Orb position={[v * 0.33, 1.14, 0.27]} scale={[0.06, 0.035, 0.025]} color="#d6b394" />
          <mesh position={[v * 0.065, 1.05, 0.347]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.028, 0.075, 8]} />
            <meshStandardMaterial color="#fff9e8" />
          </mesh>
        </group>
      ))}
      <Orb position={[0, 1.09, 0.335]} scale={[0.09, 0.025, 0.02]} color="#45583b" />
      <group ref={left} position={[-0.23, 0.37, 0]}>
        <Orb position={[0, -0.2, 0.02]} scale={[0.15, 0.23, 0.17]} color={color} />
        <Orb position={[0, -0.29, 0.08]} scale={[0.17, 0.11, 0.22]} color="#596750" />
      </group>
      <group ref={right} position={[0.23, 0.37, 0]}>
        <Orb position={[0, -0.2, 0.02]} scale={[0.15, 0.23, 0.17]} color={color} />
        <Orb position={[0, -0.29, 0.08]} scale={[0.17, 0.11, 0.22]} color="#596750" />
      </group>
      {[-1, 1].map((v) => (
        <group
          key={v}
          ref={v === -1 ? leftArm : rightArm}
          position={[v * 0.43, 0.77, 0]}
          rotation={[0, 0, v * 0.16]}
        >
          <Orb scale={[0.14, 0.3, 0.16]} color={hoodie} />
          <Orb position={[0, -0.24, 0.035]} scale={[0.13, 0.13, 0.13]} color={color} />
        </group>
      ))}
      <mesh position={[0, 0.73, 0.313]}>
        <boxGeometry args={[0.3, 0.15, 0.025]} />
        <meshStandardMaterial color="#c7b99c" />
      </mesh>
      {[-1, 1].map((v) => (
        <mesh key={v} position={[v * 0.09, 0.98, 0.305]}>
          <boxGeometry args={[0.015, 0.19, 0.012]} />
          <meshStandardMaterial color="#fff4de" />
        </mesh>
      ))}
      {npc && (
        <mesh position={[0, 1.52, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color={hoodie} />
        </mesh>
      )}
    </group>
  );
}
export function CreatureModel({ species, moving = false }: { species: Species; moving?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const c = CREATURES[species];
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y =
        Math.sin(clock.elapsedTime * (moving ? 8 : 2)) * (moving ? 0.08 : 0.025);
      ref.current.rotation.z = species === 'aquabub' ? Math.sin(clock.elapsedTime * 3) * 0.05 : 0;
    }
  });
  return (
    <group ref={ref} scale={0.85}>
      <Orb
        position={[0, 0.45, 0]}
        scale={species === 'mosshell' ? [0.55, 0.35, 0.55] : [0.36, 0.4, 0.4]}
        color={c.color}
      />
      {species === 'mosshell' && (
        <Orb position={[0, 0.58, -0.12]} scale={[0.53, 0.33, 0.48]} color="#557952" />
      )}
      <Orb position={[0, 0.65, 0.26]} scale={[0.33, 0.29, 0.3]} color={c.color} />
      {[-1, 1].map((v) => (
        <group key={v}>
          <Orb
            position={[v * 0.13, 0.71, 0.52]}
            scale={[0.065, 0.09, 0.035]}
            color="#213b34"
            roughness={0.1}
          />
          <Orb
            position={[v * 0.13 - 0.015, 0.74, 0.55]}
            scale={[0.016, 0.02, 0.01]}
            color="white"
          />
          <Orb position={[v * 0.24, 0.16, 0.1]} scale={[0.13, 0.13, 0.18]} color={c.color} />
        </group>
      ))}
      {(species === 'emberfox' || species === 'zaplet') &&
        [-1, 1].map((v) => (
          <mesh key={v} position={[v * 0.2, 1, 0.14]} rotation={[0, 0, v * -0.2]} castShadow>
            <coneGeometry args={[0.12, 0.45, 4]} />
            <meshStandardMaterial color={c.color} />
          </mesh>
        ))}
      {species === 'aquabub' && (
        <>
          <Orb position={[-0.38, 0.45, 0]} scale={[0.2, 0.08, 0.25]} color="#a7dce4" />
          <Orb position={[0.38, 0.45, 0]} scale={[0.2, 0.08, 0.25]} color="#a7dce4" />
          <Orb position={[0, 0.98, 0.05]} scale={[0.08, 0.2, 0.08]} color="#b4e3e9" />
        </>
      )}
      {species === 'emberfox' && (
        <Orb position={[0, 0.55, -0.55]} scale={[0.2, 0.23, 0.4]} color="#f4cc87" />
      )}
      {species === 'zaplet' && (
        <mesh position={[0, 0.6, -0.5]} rotation={[0.8, 0, 0]}>
          <coneGeometry args={[0.18, 0.65, 3]} />
          <meshStandardMaterial color="#f9e8a0" />
        </mesh>
      )}
    </group>
  );
}
