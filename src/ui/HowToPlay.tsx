import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Compass, Zap, Shield, Key } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const HowToPlay: React.FC = () => {
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
              HOW TO <span className="text-sky-400">PLAY</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              PILOTING MANUAL & GRAVITATIONAL ADHESION GUIDE
            </p>
          </div>
        </div>
      </div>

      {/* Guide Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 z-10 my-auto max-w-5xl w-full mx-auto">
        {/* Controls Column */}
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Key className="w-4 h-4" />
            <span>FLIGHT CONTROLS</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">ACCELERATE</span>
              <span className="text-white font-bold">[W] or [↑]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">BRAKE / REVERSE</span>
              <span className="text-white font-bold">[S] or [↓]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">STEERING</span>
              <span className="text-white font-bold">[A] [D] or [←] [→]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">NITRO BOOST</span>
              <span className="text-amber-400 font-bold">[SPACE]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">DRIFT / HANDBRAKE</span>
              <span className="text-sky-400 font-bold">[SHIFT]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">MANUAL GRAVITY</span>
              <span className="text-purple-400 font-bold">[G]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">VEHICLE RECOVERY</span>
              <span className="text-red-400 font-bold">[R]</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-neutral-950/60">
              <span className="text-neutral-400">CAMERA MODE</span>
              <span className="text-neutral-300 font-bold">[C]</span>
            </div>
          </div>
        </div>

        {/* Gravity Dynamics */}
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Compass className="w-4 h-4" />
            <span>DYNAMIC GRAVITY</span>
          </div>

          <div className="space-y-3 text-xs text-neutral-300 font-sans">
            <p>
              Gravity Rush features <strong className="text-white">real Rapier rigid body physics</strong>. When entering a gravity zone, gravitational acceleration re-orients toward the active surface normal.
            </p>
            <div className="p-3 rounded bg-neutral-950/60 space-y-2 font-mono text-[11px]">
              <div className="text-sky-400">■ 90° WALL RIDING</div>
              <div>Keep throttle engaged at high speed. Downforce and tire friction maintain suction against skyscraper facades.</div>
              <div className="text-amber-400">■ 180° INVERTED CEILINGS</div>
              <div>Maintain momentum through inverted loops. Never brake while upside down unless adhering firmly.</div>
              <div className="text-purple-400">■ ZERO-G VACUUM ZONES</div>
              <div>Gravity is disabled. Steer using 6DOF attitude thrusters and align for the landing capture ring.</div>
            </div>
          </div>
        </div>

        {/* Tactical Racing */}
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Zap className="w-4 h-4" />
            <span>RACING TACTICS</span>
          </div>

          <div className="space-y-3 text-xs text-neutral-300 font-sans">
            <div className="p-3 rounded bg-neutral-950/60 space-y-1 font-mono text-[11px]">
              <div className="text-amber-400">NITRO CHARGE:</div>
              <div>Recharges automatically over time. Drifting around corners generates bonus nitro recharge!</div>
            </div>

            <div className="p-3 rounded bg-neutral-950/60 space-y-1 font-mono text-[11px]">
              <div className="text-emerald-400">RACING LINE:</div>
              <div>Take the inside apex on high-G wall transitions to shave seconds off your lap times.</div>
            </div>

            <div className="p-3 rounded bg-neutral-950/60 space-y-1 font-mono text-[11px]">
              <div className="text-red-400">RECOVERY:</div>
              <div>If you tumble off a cliff or flip upside down, press <strong className="text-white">[R]</strong> to instantly recover to your last valid checkpoint.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400 max-w-5xl w-full mx-auto">
        <div>TIP: PRESS [C] TO SWITCH TO HOOD OR CHASE CAMERA VIEWS</div>
        <div>GRAVITY RUSH RACING PROTOCOL</div>
      </div>
    </div>
  );
};
