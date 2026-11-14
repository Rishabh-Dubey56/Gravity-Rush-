import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, RotateCcw, Settings as SettingsIcon, Home } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const PauseMenu: React.FC = () => {
  const { resumeRace, resetRace, setScreen } = useGameStore();

  const handleResume = () => {
    AudioManager.playCheckpoint();
    resumeRace();
  };

  const handleRestart = () => {
    AudioManager.playCheckpoint();
    resetRace();
  };

  const handleExit = () => {
    AudioManager.playCheckpoint();
    AudioManager.stopEngine();
    AudioManager.stopMusic();
    setScreen('main_menu');
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/75 backdrop-blur-md z-50 text-white select-none scanlines">
      <div className="cyber-panel p-8 max-w-sm w-full bg-neutral-900/95 border-sky-500/50 space-y-6 text-center shadow-2xl box-glow-blue">
        <div>
          <h2 className="text-3xl font-display font-black text-white glow-blue mb-1">
            RACE <span className="text-sky-400">PAUSED</span>
          </h2>
          <p className="text-xs font-mono text-neutral-400 uppercase">
            SIMULATION SUSPENDED
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResume}
            className="cyber-btn w-full py-3.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center space-x-2 box-glow-blue"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME RACE</span>
          </button>

          <button
            onClick={handleRestart}
            className="cyber-btn w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-display font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART CIRCUIT</span>
          </button>

          <button
            onClick={() => setScreen('settings')}
            className="cyber-btn w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-display font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
          >
            <SettingsIcon className="w-4 h-4" />
            <span>SETTINGS</span>
          </button>

          <button
            onClick={handleExit}
            className="cyber-btn w-full py-3 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-display font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
          >
            <Home className="w-4 h-4" />
            <span>EXIT TO MENU</span>
          </button>
        </div>

        <div className="text-[10px] font-mono text-neutral-500">
          PRESS [ESC] TO RESUME AT ANY TIME
        </div>
      </div>
    </div>
  );
};
