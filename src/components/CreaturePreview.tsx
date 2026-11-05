'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import { CreatureModel } from './Character';
import CreaturePortrait from './CreaturePortrait';
import type { Species } from '@/game/data';
function Display({ species, onReady }: { species: Species; onReady: () => void }) {
  const ref = useRef<Group>(null),
    reported = useRef(false);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += Math.min(dt, 0.05) * 0.35;
      if (!reported.current) {
        reported.current = true;
        onReady();
      }
    }
  });
  return (
    <group ref={ref} rotation={[0, -0.35, 0]}>
      <CreatureModel species={species} />
    </group>
  );
}
export default function CreaturePreview({ species }: { species: Species }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="creature-3d" aria-busy={!ready}>
      <Canvas
        dpr={1}
        camera={{ position: [0, 1.1, 3], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
      >
        <ambientLight intensity={1.7} />
        <directionalLight position={[3, 5, 4]} intensity={2} />
        <Display species={species} onReady={() => setReady(true)} />
      </Canvas>
      {!ready && (
        <div className="preview-placeholder">
          <CreaturePortrait species={species} />
          <small>Preparing 3D view…</small>
        </div>
      )}
    </div>
  );
}
