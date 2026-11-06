'use client';
import { maxCreatureHp } from '@/game/rules';
import { TRAINING, formation, retreatPosition, squadOf, memberOf } from '@/game/squad';
import { squadRuntime } from '@/game/squad-runtime';
import AbilityEffects from './AbilityEffects';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import {
  Physics,
  RigidBody,
  CuboidCollider,
  CapsuleCollider,
  type RapierRigidBody,
  useRapier,
} from '@react-three/rapier';
import * as THREE from 'three';
import {
  CREATURES,
  ITEMS,
  LANDMARKS,
  NPCS,
  OBJECTS,
  PLOT,
  type Species,
  type Vec3,
} from '@/game/data';
import { useGame } from '@/game/store';
import { validPlacement, type Block } from '@/game/rules';
import { keys, motion, playerRuntime, companionRuntime, navigation } from '@/game/input';
import { touchInput, touchLook } from '@/game/touch';
import AttackEffects from './AttackEffects';
import { ArchedBridge, RiverWater } from './River';
import { WorldLabel as Label, WorldLabelLayout } from './WorldLabels';
import { SKINS, cameraProfile } from '@/game/appearance';
import { RIVER, waterMotion } from '@/game/river';
import { sound } from '@/game/audio';
import { Character, CreatureModel } from './Character';
import { Villager, Workplaces } from './Villagers';
import { HOMES, npcPosition, villagerPose, homePoint } from '@/game/villagers';
const UP = new THREE.Vector3(0, 1, 0);
function Box({
  position,
  size,
  color,
  rotation = [0, 0, 0],
  ...rest
}: {
  position: Vec3;
  size: Vec3;
  color: string;
  rotation?: Vec3;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (e: ThreeEvent<PointerEvent>) => void;
}) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow {...rest}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.88} />
    </mesh>
  );
}
function Tree({
  position,
  scale = 1,
  autumn = false,
}: {
  position: Vec3;
  scale?: number;
  autumn?: boolean;
}) {
  return (
    <group position={position} scale={scale}>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.32, 1.5, 0.32]} position={[0, 1.5, 0]} />
        <Box position={[0, 1.6, 0]} size={[0.55, 3.2, 0.55]} color="#816951" />
      </RigidBody>
      {[
        [-0.8, 3.1, 0.1, 1.5],
        [0.65, 3.5, 0.15, 1.5],
        [0, 4.25, 0, 1.65],
        [0, 3, -0.7, 1.4],
      ].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <icosahedronGeometry args={[r, 1]} />
          <meshStandardMaterial
            color={
              autumn
                ? ['#b4bb6c', '#ccba75', '#a3af66', '#b9c97b'][i]
                : ['#7caa63', '#91b976', '#a3c681', '#6c9c5b'][i]
            }
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
function House({
  resident,
  position,
  color = '#e4d5b1',
  roof = '#8a9c76',
  rotation = 0,
  shop = false,
}: {
  resident: string;
  position: Vec3;
  color?: string;
  roof?: string;
  rotation?: number;
  shop?: boolean;
}) {
  const second = useGame((s) => Math.floor(s.save.playTime));
  const residentPose = villagerPose(resident, second);
  const indoors = residentPose.indoors;
  const door = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const p = villagerPose(resident, useGame.getState().save.playTime);
    const entrance = homePoint(resident, 2.5);
    const near = Math.hypot(p.position[0] - entrance[0], p.position[2] - entrance[2]) < 3;
    const player = playerRuntime.position;
    const playerNear = Math.hypot(player[0] - entrance[0], player[2] - entrance[2]) < 2;
    if (door.current)
      door.current.rotation.y = THREE.MathUtils.damp(
        door.current.rotation.y,
        (near && p.moving) || playerNear ? -Math.PI * 0.6 : 0,
        8,
        dt
      );
  });
  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      userData={indoors ? { interactionId: resident } : {}}
    >
      <RigidBody type="fixed" colliders={false}>
        {(
          [
            [
              [-2.5, 1.88, 0],
              [0.2, 3.4, 4.2],
            ],
            [
              [2.5, 1.88, 0],
              [0.2, 3.4, 4.2],
            ],
            [
              [0, 1.88, -2],
              [5.2, 3.4, 0.2],
            ],
            [
              [-1.6, 1.88, 2],
              [2, 3.4, 0.2],
            ],
            [
              [1.6, 1.88, 2],
              [2, 3.4, 0.2],
            ],
            [
              [0, 3.02, 2],
              [1.2, 1.12, 0.2],
            ],
            [
              [0, 0.18, 0],
              [5.6, 0.36, 4.6],
            ],
          ] as [Vec3, Vec3][]
        ).map(([p, size], i) => (
          <group key={i}>
            <CuboidCollider position={p} args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
            <Box position={p} size={size} color={i === 6 ? '#a5a18a' : color} />
          </group>
        ))}
      </RigidBody>
      <mesh position={[0, 4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[4.4, 2, 4]} />
        <meshStandardMaterial color={roof} flatShading />
      </mesh>
      <Box position={[0, 4.8, 0.3]} size={[0.6, 1.4, 0.7]} color="#b9aa8e" />
      <group ref={door} position={[-0.58, 0.36, 2.14]}>
        <Box position={[0.58, 1.05, 0]} size={[1.16, 2.1, 0.12]} color="#7e7157" />
        <Box position={[0.92, 1, 0.1]} size={[0.08, 0.08, 0.08]} color="#e6cc85" />
      </group>
      <Box position={[0, 0.55, -0.1]} size={[1.3, 0.38, 2.4]} color="#92744e" />
      <Box position={[0, 0.77, -0.1]} size={[1.2, 0.12, 2.3]} color="#b8c9a2" />
      <Box position={[0, 0.88, 0.7]} size={[1, 0.16, 0.45]} color="#eee5d2" />
      {indoors && (
        <Label
          interactionId={resident}
          text={NPCS.find((n) => n.id === resident)!.name}
          position={[0, 2.8, 3.5]}
          size={0.4}
        />
      )}

      {[-1.7, 1.7].map((x) => (
        <group key={x}>
          <Box position={[x, 1.9, 2.15]} size={[0.95, 1, 0.12]} color="#6e8274" />
          <mesh position={[x, 1.9, 2.23]}>
            <boxGeometry args={[0.7, 0.78, 0.05]} />
            <meshStandardMaterial
              color={indoors ? '#ffe3a0' : '#d8e3c5'}
              emissive="#ffc66b"
              emissiveIntensity={indoors ? 0.55 : 0}
            />
          </mesh>
          <Box position={[x, 1.9, 2.27]} size={[0.06, 0.85, 0.06]} color="#8d8469" />
          <Box position={[x, 1.9, 2.27]} size={[0.8, 0.06, 0.06]} color="#8d8469" />
          <Box position={[x, 1.25, 2.35]} size={[1.2, 0.2, 0.5]} color="#8c7659" />
          {[-0.3, 0, 0.3].map((dx) => (
            <mesh key={dx} position={[x + dx, 1.45, 2.4]}>
              <sphereGeometry args={[0.17, 8, 6]} />
              <meshStandardMaterial color={dx === 0 ? '#e2c783' : '#b6bf79'} />
            </mesh>
          ))}
        </group>
      ))}
      {shop && (
        <>
          <Box position={[0, 2.6, 3]} size={[5.5, 0.15, 2]} color="#b0bb87" />
          {[-2.5, 2.5].map((x) => (
            <Box key={x} position={[x, 1.3, 3.7]} size={[0.14, 2.6, 0.14]} color="#867455" />
          ))}
          {[-1.45, 1.45].map((x) => (
            <Box key={x} position={[x, 0.65, 3.5]} size={[1.6, 1.3, 0.8]} color="#ae8b61" />
          ))}
        </>
      )}
    </group>
  );
}
function Terrain() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const tiles = useMemo(() => {
    const a = [];
    const xs = [
      ...new Set([...Array.from({ length: 65 }, (_, i) => -128 + i * 4), RIVER.left, RIVER.right]),
    ].sort((a, b) => a - b);
    const zs = [
      ...new Set([...Array.from({ length: 65 }, (_, i) => -128 + i * 4), RIVER.north, RIVER.south]),
    ].sort((a, b) => a - b);
    for (let i = 0; i < xs.length - 1; i++)
      for (let j = 0; j < zs.length - 1; j++) {
        const x = xs[i],
          z = zs[j],
          width = xs[i + 1] - x,
          depth = zs[j + 1] - z;
        const river = x >= RIVER.left && x < RIVER.right && z >= RIVER.north && z < RIVER.south;
        a.push({
          x,
          z,
          width,
          depth,
          river,
          color: river ? '#b7b091' : ((i * 31 + j * 17) & 7) < 3 ? '#96b981' : '#9dbe87',
        });
      }
    return a;
  }, []);
  useEffect(() => {
    if (!mesh.current) return;
    const m = new THREE.Object3D();
    tiles.forEach((t, i) => {
      m.position.set(t.x + t.width / 2, t.river ? RIVER.bed - 0.6 : -0.6, t.z + t.depth / 2);
      m.scale.set(t.width, 1.2, t.depth);
      m.updateMatrix();
      mesh.current!.setMatrixAt(i, m.matrix);
      mesh.current!.setColorAt(i, new THREE.Color(t.color));
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  }, [tiles]);
  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, tiles.length]} receiveShadow>
        <boxGeometry />
        <meshStandardMaterial roughness={1} />
      </instancedMesh>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[81.25, 0.6, 128]} position={[-46.75, -0.6, 0]} />
        <CuboidCollider args={[42.25, 0.6, 128]} position={[85.75, -0.6, 0]} />
        <CuboidCollider args={[4.5, 0.6, 42.5]} position={[39, -0.6, -85.5]} />
        <CuboidCollider args={[4.5, 0.6, 67.5]} position={[39, -0.6, 60.5]} />
        <CuboidCollider args={[4.5, 0.6, 18]} position={[39, RIVER.bed - 0.6, -25]} />
        {[-1, 1].map((side) => (
          <CuboidCollider
            key={side}
            args={[Math.hypot(1, 0.95) / 2, 0.1, 18]}
            position={[side === -1 ? 35 : 43, -0.475, -25]}
            rotation={[0, 0, side * Math.atan(0.95)]}
          />
        ))}
        {[
          [128, 0],
          [-128, 0],
          [0, 128],
          [0, -128],
        ].map(([x, z], i) => (
          <CuboidCollider key={i} args={x ? [0.5, 12, 128] : [128, 12, 0.5]} position={[x, 8, z]} />
        ))}
      </RigidBody>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} receiveShadow>
        <circleGeometry args={[9, 12]} />
        <meshStandardMaterial color="#c5bea0" />
      </mesh>
      <RiverWater />
      {Array.from({ length: 28 }, (_, i) => (
        <Box
          key={i}
          position={[i * 3 - 14, 0.025, 1 + Math.sin(i * 0.12) * 1.5]}
          size={[3.05, 0.045, 3.6]}
          color={i % 3 === 0 ? '#c3b995' : '#cbbf9d'}
        />
      ))}
      <Box position={[3, 0.025, 16]} size={[3, 0.05, 18]} color="#c6bc9e" />
      <ArchedBridge />
    </>
  );
}
function InstancedForest({ trees }: { trees: { x: number; z: number; s: number }[] }) {
  const trunks = useRef<THREE.InstancedMesh>(null),
    leaves = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    if (!trunks.current || !leaves.current) return;
    const m = new THREE.Object3D();
    trees.forEach((t, i) => {
      m.position.set(t.x, 1.6 * t.s, t.z);
      m.scale.set(0.55 * t.s, 3.2 * t.s, 0.55 * t.s);
      m.updateMatrix();
      trunks.current!.setMatrixAt(i, m.matrix);
      [
        [-0.8, 3.1, 0.1, 1.5],
        [0.65, 3.5, 0.15, 1.5],
        [0, 4.25, 0, 1.65],
        [0, 3, -0.7, 1.4],
      ].forEach(([x, y, z, r], j) => {
        m.position.set(t.x + x * t.s, y * t.s, t.z + z * t.s);
        m.scale.setScalar(r * t.s);
        m.updateMatrix();
        leaves.current!.setMatrixAt(i * 4 + j, m.matrix);
        leaves.current!.setColorAt(
          i * 4 + j,
          new THREE.Color(
            (i % 7 === 0
              ? ['#b4bb6c', '#ccba75', '#a3af66', '#b9c97b']
              : ['#7caa63', '#91b976', '#a3c681', '#6c9c5b'])[j]
          )
        );
      });
    });
    trunks.current.instanceMatrix.needsUpdate = true;
    leaves.current.instanceMatrix.needsUpdate = true;
    leaves.current.instanceColor!.needsUpdate = true;
  }, [trees]);
  return (
    <>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} castShadow>
        <boxGeometry />
        <meshStandardMaterial color="#816951" />
      </instancedMesh>
      <instancedMesh ref={leaves} args={[undefined, undefined, trees.length * 4]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial flatShading />
      </instancedMesh>
      <RigidBody type="fixed" colliders={false}>
        {trees.map((t, i) => (
          <CuboidCollider
            key={i}
            position={[t.x, 1.5 * t.s, t.z]}
            args={[0.32 * t.s, 1.5 * t.s, 0.32 * t.s]}
          />
        ))}
      </RigidBody>
    </>
  );
}
function Scenery() {
  const trees = useMemo(
    () =>
      Array.from({ length: 155 }, (_, i) => {
        const x = ((i * 37) % 211) - 100,
          z = ((i * 61) % 211) - 100;
        return { x, z, s: 0.8 + (i % 5) * 0.13 };
      }).filter(
        (t) =>
          !(t.x > -26 && t.x < 99 && t.z > -30 && t.z < 49) &&
          !(t.x > RIVER.left && t.x < RIVER.right && t.z > RIVER.north && t.z < RIVER.south)
      ),
    []
  );
  return (
    <>
      <InstancedForest trees={trees} />
      {[
        [-23, 0, -7],
        [-17, 0, -15],
        [-4, 0, -19],
        [16, 0, -19],
        [-24, 0, 16],
        [15, 0, 18],
        [22, 0, -13],
        [27, 0, 35],
        [58, 0, 43],
        [72, 0, 26],
        [82, 0, -12],
      ].map((p, i) => (
        <Tree key={i} position={p as Vec3} scale={1.1 + (i % 3) * 0.15} />
      ))}
      <Tree position={[45, 0, 42]} scale={2} />
      {HOMES.map((h) => (
        <House key={h.id} resident={h.id} {...h} />
      ))}
      <group position={[0, 0, -3]}>
        <Box position={[0, 0.25, 0]} size={[3, 0.5, 3]} color="#a7ac96" />
        <Box position={[0, 0.6, 0]} size={[2.3, 0.3, 2.3]} color="#c2c9b2" />
        <Box position={[0, 0.8, 0]} size={[1.8, 0.1, 1.8]} color="#8bbac0" />
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.35, 0.8, 8]} />
          <meshStandardMaterial color="#b4baa4" />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.45, 12, 8]} />
          <meshStandardMaterial color="#c7d1b2" />
        </mesh>
      </group>
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, 4]}>
          <Box position={[0, 0.5, 0]} size={[2, 0.18, 0.7]} color="#aa8861" />
          {[-0.8, 0.8].map((dx) => (
            <Box key={dx} position={[dx, 0.25, 0]} size={[0.15, 0.5, 0.5]} color="#7b7057" />
          ))}
        </group>
      ))}
      <group position={[18, 0, 1]}>
        <Box position={[0, 1.3, 0]} size={[0.2, 2.6, 0.2]} color="#89765b" />
        <Box position={[0, 2.3, 0]} size={[3, 0.65, 0.2]} color="#a48b64" />
        <Label text="GREENWOOD →" position={[0, 2.3, 0.2]} size={0.34} />
      </group>
      {Array.from({ length: 13 }, (_, i) => (
        <group key={i} position={[-6 + i * 1.33, 0, 35]}>
          <Box position={[0, 0.6, 0]} size={[0.13, 1.2, 0.13]} color="#c2b28b" />
          <Box position={[0.6, 0.8, 0]} size={[1.3, 0.12, 0.12]} color="#cabb96" />
        </group>
      ))}
      <Label text="YOUR HOMESTEAD" position={[2, 1.3, 35]} size={0.4} />
      {Array.from({ length: 95 }, (_, i) => {
        const x = ((i * 17) % 103) - 24,
          z = ((i * 23) % 61) - 22;
        if (Math.abs(z) < 4 || (x < 15 && z < 18)) return null;
        return (
          <group key={i} position={[x, 0.1, z]}>
            <mesh rotation={[0, i, 0]}>
              <coneGeometry args={[0.18, 0.5, 3]} />
              <meshStandardMaterial color="#718e58" />
            </mesh>
            {i % 3 === 0 && (
              <mesh position={[0.12, 0.3, 0]}>
                <icosahedronGeometry args={[0.12, 0]} />
                <meshStandardMaterial color={i % 2 ? '#ede3ad' : '#d9b3b0'} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
}
function ObjectMesh({ id }: { id: string }) {
  const shake = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!shake.current) return;
    const harvest = playerRuntime.harvest;
    const elapsed = harvest ? (Date.now() - harvest.started) / 1000 : 2;
    shake.current.rotation.z =
      harvest?.id === id && elapsed < 0.7
        ? Math.sin(elapsed * 36) * 0.045 * (1 - elapsed / 0.7)
        : 0;
  });
  const obj = OBJECTS.find((o) => o.id === id)!;
  const used = useGame((s) => s.save.nodes[id] ?? 0),
    time = useGame((s) => Math.floor(s.save.playTime / 10)),
    done = useGame((s) => s.save.flags.includes('ability:' + id)),
    markedPlant = useGame(
      (s) =>
        id === 'plant' &&
        s.save.quests.q07?.status === 'active' &&
        !s.save.flags.includes('ability:plant')
    ),
    guardianHp = useGame((s) => (id === 'guardian' ? s.save.enemyHp : 0)),
    target = useGame((s) => s.target === id),
    telegraph = useGame(
      (s) =>
        id === 'guardian' &&
        s.save.enemyCooldown < 0.9 &&
        s.save.enemyHp > 0 &&
        s.save.flags.includes('repaired')
    );
  const guardianPosition = useGame((s) =>
    id === 'guardian' ? s.save.squad?.enemyPosition : undefined
  );
  const trainingHp = useGame((s) =>
    id.startsWith('training') ? s.save.squad?.training[Number(id.slice(-1))] : undefined
  );
  const trainingIndex = TRAINING.findIndex((t) => t.id === id);
  const depleted = used > time * 10;
  if (obj.kind === 'landmark') return null;
  return (
    <group
      ref={shake}
      position={id === 'guardian' ? (guardianPosition ?? obj.pos) : obj.pos}
      userData={{ interactionId: obj.id }}
    >
      {trainingIndex < 0 && id !== 'guardian' && id !== 'plant' && (
        <Label
          interactionId={id}
          text={`${obj.name}${obj.kind === 'resource' && depleted ? ' · Regrowing' : ''}`}
          position={[0, obj.item === 'wood' ? 2.6 : 1.8, 0]}
          size={0.43}
        />
      )}
      {trainingIndex >= 0 ? (
        <group>
          <Box position={[0, 0.7, 0]} size={[0.18, 1.4, 0.18]} color="#8c7659" />
          <Box
            position={[0, 1.2, 0]}
            size={[1.2, 0.65, 0.45]}
            color={(trainingHp ?? 240) > 0 ? '#b6a66c' : '#77776b'}
          />
          <Label
            interactionId={id}
            text={`${obj.name} · ${Math.ceil(trainingHp ?? 240)} HP`}
            position={[0, 2, 0]}
            size={0.28}
          />
        </group>
      ) : obj.item === 'wood' ? (
        <Tree position={[0, 0, 0]} scale={depleted ? 0.75 : 1} />
      ) : obj.item === 'berry' || obj.item === 'fruit' ? (
        <>
          <mesh position={[0, 0.55, 0]} castShadow>
            <icosahedronGeometry args={[0.65, 1]} />
            <meshStandardMaterial color={depleted ? '#819b69' : '#7c9d60'} />
          </mesh>
          {!depleted &&
            [-0.3, 0, 0.3].map((x, i) => (
              <mesh key={i} position={[x, 0.7, 0.5]}>
                <sphereGeometry args={[0.12, 8, 6]} />
                <meshStandardMaterial color={obj.item === 'fruit' ? '#e1c879' : '#b66a7c'} />
              </mesh>
            ))}
        </>
      ) : obj.item === 'fiber' ? (
        <group scale={depleted ? 0.5 : 1}>
          {[-1, 0, 1].map((x) => (
            <mesh key={x} position={[x * 0.15, 0.3, 0]} rotation={[0, 0, x * 0.3]}>
              <coneGeometry args={[0.15, 0.65, 4]} />
              <meshStandardMaterial color="#698d58" />
            </mesh>
          ))}
        </group>
      ) : obj.item === 'crystal' || obj.item === 'fragment' ? (
        <>
          {[-0.25, 0.1, 0.3].map((x, i) => (
            <mesh key={i} position={[x, 0.35 + i * 0.1, 0]} rotation={[0, 0, x]} castShadow>
              <coneGeometry args={[0.22, 0.8 + i * 0.15, 5]} />
              <meshStandardMaterial
                color={depleted ? '#8a9e94' : obj.item === 'fragment' ? '#d6c869' : '#a5cbd2'}
                emissive={depleted ? '#000' : '#75a4ac'}
                emissiveIntensity={0.25}
              />
            </mesh>
          ))}
        </>
      ) : obj.item === 'stone' || obj.item === 'ore' ? (
        <RigidBody type="fixed" colliders="hull">
          <mesh position={[0, 0.4, 0]} scale={[1, 0.65, 0.8]} castShadow>
            <dodecahedronGeometry args={[0.8, 0]} />
            <meshStandardMaterial color={obj.item === 'ore' ? '#a6967f' : '#9ca69a'} />
          </mesh>
        </RigidBody>
      ) : obj.id === 'guardian' ? (
        <>
          <group scale={[1.8, 1.8, 1.8]}>
            <CreatureModel species="mosshell" moving={guardianHp < 100 && guardianHp > 0} />
          </group>
          {guardianHp > 0 && (
            <Label
              interactionId={id}
              text={`BRAMBLE GUARDIAN · ${guardianHp} HP`}
              position={[0, 2.7, 0]}
              size={0.5}
            />
          )}
        </>
      ) : obj.id === 'craft' ? (
        <>
          <Box position={[0, 0.8, 0]} size={[2, 0.25, 1.2]} color="#ae916c" />
          {[-0.8, 0.8].map((x) => (
            <Box key={x} position={[x, 0.4, 0]} size={[0.15, 0.8, 0.8]} color="#8b795c" />
          ))}
          <Box position={[0.4, 1.1, 0]} size={[0.5, 0.4, 0.5]} color="#8e9b94" />
        </>
      ) : obj.id === 'heal' ? (
        <>
          <Box position={[0, 0.55, 0]} size={[1.5, 1.1, 1]} color="#d8d3b7" />
          <Box position={[0, 1.15, 0]} size={[1.7, 0.2, 1.2]} color="#b1cba9" />
          <mesh position={[0, 1.5, 0]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial color="#a0d2bb" emissive="#7da68e" emissiveIntensity={0.4} />
          </mesh>
        </>
      ) : obj.id === 'board' ? (
        <>
          <Box position={[0, 1.7, 0]} size={[2, 1.5, 0.2]} color="#9c8562" />
          <Box position={[0, 0.7, 0]} size={[0.17, 1.4, 0.17]} color="#7c7258" />
          <Box position={[0, 1.7, 0.13]} size={[1.6, 1.1, 0.03]} color="#ded3ad" />
        </>
      ) : obj.id === 'chest' ? (
        <>
          <Box position={[0, 0.4, 0]} size={[1.1, 0.8, 0.7]} color="#a58759" />
          <Box position={[0, 0.4, 0.37]} size={[0.15, 0.3, 0.04]} color="#dfcd89" />
        </>
      ) : obj.id === 'plant' ? (
        <>
          <mesh position={[0, 0.1, 0]} receiveShadow>
            <cylinderGeometry args={[0.95, 1, 0.2, 12]} />
            <meshStandardMaterial color="#827251" />
          </mesh>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 1.2, 8]} />
            <meshStandardMaterial color={done ? '#81a96a' : '#739362'} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh
              key={side}
              position={[side * 0.28, 0.55, 0]}
              scale={[0.4, 0.12, 0.2]}
              rotation={[0, 0, side * 0.4]}
              castShadow
            >
              <sphereGeometry args={[1, 12, 8]} />
              <meshStandardMaterial color="#86ad6b" />
            </mesh>
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const angle = (i * Math.PI) / 3;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * 0.39, 1.3, Math.sin(angle) * 0.39]}
                rotation={[0, -angle, 0]}
                scale={[0.48, 0.13, 0.22]}
                castShadow
              >
                <sphereGeometry args={[1, 16, 10]} />
                <meshStandardMaterial
                  color={done ? '#e3d2f8' : '#f5edff'}
                  emissive="#b5a0d4"
                  emissiveIntensity={done ? 0.3 : 0.13}
                />
              </mesh>
            );
          })}
          <mesh position={[0, 1.35, 0]}>
            <sphereGeometry args={[0.23, 16, 10]} />
            <meshStandardMaterial
              color={done ? '#a6d7ec' : '#dcc477'}
              emissive={done ? '#80b5d1' : '#bba453'}
              emissiveIntensity={0.35}
            />
          </mesh>
          <Label
            interactionId={id}
            text={done ? 'Moonflower · watered' : 'Thirsty moonflower'}
            position={[0, 2.05, 0]}
            color={done ? '#b9e1eb' : '#fff1bc'}
            size={0.6}
          />
          {markedPlant && (
            <>
              <mesh position={[0, 0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.05, 1.22, 40]} />
                <meshBasicMaterial color="#f5d574" transparent opacity={0.9} />
              </mesh>
              <mesh position={[0, 2.65, 0]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.2, 0.38, 4]} />
                <meshBasicMaterial color="#f5d574" />
              </mesh>
              <mesh position={[0, 1.65, 0]}>
                <cylinderGeometry args={[0.12, 0.42, 3, 16, 1, true]} />
                <meshBasicMaterial color="#f9df96" transparent opacity={0.1} depthWrite={false} />
              </mesh>
            </>
          )}
        </>
      ) : obj.id === 'toughNode' || obj.id === 'passage' ? (
        <Box
          position={[0, done ? 0.15 : 1, 0]}
          size={[obj.id === 'passage' ? 4 : 1.5, done ? 0.3 : 2, 1.5]}
          color={done ? '#b4b59e' : '#8b9784'}
        />
      ) : obj.id === 'repair' ? (
        <Box position={[0, 0.1, 0]} size={[4, 0.2, 4]} color="#b9a884" />
      ) : (
        <>
          <Box position={[0, 0.5, 0]} size={[0.8, 1, 0.8]} color="#9aab9d" />
          <mesh position={[0, 1.25, 0]}>
            <octahedronGeometry args={[0.3]} />
            <meshStandardMaterial
              color={done ? '#e9d983' : '#8bafa9'}
              emissive={done ? '#c7b66b' : '#000'}
              emissiveIntensity={0.5}
            />
          </mesh>
        </>
      )}
      {telegraph && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 2.3, 32]} />
          <meshBasicMaterial color="#cf8865" transparent opacity={0.55} />
        </mesh>
      )}
      {target && (
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color="#fff2b5" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
function Player() {
  const skin = useGame((s) => s.settings.skin);
  const perspective = useGame((s) => s.settings.perspective);
  const mobile = useThree((s) => s.size.width <= 900) || matchMedia('(pointer: coarse)').matches;
  const mobileRef = useRef(mobile);
  mobileRef.current = mobile;
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<THREE.Group>(null);
  const { camera, size, set: setThree } = useThree();
  const originalCamera = useRef(camera);
  const isoCamera = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 180), []);
  useEffect(() => {
    setThree({ camera: perspective === 'adventure' ? isoCamera : originalCamera.current });
  }, [perspective, isoCamera, setThree]);
  const { world, rapier } = useRapier();
  const [moving, setMoving] = useState(false),
    [running, setRunning] = useState(false);
  const accumulator = useRef(0),
    jumpLatch = useRef(false),
    safe = useRef<Vec3>([0, 1, 5]);
  const previousPosition = useRef(new THREE.Vector3());
  const stuckTime = useRef(0);
  const camPos = useRef(new THREE.Vector3()),
    look = useRef(new THREE.Vector3());
  useEffect(() => {
    useGame.setState({ worldReady: true });
    const s = useGame.getState().save.position;
    body.current?.setTranslation({ x: s[0], y: s[1], z: s[2] }, true);
    camPos.current.set(s[0], s[1] + 5, s[2] + 9);
    return useGame.subscribe((state, previous) => {
      const p = state.save.position,
        old = previous.save.position;
      if ((state.started && !previous.started) || Math.hypot(p[0] - old[0], p[2] - old[2]) > 15) {
        body.current?.setTranslation({ x: p[0], y: p[1], z: p[2] }, true);
        body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
        const profile = cameraProfile(state.settings, mobileRef.current, motion.pitch);
        const cameraYaw = motion.yaw + profile.yawOffset;
        look.current.set(p[0], p[1] + profile.focusHeight, p[2]);
        camPos.current.set(
          p[0] + Math.sin(cameraYaw) * Math.cos(profile.pitch) * profile.distance,
          p[1] + profile.focusHeight + Math.sin(profile.pitch) * profile.distance,
          p[2] + Math.cos(cameraYaw) * Math.cos(profile.pitch) * profile.distance
        );
      }
    });
  }, []);
  useFrame((_, rawDt) => {
    const b = body.current;
    if (!b) return;
    const dt = Math.min(rawDt, 0.05),
      state = useGame.getState(),
      p = b.translation();
    const profile = cameraProfile(state.settings, mobileRef.current, motion.pitch);
    const enemyPosition = squadOf(state.save).enemyPosition;
    const cameraYaw = motion.yaw + profile.yawOffset;
    const paused = !state.started || !!state.panel || !!state.dialogue || document.hidden;
    const groundRay = new rapier.Ray({ x: p.x, y: p.y - 0.4, z: p.z }, { x: 0, y: -1, z: 0 });
    const hit = world.castRay(groundRay, 0.65, true, undefined, undefined, undefined, b);
    const grounded = !!hit && hit.timeOfImpact < 0.57;
    let dx = 0,
      dz = 0;
    if (!paused) {
      dx = (keys.has('KeyD') ? 1 : 0) - (keys.has('KeyA') ? 1 : 0);
      dz = (keys.has('KeyS') ? 1 : 0) - (keys.has('KeyW') ? 1 : 0);
      if (!dx && !dz) {
        dx = touchInput.x;
        dz = touchInput.z;
      }
    }
    if (paused || dx || dz) navigation.destination = null;
    const destination = navigation.destination;
    const dir = new THREE.Vector3(dx, 0, dz).clampLength(0, 1).applyAxisAngle(UP, cameraYaw);
    if (destination && !paused) {
      if (destination.interaction && NPCS.some((n) => n.id === destination.interaction)) {
        const pos = npcPosition(destination.interaction, useGame.getState().save.playTime);
        destination.x = pos[0];
        destination.z = pos[2];
      }
      const distance = Math.hypot(destination.x - p.x, destination.z - p.z);
      const arrival = destination.interaction
        ? destination.interaction === 'guardian'
          ? 4
          : 2.1
        : 0.3;
      if (distance <= arrival) {
        navigation.destination = null;
        if (destination.interaction) {
          useGame.setState({ target: destination.interaction });
          useGame.getState().interact();
        }
      } else {
        dir.set(destination.x - p.x, 0, destination.z - p.z).normalize();
        stuckTime.current =
          previousPosition.current.distanceTo(new THREE.Vector3(p.x, p.y, p.z)) < 0.005
            ? stuckTime.current + dt
            : 0;
        if (stuckTime.current > 1.5) {
          navigation.destination = null;
          dir.set(0, 0, 0);
          state.notify('The way is blocked. Click a clear spot or use WASD to go around.');
        }
      }
    } else stuckTime.current = 0;
    previousPosition.current.set(p.x, p.y, p.z);
    const harvest = playerRuntime.harvest;
    if (harvest && Date.now() - harvest.started < 700) {
      dir.set(0, 0, 0);
      if (visual.current)
        visual.current.rotation.y = Math.atan2(
          harvest.position[0] - p.x,
          harvest.position[2] - p.z
        );
    }
    const isMoving = dir.lengthSq() > 0,
      isRunning = keys.has('ShiftLeft') || keys.has('ShiftRight') || touchInput.sprint;
    if (isMoving !== moving) setMoving(isMoving);
    if (isRunning !== running) setRunning(isRunning);
    const wet = waterMotion(p, b.linvel().y, dt);
    const speed = (isRunning ? 7 : 4) * wet.speedScale;
    let vy = paused ? 0 : wet.verticalSpeed;
    if (!paused && (keys.has('Space') || touchInput.jump) && grounded && !jumpLatch.current) {
      vy = 6.8;
      jumpLatch.current = true;
      sound('jump', state.settings.effects * 0.4);
    }
    if (!keys.has('Space') && !touchInput.jump) jumpLatch.current = false;
    b.setLinvel({ x: dir.x * speed, y: vy, z: dir.z * speed }, true);
    b.setGravityScale(paused ? 0 : 1, true);
    if (
      visual.current &&
      Date.now() < playerRuntime.actionUntil &&
      playerRuntime.action === 'attack' &&
      state.save.flags.includes('repaired') &&
      Math.hypot(p.x - enemyPosition[0], p.z - enemyPosition[2]) < 6
    )
      visual.current.rotation.y = Math.atan2(enemyPosition[0] - p.x, enemyPosition[2] - p.z);
    if (visual.current && isMoving) {
      const target = Math.atan2(dir.x, dir.z);
      visual.current.rotation.y +=
        Math.atan2(
          Math.sin(target - visual.current.rotation.y),
          Math.cos(target - visual.current.rotation.y)
        ) * Math.min(1, dt * 14);
    }
    if (grounded && p.y > 0.5) safe.current = [p.x, p.y, p.z];
    if (p.y < -6 || Math.abs(p.x) > 129 || Math.abs(p.z) > 129) {
      b.setTranslation({ x: safe.current[0], y: safe.current[1] + 0.2, z: safe.current[2] }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
    playerRuntime.position = [p.x, p.y, p.z];
    if (visual.current) playerRuntime.heading = visual.current.rotation.y;
    playerRuntime.moving = isMoving;
    playerRuntime.running = isRunning;
    playerRuntime.grounded = grounded;
    const focus = new THREE.Vector3(p.x, p.y + profile.focusHeight, p.z),
      distance = profile.distance;
    if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as THREE.OrthographicCamera;
      const half = profile.span / 2;
      const aspect = size.width / size.height;
      if (ortho.top !== half || ortho.right !== half * aspect) {
        ortho.left = -half * aspect;
        ortho.right = half * aspect;
        ortho.top = half;
        ortho.bottom = -half;
        ortho.updateProjectionMatrix();
      }
    } else {
      const perspectiveCamera = camera as THREE.PerspectiveCamera;
      const nextFov = THREE.MathUtils.damp(perspectiveCamera.fov, profile.fov, 8, dt);
      if (Math.abs(perspectiveCamera.fov - nextFov) > 0.001) {
        perspectiveCamera.fov = nextFov;
        perspectiveCamera.updateProjectionMatrix();
      }
    }
    const offset = new THREE.Vector3(
      Math.sin(cameraYaw) * Math.cos(profile.pitch) * distance,
      Math.sin(profile.pitch) * distance,
      Math.cos(cameraYaw) * Math.cos(profile.pitch) * distance
    );
    const ray = new rapier.Ray(focus, offset.clone().normalize());
    const obstruction = world.castRay(ray, distance, true, undefined, undefined, undefined, b);
    if (profile.projection === 'perspective' && obstruction)
      offset.setLength(Math.max(1.2, obstruction.timeOfImpact - 0.4));
    const desired = focus.clone().add(offset);
    camPos.current.lerp(desired, state.settings.reducedMotion ? 1 : 1 - Math.exp(-8 * dt));
    look.current.lerp(focus, 1 - Math.exp(-12 * dt));
    camera.position.copy(camPos.current);
    camera.lookAt(look.current);
    accumulator.current += dt;
    if (accumulator.current > 0.1) {
      accumulator.current = 0;
      state.setPosition([p.x, p.y, p.z]);
      const candidates = [
        ...NPCS.map((n) => ({
          id: n.id,
          pos: npcPosition(n.id, useGame.getState().save.playTime),
          radius: 2.5,
        })),
        ...OBJECTS.filter((o) => o.kind !== 'landmark').map((o) =>
          o.id === 'guardian' ? { ...o, pos: enemyPosition } : o
        ),
        ...state.save.blocks
          .filter((b) => b.item === 'lamp')
          .map((b) => ({
            id: `lamp:${b.x}:${b.y}:${b.z}`,
            pos: [b.x + 0.5, b.y + 0.5, b.z + 0.5] as Vec3,
          })),
        ...Object.entries(CREATURES).map(([id, c]) => ({ id: 'creature:' + id, pos: c.pos })),
      ];
      let nearest: string | null = null,
        best = 3;
      for (const c of candidates) {
        const d = Math.hypot(c.pos[0] - p.x, c.pos[2] - p.z);
        if (d < best && d < ('radius' in c ? Number(c.radius) : 3)) {
          best = d;
          nearest = c.id;
        }
      }
      useGame.setState({ target: nearest });
      for (const landmark of LANDMARKS)
        if (
          Math.hypot(landmark.pos[0] - p.x, landmark.pos[2] - p.z) <
          (landmark.id === 'plot' ? 7 : 5)
        )
          state.discover(landmark.id);
    }
  });
  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, 1, 5]}
      enabledRotations={[false, false, false]}
      friction={0}
      linearDamping={0}
      ccd
    >
      <CapsuleCollider args={[0.48, 0.3]} position={[0, 0.02, 0]} />
      <group ref={visual} position={[0, -0.78, 0]}>
        <Character
          moving={moving}
          running={running}
          hoodie={SKINS[skin].hoodie}
          accent={SKINS[skin].accent}
          accessory={SKINS[skin].accessory}
        />
      </group>
    </RigidBody>
  );
}
function Companions() {
  const ids = useGame((s) => s.save.squad?.equipped.join(',') ?? s.save.active ?? '');
  return (
    <>
      {(ids ? (ids.split(',') as Species[]) : []).map((id, index) => (
        <Companion key={id} id={id} index={index} />
      ))}
    </>
  );
}
function Companion({ id, index }: { id: Species; index: number }) {
  const command = useGame((s) => s.save.squad?.order ?? s.command),
    healthy = useGame((s) => !!s.save.creatures[id]?.hp);
  const runtime = squadRuntime[id];
  const { world, rapier } = useRapier();
  const body = useRef<RapierRigidBody>(null),
    visual = useRef<THREE.Group>(null),
    controller = useRef<ReturnType<typeof world.createCharacterController> | null>(null),
    fall = useRef(0),
    blocked = useRef(0),
    followSpeed = useRef(0);
  useEffect(() => {
    if (!id || !healthy || !body.current) return;
    const c = world.createCharacterController(0.02);
    c.enableAutostep(0.45, 0.25, true);
    c.enableSnapToGround(0.45);
    c.setMaxSlopeClimbAngle(Math.PI / 4);
    controller.current = c;
    const p = formation(useGame.getState().save.position, index);
    body.current.setTranslation({ x: p[0], y: p[1], z: p[2] }, true);
    runtime.ready = true;
    runtime.speed = 0;
    runtime.distance = 0;
    return () => {
      runtime.ready = false;
      world.removeCharacterController(c);
      controller.current = null;
      runtime.speed = 0;
    };
  }, [id, healthy, world, index, runtime]);
  useFrame((_, rawDt) => {
    const b = body.current,
      c = controller.current;
    if (!b || !c) return;
    const dt = Math.min(rawDt, 0.2),
      s = useGame.getState(),
      p = b.translation(),
      player = playerRuntime.position;
    if (s.panel || s.dialogue || !s.started || document.hidden) {
      runtime.speed = 0;
      followSpeed.current = 0;
      return;
    }
    const distance = Math.hypot(p.x - player[0], p.z - player[2]);
    if (distance > 30 || blocked.current > 3 || p.y < -5) {
      const spot = formation(player, index);
      b.setTranslation({ x: spot[0], y: player[1] + 0.2, z: spot[2] }, true);
      blocked.current = 0;
      fall.current = 0;
      runtime.speed = 0;
      followSpeed.current = 0;
      return;
    }
    const q = squadOf(s.save),
      cState = s.save.creatures[id]!;
    const critical = cState.hp <= maxCreatureHp(cState) * 0.2;
    const enemy = q.target?.startsWith('training')
      ? TRAINING.find((t) => t.id === q.target)?.pos
      : s.save.flags.includes('repaired') && !s.save.flags.includes('guardianDefeated')
        ? q.enemyPosition
        : undefined;
    let goal = formation(player, index);
    if (command === 'retreat' || critical) goal = retreatPosition(player, index, enemy);
    const engage =
      enemy &&
      q.stance !== 'passive' &&
      command !== 'retreat' &&
      command !== 'stay' &&
      !critical &&
      Math.hypot(enemy[0] - player[0], enemy[2] - player[2]) <=
        (q.stance === 'aggressive' || command === 'focus' ? 12 : 8);
    if (engage && enemy) {
      const away = new THREE.Vector3(player[0] - enemy[0], 0, player[2] - enemy[2]).normalize();
      const range = id === 'mosshell' || id === 'zaplet' ? 2.4 : 4;
      goal = [enemy[0] + away.x * range + (index - 1) * 0.5, 0, enemy[2] + away.z * range];
    }
    const dashing =
      id === 'zaplet' &&
      runtime.elemental &&
      Date.now() < runtime.attackUntil &&
      memberOf(s.save, id).cooldowns.Q > 4.5 &&
      !critical;
    if (dashing) {
      const dx = p.x - runtime.target[0],
        dz = p.z - runtime.target[2],
        len = Math.hypot(dx, dz) || 1;
      goal = [runtime.target[0] + (dx / len) * 1.3, p.y, runtime.target[2] + (dz / len) * 1.3];
    }
    const desired = new THREE.Vector3(goal[0] - p.x, 0, goal[2] - p.z);
    const gap = desired.length();
    const staying = command === 'stay' && distance <= 20;
    const targetSpeed =
      !staying && gap > 0.25
        ? Math.min(dashing ? 14 : distance > 5 ? 7 : 4, (gap - 0.2) * (dashing ? 12 : 3))
        : 0;
    followSpeed.current = staying
      ? 0
      : THREE.MathUtils.damp(followSpeed.current, targetSpeed, 7, dt);
    const moving = followSpeed.current > 0.04;
    const step = moving ? Math.min(desired.length(), dt * followSpeed.current) : 0;
    desired.normalize().multiplyScalar(step);
    fall.current = Math.max(-8, fall.current - 14 * dt);
    let dy = fall.current * dt;
    if (
      p.x > RIVER.left &&
      p.x < RIVER.right &&
      p.z > RIVER.north &&
      p.z < RIVER.south &&
      p.y < RIVER.level + 0.05
    ) {
      dy = (RIVER.level - p.y) * Math.min(1, dt * 5);
      fall.current = 0;
    }
    c.computeColliderMovement(
      b.collider(0),
      { x: desired.x, y: dy, z: desired.z },
      rapier.QueryFilterFlags.EXCLUDE_DYNAMIC
    );
    const movement = c.computedMovement();
    b.setNextKinematicTranslation({
      x: p.x + movement.x,
      y: p.y + movement.y,
      z: p.z + movement.z,
    });
    if (c.computedGrounded()) fall.current = 0;
    const travelled = Math.hypot(movement.x, movement.z);
    runtime.speed = travelled / Math.max(dt, 0.001);
    runtime.distance += travelled;
    runtime.position = [p.x, p.y, p.z];
    if (s.save.active === id) Object.assign(companionRuntime, runtime);
    blocked.current = moving && travelled < 0.003 ? blocked.current + dt : 0;
    if (visual.current) {
      const attacking = Date.now() < runtime.attackUntil;
      const angle = attacking
        ? Math.atan2(runtime.target[0] - p.x, runtime.target[2] - p.z)
        : travelled > 0.001
          ? Math.atan2(movement.x, movement.z)
          : visual.current.rotation.y;
      visual.current.rotation.y +=
        Math.atan2(
          Math.sin(angle - visual.current.rotation.y),
          Math.cos(angle - visual.current.rotation.y)
        ) * Math.min(1, dt * 10);
    }
  });
  return id && healthy ? (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[0.16, 0.24]} position={[0, 0.4, 0]} sensor />
      <group ref={visual}>
        <CreatureModel species={id} companion />
      </group>
    </RigidBody>
  ) : null;
}
function Buildings() {
  const blocks = useGame((s) => s.save.blocks),
    build = useGame((s) => s.build),
    selected = useGame((s) => s.selected),
    hotbar = useGame((s) => s.save.hotbar),
    flags = useGame((s) => s.save.flags);
  const [preview, setPreview] = useState<Block | null>(null);
  const item = hotbar[selected];
  const placeable =
    item && ['block', 'lamp', 'stool', 'statue'].includes(item) ? (item as Block['item']) : 'block';
  const point = (e: ThreeEvent<PointerEvent>, existing?: Block) => {
    if (!build) return;
    if (e.pointerType === 'touch' && (e.type !== 'pointerup' || touchLook.dragged)) return;
    e.stopPropagation();
    const normal = e.face?.normal.clone() ?? new THREE.Vector3(0, 1, 0);
    const v = e.point.clone().addScaledVector(normal, 0.02);
    const b: Block = {
      x: Math.floor(v.x),
      y: Math.max(0, Math.floor(v.y)),
      z: Math.floor(v.z),
      item: placeable,
    };
    if (e.type === 'pointermove') {
      setPreview(b);
      return;
    }
    if (e.pointerType === 'touch' && touchInput.remove) {
      if (existing) useGame.getState().remove(existing);
      return;
    }
    if (e.button === 2 && existing) useGame.getState().remove(existing);
    else if (e.button === 0) useGame.getState().place(b);
  };
  return (
    <>
      <mesh
        position={[2, 0.012, 27]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => point(e)}
        onPointerDown={(e) => point(e)}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch') point(e);
        }}
        receiveShadow
      >
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#b1b78d" />
      </mesh>
      {build && <gridHelper args={[16, 16, '#eae0b6', '#d0cca6']} position={[2, 0.025, 27]} />}
      {blocks.map((b) => (
        <RigidBody
          key={`${b.x}:${b.y}:${b.z}`}
          type="fixed"
          colliders="cuboid"
          userData={b.item === 'lamp' ? { interactionId: `lamp:${b.x}:${b.y}:${b.z}` } : {}}
        >
          {b.item === 'lamp' && (
            <Label
              interactionId={`lamp:${b.x}:${b.y}:${b.z}`}
              text="Crystal lamp"
              position={[b.x + 0.5, b.y + 1.5, b.z + 0.5]}
              size={0.43}
            />
          )}
          <Box
            position={[b.x + 0.5, b.y + 0.5, b.z + 0.5]}
            size={b.item === 'block' ? [1, 1, 1] : [0.8, 0.8, 0.8]}
            color={b.item === 'lamp' ? '#e5d29a' : b.item === 'statue' ? '#a8b9a1' : '#b2936e'}
            onPointerMove={(e) => point(e, b)}
            onPointerDown={(e) => point(e, b)}
            onPointerUp={(e) => {
              if (e.pointerType === 'touch') point(e, b);
            }}
          />
          {b.item === 'lamp' && !flags.includes(`off:lamp:${b.x}:${b.y}:${b.z}`) && (
            <pointLight
              position={[b.x + 0.5, b.y + 1, b.z + 0.5]}
              intensity={2}
              distance={5}
              color="#ffe4a5"
            />
          )}
        </RigidBody>
      ))}
      {build && preview && (
        <mesh position={[preview.x + 0.5, preview.y + 0.5, preview.z + 0.5]}>
          <boxGeometry args={[1.01, 1.01, 1.01]} />
          <meshBasicMaterial
            color={validPlacement(preview, blocks, playerRuntime.position) ? '#d5edb2' : '#e99f8c'}
            transparent
            opacity={0.45}
            wireframe
          />
        </mesh>
      )}
    </>
  );
}
function Lighting() {
  const sun = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (sun.current) {
      const time = useGame.getState().save.playTime;
      sun.current.intensity = 1.6 + Math.sin(time / 180) * 0.65;
    }
  });
  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#e7f0d7', '#a5ae83', 1.3]} />
      <directionalLight
        ref={sun}
        position={[-18, 35, 22]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-40}
        shadow-camera-right={50}
        shadow-camera-top={45}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0005}
      />
    </>
  );
}
function clickWorld(e: ThreeEvent<PointerEvent>) {
  const state = useGame.getState();
  if (e.pointerType === 'touch' && (e.type !== 'pointerup' || touchLook.dragged)) return;
  if (e.button !== 0 || !state.started || state.panel || state.dialogue || state.build) return;
  e.stopPropagation();
  let object: THREE.Object3D | null = e.object;
  let id: string | undefined;
  while (object) {
    if (object.userData.interactionId) {
      id = object.userData.interactionId;
      break;
    }
    object = object.parent;
  }
  const target = id
    ? id === 'guardian'
      ? squadOf(state.save).enemyPosition
      : ((NPCS.some((n) => n.id === id)
          ? npcPosition(id!, useGame.getState().save.playTime)
          : undefined) ??
        OBJECTS.find((o) => o.id === id)?.pos ??
        (id.startsWith('creature:') ? CREATURES[id.slice(9) as Species]?.pos : undefined))
    : undefined;
  const ground = e.ray.intersectPlane(new THREE.Plane(UP, 0), new THREE.Vector3());
  const x = target?.[0] ?? ground?.x,
    z = target?.[2] ?? ground?.z;
  if (x === undefined || z === undefined || Math.abs(x) > 127 || Math.abs(z) > 127) return;
  navigation.destination = {
    x,
    z,
    interaction:
      target && id && OBJECTS.find((o) => o.id === id)?.kind !== 'landmark' ? id : undefined,
  };
}
function MoveMarker() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const target = navigation.destination;
    ref.current.visible = !!target;
    if (target) ref.current.position.set(target.x, 0.06, target.z);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.43, 32]} />
      <meshBasicMaterial color="#fff4ba" transparent opacity={0.9} />
    </mesh>
  );
}
function HarvestEffects() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const object = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    if (!mesh.current) return;
    const harvest = playerRuntime.harvest;
    const age = harvest ? (Date.now() - harvest.started) / 1000 : 10;
    mesh.current.visible = !!harvest && age < 1.1;
    if (!harvest || age >= 1.1) return;
    const material = mesh.current.material as THREE.MeshBasicMaterial;
    material.color.set(ITEMS[harvest.item].color);
    for (let i = 0; i < 10; i++) {
      const angle = i * 2.399;
      const t = Math.max(0, Math.min(1, (age - 0.15) / 0.95));
      const start = new THREE.Vector3(
        harvest.position[0] + Math.cos(angle) * 0.4,
        0.7 + (i % 3) * 0.2,
        harvest.position[2] + Math.sin(angle) * 0.4
      );
      const end = new THREE.Vector3(
        playerRuntime.position[0],
        playerRuntime.position[1] + 0.3,
        playerRuntime.position[2]
      );
      object.position.copy(start).lerp(end, t);
      object.position.y += Math.sin(t * Math.PI) * 0.65;
      object.scale.setScalar(0.07 * (1 - t * 0.7));
      object.rotation.set(age * 5 + i, age * 3, 0);
      object.updateMatrix();
      mesh.current.setMatrixAt(i, object.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, 10]} visible={false}>
      <boxGeometry />
      <meshBasicMaterial />
    </instancedMesh>
  );
}
function Scene() {
  return (
    <>
      <color attach="background" args={['#cadbc3']} />
      <fog attach="fog" args={['#cadbc3', 65, 135]} />
      <Lighting />
      <Suspense fallback={null}>
        <Physics gravity={[0, -16, 0]} timeStep={1 / 60}>
          <group
            onPointerDown={clickWorld}
            onPointerUp={(e) => {
              if (e.pointerType === 'touch') clickWorld(e);
            }}
          >
            <Terrain />
            <Scenery />
            <Workplaces />
            <Buildings />
            {OBJECTS.map((o) => (
              <ObjectMesh key={o.id} id={o.id} />
            ))}
            {NPCS.map((n) => (
              <Villager key={n.id} id={n.id} />
            ))}
            {(Object.entries(CREATURES) as [Species, (typeof CREATURES)[Species]][]).map(
              ([id, c]) => (
                <group key={id} position={c.pos} userData={{ interactionId: 'creature:' + id }}>
                  <CreatureModel species={id} />
                  <Label
                    interactionId={'creature:' + id}
                    text={c.name}
                    position={[0, 1.7, 0]}
                    size={0.35}
                  />
                </group>
              )
            )}
          </group>
          <MoveMarker />
          <HarvestEffects />
          <AttackEffects />
          <Companions />
          <AbilityEffects />
          <Player />
          <WorldLabelLayout />
        </Physics>
      </Suspense>
    </>
  );
}
export default function World() {
  const quality = useGame((s) => s.settings.quality);
  const menuOpen = useGame((s) => !!s.panel || !!s.dialogue);
  return (
    <Canvas
      frameloop={menuOpen ? 'demand' : 'always'}
      shadows={quality !== 'low'}
      dpr={quality === 'low' ? 1 : [1, 1.5]}
      camera={{ position: [0, 6, 14], fov: 48, near: 0.1, far: 180 }}
      gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
    >
      <Scene />
    </Canvas>
  );
}
