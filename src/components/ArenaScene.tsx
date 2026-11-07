'use client';
import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Character } from './Character';
import { SKINS } from '@/game/appearance';
import type { RoomView } from '@/arena/rules';
function CameraFit() {
  const { camera, size } = useThree();
  useFrame(() => {
    const c = camera as THREE.OrthographicCamera,
      zoom = Math.min(size.width / 20, size.height / 16);
    if (c.zoom !== zoom) {
      c.zoom = zoom;
      c.updateProjectionMatrix();
    }
    c.lookAt(0, 0, 0);
  });
  return null;
}
function Fighter({
  player,
  index,
  labels,
}: {
  player: RoomView['players'][number];
  index: number;
  labels: { current: (HTMLDivElement | null)[] };
}) {
  const root = useRef<THREE.Group>(null);
  const initialPosition = useRef<[number, number, number]>([
    player.position.x,
    0.12,
    player.position.z,
  ]);
  const { camera, size } = useThree();
  const skin = SKINS[player.skin] ?? SKINS.meadow;
  useFrame((_, dt) => {
    if (!root.current) return;
    root.current.position.lerp(
      new THREE.Vector3(player.position.x, 0.12, player.position.z),
      1 - Math.exp(-18 * Math.min(dt, 0.1))
    );
    const label = labels.current[index];
    if (label) {
      const point = root.current.position
        .clone()
        .add(new THREE.Vector3(0, 2, 0))
        .project(camera);
      const half = label.offsetWidth / 2 + 6;
      const x = Math.max(
        half,
        Math.min(size.width - half, ((point.x + 1) * size.width) / 2 + (index === 0 ? -30 : 30))
      );
      const y = Math.max(12, ((1 - point.y) * size.height) / 2 - (index === 0 ? 0 : 20));
      label.style.visibility = 'visible';
      label.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px) translate(-50%,-100%)`;
    }
    const rotation = root.current.rotation.y;
    root.current.rotation.y +=
      Math.atan2(Math.sin(player.heading - rotation), Math.cos(player.heading - rotation)) *
      Math.min(1, dt * 18);
  });
  return (
    <group ref={root} position={initialPosition.current}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.7, 28]} />
        <meshBasicMaterial
          color={player.hurt > 0 ? '#ee8c6a' : index === 0 ? '#5a9bb7' : '#c48160'}
          transparent
          opacity={0.85}
        />
      </mesh>
      <group scale={1.05}>
        <Character
          npc
          moving={player.moving}
          hoodie={player.skin === 'meadow' ? (index === 0 ? '#659cb7' : '#c78363') : skin.hoodie}
          accent={skin.accent}
          accessory={skin.accessory}
          arenaPose={{ weapon: player.weapon, actionTime: player.actionTime }}
        />
      </group>
      {player.actionTime > 0 && player.weapon === 'sword' && (
        <mesh position={[0, 0.8, 1]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.035, 5, 20, Math.PI]} />
          <meshBasicMaterial color="#fff1b0" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
export default function ArenaScene({ room, myId }: { room: RoomView; myId: string }) {
  const labels = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <>
      <Canvas
        orthographic
        shadows
        camera={{ position: [14, 20, 20], near: 0.1, far: 100, zoom: 18 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        aria-label="Live versus arena"
      >
        <CameraFit />
        <ambientLight intensity={1.5} />
        <directionalLight
          position={[5, 14, 8]}
          intensity={2.3}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <mesh position={[0, -0.4, 0]} receiveShadow>
          <cylinderGeometry args={[8.6, 8.9, 0.8, 64]} />
          <meshStandardMaterial color="#b5ad8a" />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[8.4, 64]} />
          <meshStandardMaterial color="#e3d7b4" />
        </mesh>
        {[7.5, 8.1].map((radius) => (
          <mesh key={radius} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius, radius + 0.08, 64]} />
            <meshStandardMaterial color="#9eaf7f" />
          </mesh>
        ))}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 1.9, 48]} />
          <meshStandardMaterial color="#b8c49b" />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <group key={i} position={[Math.sin(a) * 8.5, 0, Math.cos(a) * 8.5]}>
              <mesh position={[0, 0.55, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.28, 1.1, 6]} />
                <meshStandardMaterial color="#d9cfaf" />
              </mesh>
              <mesh position={[0, 1.2, 0]}>
                <octahedronGeometry args={[0.24]} />
                <meshStandardMaterial
                  color={i % 2 ? '#95b77c' : '#81adb3'}
                  emissive={i % 2 ? '#597d4d' : '#426e79'}
                  emissiveIntensity={0.2}
                />
              </mesh>
            </group>
          );
        })}
        <Suspense fallback={null}>
          {room.players.map((p, i) => (
            <Fighter key={p.id} player={p} index={i} labels={labels} />
          ))}
        </Suspense>
        {room.shots.map((s) => (
          <group
            key={s.id}
            position={[s.position.x, 0.9, s.position.z]}
            rotation={[0, Math.atan2(s.direction.x, s.direction.z), 0]}
          >
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.7, 5]} />
              <meshStandardMaterial color="#946e43" />
            </mesh>
            <mesh position={[0, 0, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.065, 0.17, 4]} />
              <meshStandardMaterial color="#f2edcd" />
            </mesh>
          </group>
        ))}
      </Canvas>
      <div className="arena-nameplates" aria-hidden="true">
        {room.players.map((p, i) => (
          <div
            className={`arena-name-tag team-${i}`}
            style={{ visibility: 'hidden' }}
            key={p.id}
            ref={(el) => {
              labels.current[i] = el;
            }}
          >
            <span />
            {p.id === myId ? 'You' : p.name}
          </div>
        ))}
      </div>
    </>
  );
}
