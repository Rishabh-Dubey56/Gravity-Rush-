import React from 'react';
import { useGameStore, TRACK_METADATA, TrackId } from '../store/gameStore';
import { Trophy, RotateCcw, ArrowRight, Home, Zap, Award, Coins, Wrench, AlertOctagon } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const ResultsScreen: React.FC = () => {
  const {
    raceState,
    selectedTrackId,
    startRace,
    setScreen,
    saveData,
  } = useGameStore();

  const { finalPosition, finalTime, lapTimes, coinsCollected } = raceState;
  const trackMeta = TRACK_METADATA[selectedTrackId];
  const position = finalPosition ?? 1;
  const isVictory = position === 1;
  const isPodium = position <= 3;

  const trackOrder: TrackId[] = [
    'neon-metropolis',
    'inferno-circuit',
    'frostbite',
    'orbital-zero',
    'singularity',
  ];
  const currIdx = trackOrder.indexOf(selectedTrackId);
  const nextTrackId = currIdx !== -1 && currIdx + 1 < trackOrder.length ? trackOrder[currIdx + 1] : null;

  const formatTime = (secs: number | null) => {
    if (secs === null) return '--:--.--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const bestLap = lapTimes && lapTimes.length > 0 ? Math.min(...lapTimes) : finalTime;
  const positionReward = position === 1 ? 1500 : position === 2 ? 800 : position === 3 ? 400 : 150;
  const coinReward = (coinsCollected || 0) * 50;
  const totalReward = positionReward + coinReward;

  const handleNextTrack = () => {
    AudioManager.playCheckpoint();
    if (nextTrackId) {
      startRace(nextTrackId);
    } else {
      setScreen('career');
    }
  };

  const handleRetry = () => {
    AudioManager.playCheckpoint();
    startRace(selectedTrackId);
  };

  const handleGarage = () => {
    AudioManager.playCheckpoint();
    AudioManager.stopEngine();
    AudioManager.stopMusic();
    setScreen('garage');
  };

  const handleMenu = () => {
    AudioManager.playCheckpoint();
    AudioManager.stopEngine();
    AudioManager.stopMusic();
    setScreen('main_menu');
  };

  return (
    <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/85 backdrop-blur-md z-50 text-white select-none scanlines p-6">
      <div
        className={`cyber-panel p-8 max-w-lg w-full bg-neutral-900/95 space-y-5 text-center shadow-2xl ${
          isVictory ? 'border-amber-400/80 box-glow-orange' : isPodium ? 'border-sky-500/60 box-glow-blue' : 'border-red-500/60 box-glow-red'
        }`}
      >
        {/* Header Banner */}
        <div>
          <div
            className={`inline-flex p-3.5 rounded-full mb-2 ${
              isVictory
                ? 'bg-amber-500/20 border border-amber-400 text-amber-400 box-glow-orange animate-bounce'
                : isPodium
                ? 'bg-sky-500/20 border border-sky-400 text-sky-400 box-glow-blue'
                : 'bg-red-500/20 border border-red-500 text-red-400 box-glow-red'
            }`}
          >
            {isVictory ? (
              <Trophy className="w-9 h-9" />
            ) : isPodium ? (
              <Award className="w-9 h-9" />
            ) : (
              <AlertOctagon className="w-9 h-9" />
            )}
          </div>

          <h2
            className={`text-4xl font-display font-black tracking-tight ${
              isVictory ? 'text-amber-400 glow-orange' : isPodium ? 'text-sky-400 glow-blue' : 'text-red-400 glow-red'
            }`}
          >
            {isVictory ? 'VICTORY!' : isPodium ? 'PODIUM FINISH' : 'DEFEAT'}
          </h2>
          <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest mt-1">
            {trackMeta.name} // {isVictory ? 'CIRCUIT CHAMPION' : isPodium ? 'TOP CONTENDER' : 'ELIMINATED'}
          </p>
        </div>

        {/* Position & Time Showcase */}
        <div className="cyber-panel p-4 bg-neutral-950/80 flex items-center justify-around border-sky-500/30">
          <div>
            <div className="text-[10px] font-mono text-neutral-400">FINISH RANK</div>
            <div
              className={`text-4xl font-display font-black leading-none ${
                isVictory ? 'text-amber-400 glow-orange' : isPodium ? 'text-sky-400' : 'text-red-400'
              }`}
            >
              {position}
              <span className="text-sm font-bold">
                {position === 1 ? 'ST' : position === 2 ? 'ND' : position === 3 ? 'RD' : 'TH'}
              </span>
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-800" />

          <div>
            <div className="text-[10px] font-mono text-neutral-400">TOTAL TIME</div>
            <div className="text-lg font-mono font-bold text-white">
              {formatTime(finalTime)}
            </div>
          </div>

          <div className="h-8 w-px bg-neutral-800" />

          <div>
            <div className="text-[10px] font-mono text-neutral-400">BEST LAP</div>
            <div className="text-lg font-mono font-bold text-sky-400">
              {formatTime(bestLap)}
            </div>
          </div>
        </div>

        {/* Rewards Breakdown: Position Prize + Coins Collected */}
        <div className="cyber-panel p-3.5 bg-neutral-950/80 border-amber-500/40 text-xs font-mono space-y-1.5">
          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center space-x-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Rank Placement Prize:</span>
            </span>
            <span className="text-amber-400 font-bold">+{positionReward} CR</span>
          </div>

          <div className="flex justify-between items-center text-neutral-300">
            <span className="flex items-center space-x-1.5">
              <Coins className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Track Coins ({coinsCollected || 0} collected):</span>
            </span>
            <span className="text-amber-400 font-bold">+{coinReward} CR</span>
          </div>

          <div className="pt-1.5 border-t border-neutral-800 flex justify-between items-center text-sm font-display font-bold">
            <span className="text-white">TOTAL PAYOUT:</span>
            <span className="text-amber-400 glow-orange">+{totalReward} CREDITS</span>
          </div>
        </div>

        {/* Action Buttons: RETRY, GARAGE, NEXT, EXIT */}
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={handleRetry}
            className="cyber-btn py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-display font-semibold text-xs tracking-wider uppercase transition-all flex flex-col items-center justify-center space-y-1"
            title="Retry Circuit"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[10px]">RETRY</span>
          </button>

          <button
            onClick={handleGarage}
            className="cyber-btn py-3 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-display font-semibold text-xs tracking-wider uppercase transition-all flex flex-col items-center justify-center space-y-1"
            title="Upgrade in Garage"
          >
            <Wrench className="w-4 h-4" />
            <span className="text-[10px]">GARAGE</span>
          </button>

          <button
            onClick={handleMenu}
            className="cyber-btn py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-display font-semibold text-xs tracking-wider uppercase transition-all flex flex-col items-center justify-center space-y-1"
            title="Exit to Main Menu"
          >
            <Home className="w-4 h-4" />
            <span className="text-[10px]">EXIT</span>
          </button>

          <button
            onClick={handleNextTrack}
            className="cyber-btn py-3 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-xs tracking-wider uppercase transition-all flex flex-col items-center justify-center space-y-1 box-glow-blue"
            title="Next Circuit"
          >
            <ArrowRight className="w-4 h-4" />
            <span className="text-[10px]">NEXT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
