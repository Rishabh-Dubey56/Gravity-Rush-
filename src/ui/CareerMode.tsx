import React from 'react';
import { useGameStore, TRACK_METADATA, TrackId } from '../store/gameStore';
import { ArrowLeft, Lock, Trophy, Play, CheckCircle, Zap } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const CareerMode: React.FC = () => {
  const { setScreen, startRace, saveData, setGameMode } = useGameStore();

  const trackIds: TrackId[] = [
    'neon-metropolis',
    'inferno-circuit',
    'frostbite',
    'orbital-zero',
    'singularity',
  ];

  const handleRace = (trackId: TrackId) => {
    AudioManager.init();
    AudioManager.resume();
    AudioManager.playCheckpoint();
    setGameMode('career');
    startRace(trackId);
  };

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
              CAREER <span className="text-amber-400">CHAMPIONSHIP</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              5 ROUND PROGRESSION • DEFY GRAVITY ACROSS THE GALAXY
            </p>
          </div>
        </div>

        <div className="cyber-panel px-4 py-2 flex items-center space-x-2 text-sm font-mono">
          <Zap className="w-4 h-4 text-amber-400 fill-current" />
          <span className="text-neutral-400">BANK:</span>
          <span className="text-amber-400 font-bold">{saveData.credits.toLocaleString()} CR</span>
        </div>
      </div>

      {/* 5 Track Progression Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 z-10 my-auto">
        {trackIds.map((trackId, idx) => {
          const meta = TRACK_METADATA[trackId];
          const record = saveData.trackRecords[trackId] || {
            unlocked: idx === 0,
            bestLapTime: null,
            bestTotalTime: null,
            completedRaces: 0,
            bestPosition: null,
          };
          const isUnlocked = record.unlocked;

          return (
            <div
              key={trackId}
              className={`cyber-panel p-5 flex flex-col justify-between transition-all ${
                isUnlocked
                  ? 'border-sky-500/40 hover:border-sky-400 bg-neutral-900/80 shadow-lg'
                  : 'opacity-50 border-neutral-800 bg-neutral-950/60'
              }`}
            >
              <div>
                {/* Round Badge & Difficulty */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-mono text-neutral-400">ROUND 0{idx + 1}</span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${meta.accentColor}25`, color: meta.accentColor }}
                  >
                    {meta.difficulty}
                  </span>
                </div>

                {/* Track Title & Subtitle */}
                <h3 className="text-lg font-display font-bold text-white mb-1">{meta.name}</h3>
                <p className="text-xs font-mono text-neutral-400 mb-4">{meta.subtitle}</p>

                {/* Gravity Mechanics Badge */}
                <div className="space-y-1 mb-4 text-[11px] font-mono text-neutral-300">
                  {meta.gravityFeatures.slice(0, 2).map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.accentColor }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Record Stats */}
                <div className="cyber-panel p-2.5 bg-neutral-950/60 text-xs font-mono space-y-1 mb-4">
                  <div className="flex justify-between text-neutral-400">
                    <span>BEST LAP:</span>
                    <span className="text-white font-bold">
                      {record.bestLapTime ? `${record.bestLapTime.toFixed(2)}s` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>POSITION:</span>
                    <span className="text-amber-400 font-bold">
                      {record.bestPosition ? `${record.bestPosition}ST PLACE` : 'UNRANKED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                {isUnlocked ? (
                  <button
                    onClick={() => handleRace(trackId)}
                    className="cyber-btn w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center space-x-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>RACE</span>
                  </button>
                ) : (
                  <div className="flex items-center justify-center space-x-2 py-2 text-xs font-mono text-neutral-500">
                    <Lock className="w-4 h-4" />
                    <span>LOCKED</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400">
        <div>PROGRESSION: FINISH IN TOP 3 (PODIUM) TO UNLOCK NEXT CIRCUIT</div>
        <div>TOTAL CIRCUITS: 5 // CHAMPIONSHIP ROUND: SINGULARITY</div>
      </div>
    </div>
  );
};
