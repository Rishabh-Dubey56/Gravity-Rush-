import React, { useState } from 'react';
import { useGameStore, TRACK_METADATA, TrackId } from '../store/gameStore';
import { ArrowLeft, Play, Flag, Timer, Zap, Unlock } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';

export const TrackSelection: React.FC = () => {
  const { setScreen, startRace, selectTrack, selectedTrackId, selectedVehicleId, saveData } = useGameStore();
  const [lapsCount, setLapsCount] = useState<number>(3);

  const trackIds: TrackId[] = [
    'neon-metropolis',
    'inferno-circuit',
    'frostbite',
    'orbital-zero',
    'singularity',
  ];

  const handleSelectTrack = (trackId: TrackId) => {
    AudioManager.playCheckpoint();
    selectTrack(trackId);
  };

  const handleStartRace = () => {
    AudioManager.init();
    AudioManager.resume();
    AudioManager.playCheckpoint();
    startRace(selectedTrackId, selectedVehicleId, lapsCount);
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
              TRACK <span className="text-sky-400">SELECTION</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              CHOOSE YOUR GRAVITATIONAL RACING ENVIRONMENT
            </p>
          </div>
        </div>

        {/* Laps Selector */}
        <div className="cyber-panel px-4 py-2 flex items-center space-x-4 text-xs font-mono">
          <span className="text-neutral-400">RACE LENGTH:</span>
          {[1, 3, 5].map((laps) => (
            <button
              key={laps}
              onClick={() => {
                AudioManager.playCheckpoint();
                setLapsCount(laps);
              }}
              className={`px-2.5 py-1 rounded transition-all ${
                lapsCount === laps
                  ? 'bg-sky-500 text-neutral-950 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {laps} {laps === 1 ? 'LAP' : 'LAPS'}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Track Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 z-10 my-auto">
        {trackIds.map((trackId) => {
          const meta = TRACK_METADATA[trackId];
          const isSelected = selectedTrackId === trackId;
          const record = saveData.trackRecords[trackId];
          const bestLap = record?.bestLapTime ? `${record.bestLapTime.toFixed(2)}s` : '--';

          return (
            <div
              key={trackId}
              onClick={() => handleSelectTrack(trackId)}
              className={`cyber-panel p-5 flex flex-col justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-sky-400 bg-sky-950/40 shadow-xl box-glow-blue scale-[1.02]'
                  : 'border-neutral-800 hover:border-neutral-600 bg-neutral-900/60'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded uppercase"
                    style={{ backgroundColor: `${meta.accentColor}25`, color: meta.accentColor }}
                  >
                    {meta.difficulty}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">{meta.lengthMeters}M</span>
                </div>

                <h3 className="text-lg font-display font-bold text-white mb-1">{meta.name}</h3>
                <p className="text-xs font-mono text-neutral-400 mb-3">{meta.subtitle}</p>

                <p className="text-xs text-neutral-300 font-sans line-clamp-3 mb-4">
                  {meta.description}
                </p>

                <div className="space-y-1 mb-4 text-[11px] font-mono text-neutral-300">
                  {meta.gravityFeatures.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.accentColor }} />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="cyber-panel p-2 bg-neutral-950/60 text-xs font-mono flex justify-between items-center mb-3">
                  <span className="text-neutral-400">RECORD:</span>
                  <span className="text-sky-400 font-bold">{bestLap}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTrack(trackId);
                    handleStartRace();
                  }}
                  className={`cyber-btn w-full py-2.5 font-display font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center space-x-2 ${
                    isSelected
                      ? 'bg-sky-500 hover:bg-sky-400 text-neutral-950'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isSelected ? 'LAUNCH RACE' : 'SELECT'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400">
        <div className="flex items-center space-x-2">
          <span>SELECTED:</span>
          <span className="text-sky-400 font-bold">{TRACK_METADATA[selectedTrackId].name}</span>
        </div>
        <button
          onClick={handleStartRace}
          className="cyber-btn px-8 py-3 bg-sky-500 hover:bg-sky-400 text-neutral-950 font-display font-bold text-sm tracking-wider uppercase transition-all box-glow-blue flex items-center space-x-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>START RACING</span>
        </button>
      </div>
    </div>
  );
};
