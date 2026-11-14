import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AudioManager } from '../../audio/AudioManager';

interface DriftEffectsProps {
  vehiclePos: THREE.Vector3;
  vehicleQuat: THREE.Quaternion;
  speedKmh: number;
  slipAngle: number;
  isHandbraking?: boolean;
}

export const DriftEffects: React.FC<DriftEffectsProps> = ({
  vehiclePos,
  vehicleQuat,
  speedKmh,
  slipAngle,
  isHandbraking = false,
}) => {
  const sparksRef = useRef<THREE.Points>(null);
  const smokeRef = useRef<THREE.Points>(null);

  const sparkCount = 80;
  const smokeCount = 60;

  // Spark particles (golden fire embers)
  const sparkData = useMemo(() => {
    const pos = new Float32Array(sparkCount * 3);
    const vel = new Float32Array(sparkCount * 3);
    const life = new Float32Array(sparkCount);

    for (let i = 0; i < sparkCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -500;
      pos[i * 3 + 2] = 0;
      life[i] = 0;
    }
    return { sparkPos: pos, sparkVel: vel, sparkLife: life };
  }, []);

  // Smoke puffs (expanding vapor)
  const smokeData = useMemo(() => {
    const pos = new Float32Array(smokeCount * 3);
    const vel = new Float32Array(smokeCount * 3);
    const life = new Float32Array(smokeCount);

    for (let i = 0; i < smokeCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -500;
      pos[i * 3 + 2] = 0;
      life[i] = 0;
    }
    return { smokePos: pos, smokeVel: vel, smokeLife: life };
  }, []);

  useFrame((_, delta) => {
    const isDrifting = speedKmh > 50 && (Math.abs(slipAngle) > 0.12 || isHandbraking);
    const driftIntensity = Math.min(1.0, (speedKmh / 180) * (Math.abs(slipAngle) * 4 + (isHandbraking ? 0.6 : 0)));

    AudioManager.updateDrift(isDrifting ? driftIntensity : 0);

    // Update Sparks
    if (sparksRef.current) {
      const posAttr = sparksRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const { sparkVel, sparkLife } = sparkData;

      for (let i = 0; i < sparkCount; i++) {
        sparkLife[i] -= delta * 2.5;

        if (sparkLife[i] <= 0 && isDrifting) {
          // Spawn new spark behind rear wheels
          const side = (i % 2 === 0 ? 1 : -1) * 0.85;
          const localOffset = new THREE.Vector3(side, 0.1, -1.8).applyQuaternion(vehicleQuat);

          pos[i * 3] = vehiclePos.x + localOffset.x;
          pos[i * 3 + 1] = vehiclePos.y + localOffset.y;
          pos[i * 3 + 2] = vehiclePos.z + localOffset.z;

          const spread = (Math.random() - 0.5) * 4;
          const backward = new THREE.Vector3(spread, Math.random() * 2 + 1, -Math.random() * 6 - 4).applyQuaternion(vehicleQuat);

          sparkVel[i * 3] = backward.x;
          sparkVel[i * 3 + 1] = backward.y;
          sparkVel[i * 3 + 2] = backward.z;

          sparkLife[i] = 0.35 + Math.random() * 0.35;
        } else if (sparkLife[i] > 0) {
          pos[i * 3] += sparkVel[i * 3] * delta;
          pos[i * 3 + 1] += sparkVel[i * 3 + 1] * delta;
          pos[i * 3 + 2] += sparkVel[i * 3 + 2] * delta;
        } else {
          pos[i * 3 + 1] = -500; // hide
        }
      }
      posAttr.needsUpdate = true;
    }

    // Update Smoke Puffs
    if (smokeRef.current) {
      const posAttr = smokeRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const pos = posAttr.array as Float32Array;
      const { smokeVel, smokeLife } = smokeData;

      for (let i = 0; i < smokeCount; i++) {
        smokeLife[i] -= delta * 1.5;

        if (smokeLife[i] <= 0 && isDrifting) {
          const side = (i % 2 === 0 ? 1 : -1) * 0.8;
          const localOffset = new THREE.Vector3(side, 0.2, -1.9).applyQuaternion(vehicleQuat);

          pos[i * 3] = vehiclePos.x + localOffset.x;
          pos[i * 3 + 1] = vehiclePos.y + localOffset.y;
          pos[i * 3 + 2] = vehiclePos.z + localOffset.z;

          smokeVel[i * 3] = (Math.random() - 0.5) * 2;
          smokeVel[i * 3 + 1] = Math.random() * 1.5 + 0.5;
          smokeVel[i * 3 + 2] = (Math.random() - 0.5) * 2;

          smokeLife[i] = 0.5 + Math.random() * 0.4;
        } else if (smokeLife[i] > 0) {
          pos[i * 3] += smokeVel[i * 3] * delta;
          pos[i * 3 + 1] += smokeVel[i * 3 + 1] * delta;
          pos[i * 3 + 2] += smokeVel[i * 3 + 2] * delta;
        } else {
          pos[i * 3 + 1] = -500;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <>
      {/* High-speed Drift Sparks */}
      <points ref={sparksRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkData.sparkPos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#f59e0b"
          size={0.28}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Tire Vapor Smoke */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[smokeData.smokePos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#94a3b8"
          size={0.65}
          transparent
          opacity={0.35}
        />
      </points>
    </>
  );
};
