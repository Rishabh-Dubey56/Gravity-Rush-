import React from 'react';
import { useGameStore } from '../store/gameStore';
import { ArrowLeft, Volume2, Monitor, Eye, RefreshCw } from 'lucide-react';
import { AudioManager } from '../audio/AudioManager';
import { SaveSystem } from '../systems/SaveSystem';

export const Settings: React.FC = () => {
  const { setScreen, saveData, updateSettings } = useGameStore();
  const { settings } = saveData;

  const handleVolumeChange = (type: 'master' | 'music' | 'sfx', value: number) => {
    const updated = {
      ...settings,
      [`${type}Volume`]: value,
    };
    updateSettings(updated);
    AudioManager.setVolumes(updated.masterVolume, updated.sfxVolume, updated.musicVolume);
  };

  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    AudioManager.playCheckpoint();
    updateSettings({ graphicsQuality: quality });
  };

  const handleResetSave = () => {
    if (window.confirm('Reset all progress, records and customizations? This cannot be undone.')) {
      SaveSystem.reset();
      window.location.reload();
    }
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
              SYSTEM <span className="text-sky-400">SETTINGS</span>
            </h1>
            <p className="text-xs font-mono text-neutral-400">
              AUDIO, RENDERING GRAPHICS AND TELEMETRY CONFIGURATION
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 my-auto max-w-4xl w-full mx-auto">
        {/* Audio Settings */}
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-5">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Volume2 className="w-4 h-4" />
            <span>AUDIO SYSTEM</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1.5 text-neutral-300">
                <span>MASTER VOLUME</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('master', parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 text-neutral-300">
                <span>SYNTH MUSIC VOLUME</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('music', parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 text-neutral-300">
                <span>SFX & ENGINE VOLUME</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Graphics & Performance Settings */}
        <div className="cyber-panel p-6 bg-neutral-900/80 space-y-5">
          <div className="flex items-center space-x-2 text-sm font-display font-bold text-sky-400">
            <Monitor className="w-4 h-4" />
            <span>GRAPHICS QUALITY</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <span className="text-neutral-400 block mb-2">QUALITY PRESET:</span>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQualityChange(q)}
                    className={`py-2 rounded uppercase font-bold transition-all ${
                      settings.graphicsQuality === q
                        ? 'bg-sky-500 text-neutral-950 box-glow-blue'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">SHOW FPS MONITOR</span>
                <input
                  type="checkbox"
                  checked={settings.showFps}
                  onChange={(e) => updateSettings({ showFps: e.target.checked })}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">SHOW GPS MINI-MAP</span>
                <input
                  type="checkbox"
                  checked={settings.showMiniMap}
                  onChange={(e) => updateSettings({ showMiniMap: e.target.checked })}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-neutral-300">SPEED FOV WARP EFFECT</span>
                <input
                  type="checkbox"
                  checked={settings.cameraFovBoost}
                  onChange={(e) => updateSettings({ cameraFovBoost: e.target.checked })}
                  className="w-4 h-4 accent-sky-400 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Reset Data */}
      <div className="flex justify-between items-center z-10 text-xs font-mono text-neutral-400 max-w-4xl w-full mx-auto">
        <button
          onClick={handleResetSave}
          className="flex items-center space-x-1.5 text-red-400 hover:text-red-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESET ALL SAVE DATA</span>
        </button>
        <div>GRAVITY RUSH CONFIGURATION MATRIX</div>
      </div>
    </div>
  );
};
