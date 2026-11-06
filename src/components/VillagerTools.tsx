'use client';
export function WorkProp({ id }: { id: string }) {
  // Tools belong to villagers, independently of the player's selected inventory item.
  if (id === 'luna')
    return (
      <group position={[0, -0.28, 0.15]} rotation={[0.6, 0, 0]}>
        {[-1, 1].map((v) => (
          <mesh key={v} position={[v * 0.1, 0, 0]} rotation={[0, 0, v * 0.2]}>
            <boxGeometry args={[0.19, 0.035, 0.28]} />
            <meshStandardMaterial color="#eee4c2" />
          </mesh>
        ))}
      </group>
    );
  if (id === 'foxy')
    return (
      <mesh position={[0, -0.25, 0.2]}>
        <boxGeometry args={[0.38, 0.3, 0.34]} />
        <meshStandardMaterial color="#ad8153" />
      </mesh>
    );
  if (id === 'bloop')
    return (
      <mesh position={[0, -0.25, 0.12]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <meshStandardMaterial color="#96d8be" emissive="#32674c" emissiveIntensity={0.25} />
      </mesh>
    );
  return (
    <group position={[0, -0.27, 0.1]}>
      <mesh>
        <cylinderGeometry args={[0.025, 0.025, id === 'moss' ? 0.8 : 0.35, 8]} />
        <meshStandardMaterial color="#8e704d" />
      </mesh>
      <mesh position={[0, id === 'moss' ? -0.38 : 0.18, 0]}>
        <boxGeometry args={[id === 'moss' ? 0.25 : 0.26, 0.1, 0.13]} />
        <meshStandardMaterial color="#879193" />
      </mesh>
    </group>
  );
}
