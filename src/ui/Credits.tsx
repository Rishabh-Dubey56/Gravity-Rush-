import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Award, Code, Cpu, Music } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const Credits: React.FC = () => {
  const { setScreen } = useGameStore();

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
              DEVELOPMENT <span className="text-sky-400">CREDITS</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              ARCHITECTURE, PHYSICS ENGINEERING & AUDIO DESIGN
            </p>
          </div>
        </div>
      </div>

      {/* Credits Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 my-auto max-w-5xl w-full mx-auto">
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Cpu className="w-4 h-4" />
            <span>PHYSICS & CORE ARCHITECTURE</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-neutral-300">
            <div>• Dimforge Rapier 3D WebAssembly</div>
            <div>• 4-Wheel Raycast Spring Suspension (F = kx + cv)</div>
            <div>• Dynamic Dynamic Local Gravity Vector Field</div>
            <div>• Non-Gimbal Quaternion Camera Alignment</div>
            <div>• Pure Out-of-React High Frequency Simulation</div>
          </div>
        </div>

        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Code className="w-4 h-4" />
            <span>GRAPHICS & TECH STACK</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-neutral-300">
            <div>• Three.js r168 & React Three Fiber</div>
            <div>• Procedural Track Spline Mesh Generation</div>
            <div>• Zustand Persistent Store with Schema Migration</div>
            <div>• Tailwind CSS Futuristic UI & Lucide Icons</div>
            <div>• Vite + TypeScript Strict Modular Engine</div>
          </div>
        </div>

        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Music className="w-4 h-4" />
            <span>PROCEDURAL SOUND ENGINE</span>
          </div>
          <div className="space-y-2 text-xs font-mono text-neutral-300">
            <div>• Zero External Asset Dependency Web Audio API</div>
            <div>• Multi-Oscillator Sawtooth/Sub Engine Synth</div>
            <div>• Resonant Bandpass Drift & Tire Screech</div>
            <div>• Harmonic Arpeggiated Synthwave Music</div>
            <div>• Frequency-Sweep Plasma Nitro & Gravity Chimes</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400 max-w-5xl w-full mx-auto">
        <div>GRAVITY RUSH // HACKATHON EDITION 2026</div>
        <div className="text-sky-400 font-bold">BUILT FOR SPEED & EXTREME G-FORCE</div>
      </div>
    </div>
  );
};
