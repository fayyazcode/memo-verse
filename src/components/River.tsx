'use client';
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { RIVER, BRIDGE, bridgeHeight, riverDepth } from '@/game/river';
import { playerRuntime } from '@/game/input';
export function ArchedBridge() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => {
        const a = BRIDGE.left + (i * 9) / 24,
          b = a + 9 / 24;
        const ya = bridgeHeight(a),
          yb = bridgeHeight(b);
        return {
          x: (a + b) / 2,
          y: (ya + yb) / 2,
          angle: Math.atan2(yb - ya, b - a),
          length: Math.hypot(b - a, yb - ya) + 0.025,
        };
      }),
    []
  );
  return (
    <group>
      {pieces.map((p, i) => (
        <group key={i}>
          <RigidBody
            type="fixed"
            colliders={false}
            position={[p.x, p.y - 0.1, BRIDGE.z]}
            rotation={[0, 0, p.angle]}
          >
            <CuboidCollider args={[p.length / 2, 0.1, BRIDGE.width / 2]} />
            <mesh castShadow receiveShadow>
              <boxGeometry args={[p.length, 0.2, BRIDGE.width]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#a47b50' : i % 3 === 1 ? '#bc9466' : '#c5a477'}
                roughness={0.9}
              />
            </mesh>
          </RigidBody>
          {[-1, 1].map((side) => (
            <group key={side}>
              {[0.55, 1.05].map((h) => (
                <mesh
                  key={h}
                  position={[p.x, p.y + h, BRIDGE.z + side * 1.72]}
                  rotation={[0, 0, p.angle]}
                  castShadow
                >
                  <boxGeometry args={[p.length, 0.09, 0.1]} />
                  <meshStandardMaterial color="#846347" />
                </mesh>
              ))}
              {i % 4 === 0 && (
                <RigidBody type="fixed" colliders="cuboid">
                  <mesh position={[p.x, p.y + 0.52, BRIDGE.z + side * 1.72]} castShadow>
                    <boxGeometry args={[0.13, 1.18, 0.13]} />
                    <meshStandardMaterial color="#97734f" />
                  </mesh>
                </RigidBody>
              )}
            </group>
          ))}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <RigidBody key={side} type="fixed" colliders={false}>
          {pieces.map((p, i) => (
            <CuboidCollider
              key={i}
              args={[p.length / 2, 0.6, 0.06]}
              position={[p.x, p.y + 0.5, BRIDGE.z + side * 1.74]}
              rotation={[0, 0, p.angle]}
            />
          ))}
        </RigidBody>
      ))}
    </group>
  );
}
export function RiverWater() {
  const ref = useRef<THREE.ShaderMaterial>(null),
    ripples = useRef<THREE.Group>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPlayer: { value: new THREE.Vector2(-999, -999) },
      uMoving: { value: 0 },
    }),
    []
  );
  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    const [x, y, z] = playerRuntime.position;
    const depth = riverDepth({ x, y, z });
    uniforms.uPlayer.value.set(x, z);
    uniforms.uMoving.value = depth > 0.12 && playerRuntime.moving ? 1 : 0;
    if (ripples.current) {
      ripples.current.visible = depth > 0.12;
      ripples.current.position.set(x, RIVER.level + 0.035, z);
      ripples.current.scale.setScalar(0.85 + Math.sin(clock.elapsedTime * 4) * 0.12);
    }
  });
  return (
    <>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side === -1 ? 35 : 43, -0.475, -25]}
          rotation={[0, 0, side * Math.atan(0.95)]}
          receiveShadow
        >
          <boxGeometry args={[Math.hypot(1, 0.95), 0.2, 36]} />
          <meshStandardMaterial color="#c5bc96" roughness={1} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[39, RIVER.level, -25]} receiveShadow>
        <planeGeometry args={[9, 36, 36, 100]} />
        <shaderMaterial
          ref={ref}
          uniforms={uniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          vertexShader={`uniform float uTime; varying vec3 vWorld; varying float vWave; void main(){vec3 p=position;float wave=sin(p.x*2.4+uTime*1.4)*.022+sin(p.y*1.6-uTime*1.1)*.018;p.z+=wave;vWave=wave;vWorld=(modelMatrix*vec4(p,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(vWorld,1.);}`}
          fragmentShader={`uniform float uTime;uniform vec2 uPlayer;uniform float uMoving;varying vec3 vWorld;varying float vWave;void main(){float bank=smoothstep(0.,.8,min(vWorld.x-34.5,43.5-vWorld.x));float strands=sin(vWorld.x*10.+sin(vWorld.z*1.6+uTime)*2.+uTime*1.3)*sin(vWorld.z*8.-uTime*2.);float shimmer=pow(max(0.,strands),12.);float foam=(1.-bank)*(.45+.2*sin(vWorld.z*6.+uTime));float wake=pow(max(0.,sin(length(vWorld.xz-uPlayer)*24.-uTime*6.)),10.)*exp(-length(vWorld.xz-uPlayer)*1.5)*uMoving;vec3 water=mix(vec3(.40,.70,.64),vec3(.18,.48,.54),bank);water+=shimmer*.15+foam*.2+wake*.24+vWave*.9;gl_FragColor=vec4(water,.76);}`}
        />
      </mesh>
      <group ref={ripples} visible={false}>
        {[0.45, 0.8, 1.1].map((r, i) => (
          <mesh key={r} position={[0, i * 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r, r + 0.035, 40]} />
            <meshBasicMaterial
              color="#d5f0dc"
              transparent
              opacity={0.5 - i * 0.12}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
