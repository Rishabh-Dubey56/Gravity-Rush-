import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useGameStore, VEHICLE_PRESETS, GameScreen } from '../store/gameStore';
import {
  Play,
  Trophy,
  Flag,
  Wrench,
  Settings as SettingsIcon,
  HelpCircle,
  Award,
  Zap,
  Power,
  AlertTriangle,
} from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

// Simple vehicle preview renderer for the menu background
const MenuVehicleModel: React.FC<{ color: string; wheelColor: string }> = ({ color, wheelColor }) => {
  return (
    <group rotation={[0.15, -Math.PI / 4, 0]}>
      {/* Chassis Body */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[1.7, 0.38, 3.8]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Cockpit Canopy */}
      <mesh position={[0, 0.48, -0.1]}>
        <boxGeometry args={[1.1, 0.3, 1.6]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.95} roughness={0.1} transparent opacity={0.8} />
      </mesh>
      {/* Spoiler */}
      <mesh position={[0, 0.72, -1.9]}>
        <boxGeometry args={[2.0, 0.08, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.9} roughness={0.2} />
      </mesh>
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
    </group>
  );
};

export const MainMenu: React.FC = () => {
  const { setScreen, startRace, saveData, selectedVehicleId } = useGameStore();
  const [showExitModal, setShowExitModal] = useState(false);

  const vPreset = VEHICLE_PRESETS[selectedVehicleId];
  const cust = saveData.vehicleCustomizations[selectedVehicleId] || {
    bodyColor: '#38BDF8',
    wheelColor: '#38BDF8',
  };

  const navTo = (screen: any) => {
    try {
      AudioManager.playCheckpoint();
    } catch {}
    setScreen(screen);
  };

  const handleExitSimulation = () => {
    try {
      AudioManager.stopEngine();
      AudioManager.stopMusic();
    } catch {}
    setShowExitModal(false);
    setScreen('intro');
  };

  const handleQuickPlay = () => {
    try {
      AudioManager.init();
      AudioManager.resume();
      AudioManager.playCheckpoint();
    } catch {}
    startRace('neon-metropolis', selectedVehicleId);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 bg-[#101820] text-white overflow-hidden scanlines">
      {/* 3D Background Vehicle Showcase */}
      <div className="absolute inset-0 w-full h-full z-0 opacity-80 pointer-events-none">
        <Canvas camera={{ position: [4.5, 2.5, 5], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 15, 10]} intensity={1.5} />
          <pointLight position={[-10, -5, -10]} intensity={0.5} color="#38bdf8" />
          <MenuVehicleModel color={cust.bodyColor} wheelColor={cust.wheelColor} />
          {/* Subtle grid floor */}
          <gridHelper args={[30, 30, '#38bdf8', '#1e293b']} position={[0, -0.35, 0]} />
        </Canvas>
      </div>

      {/* Top Header Status */}
      <div className="w-full flex justify-between items-center z-10">
        <div>
          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white glow-blue">
            GRAVITY <span className="text-sky-400">RUSH</span>
          </h1>
          <p className="text-xs font-mono tracking-widest text-sky-400/80 uppercase">
            Defy Gravity. Control The Impossible.
          </p>
        </div>

        {/* Player Profile & Credits */}
        <div className="cyber-panel px-5 py-2.5 flex items-center space-x-6 text-sm font-mono">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400 fill-current" />
            <span className="text-neutral-400">CREDITS:</span>
            <span className="text-amber-400 font-bold">{saveData.credits.toLocaleString()} CR</span>
          </div>
          <div className="h-4 w-px bg-neutral-700" />
          <div className="flex items-center space-x-2">
            <span className="text-neutral-400">ACTIVE:</span>
            <span className="text-sky-400 font-bold">{vPreset.name}</span>
          </div>
        </div>
      </div>

      {/* Main Menu Navigation Column */}
      <div className="flex flex-col space-y-3 max-w-md z-10 my-auto">
        <button
          onClick={handleQuickPlay}
          className="cyber-btn flex items-center justify-between px-6 py-4 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-lg tracking-wider uppercase transition-all box-glow-blue shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Play className="w-5 h-5 fill-current" />
            <span>PLAY NOW</span>
          </div>
          <span className="text-xs font-mono bg-neutral-900/30 px-2 py-0.5 rounded">QUICK RACE</span>
        </button>

        <button
          onClick={() => navTo('career')}
          className="cyber-btn flex items-center justify-between px-6 py-3.5 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 hover:border-amber-400/60 text-white font-display font-semibold tracking-wider uppercase transition-all"
        >
          <div className="flex items-center space-x-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>CAREER MODE</span>
          </div>
          <span className="text-xs font-mono text-amber-400">5 CIRCUITS</span>
        </button>

        <button
          onClick={() => navTo('track_select')}
          className="cyber-btn flex items-center justify-between px-6 py-3.5 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 hover:border-sky-400/60 text-white font-display font-semibold tracking-wider uppercase transition-all"
        >
          <div className="flex items-center space-x-3">
            <Flag className="w-5 h-5 text-sky-400" />
            <span>TRACK SELECTION</span>
          </div>
          <span className="text-xs font-mono text-neutral-400">EXPLORE</span>
        </button>

        <button
          onClick={() => navTo('garage')}
          className="cyber-btn flex items-center justify-between px-6 py-3.5 bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 hover:border-sky-400/60 text-white font-display font-semibold tracking-wider uppercase transition-all"
        >
          <div className="flex items-center space-x-3">
            <Wrench className="w-5 h-5 text-sky-400" />
            <span>VEHICLE GARAGE</span>
          </div>
          <span className="text-xs font-mono text-neutral-400">CUSTOMIZE</span>
        </button>

        <div className="grid grid-cols-4 gap-2 pt-2">
          <button
            onClick={() => navTo('settings')}
            className="cyber-btn flex items-center justify-center space-x-1 px-2.5 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 text-xs font-mono text-neutral-300 uppercase transition-all"
            title="Audio & Graphics Settings"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span className="text-[10px]">CONFIG</span>
          </button>

          <button
            onClick={() => navTo('how_to_play')}
            className="cyber-btn flex items-center justify-center space-x-1 px-2.5 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 text-xs font-mono text-neutral-300 uppercase transition-all"
            title="Controls & Mechanics"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="text-[10px]">GUIDE</span>
          </button>

          <button
            onClick={() => navTo('credits')}
            className="cyber-btn flex items-center justify-center space-x-1 px-2.5 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-600 text-xs font-mono text-neutral-300 uppercase transition-all"
            title="Development Credits"
          >
            <Award className="w-3.5 h-3.5" />
            <span className="text-[10px]">CREDITS</span>
          </button>

          <button
            onClick={() => setShowExitModal(true)}
            className="cyber-btn flex items-center justify-center space-x-1 px-2.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 hover:border-red-400 text-xs font-mono text-red-300 uppercase transition-all"
            title="Exit Simulator"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="text-[10px]">EXIT</span>
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/80 backdrop-blur-md z-50 p-6">
          <div className="cyber-panel p-6 max-w-sm w-full bg-neutral-900/95 border-red-500/60 space-y-4 text-center shadow-2xl box-glow-red">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-display font-black text-white">TERMINATE SIMULATION?</h3>
              <p className="text-xs font-mono text-neutral-400 mt-1">
                Disconnect telemetry and return to standby screen?
              </p>
            </div>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setShowExitModal(false)}
                className="cyber-btn flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-mono text-xs uppercase"
              >
                CANCEL
              </button>
              <button
                onClick={handleExitSimulation}
                className="cyber-btn flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-xs uppercase font-bold box-glow-red"
              >
                CONFIRM EXIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Controls Tip */}
      <div className="w-full flex justify-between items-center z-10 text-xs font-mono text-neutral-400">
        <div>CONTROLS: [W/A/S/D] DRIVE • [SPACE] NITRO • [SHIFT] DRIFT • [G] GRAVITY • [R] RESET</div>
        <div className="text-sky-400">v1.0.0 HACKATHON BUILD</div>
      </div>
    </div>
  );
};
