import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GravityZoneConfig } from '../gravity/GravityZone';

interface GravityEffectsProps {
  zones: GravityZoneConfig[];
}

export const GravityEffects: React.FC<GravityEffectsProps> = ({ zones }) => {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ringsRef.current) return;
    const t = clock.getElapsedTime();

    // Pulse gravity portal rings
    ringsRef.current.children.forEach((child, idx) => {
      if (child instanceof THREE.Mesh) {
        const s = 1.0 + Math.sin(t * 3.5 + idx) * 0.04;
        child.scale.set(s, s, 1.0);
      }
    });
  });

  return (
    <group ref={ringsRef}>
      {zones.map((zone) => {
        // Center of zone bounding box
        const center = new THREE.Vector3().addVectors(zone.minBounds, zone.maxBounds).multiplyScalar(0.5);

        return (
          <group key={zone.id} position={center}>
            {/* Holographic Gravity Field Ring */}
            <mesh rotation={[0, 0, 0]}>
              <ringGeometry args={[12, 14.5, 32]} />
              <meshBasicMaterial
                color={zone.energyColor || '#38BDF8'}
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>

            {/* Subtle point light at portal center */}
            <pointLight
              color={zone.energyColor || '#38BDF8'}
              intensity={2.0}
              distance={35}
            />
          </group>
        );
      })}
    </group>
  );
};
