/**
 * GRAVITY RUSH - Persistent Save System
 * Handles localStorage persistence with schema versioning and corruption recovery.
 */

export interface VehicleCustomization {
  bodyColor: string;
  wheelColor: string;
  nitroColor: string;
  performancePreset: 'standard' | 'overclocked' | 'drift' | 'downforce';
}

export interface TrackRecord {
  unlocked: boolean;
  bestLapTime: number | null; // in seconds
  bestTotalTime: number | null; // in seconds
  completedRaces: number;
  bestPosition: number | null; // 1, 2, 3, etc.
}

export interface PlayerSettings {
  masterVolume: number; // 0 to 1
  musicVolume: number; // 0 to 1
  sfxVolume: number; // 0 to 1
  graphicsQuality: 'low' | 'medium' | 'high';
  showFps: boolean;
  showMiniMap: boolean;
  cameraFovBoost: boolean;
}

export interface SaveData {
  schemaVersion: number;
  credits: number;
  selectedVehicleId: 'velocity-x' | 'phantom-gt' | 'titan-r';
  unlockedVehicles: string[];
  vehicleCustomizations: Record<string, VehicleCustomization>;
  trackRecords: Record<string, TrackRecord>;
  settings: PlayerSettings;
  createdAt: number;
  lastPlayedAt: number;
}

const STORAGE_KEY = 'gravity_rush_save_v1';
const CURRENT_SCHEMA_VERSION = 1;

export const DEFAULT_CUSTOMIZATION: VehicleCustomization = {
  bodyColor: '#38BDF8', // Electric Blue
  wheelColor: '#F59E0B', // Turbo Orange
  nitroColor: '#38BDF8', // Cyan boost
  performancePreset: 'standard',
};

export const DEFAULT_TRACK_RECORDS: Record<string, TrackRecord> = {
  'neon-metropolis': {
    unlocked: true,
    bestLapTime: null,
    bestTotalTime: null,
    completedRaces: 0,
    bestPosition: null,
  },
  'inferno-circuit': {
    unlocked: false,
    bestLapTime: null,
    bestTotalTime: null,
    completedRaces: 0,
    bestPosition: null,
  },
  'frostbite': {
    unlocked: false,
    bestLapTime: null,
    bestTotalTime: null,
    completedRaces: 0,
    bestPosition: null,
  },
  'orbital-zero': {
    unlocked: false,
    bestLapTime: null,
    bestTotalTime: null,
    completedRaces: 0,
    bestPosition: null,
  },
  'singularity': {
    unlocked: false,
    bestLapTime: null,
    bestTotalTime: null,
    completedRaces: 0,
    bestPosition: null,
  },
};

export const DEFAULT_SAVE_DATA: SaveData = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  credits: 500,
  selectedVehicleId: 'velocity-x',
  unlockedVehicles: ['velocity-x', 'phantom-gt', 'titan-r'],
  vehicleCustomizations: {
    'velocity-x': {
      bodyColor: '#38BDF8',
      wheelColor: '#38BDF8',
      nitroColor: '#38BDF8',
      performancePreset: 'standard',
    },
    'phantom-gt': {
      bodyColor: '#F59E0B',
      wheelColor: '#F59E0B',
      nitroColor: '#F59E0B',
      performancePreset: 'overclocked',
    },
    'titan-r': {
      bodyColor: '#EF4444',
      wheelColor: '#E5E7EB',
      nitroColor: '#EF4444',
      performancePreset: 'downforce',
    },
  },
  trackRecords: DEFAULT_TRACK_RECORDS,
  settings: {
    masterVolume: 0.8,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    graphicsQuality: 'high',
    showFps: true,
    showMiniMap: true,
    cameraFovBoost: true,
  },
  createdAt: Date.now(),
  lastPlayedAt: Date.now(),
};

class MemoryStorage {
  private store: Record<string, string> = {};
  public getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  public setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  public removeItem(key: string): void {
    delete this.store[key];
  }
  public clear(): void {
    this.store = {};
  }
}

const memoryStorage = new MemoryStorage();

function getStorage(): { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; clear?(): void } {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {}
  return memoryStorage;
}

