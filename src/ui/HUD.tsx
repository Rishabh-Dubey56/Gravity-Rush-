import React from 'react';
import { useGameStore, TRACK_METADATA } from '../store/gameStore';
import { Zap, Compass, Pause, AlertTriangle, Coins, Radio } from 'lucide-react';

export const HUD: React.FC = () => {
  const {
    telemetry,
    raceState,
    selectedTrackId,
    pauseRace,
    saveData,
    fps,
    radioComms,
    floatingPopups,
  } = useGameStore();

  const trackMeta = TRACK_METADATA[selectedTrackId];
  const { speedKmh, rpm, gear, nitroPercent, gravityVector, gravityZoneName, isZeroG } = telemetry;
  const { currentLap, totalLaps, position, raceTimer, countdown, raceWarning } = raceState;

  // Format race timer: mm:ss.ms
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs * 100) % 100);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  // Convert gravity vector to human readable orientation
  const getGravityLabel = () => {
    if (isZeroG) return 'ZERO-GRAVITY';
    const [gx, gy] = gravityVector;
    if (Math.abs(gx) > 15) return gx > 0 ? 'RIGHT WALL 90°' : 'LEFT WALL 90°';
    if (gy > 10) return 'INVERTED CEILING';
    return 'NORMAL GROUND';
  };

  const positionSuffix = (pos: number) => {
    if (pos === 1) return 'ST';
    if (pos === 2) return 'ND';
    if (pos === 3) return 'RD';
    return 'TH';
  };

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between overflow-hidden select-none">
      {/* COUNTDOWN OVERLAY (3, 2, 1, GO!) */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center flex flex-col items-center animate-pulse">
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-full border-2 border-sky-400/50 flex items-center justify-center bg-black/60 backdrop-blur-md box-glow-blue shadow-2xl">
              <span
                className={`font-display font-black text-7xl md:text-8xl tracking-tighter transition-all transform ${
                  countdown === 0 ? 'text-amber-400 glow-orange scale-110' : 'text-sky-400 glow-blue'
                }`}
              >
                {countdown === 0 ? 'GO!' : countdown}
              </span>
            </div>
            <div className="mt-3 font-mono text-xs uppercase tracking-widest text-sky-400/90 font-bold bg-neutral-900/80 px-4 py-1 rounded border border-sky-500/30">
              {countdown === 0 ? 'THRUSTERS ENGAGED' : 'SYSTEM INITIALIZING'}
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR: Track Info, Position, Lap, Timer */}
      <div className="w-full flex justify-between items-start z-10">
        {/* Track Title & Pause */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <button
            onClick={pauseRace}
            className="p-2.5 rounded cyber-panel hover:bg-neutral-800 text-sky-400 hover:text-white transition-all pointer-events-auto"
            title="Pause [ESC]"
          >
            <Pause className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-mono text-sky-400/90 tracking-widest uppercase">
              {trackMeta.name}
            </div>
            <div className="text-sm font-display font-bold text-white tracking-wider">
              {trackMeta.subtitle}
            </div>
          </div>
        </div>

        {/* Center: Position, Lap, & Coins Badge */}
        <div className="flex items-center space-x-3">
          {/* Race Position */}
          <div className="cyber-panel px-5 py-2 flex items-baseline space-x-1 border-sky-400/60 bg-neutral-900/90 box-glow-blue">
            <span className="text-4xl font-display font-black text-white glow-blue leading-none">
              {position}
            </span>
            <span className="text-sm font-display font-bold text-sky-400">
              {positionSuffix(position)}
            </span>
            <span className="text-[10px] font-mono text-neutral-400 ml-2">/ 4</span>
          </div>

          {/* Lap Counter */}
          <div className="cyber-panel px-4 py-2 flex items-center space-x-2 bg-neutral-900/90 font-mono">
            <span className="text-xs text-neutral-400">LAP</span>
            <span className="text-xl font-bold text-white">{currentLap}</span>
            <span className="text-xs text-neutral-500">/</span>
            <span className="text-xs text-neutral-400">{totalLaps}</span>
          </div>

          {/* Quantum Coins Collected */}
          <div className="cyber-panel px-4 py-2 flex items-center space-x-2 bg-neutral-900/90 border-amber-500/50 box-glow-orange">
            <Coins className="w-5 h-5 text-amber-400 fill-current animate-pulse" />
            <span className="text-xl font-display font-black text-amber-400 glow-orange leading-none">
              {raceState.coinsCollected}
            </span>
          </div>
        </div>

        {/* Right: Race Timer & Mini-Map Container */}
        <div className="flex flex-col items-end space-y-2">
          <div className="cyber-panel px-4 py-1.5 font-mono text-lg font-bold text-sky-400 bg-neutral-900/90">
            {formatTime(raceTimer)}
          </div>

          {/* Mini-Map */}
          {saveData.settings.showMiniMap && (
            <div className="cyber-panel w-28 h-28 p-1 flex items-center justify-center bg-neutral-950/80 border-sky-500/30 relative">
              <svg className="w-full h-full" viewBox="-150 -150 500 500">
                {/* Simplified track circuit loop */}
                <path
                  d="M 0 50 Q 0 250 150 250 Q 300 250 300 120 Q 300 -50 150 -50 Z"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="20"
                />
                <path
                  d="M 0 50 Q 0 250 150 250 Q 300 250 300 120 Q 300 -50 150 -50 Z"
                  fill="none"
                  stroke={trackMeta.accentColor}
                  strokeWidth="4"
                  strokeDasharray="8 4"
                />
                {/* Player Blip (Cyan) */}
                <circle cx="80" cy="180" r="10" fill="#38BDF8" className="animate-pulse" />
                {/* AI Blips (Red, Violet, Green) */}
                <circle cx="95" cy="200" r="7" fill="#EF4444" />
                <circle cx="65" cy="160" r="7" fill="#A855F7" />
                <circle cx="50" cy="140" r="7" fill="#10B981" />
              </svg>
              <div className="absolute bottom-1 right-1 text-[9px] font-mono text-neutral-500">
                GPS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TACTICAL RADIO COMMS / ANNOUNCER HUD */}
      {radioComms && radioComms.active && (
        <div className="self-center z-40 animate-pulse transition-all">
          <div className="cyber-panel px-6 py-2.5 bg-neutral-950/95 border-sky-400 flex items-center space-x-4 shadow-2xl box-glow-blue max-w-xl">
            {/* Animated Equalizer Waveform */}
            <div className="flex items-end space-x-1 h-6">
              {[0.4, 0.9, 0.6, 1.0, 0.7, 0.3, 0.8, 0.5].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-sky-400 rounded-sm animate-pulse"
                  style={{
                    height: `${h * 100}%`,
                    animationDuration: `${0.25 + (i % 3) * 0.12}s`,
                  }}
                />
              ))}
            </div>

            <div className="text-left">
              <div className="text-[10px] font-mono text-sky-400 tracking-widest font-bold flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>COMMS // {radioComms.speaker} [{radioComms.callsign}]</span>
              </div>
              <div className="text-sm font-display font-black text-white tracking-wide">
                "{radioComms.message}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION & PICKUP POPUPS */}
      <div className="absolute top-28 right-8 z-30 flex flex-col items-end space-y-2 pointer-events-none">
        {floatingPopups.map((popup) => (
          <div
            key={popup.id}
            className="cyber-panel px-4 py-1.5 bg-neutral-950/90 text-sm font-display font-black tracking-wider animate-bounce shadow-lg"
            style={{ color: popup.color, borderColor: popup.color }}
          >
            {popup.text}
          </div>
        ))}
      </div>

      {/* CENTER RACE WARNING BANNER */}
      {raceWarning && (
        <div className="self-center cyber-panel-orange px-6 py-2 flex items-center space-x-2 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span className="font-display font-bold text-sm text-amber-400 tracking-wider">
            {raceWarning}
          </span>
        </div>
      )}

      {/* BOTTOM CLUSTERS: Gravity Vector (Left) & Instrument Cluster (Right) */}
      <div className="w-full flex justify-between items-end z-10">
        {/* Dynamic Gravity Indicator Widget (Left) */}
        <div className="cyber-panel p-4 bg-neutral-950/85 border-sky-500/40 space-y-2 max-w-xs">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
            <Compass className="w-4 h-4 text-sky-400 animate-spin" />
            <span>GRAVITY ORIENTATION</span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Visual Orientation Compass Arrow */}
            <div className="w-10 h-10 rounded border border-sky-400/50 bg-sky-950/40 flex items-center justify-center font-mono text-sm font-bold text-sky-400">
              {gravityVector[1] > 10 ? '▲' : gravityVector[0] > 10 ? '▶' : gravityVector[0] < -10 ? '◀' : '▼'}
            </div>
            <div>
              <div className="text-sm font-display font-bold text-white">
                {getGravityLabel()}
              </div>
              <div className="text-[11px] font-mono text-neutral-400">
                ZONE: <span className="text-sky-400">{gravityZoneName}</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-neutral-500 flex justify-between">
            <span>VEC: [{gravityVector.join(', ')}]</span>
            <span className="text-emerald-400">LOCKED</span>
          </div>
        </div>

        {/* Speedometer & Instrument Cluster (Right) */}
        <div className="cyber-panel p-5 bg-neutral-950/90 border-sky-500/50 flex flex-col items-end space-y-3">
          {/* Main Speed Readout */}
          <div className="flex items-baseline space-x-3">
            <div className="flex items-baseline font-mono font-black text-6xl md:text-7xl tracking-tight leading-none tabular-nums">
              {(() => {
                const spd = Math.max(0, Math.round(speedKmh));
                const sStr = spd.toString().padStart(3, '0');
                const leadingCount = 3 - spd.toString().length;
                return (
                  <>
                    {leadingCount > 0 && (
                      <span className="text-sky-500/25 select-none">
                        {sStr.slice(0, leadingCount)}
                      </span>
                    )}
                    <span className="text-white glow-blue">
                      {sStr.slice(leadingCount)}
                    </span>
                  </>
                );
              })()}
            </div>
            <div className="flex flex-col items-start font-mono">
              <span className="text-xs font-bold text-sky-400 tracking-wider">KM/H</span>
              <span className="text-xs font-bold text-amber-400">
                GEAR {gear === -1 ? 'R' : gear}
              </span>
            </div>
          </div>

          {/* RPM Tachometer Sweeper Bar */}
          <div className="w-56 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-neutral-400">
              <span>RPM</span>
              <span>{rpm}</span>
            </div>
            <div className="h-2 w-full bg-neutral-800 rounded-sm overflow-hidden flex">
              <div
                className={`h-full transition-all duration-75 ${
                  rpm > 7600 ? 'bg-red-500 animate-pulse' : 'bg-sky-400'
                }`}
                style={{ width: `${Math.min(100, (rpm / 8500) * 100)}%` }}
              />
            </div>
          </div>

          {/* Nitro Energy Bar */}
          <div className="w-56 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <div className="flex items-center space-x-1 text-amber-400">
                <Zap className="w-3 h-3 fill-current" />
                <span>NITRO BOOST</span>
              </div>
              <span className="text-white font-bold">{nitroPercent}%</span>
            </div>
            <div className="h-2 w-full bg-neutral-800 rounded-sm overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-75 box-glow-orange"
                style={{ width: `${nitroPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dev FPS Counter */}
      {saveData.settings.showFps && (
        <div className="absolute top-2 right-2 text-[10px] font-mono text-neutral-500">
          60 FPS // RAPIER 3D
        </div>
      )}
    </div>
  );
};
