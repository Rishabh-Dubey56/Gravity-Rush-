import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { QuantumCoin } from './CoinSystem';

interface CoinMeshGroupProps {
  coins: QuantumCoin[];
  accentColor?: string;
}

export const CoinMeshGroup: React.FC<CoinMeshGroupProps> = ({ coins, accentColor = '#F59E0B' }) => {
  const groupRef = useRef<THREE.Group>(null);
  const sparkPointsRef = useRef<THREE.Points>(null);

  // Sparkle burst particles
  const particleCount = 60;
  const { sparkPositions, sparkVelocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -100; // start hidden
      pos[i * 3 + 2] = 0;

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = (Math.random() - 0.2) * speed;
      vel[i * 3 + 2] = Math.sin(angle) * speed;
    }
    return { sparkPositions: pos, sparkVelocities: vel };
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // Rotate and animate coins
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const coin = coins[i];
        if (!coin) return;

        if (coin.collected) {
          child.visible = false;
        } else {
          child.visible = true;
          child.rotation.y = t * 3.8 + i;
          // Gentle vertical levitation oscillation
          child.position.y = coin.position.y + Math.sin(t * 3.5 + i * 0.8) * 0.12;
        }
      });
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {coins.map((coin, i) => (
          <group key={coin.id} position={[coin.position.x, coin.position.y, coin.position.z]}>
            {/* 3D Quantum Energy Coin Disc */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.65, 0.65, 0.12, 16]} />
              <meshStandardMaterial
                color="#f59e0b"
                emissive="#f59e0b"
                emissiveIntensity={1.2}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Glowing Outer Energy Plasma Halo */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.55, 0.76, 16]} />
              <meshBasicMaterial
                color="#fbbf24"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Inner Quantum Energy Core */}
            <mesh>
              <octahedronGeometry args={[0.3, 0]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>

            {/* Subtle local glow point light for every 3rd coin */}
            {i % 3 === 0 && (
              <pointLight color="#f59e0b" intensity={1.8} distance={10} />
            )}
          </group>
        ))}
      </group>
    </>
  );
};
