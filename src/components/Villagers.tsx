'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { NPCS } from '@/game/data';
import { villagerPose } from '@/game/villagers';
import { useGame } from '@/game/store';
import { Character } from './Character';
import { WorldLabel } from './WorldLabels';

export function Villager({ id }: { id: string }) {
  const n = NPCS.find((n) => n.id === id)!;
  const second = useGame((s) => Math.floor(s.save.playTime));
  const pose = villagerPose(id, second);
  const initialPosition = useRef(pose.position).current;
  const body = useRef<RapierRigidBody>(null);
  const model = useRef<THREE.Group>(null);
  const rotation = useRef(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, pose.heading, 0)));
  const desiredRotation = useRef(new THREE.Quaternion());
  const displayed = useRef(new THREE.Vector3(...initialPosition));
  const desired = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const state = useGame.getState();
    const p = villagerPose(id, state.save.playTime);
    if (!state.panel && !state.dialogue && !document.hidden) {
      desired.current.set(...p.position);
      displayed.current.lerp(desired.current, 1 - Math.exp(-14 * Math.min(dt, 0.1)));
    }
    body.current?.setNextKinematicTranslation({
      x: displayed.current.x,
      y: displayed.current.y,
      z: displayed.current.z,
    });
    desiredRotation.current.setFromEuler(new THREE.Euler(0, p.heading, 0));
    rotation.current.slerp(desiredRotation.current, 1 - Math.exp(-10 * Math.min(dt, 0.1)));
    body.current?.setNextKinematicRotation(rotation.current);
    if (model.current)
      model.current.rotation.x = THREE.MathUtils.damp(
        model.current.rotation.x,
        p.resting ? Math.PI / 2 : 0,
        8,
        dt
      );
  });
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={initialPosition}
      userData={{ interactionId: id }}
    >
      <CapsuleCollider args={[0.5, 0.35]} position={[0, 0.8, 0]} sensor={pose.indoors} />
      <group userData={{ interactionId: id }}>
        <group ref={model}>
          <Character
            color={n.color}
            hoodie={id === 'moss' ? '#c5b68d' : id === 'luna' ? '#e1d9ca' : '#cec4ad'}
            npc
            villagerId={id}
          />
        </group>
        {!pose.indoors && (
          <>
            <WorldLabel text={n.name} interactionId={id} position={[0, 2.5, 0]} size={0.4} />
          </>
        )}
      </group>
    </RigidBody>
  );
}

export function Workplaces() {
  return (
    <>
      {NPCS.map((n) => (
        <group key={n.id} position={[n.pos[0] + 0.6, 0, n.pos[2] + 1]}>
          {n.id === 'moss' ? (
            <>
              <mesh position={[0, 0.03, 0]}>
                <boxGeometry args={[2.2, 0.06, 0.5]} />
                <meshStandardMaterial color="#716047" />
              </mesh>
              {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => (
                <group key={x} position={[x, 0.15, 0]}>
                  <mesh rotation={[0, 0, 0.4]}>
                    <sphereGeometry args={[0.13, 8, 6]} />
                    <meshStandardMaterial color="#7eaa57" />
                  </mesh>
                  <mesh position={[0.09, 0.08, 0]}>
                    <sphereGeometry args={[0.1, 8, 6]} />
                    <meshStandardMaterial color="#d4be82" />
                  </mesh>
                </group>
              ))}
            </>
          ) : (
            <>
              <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2.2, 0.12, 0.55]} />
                <meshStandardMaterial color="#a3875f" />
              </mesh>
              {[-0.9, 0.9].map((x) => (
                <mesh key={x} position={[x, 0.25, 0]}>
                  <boxGeometry args={[0.12, 0.5, 0.4]} />
                  <meshStandardMaterial color="#806b50" />
                </mesh>
              ))}
              {n.id === 'bruno' ? (
                <mesh position={[0, 0.63, 0]}>
                  <boxGeometry args={[1.8, 0.14, 0.23]} />
                  <meshStandardMaterial color="#d0ad75" />
                </mesh>
              ) : n.id === 'foxy' ? (
                <>
                  {[-0.65, 0.6].map((x) => (
                    <mesh key={x} position={[x, 0.75, 0]}>
                      <boxGeometry args={[0.4, 0.4, 0.4]} />
                      <meshStandardMaterial color="#be9360" />
                    </mesh>
                  ))}
                </>
              ) : n.id === 'luna' ? (
                <mesh position={[0, 0.6, 0]} rotation={[0, 0.2, 0]}>
                  <boxGeometry args={[0.65, 0.06, 0.4]} />
                  <meshStandardMaterial color="#eee4c2" />
                </mesh>
              ) : (
                <>
                  <mesh position={[0, 0.78, 0]}>
                    <sphereGeometry args={[0.27, 12, 8]} />
                    <meshStandardMaterial color="#526d65" />
                  </mesh>
                  <mesh position={[0, 0.99, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.19, 12]} />
                    <meshStandardMaterial
                      color="#a1d4a6"
                      emissive="#4b825a"
                      emissiveIntensity={0.3}
                    />
                  </mesh>
                </>
              )}
            </>
          )}
        </group>
      ))}
    </>
  );
}
