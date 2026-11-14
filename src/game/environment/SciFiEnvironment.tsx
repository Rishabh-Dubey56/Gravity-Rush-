import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface SciFiEnvironmentProps {
  trackId: string;
  accentColor: string;
}

export const SciFiEnvironment: React.FC<SciFiEnvironmentProps> = ({ trackId, accentColor }) => {
  const starsRef = useRef<THREE.Points>(null);
  const trafficRef = useRef<THREE.Group>(null);
  const singularityRef = useRef<THREE.Group>(null);
  const beaconBlinkRef = useRef<THREE.Group>(null);

  // 1. Procedural 2,500-Star Cosmic Deep Space Starfield
  const starData = useMemo(() => {
    const count = 2200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distribute on sphere of radius 800 - 1100
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 850 + Math.random() * 250;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(30, r * Math.cos(phi)); // Keep mostly in upper hemisphere
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Star colors: cool cyan-white, warm amber, soft violet
      const tint = Math.random();
      if (tint > 0.8) {
        colors[i * 3] = 0.9;
        colors[i * 3 + 1] = 0.6;
        colors[i * 3 + 2] = 0.3; // Amber
      } else if (tint > 0.4) {
        colors[i * 3] = 0.4;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 1.0; // Cyber Blue
      } else {
        colors[i * 3] = 0.95;
        colors[i * 3 + 1] = 0.98;
        colors[i * 3 + 2] = 1.0; // Crisp White
      }
    }

    return { positions, colors };
  }, []);

  // 2. Procedural Cyberpunk Skyscrapers for Neon Metropolis
  const cityData = useMemo(() => {
    if (trackId !== 'neon-metropolis') return [];

    const buildings: {
      x: number;
      z: number;
      w: number;
      d: number;
      h: number;
      hasBillboard: boolean;
      billboardColor: string;
      billboardText: string;
      hasSpire: boolean;
    }[] = [];

    // Dense perimeter skyscraper rings
    const billboardThemes = [
      { color: '#38BDF8', text: 'QUANTUM GRAVITY' },
      { color: '#F59E0B', text: 'HYPERION DRIVE' },
      { color: '#EC4899', text: 'NEON MATRIX' },
      { color: '#10B981', text: 'GRAV-CORP' },
      { color: '#A855F7', text: 'SYNTH-TECH' },
    ];

    // Seeded distribution avoiding track center
    for (let i = 0; i < 46; i++) {
      const angle = (i / 46) * Math.PI * 2 + (i % 3) * 0.15;
      const dist = 140 + (i % 5) * 55 + Math.random() * 35;
      const x = Math.cos(angle) * dist + 120;
      const z = Math.sin(angle) * dist + 100;

      const w = 32 + (i % 4) * 14;
      const d = 32 + ((i + 2) % 4) * 14;
      const h = 120 + (i % 7) * 32 + ((i * 37) % 60);

      const hasBillboard = i % 4 === 0;
      const theme = billboardThemes[i % billboardThemes.length];
      const hasSpire = h > 180;

      buildings.push({
        x,
        z,
        w,
        d,
        h,
        hasBillboard,
        billboardColor: theme.color,
        billboardText: theme.text,
        hasSpire,
      });
    }

    return buildings;
  }, [trackId]);

  // Highway Foundation Support Pillars (Elevated skyway pillars)
  const highwayPillars = useMemo(() => {
    if (trackId !== 'neon-metropolis') return [];
    // Positions along track curve where massive columns ground into the city
    return [
      [0, 60],
      [0, 180],
      [45, 300],
      [140, 360],
      [310, 240],
      [310, 120],
      [240, 20],
      [130, -140],
      [0, -200],
      [-60, -80],
    ];
  }, [trackId]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle starfield rotation
    if (starsRef.current) {
      starsRef.current.rotation.y = t * 0.005;
    }

    // Singularity vortex rotation
    if (singularityRef.current) {
      singularityRef.current.rotation.z = t * 0.45;
      singularityRef.current.rotation.y = t * 0.25;
    }

    // Flying traffic animation
    if (trafficRef.current) {
      trafficRef.current.children.forEach((lane, idx) => {
        const speed = (idx % 2 === 0 ? 1 : -1) * (30 + idx * 10);
        lane.position.x = ((t * speed + idx * 80) % 700) - 350;
      });
    }

    // Rooftop warning beacon blinking
    if (beaconBlinkRef.current) {
      const isLit = Math.sin(t * 4.5) > 0.2;
      beaconBlinkRef.current.visible = isLit;
    }
  });

  return (
    <group>
      {/* 1. DEEP SPACE COSMIC STARFIELD */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[starData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={1.6}
          vertexColors
          transparent
          opacity={0.88}
          sizeAttenuation
        />
      </points>

      {/* 2. ATMOSPHERIC HORIZON NEBULA DOME */}
      <mesh position={[0, 40, 0]}>
        <sphereGeometry args={[750, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshBasicMaterial
          color="#080e18"
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. NEON METROPOLIS CYBERPUNK SKYLINE */}
      {trackId === 'neon-metropolis' && (
        <group>
          {/* Ground City Floor Grid */}
          <mesh position={[120, -50, 100]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1400, 1400, 20, 20]} />
            <meshStandardMaterial
              color="#070c14"
              metalness={0.9}
              roughness={0.4}
              wireframe={false}
            />
          </mesh>

          {/* Elevated Highway Foundation Pylons */}
          {highwayPillars.map(([px, pz], idx) => (
            <group key={`pylon-${idx}`} position={[px, -15, pz]}>
              <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[3.2, 4.8, 70, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
              </mesh>
              {/* Pillar Neon Ring Accents */}
              <mesh position={[0, 12, 0]}>
                <torusGeometry args={[3.8, 0.2, 8, 16]} />
                <meshBasicMaterial color="#38bdf8" />
              </mesh>
            </group>
          ))}

          {/* 46 Towering Cyberpunk Skyscrapers */}
          {cityData.map((b, i) => (
            <group key={i} position={[b.x, b.h * 0.5 - 50, b.z]}>
              {/* Skyscraper Main Shaft */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[b.w, b.h, b.d]} />
                <meshStandardMaterial
                  color="#0f172a"
                  metalness={0.88}
                  roughness={0.2}
                />
              </mesh>

              {/* Glowing Window Matrices (Banded illumination) */}
              <mesh position={[0, 0, b.d * 0.5 + 0.1]}>
                <planeGeometry args={[b.w * 0.85, b.h * 0.9]} />
                <meshBasicMaterial
                  color={i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#f59e0b' : '#60a5fa'}
                  transparent
                  opacity={0.18}
                />
              </mesh>

              {/* Holographic Rooftop / Side Billboard */}
              {b.hasBillboard && (
                <group position={[0, b.h * 0.2, b.d * 0.5 + 1.2]}>
                  <mesh>
                    <boxGeometry args={[b.w * 0.75, 12, 0.4]} />
                    <meshBasicMaterial color="#020617" />
                  </mesh>
                  <mesh position={[0, 0, 0.3]}>
                    <planeGeometry args={[b.w * 0.7, 10]} />
                    <meshBasicMaterial
                      color={b.billboardColor}
                      transparent
                      opacity={0.85}
                    />
                  </mesh>
                  <pointLight
                    color={b.billboardColor}
                    intensity={2.8}
                    distance={35}
                    position={[0, 0, 4]}
                  />
                </group>
              )}

              {/* Rooftop Communications Antenna Spire */}
              {b.hasSpire && (
                <group position={[0, b.h * 0.5, 0]}>
                  <mesh position={[0, 14, 0]}>
                    <cylinderGeometry args={[0.3, 0.8, 28, 6]} />
                    <meshStandardMaterial color="#334155" metalness={0.9} />
                  </mesh>
                  {/* Flashing Warning Beacon Tip */}
                  <mesh position={[0, 28, 0]}>
                    <sphereGeometry args={[0.8, 8, 8]} />
                    <meshBasicMaterial color="#ef4444" />
                  </mesh>
                </group>
              )}
            </group>
          ))}

          {/* Autonomous Aerial Sky-Traffic Light Streams */}
          <group ref={trafficRef} position={[100, 110, 120]}>
            {[-90, -30, 40, 100].map((offsetZ, i) => (
              <group key={i} position={[0, (i % 2) * 25, offsetZ]}>
                <mesh>
                  <boxGeometry args={[18, 0.3, 0.4]} />
                  <meshBasicMaterial
                    color={i % 2 === 0 ? '#38bdf8' : '#ef4444'}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      )}

      {/* 4. INFERNO CIRCUIT SCENERY */}
      {trackId === 'inferno-circuit' && (
        <group>
          {/* Subterranean Magma Lake with Orange Emissive Glow */}
          <mesh position={[120, -15, 200]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1200, 1200]} />
            <meshStandardMaterial
              color="#ea580c"
              emissive="#ea580c"
              emissiveIntensity={1.8}
              roughness={0.7}
            />
          </mesh>
          <pointLight color="#f97316" intensity={8.0} distance={250} position={[120, 20, 200]} />

          {/* Industrial Cooling Towers */}
          {[-120, 60, 220, 360].map((x, i) => (
            <group key={i} position={[x, 35, (i % 2 === 0 ? 1 : -1) * 160]}>
              <mesh>
                <cylinderGeometry args={[28, 42, 110, 20, 1, true]} />
                <meshStandardMaterial color="#1c1917" metalness={0.8} roughness={0.4} />
              </mesh>
              {/* Internal Magma Glow Vent */}
              <pointLight color="#f97316" intensity={4} distance={60} position={[0, 40, 0]} />
            </group>
          ))}
        </group>
      )}

      {/* 5. FROSTBITE GLACIAL SCENERY */}
      {trackId === 'frostbite' && (
        <group>
          {/* Glacial Valley Floor */}
          <mesh position={[100, -10, 50]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1200, 1200]} />
            <meshStandardMaterial color="#0284c7" roughness={0.15} metalness={0.4} />
          </mesh>

          {/* Jagged Ice Mountains */}
          {[-160, -40, 120, 280, 380].map((x, i) => (
            <mesh key={i} position={[x, 50, (i % 2 === 0 ? 1 : -1) * 180]}>
              <coneGeometry args={[55, 140 + (i % 3) * 40, 5]} />
              <meshStandardMaterial
                color="#bae6fd"
                emissive="#0284c7"
                emissiveIntensity={0.25}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
          ))}

          {/* Aurora Borealis Ribbon Curtain */}
          <mesh position={[100, 220, -100]} rotation={[0.4, 0.2, 0]}>
            <planeGeometry args={[650, 90, 16, 4]} />
            <meshBasicMaterial
              color="#22d3ee"
              transparent
              opacity={0.32}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* 6. ORBITAL ZERO SPACE STATION SCENERY */}
      {trackId === 'orbital-zero' && (
        <group>
          {/* Giant Orbiting Blue Gas Planet */}
          <mesh position={[380, 280, -450]}>
            <sphereGeometry args={[140, 32, 32]} />
            <meshStandardMaterial
              color="#1d4ed8"
              emissive="#1e40af"
              emissiveIntensity={0.35}
              roughness={0.7}
            />
          </mesh>

          {/* Massive Orbital Station Rings */}
          <group position={[120, 60, 200]} rotation={[Math.PI / 4, 0, 0]}>
            <mesh>
              <torusGeometry args={[160, 6, 16, 64]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      )}

      {/* 7. SINGULARITY BLACK HOLE & ACCRETION DISK */}
      {trackId === 'singularity' && (
        <group ref={singularityRef} position={[240, 50, 140]}>
          {/* Event Horizon Dark Core */}
          <mesh>
            <sphereGeometry args={[26, 32, 32]} />
            <meshBasicMaterial color="#000000" />
          </mesh>

          {/* Glowing Accretion Disk */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[32, 95, 48]} />
            <meshBasicMaterial
              color="#ec4899"
              transparent
              opacity={0.65}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {/* High Energy Singularity Light Source */}
          <pointLight color="#ec4899" intensity={9.0} distance={300} />
        </group>
      )}
    </group>
  );
};
