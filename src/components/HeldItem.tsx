'use client';
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { ITEMS, type ItemId } from '@/game/data';
import { count } from '@/game/rules';
import { useGame } from '@/game/store';
import { weaponOf, type Weapon } from '@/game/weapons';
import { playerRuntime } from '@/game/input';
export function ItemModel({ item }: { item: ItemId | Weapon }) {
  if (item === 'sword')
    return (
      <group>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.09, 0.62, 0.045]} />
          <meshStandardMaterial color="#c9e0dc" metalness={0.65} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0.79, 0]} castShadow>
          <coneGeometry args={[0.065, 0.16, 4]} />
          <meshStandardMaterial color="#e4eee1" metalness={0.55} />
        </mesh>
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.32, 0.07, 0.09]} />
          <meshStandardMaterial color="#d4b56d" metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.04, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.23, 8]} />
          <meshStandardMaterial color="#79563e" />
        </mesh>
      </group>
    );
  if (item === 'bow')
    return (
      <group position={[0, 0, 0.34]} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[0, 0, -Math.PI / 2]} castShadow>
          <torusGeometry args={[0.38, 0.035, 6, 18, Math.PI]} />
          <meshStandardMaterial color="#a97743" />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.009, 0.009, 0.76, 4]} />
          <meshStandardMaterial color="#eee4c8" />
        </mesh>
        <mesh position={[0.34, 0, 0]}>
          <boxGeometry args={[0.055, 0.18, 0.07]} />
          <meshStandardMaterial color="#6c4933" />
        </mesh>
      </group>
    );
  const color = ITEMS[item].color;
  if (item === 'pickaxe')
    return (
      <group rotation={[0, 0, -0.2]}>
        <mesh position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.035, 0.045, 0.65, 8]} />
          <meshStandardMaterial color="#946c45" />
        </mesh>
        <mesh position={[0, 0.41, 0]} rotation={[0, 0, 0.12]} castShadow>
          <boxGeometry args={[0.58, 0.12, 0.12]} />
          <meshStandardMaterial color="#9eb1b3" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[-0.3, 0.35, 0]} rotation={[0, 0, -0.4]}>
          <coneGeometry args={[0.07, 0.24, 4]} />
          <meshStandardMaterial color="#a7b9b7" metalness={0.4} />
        </mesh>
      </group>
    );
  if (item === 'warmTreat')
    return (
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.07, 16]} />
          <meshStandardMaterial color="#cd955b" />
        </mesh>
        {[
          [-0.07, 0.04, 0.05],
          [0.06, 0.04, -0.06],
          [0.03, 0.04, 0.08],
          [-0.08, 0.04, -0.07],
        ].map((p, i) => (
          <mesh key={i} position={p as [number, number, number]}>
            <sphereGeometry args={[0.023, 6, 4]} />
            <meshStandardMaterial color="#67462f" />
          </mesh>
        ))}
      </group>
    );
  if (item === 'fiber')
    return (
      <group>
        {[-1, 0, 1].map((i) => (
          <mesh key={i} position={[i * 0.055, 0.08, 0]} rotation={[0, 0, i * 0.3]} castShadow>
            <coneGeometry args={[0.055, 0.35, 4]} />
            <meshStandardMaterial color="#80a653" />
          </mesh>
        ))}
      </group>
    );
  if (item === 'wood' || item === 'processedWood')
    return (
      <mesh rotation={[0, 0, 0.8]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  if (['block', 'stool', 'lamp', 'statue'].includes(item))
    return (
      <mesh castShadow>
        <boxGeometry args={[0.26, 0.26, 0.26]} />
        <meshStandardMaterial color={color} />
      </mesh>
    );
  return (
    <mesh castShadow>
      {item === 'crystal' || item === 'fragment' || item === 'chargedTreat' ? (
        <octahedronGeometry args={[0.19]} />
      ) : item === 'berry' || item === 'fruit' ? (
        <sphereGeometry args={[0.15, 12, 8]} />
      ) : (
        <dodecahedronGeometry args={[0.16, 0]} />
      )}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
export default function HeldItem() {
  const held = useGame((s) => {
    const item = s.save.hotbar[s.selected];
    return item && count(s.save.inventory, item) > 0 ? item : null;
  });
  const weapon = useGame((s) => weaponOf(s.save));
  const drawn = useGame((s) => s.weaponDrawn);
  const build = useGame((s) => s.build);
  const weaponGroup = useRef<Group>(null);
  const ownsPickaxe = useGame((s) => count(s.save.inventory, 'pickaxe') > 0);
  const normal = useRef<Group>(null),
    mining = useRef<Group>(null);
  useFrame(() => {
    const usingPickaxe =
      ownsPickaxe && playerRuntime.action === 'mine' && Date.now() < playerRuntime.actionUntil;
    const wielding =
      !usingPickaxe &&
      !build &&
      (drawn ||
        !held ||
        (['attack', 'shoot'].includes(playerRuntime.action) &&
          Date.now() < playerRuntime.actionUntil));
    if (weaponGroup.current) weaponGroup.current.visible = wielding;
    if (normal.current) normal.current.visible = !usingPickaxe && !wielding;
    if (mining.current) mining.current.visible = usingPickaxe;
  });
  return (
    <group position={[0, -0.3, 0.13]}>
      <group ref={weaponGroup}>
        <ItemModel item={weapon} />
      </group>
      <group ref={normal}>{held && <ItemModel item={held} />}</group>
      <group ref={mining} visible={false}>
        <ItemModel item="pickaxe" />
      </group>
    </group>
  );
}
