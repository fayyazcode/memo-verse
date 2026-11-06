'use client';
import { squadRuntime } from '@/game/squad-runtime';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import HeldItem from './HeldItem';
import { gaitPose, attackPose } from '@/game/appearance';
import { playerRuntime, companionRuntime } from '@/game/input';
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
  accent = '#c7b99c',
  accessory = 'none',
}: {
  color?: string;
  hoodie?: string;
  moving?: boolean;
  running?: boolean;
  npc?: boolean;
  accent?: string;
  accessory?: 'none' | 'cap' | 'scarf';
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
          action === 'attack'
            ? -0.3 - attackPose(Date.now(), playerRuntime.actionStarted) * 1.7 * (i === 1 ? 1 : 0.4)
            : action === 'mine'
              ? -0.3 -
                Math.sin(
                  Math.min(1, (Date.now() - playerRuntime.actionStarted) / 1100) * Math.PI * 3
                ) *
                  1.2
              : action === 'pick'
                ? -1.35
                : action === 'gather'
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
    if (root.current)
      root.current.rotation.x = air
        ? 0.08
        : action === 'pick'
          ? 0.45
          : action === 'mine'
            ? 0.16
            : action === 'gather'
              ? 0.12
              : 0;
  });
  return (
    <group ref={root}>
      {accessory === 'cap' && (
        <group position={[0, 1.52, -0.03]}>
          <Orb scale={[0.44, 0.14, 0.31]} color={hoodie} />
          <mesh position={[0, -0.05, 0.25]} castShadow>
            <boxGeometry args={[0.55, 0.06, 0.28]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </group>
      )}
      {accessory === 'scarf' && (
        <group>
          <Orb position={[0, 0.99, 0]} scale={[0.41, 0.1, 0.3]} color={accent} />
          <mesh position={[0.2, 0.75, 0.34]} rotation={[0, 0, -0.15]} castShadow>
            <boxGeometry args={[0.14, 0.4, 0.04]} />
            <meshStandardMaterial color={accent} />
          </mesh>
        </group>
      )}
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
          {!npc && v === 1 && <HeldItem />}
        </group>
      ))}
      <mesh position={[0, 0.73, 0.313]}>
        <boxGeometry args={[0.3, 0.15, 0.025]} />
        <meshStandardMaterial color={accent} />
      </mesh>
      {[-1, 1].map((v) => (
        <mesh key={v} position={[v * 0.09, 0.98, 0.305]}>
          <boxGeometry args={[0.015, 0.19, 0.012]} />
          <meshStandardMaterial color={accent} />
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
export function CreatureModel({
  species,
  moving = false,
  companion = false,
}: {
  species: Species;
  moving?: boolean;
  companion?: boolean;
}) {
  const ref = useRef<THREE.Group>(null),
    legs = useRef<(THREE.Group | null)[]>([]),
    blend = useRef(0),
    tail = useRef<THREE.Group>(null);
  const c = CREATURES[species];
  const runtime = squadRuntime[species];
  useFrame(({ clock }, dt) => {
    const speed = companion ? runtime.speed : moving ? 1.2 : 0;
    blend.current = THREE.MathUtils.damp(blend.current, speed, 10, Math.min(dt, 0.05));
    const distance = companion ? runtime.distance : clock.elapsedTime * (moving ? 1.2 : 0);
    const pulse =
      companion && Date.now() < runtime.attackUntil
        ? attackPose(Date.now(), runtime.attackStarted)
        : 0;
    if (ref.current) {
      ref.current.position.y = 0;
      ref.current.position.z = pulse * 0.3;
      ref.current.scale.y = 0.85 * (1 + Math.sin(clock.elapsedTime * 2) * 0.007);
      ref.current.rotation.z = Math.sin(distance * 8) * 0.02 * Math.min(1, blend.current);
      ref.current.rotation.x = -pulse * 0.22;
    }
    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const pose = gaitPose(distance, blend.current, i);
      leg.rotation.x = THREE.MathUtils.damp(leg.rotation.x, pose.swing, 16, Math.min(dt, 0.05));
      leg.position.y = 0.18 + pose.lift;
    });
    if (tail.current)
      tail.current.rotation.y =
        Math.sin(clock.elapsedTime * 3) * (0.07 + Math.min(1, blend.current) * 0.18);
  });
  return (
    <group ref={ref} scale={0.85}>
      {Array.from({ length: species === 'zaplet' ? 2 : 4 }, (_, i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const z = i < 2 ? 0.18 : -0.25;
        return (
          <group
            key={i}
            ref={(node) => {
              legs.current[i] = node;
            }}
            position={[side * (species === 'mosshell' ? 0.34 : 0.24), 0.18, z]}
          >
            <Orb position={[0, 0.03, 0]} scale={[0.1, 0.16, 0.11]} color={c.color} />
            <Orb
              position={[0, -0.04, 0.04]}
              scale={[0.13, 0.13, 0.18]}
              color={species === 'emberfox' ? '#c96b49' : c.color}
            />
          </group>
        );
      })}
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
      {species === 'emberfox' && (
        <>
          <Orb position={[0, 0.49, 0.27]} scale={[0.25, 0.28, 0.18]} color="#ffe0ac" />
          <Orb position={[0, 0.57, 0.51]} scale={[0.21, 0.13, 0.14]} color="#ffe6bf" />
          <Orb position={[0, 0.63, 0.64]} scale={[0.055, 0.045, 0.035]} color="#50372f" />
          <group ref={tail} position={[0.12, 0.5, -0.55]} rotation={[-0.65, 0, 0.3]}>
            <Orb scale={[0.22, 0.37, 0.23]} color="#df7349" />
            <Orb position={[0, 0.27, 0]} scale={[0.16, 0.22, 0.17]} color="#ffe5a0" />
          </group>
          {[-1, 1].map((v) => (
            <group key={v}>
              <mesh position={[v * 0.2, 1.02, 0.19]} rotation={[0, 0, v * -0.2]}>
                <coneGeometry args={[0.065, 0.28, 3]} />
                <meshStandardMaterial color="#663e40" />
              </mesh>
            </group>
          ))}
        </>
      )}
      {species === 'mosshell' && (
        <>
          {[
            [-0.25, 0.72, -0.1],
            [0.25, 0.72, -0.1],
            [0, 0.83, -0.18],
            [0, 0.68, -0.43],
          ].map((p, i) => (
            <mesh
              key={i}
              position={p as [number, number, number]}
              rotation={[0, i * 0.7, 0]}
              castShadow
            >
              <cylinderGeometry args={[0.22, 0.24, 0.1, 6]} />
              <meshStandardMaterial color={i % 2 ? '#97ad62' : '#b3bf7d'} />
            </mesh>
          ))}
          <mesh position={[0.12, 1, -0.25]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.13, 0.36, 4]} />
            <meshStandardMaterial color="#a8cb82" />
          </mesh>
          <Orb position={[0, 0.52, 0.48]} scale={[0.22, 0.09, 0.1]} color="#d4d7a5" />
        </>
      )}
      {species === 'aquabub' && (
        <>
          <Orb position={[0, 0.43, 0.27]} scale={[0.24, 0.23, 0.15]} color="#d0f0e8" />
          <group ref={tail} position={[0, 0.4, -0.4]} rotation={[0.7, 0, 0]}>
            <Orb position={[-0.15, 0, 0]} scale={[0.23, 0.09, 0.25]} color="#8bd3d5" />
            <Orb position={[0.15, 0, 0]} scale={[0.23, 0.09, 0.25]} color="#8bd3d5" />
          </group>
          {[-1, 1].map((v) => (
            <group key={v}>
              <Orb position={[v * 0.28, 0.59, 0.4]} scale={[0.08, 0.04, 0.02]} color="#b6b4d5" />
              <mesh position={[v * 0.47, 0.6, 0]} rotation={[0, 0, v * 0.6]}>
                <coneGeometry args={[0.12, 0.35, 3]} />
                <meshStandardMaterial color="#b2e6e3" />
              </mesh>
            </group>
          ))}
          <Orb
            position={[0.16, 1.1, 0.07]}
            scale={[0.06, 0.07, 0.06]}
            color="#d3f7ee"
            roughness={0.15}
          />
        </>
      )}
      {species === 'zaplet' && (
        <>
          <Orb position={[0, 0.43, 0.3]} scale={[0.22, 0.2, 0.12]} color="#fff1b6" />
          {[-1, 1].map((v) => (
            <group key={v}>
              <mesh position={[v * 0.4, 0.62, -0.06]} rotation={[0, 0, -v * 0.65]}>
                <octahedronGeometry args={[0.18]} />
                <meshStandardMaterial color="#b6acdc" emissive="#a998c4" emissiveIntensity={0.2} />
              </mesh>
              <Orb position={[v * 0.26, 0.59, 0.43]} scale={[0.07, 0.04, 0.025]} color="#d6a15f" />
            </group>
          ))}
          <mesh position={[0, 0.88, 0.2]} rotation={[0, 0, 0.4]}>
            <octahedronGeometry args={[0.1]} />
            <meshStandardMaterial color="#faf4cb" />
          </mesh>
        </>
      )}
    </group>
  );
}
