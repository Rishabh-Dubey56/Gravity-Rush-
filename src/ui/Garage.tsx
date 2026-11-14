import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore, VEHICLE_PRESETS, VehicleId } from '../store/gameStore';
import { ArrowLeft, Check, Palette, Sparkles, Gauge, Shield, Zap } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

const GarageVehiclePreview: React.FC<{
  vehicleId: VehicleId;
  bodyColor: string;
  wheelColor: string;
  nitroColor: string;
}> = ({ vehicleId, bodyColor, wheelColor, nitroColor }) => {
  return (
    <group rotation={[0, -Math.PI / 3, 0]} position={[0, -0.3, 0]}>
      {/* Chassis Body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.7, 0.38, 3.8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Cockpit Canopy */}
      <mesh position={[0, 0.48, -0.1]}>
        <boxGeometry args={[1.1, 0.3, 1.6]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.95} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Front Nose Wedge */}
      <mesh position={[0, 0.16, 2.0]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1.5, 0.22, 0.8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.88} roughness={0.22} />
      </mesh>
      {/* Active Rear Wing */}
      <mesh position={[0, 0.72, -1.9]}>
        <boxGeometry args={[2.1, 0.08, 0.55]} />
        <meshStandardMaterial color={bodyColor} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Dual Thrusters */}
      <group position={[-0.48, 0.18, -2.0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.18, 16]} />
          <meshBasicMaterial color={nitroColor} />
        </mesh>
      </group>
      <group position={[0.48, 0.18, -2.0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.18, 0.22, 0.3, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.09, 0.18, 16]} />
          <meshBasicMaterial color={nitroColor} />
        </mesh>
      </group>
      {/* Wheels */}
      {[-0.92, 0.92].map((x, xi) =>
        [-1.35, 1.35].map((z, zi) => (
          <group key={`${xi}-${zi}`} position={[x, 0.05, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.38, 0.38, 0.32, 24]} />
              <meshStandardMaterial color="#18181b" roughness={0.7} metalness={0.2} />
            </mesh>
            <mesh position={[x > 0 ? 0.165 : -0.165, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
              <ringGeometry args={[0.16, 0.28, 16]} />
              <meshStandardMaterial color={wheelColor} emissive={wheelColor} emissiveIntensity={1.8} />
            </mesh>
          </group>
        ))
      )}
      {/* Floor circular stand */}
      <mesh position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <meshStandardMaterial color="#172532" roughness={0.4} metalness={0.8} />
      </mesh>
    </group>
  );
};

