import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { VehiclePhysics } from './VehiclePhysics';
import { VehicleId, VehicleCustomization } from '../../store/gameStore';

interface VehicleProps {
  physics: VehiclePhysics;
  vehicleId: VehicleId;
  customization: VehicleCustomization;
  isNitroActive?: boolean;
}

export const Vehicle: React.FC<VehicleProps> = ({
  physics,
  vehicleId,
  customization,
  isNitroActive = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const wheelRefs = [
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
    useRef<THREE.Group>(null),
  ];
  const nitroLightRef1 = useRef<THREE.PointLight>(null);
  const nitroLightRef2 = useRef<THREE.PointLight>(null);
  const brakeLightMatRef = useRef<THREE.MeshStandardMaterial>(null);

  // Smooth visual interpolation
  const currentPos = useRef(new THREE.Vector3());
  const currentQuat = useRef(new THREE.Quaternion());

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    const targetPos = physics.getPosition();
    const targetQuat = physics.getRotation();

    // Lerp/Slerp towards target physics transform for butter-smooth 60fps rendering
    const smoothRate = Math.min(1.0, delta * 35);
    currentPos.current.lerp(targetPos, smoothRate);
    currentQuat.current.slerp(targetQuat, smoothRate);

    rootRef.current.position.copy(currentPos.current);
    rootRef.current.quaternion.copy(currentQuat.current);

    // Update 4 wheels transforms
    for (let i = 0; i < 4; i++) {
      const wheelGroup = wheelRefs[i].current;
      if (wheelGroup && physics.wheelTransforms[i]) {
        const wt = physics.wheelTransforms[i];
        wheelGroup.position.copy(wt.position);
        wheelGroup.quaternion.copy(wt.rotation);

        // Spin wheels based on vehicle speed
        const spinSpeed = (physics.currentSpeedKmh / 3.6 / 0.38) * delta;
        wheelGroup.rotateX(spinSpeed);
      }
    }

    // Brake lights reaction
    if (brakeLightMatRef.current) {
      const isBraking = physics.engine.currentGear === -1 || physics.engine.rpm < 2000;
      brakeLightMatRef.current.emissiveIntensity = isBraking ? 3.0 : 0.6;
    }

    // Nitro thruster lights flicker
    if (nitroLightRef1.current && nitroLightRef2.current) {
      const intensity = isNitroActive ? 4.5 + Math.random() * 2.5 : 0;
      nitroLightRef1.current.intensity = intensity;
      nitroLightRef2.current.intensity = intensity;
    }
  });

  const bodyColor = customization.bodyColor || '#38BDF8';
  const wheelColor = customization.wheelColor || '#38BDF8';
  const nitroColor = customization.nitroColor || '#38BDF8';

  return (
    <group ref={rootRef}>
      {/* VEHICLE CHASSIS BODY */}
      <group position={[0, 0, 0]}>
        {/* Main Monocoque Fuselage */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.38, 3.8]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.88}
            roughness={0.22}
            envMapIntensity={1.2}
          />
        </mesh>

        {/* Cockpit Canopy Glass */}
        <mesh position={[0, 0.44, -0.1]} castShadow>
          <boxGeometry args={[1.1, 0.32, 1.6]} />
          <meshStandardMaterial
            color="#0ea5e9"
            metalness={0.95}
            roughness={0.08}
            transparent
            opacity={0.75}
          />
        </mesh>

        {/* Front Nose Aerodynamic Wedge */}
        <mesh position={[0, 0.12, 1.95]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 0.22, 0.8]} />
          <meshStandardMaterial
            color={bodyColor}
            metalness={0.85}
            roughness={0.25}
          />
        </mesh>

        {/* Front Splitter / Carbon Winglet */}
        <mesh position={[0, -0.05, 2.15]} castShadow>
          <boxGeometry args={[1.85, 0.06, 0.5]} />
          <meshStandardMaterial color="#111827" metalness={0.3} roughness={0.7} />
        </mesh>

        {/* Side Air Intakes */}
        <mesh position={[-0.92, 0.15, -0.2]}>
          <boxGeometry args={[0.25, 0.35, 1.8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.4} />
        </mesh>
        <mesh position={[0.92, 0.15, -0.2]}>
          <boxGeometry args={[0.25, 0.35, 1.8]} />
          <meshStandardMaterial color="#1f2937" metalness={0.7} roughness={0.4} />
        </mesh>

        {/* Rear Engine Cowl & Diffuser */}
        <mesh position={[0, 0.26, -1.75]} castShadow>
          <boxGeometry args={[1.65, 0.45, 0.9]} />
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Rear Wing / Active Aero Spoiler */}
        <mesh position={[0, 0.72, -1.95]} castShadow>
          <boxGeometry args={[2.1, 0.08, 0.55]} />
          <meshStandardMaterial color={bodyColor} metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Wing Endplates */}
        <mesh position={[-1.02, 0.76, -1.95]}>
          <boxGeometry args={[0.06, 0.32, 0.65]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        <mesh position={[1.02, 0.76, -1.95]}>
          <boxGeometry args={[0.06, 0.32, 0.65]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Wing Struts */}
        <mesh position={[-0.45, 0.52, -1.85]}>
          <boxGeometry args={[0.08, 0.42, 0.12]} />
          <meshStandardMaterial color="#111827" metalness={0.9} />
        </mesh>
        <mesh position={[0.45, 0.52, -1.85]}>
          <boxGeometry args={[0.08, 0.42, 0.12]} />
          <meshStandardMaterial color="#111827" metalness={0.9} />
        </mesh>

        {/* Brake Lights (Rear glowing strip) */}
        <mesh position={[0, 0.32, -2.18]}>
          <boxGeometry args={[1.5, 0.08, 0.08]} />
          <meshStandardMaterial
            ref={brakeLightMatRef}
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.2}
          />
        </mesh>

        {/* Headlights (Front glowing projector strips) */}
        <mesh position={[-0.65, 0.18, 2.25]}>
          <boxGeometry args={[0.42, 0.08, 0.06]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={3.5}
          />
        </mesh>
        <mesh position={[0.65, 0.18, 2.25]}>
          <boxGeometry args={[0.42, 0.08, 0.06]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={3.5}
          />
        </mesh>

        {/* Dynamic Forward Headlight Illumination */}
        <pointLight
          position={[0, 0.35, 3.2]}
          color="#bae6fd"
          intensity={4.5}
          distance={35}
        />

        {/* Dual Anti-Gravity Plasma Thrusters */}
        <group position={[-0.48, 0.16, -2.18]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.09, 0.18, 16]} />
            <meshBasicMaterial color={nitroColor} />
          </mesh>
          <pointLight ref={nitroLightRef1} color={nitroColor} distance={8} intensity={0} />

          {/* Nitro Jet Flame Mesh */}
          {isNitroActive && (
            <mesh position={[0, 0, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.22, 1.2, 16]} />
              <meshBasicMaterial color={nitroColor} transparent opacity={0.85} />
            </mesh>
          )}
        </group>

        <group position={[0.48, 0.16, -2.18]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.09, 0.18, 16]} />
            <meshBasicMaterial color={nitroColor} />
          </mesh>
          <pointLight ref={nitroLightRef2} color={nitroColor} distance={8} intensity={0} />

          {/* Nitro Jet Flame Mesh */}
          {isNitroActive && (
            <mesh position={[0, 0, -0.75]} rotation={[-Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.22, 1.2, 16]} />
              <meshBasicMaterial color={nitroColor} transparent opacity={0.85} />
            </mesh>
          )}
        </group>

        {/* Distinct Vehicle Identity Elements */}
        {vehicleId === 'phantom-gt' && (
          // Hypersonic Canards & Elongated Nose
          <mesh position={[0, 0.18, 2.35]} rotation={[0.15, 0, 0]}>
            <coneGeometry args={[0.4, 1.1, 4]} />
            <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} />
          </mesh>
        )}

        {vehicleId === 'titan-r' && (
          // Armored Heavy Shield Cowling & Dual Top Intakes
          <group position={[0, 0.58, -0.3]}>
            <mesh>
              <boxGeometry args={[1.5, 0.2, 1.2]} />
              <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.12, 0.2]}>
              <boxGeometry args={[0.8, 0.12, 0.4]} />
              <meshStandardMaterial color="#111827" />
            </mesh>
          </group>
        )}
      </group>

      {/* 4 HIGH-TECH WHEELS (FL, FR, RL, RR) */}
      {[0, 1, 2, 3].map((i) => {
        const isLeft = i % 2 === 0;
        return (
          <group key={i} ref={wheelRefs[i]}>
            {/* Wheel Rim & Tire Cylinder */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.38, 0.38, 0.32, 24]} />
              <meshStandardMaterial color="#18181b" roughness={0.65} metalness={0.2} />
            </mesh>

            {/* Glowing Alloy Rim Accent */}
            <mesh position={[isLeft ? -0.165 : 0.165, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[0.16, 0.28, 16]} />
              <meshStandardMaterial
                color={wheelColor}
                emissive={wheelColor}
                emissiveIntensity={1.8}
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Brake Caliper */}
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.18, 0.12, 0.15]} />
              <meshStandardMaterial color="#ef4444" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
