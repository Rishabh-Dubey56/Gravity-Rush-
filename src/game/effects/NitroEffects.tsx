import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface NitroEffectsProps {
  speedKmh: number;
  isNitroActive: boolean;
  vehiclePos: THREE.Vector3;
  vehicleForward: THREE.Vector3;
}

export const NitroEffects: React.FC<NitroEffectsProps> = ({
  speedKmh,
  isNitroActive,
  vehiclePos,
  vehicleForward,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 180;

  // Generate particle cloud around vehicle
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      // Cylinder distribution around camera/car
      const radius = 1.5 + Math.random() * 8.0;
      const angle = Math.random() * Math.PI * 2;
      const z = -15 + Math.random() * 35;

      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = z;

      vel[i * 3] = (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 2] = -1.5 - Math.random() * 2.0;
    }

    return { positions: pos, velocities: vel };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    // Follow vehicle position
    pointsRef.current.position.copy(vehiclePos);

    const highSpeed = speedKmh > 200 || isNitroActive;
    pointsRef.current.visible = highSpeed;
    if (!highSpeed) return;

    const speedFactor = (speedKmh / 120) * (isNitroActive ? 2.5 : 1.2);
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Move particles backward relative to vehicle motion
      array[i * 3 + 2] -= speedFactor * 45 * delta;

      // Wrap around when past rear
      if (array[i * 3 + 2] < -18) {
        array[i * 3 + 2] = 22 + Math.random() * 5;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={isNitroActive ? '#F59E0B' : '#38BDF8'}
        size={0.16}
        transparent
        opacity={isNitroActive ? 0.85 : 0.45}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