export const Garage: React.FC = () => {
  const {
    setScreen,
    selectedVehicleId,
    selectVehicle,
    updateCustomization,
    saveData,
  } = useGameStore();

  const vehicles: VehicleId[] = ['velocity-x', 'phantom-gt', 'titan-r'];
  const activePreset = VEHICLE_PRESETS[selectedVehicleId];
  const activeCustom =
    saveData.vehicleCustomizations[selectedVehicleId] || {
      bodyColor: '#38BDF8',
      wheelColor: '#38BDF8',
      nitroColor: '#38BDF8',
      performancePreset: 'standard',
    };

  const bodyColors = [
    { name: 'Electric Blue', hex: '#38BDF8' },
    { name: 'Danger Red', hex: '#EF4444' },
    { name: 'Cyber Amber', hex: '#F59E0B' },
    { name: 'Emerald Surge', hex: '#10B981' },
    { name: 'Plasma Violet', hex: '#A855F7' },
    { name: 'Stealth Carbon', hex: '#1E293B' },
    { name: 'Glacier Silver', hex: '#E5E7EB' },
  ];

  const wheelColors = [
    { name: 'Cyan Neon', hex: '#38BDF8' },
    { name: 'Orange Fire', hex: '#F59E0B' },
    { name: 'Neon Green', hex: '#A3E635' },
    { name: 'Magenta Glow', hex: '#E879F9' },
    { name: 'Pure White', hex: '#FFFFFF' },
  ];

  const nitroColors = [
    { name: 'Cyan Blast', hex: '#38BDF8' },
    { name: 'Amber Inferno', hex: '#F59E0B' },
    { name: 'Crimson Surge', hex: '#EF4444' },
    { name: 'Violet Tachyon', hex: '#A855F7' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 bg-[#101820] text-white overflow-hidden scanlines">
      {/* Header */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              AudioManager.playCheckpoint();
              setScreen('main_menu');
            }}
            className="p-2 rounded bg-neutral-800 hover:bg-neutral-700 text-sky-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display font-black text-white glow-blue">
              VEHICLE <span className="text-sky-400">GARAGE</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              CUSTOMIZE AERODYNAMICS, COLOR MATRIX AND PERFORMANCE PROFILES
            </p>
          </div>
        </div>

        <div className="cyber-panel px-4 py-2 flex items-center space-x-2 text-sm font-mono">
          <Zap className="w-4 h-4 text-amber-400 fill-current" />
          <span className="text-neutral-400">CREDITS:</span>
          <span className="text-amber-400 font-bold">{saveData.credits.toLocaleString()} CR</span>
        </div>
      </div>

      {/* Main Center Area: Left Vehicle Selector & Stats, Center 3D Preview, Right Customization */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 z-10 my-auto h-[70vh]">
        {/* Left Column: Vehicle Selector & Specs */}
        <div className="md:col-span-4 flex flex-col justify-between space-y-4">
          {/* Preset Selector */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-neutral-400 tracking-wider">SELECT PROTOTYPE:</span>
            <div className="grid grid-cols-3 gap-2">
              {vehicles.map((vId) => {
                const preset = VEHICLE_PRESETS[vId];
                const isSelected = selectedVehicleId === vId;
                return (
                  <button
                    key={vId}
                    onClick={() => {
                      AudioManager.playCheckpoint();
                      selectVehicle(vId);
                    }}
                    className={`cyber-panel p-3 text-left transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-950/60 shadow-lg'
                        : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/60'
                    }`}
                  >
                    <div className="text-xs font-display font-bold text-white truncate">{preset.name}</div>
                    <div className="text-[10px] font-mono text-sky-400">{preset.topSpeed} KM/H</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vehicle Telemetry & Stats Cards */}
          <div className="cyber-panel p-5 bg-neutral-900/80 space-y-4">
            <div>
              <h2 className="text-xl font-display font-black text-white">{activePreset.name}</h2>
              <p className="text-xs font-mono text-sky-400 mb-2">{activePreset.tagline}</p>
              <p className="text-xs text-neutral-300 font-sans">{activePreset.description}</p>
            </div>

            {/* Performance Bars */}
            <div className="space-y-2.5 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400">TOP SPEED</span>
                  <span className="text-white font-bold">{activePreset.topSpeed} KM/H</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400"
                    style={{ width: `${(activePreset.topSpeed / 360) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400">ACCELERATION</span>
                  <span className="text-amber-400 font-bold">{activePreset.acceleration}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${activePreset.acceleration}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400">HANDLING & ADHESION</span>
                  <span className="text-emerald-400 font-bold">{activePreset.handling}%</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${activePreset.handling}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-neutral-400">VEHICLE MASS</span>
                  <span className="text-neutral-300 font-bold">{activePreset.mass} KG</span>
                </div>
                <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-400"
                    style={{ width: `${(activePreset.mass / 1400) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: 3D Interactive Showcase Canvas */}
        <div className="md:col-span-5 relative cyber-panel border-neutral-800 bg-neutral-950/80 overflow-hidden">
          <Canvas camera={{ position: [4.2, 2.2, 4.8], fov: 42 }}>
            <ambientLight intensity={0.9} />
            <directionalLight position={[10, 15, 10]} intensity={1.8} />
            <pointLight position={[-8, 6, -8]} intensity={1.2} color="#38bdf8" />
            <GarageVehiclePreview
              vehicleId={selectedVehicleId}
              bodyColor={activeCustom.bodyColor}
              wheelColor={activeCustom.wheelColor}
              nitroColor={activeCustom.nitroColor}
            />
            <OrbitControls enablePan={false} minDistance={3.5} maxDistance={8.0} autoRotate autoRotateSpeed={1.2} />
          </Canvas>
          <div className="absolute bottom-3 left-3 text-[10px] font-mono text-neutral-500">
            DRAG TO ROTATE 360° • SCROLL TO ZOOM
          </div>
        </div>

        {/* Right Column: Customization Palette */}
        <div className="md:col-span-3 cyber-panel p-5 bg-neutral-900/80 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm font-display font-bold text-white">
              <Palette className="w-4 h-4 text-sky-400" />
              <span>CUSTOM PAINT & NEON</span>
            </div>

            {/* Body Paint */}
            <div>
              <span className="text-xs font-mono text-neutral-400 mb-2 block">BODY COLOR:</span>
              <div className="flex flex-wrap gap-2">
                {bodyColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => {
                      AudioManager.playCheckpoint();
                      updateCustomization(selectedVehicleId, { bodyColor: col.hex });
                    }}
                    className={`w-7 h-7 rounded-sm border-2 transition-all flex items-center justify-center ${
                      activeCustom.bodyColor === col.hex ? 'border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {activeCustom.bodyColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Wheel Accent Color */}
            <div>
              <span className="text-xs font-mono text-neutral-400 mb-2 block">WHEEL ALLOY GLOW:</span>
              <div className="flex flex-wrap gap-2">
                {wheelColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => {
                      AudioManager.playCheckpoint();
                      updateCustomization(selectedVehicleId, { wheelColor: col.hex });
                    }}
                    className={`w-7 h-7 rounded-sm border-2 transition-all flex items-center justify-center ${
                      activeCustom.wheelColor === col.hex ? 'border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {activeCustom.wheelColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Nitro Trail Color */}
            <div>
              <span className="text-xs font-mono text-neutral-400 mb-2 block">NITRO PLASMA TRAIL:</span>
              <div className="flex flex-wrap gap-2">
                {nitroColors.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => {
                      AudioManager.playCheckpoint();
                      updateCustomization(selectedVehicleId, { nitroColor: col.hex });
                    }}
                    className={`w-7 h-7 rounded-sm border-2 transition-all flex items-center justify-center ${
                      activeCustom.nitroColor === col.hex ? 'border-white scale-110' : 'border-neutral-700'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {activeCustom.nitroColor === col.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              AudioManager.playCheckpoint();
              setScreen('track_select');
            }}
            className="cyber-btn w-full py-3 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-sm tracking-wider uppercase transition-all box-glow-blue"
          >
            CONFIRM & RACE
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400">
        <div>ALL CUSTOMIZATIONS ARE PERSISTED AUTOMATICALLY</div>
        <div>GRAVITY RUSH RACING FEDERATION</div>
      </div>
    </div>
  );
};