export class SaveSystem {
  public static load(): SaveData {
    try {
      const storage = getStorage();
      const serialized = storage.getItem(STORAGE_KEY);
      if (!serialized) {
        return this.save(DEFAULT_SAVE_DATA);
      }

      const parsed = JSON.parse(serialized) as Partial<SaveData>;
      if (!parsed || typeof parsed !== 'object' || parsed.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        console.warn('Save data invalid or outdated schema. Migrating to schema v1.');
        return this.migrateAndSave(parsed);
      }

      // Merge with defaults to ensure all fields exist
      const merged: SaveData = {
        ...DEFAULT_SAVE_DATA,
        ...parsed,
        vehicleCustomizations: {
          ...DEFAULT_SAVE_DATA.vehicleCustomizations,
          ...(parsed.vehicleCustomizations || {}),
        },
        trackRecords: {
          ...DEFAULT_SAVE_DATA.trackRecords,
          ...(parsed.trackRecords || {}),
        },
        settings: {
          ...DEFAULT_SAVE_DATA.settings,
          ...(parsed.settings || {}),
        },
        lastPlayedAt: Date.now(),
      };

      return merged;
    } catch (err) {
      console.error('Failed to load save data, resetting to defaults safely:', err);
      return this.save(DEFAULT_SAVE_DATA);
    }
  }

  public static save(data: SaveData): SaveData {
    try {
      const toSave = {
        ...data,
        lastPlayedAt: Date.now(),
      };
      getStorage().setItem(STORAGE_KEY, JSON.stringify(toSave));
      return toSave;
    } catch (err) {
      console.error('Failed to write save data to localStorage:', err);
      return data;
    }
  }

  public static updateRecord(
    trackId: string,
    lapTime: number,
    totalTime: number,
    position: number
  ): SaveData {
    const current = this.load();
    const existing = current.trackRecords[trackId] || {
      unlocked: true,
      bestLapTime: null,
      bestTotalTime: null,
      completedRaces: 0,
      bestPosition: null,
    };

    const newBestLap =
      existing.bestLapTime === null ? lapTime : Math.min(existing.bestLapTime, lapTime);
    const newBestTotal =
      existing.bestTotalTime === null ? totalTime : Math.min(existing.bestTotalTime, totalTime);
    const newBestPos =
      existing.bestPosition === null ? position : Math.min(existing.bestPosition, position);

    const updatedRecords = {
      ...current.trackRecords,
      [trackId]: {
        unlocked: true,
        bestLapTime: newBestLap,
        bestTotalTime: newBestTotal,
        completedRaces: existing.completedRaces + 1,
        bestPosition: newBestPos,
      },
    };

    // Unlock next track if podium finish (position <= 3)
    const trackOrder = [
      'neon-metropolis',
      'inferno-circuit',
      'frostbite',
      'orbital-zero',
      'singularity',
    ];
    const currentIndex = trackOrder.indexOf(trackId);
    if (position <= 3 && currentIndex !== -1 && currentIndex + 1 < trackOrder.length) {
      const nextTrack = trackOrder[currentIndex + 1];
      if (updatedRecords[nextTrack]) {
        updatedRecords[nextTrack] = {
          ...updatedRecords[nextTrack],
          unlocked: true,
        };
      }
    }

    // Award credits based on position
    let earnedCredits = 100;
    if (position === 1) earnedCredits = 500;
    else if (position === 2) earnedCredits = 300;
    else if (position === 3) earnedCredits = 200;

    const updatedData: SaveData = {
      ...current,
      credits: current.credits + earnedCredits,
      trackRecords: updatedRecords,
    };

    return this.save(updatedData);
  }

  private static migrateAndSave(outdated: Partial<SaveData>): SaveData {
    const migrated: SaveData = {
      ...DEFAULT_SAVE_DATA,
      ...outdated,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      vehicleCustomizations: {
        ...DEFAULT_SAVE_DATA.vehicleCustomizations,
        ...(outdated?.vehicleCustomizations || {}),
      },
      trackRecords: {
        ...DEFAULT_SAVE_DATA.trackRecords,
        ...(outdated?.trackRecords || {}),
      },
      settings: {
        ...DEFAULT_SAVE_DATA.settings,
        ...(outdated?.settings || {}),
      },
      lastPlayedAt: Date.now(),
    };
    return this.save(migrated);
  }

  public static reset(): SaveData {
    getStorage().removeItem(STORAGE_KEY);
    return this.save(DEFAULT_SAVE_DATA);
  }

  public static clearStorage(): void {
    getStorage().removeItem(STORAGE_KEY);
  }
}
