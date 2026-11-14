import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, FastForward, ShieldAlert, Volume2 } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';
import { VoiceAnnouncer } from '../audio/VoiceAnnouncer';

export const IntroScreen: React.FC = () => {
  const { setScreen } = useGameStore();

  useEffect(() => {
    let hasWelcomed = false;

    const triggerWelcome = () => {
      if (hasWelcomed) return;
      hasWelcomed = true;
      try {
        AudioManager.init();
        AudioManager.resume();
        VoiceAnnouncer.announceWelcome();
      } catch {}
    };

    // 1. Attempt immediately on page open / refresh
    const timer = setTimeout(() => {
      triggerWelcome();
    }, 600);

    // 2. Also register one-time user interaction listener if browser policy blocks autoplay before click
    const handleFirstUserGesture = () => {
      triggerWelcome();
      window.removeEventListener('pointerdown', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };

    window.addEventListener('pointerdown', handleFirstUserGesture, { once: true });
    window.addEventListener('keydown', handleFirstUserGesture, { once: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };
  }, []);

  const handleStart = () => {
    try {
      AudioManager.init();
      AudioManager.resume();
      AudioManager.playCheckpoint();
    } catch (e) {
      console.warn('Audio start error suppressed:', e);
    }
    setScreen('main_menu');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#0a0f16] via-[#101820] to-[#070b0f] text-white overflow-hidden scanlines">
      {/* Background cyber grid & glow effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar Header */}
      <div className="w-full max-w-6xl flex justify-between items-center z-10 pt-4">
        <div className="flex items-center space-x-2 text-xs font-mono tracking-widest text-sky-400">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
          <span>QUANTUM GRAVITY SIMULATOR // VER 1.0</span>
        </div>
        <button
          onClick={handleStart}
          className="flex items-center space-x-1 text-xs font-mono tracking-widest text-neutral-400 hover:text-white transition-colors"
        >
          <span>SKIP INTRO</span>
          <FastForward className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* Hero Title & Identity */}
      <div className="flex flex-col items-center text-center z-10 my-auto">
        <div className="inline-block px-3 py-1 mb-4 text-xs font-mono tracking-widest uppercase rounded bg-sky-500/10 border border-sky-400/30 text-sky-400">
          Advanced 3D Anti-Gravity Racing
        </div>

        <h1 className="text-6xl md:text-8xl font-black font-display tracking-tight text-white glow-blue mb-2">
          GRAVITY <span className="text-sky-400">RUSH</span>
        </h1>

        <p className="text-lg md:text-2xl font-light tracking-[0.25em] text-neutral-300 font-display uppercase mb-8">
          Defy Gravity. Control The Impossible.
        </p>

        {/* Start Game Action */}
        <button
          onClick={handleStart}
          className="cyber-btn flex items-center space-x-3 px-10 py-5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-xl tracking-wider uppercase transition-all box-glow-blue shadow-lg hover:shadow-sky-400/50"
        >
          <Play className="w-6 h-6 fill-current" />
          <span>Enter System</span>
        </button>
      </div>

      {/* Bottom Features Banner */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-4 z-10 pb-4 text-sm font-mono text-neutral-400">
        <div className="cyber-panel p-3 flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-sky-400 rounded-sm" />
          <div>
            <div className="text-white font-bold">PHYSICAL GRAVITY</div>
            <div className="text-xs">Walls, loops and full inverted ceilings</div>
          </div>
        </div>
        <div className="cyber-panel p-3 flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-amber-400 rounded-sm" />
          <div>
            <div className="text-white font-bold">5 UNIQUE CIRCUITS</div>
            <div className="text-xs">From Tokyo Skyline to Singularity Core</div>
          </div>
        </div>
        <div className="cyber-panel p-3 flex items-center space-x-3">
          <div className="w-2.5 h-2.5 bg-purple-400 rounded-sm" />
          <div>
            <div className="text-white font-bold">COMPETITIVE AI</div>
            <div className="text-xs">Multi-agent physics & tactical racing</div>
          </div>
        </div>
      </div>
    </div>
  );
};
