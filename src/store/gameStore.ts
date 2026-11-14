import { create } from 'zustand';
import { SaveSystem, SaveData, VehicleCustomization, PlayerSettings, DEFAULT_SAVE_DATA } from '../systems/SaveSystem';

export type { VehicleCustomization, PlayerSettings };

export type GameScreen =
  | 'intro'
  | 'main_menu'
  | 'career'
  | 'quick_race'
  | 'garage'
  | 'track_select'
  | 'racing'
  | 'paused'
  | 'results'
  | 'settings'
  | 'how_to_play'
  | 'credits';

export type VehicleId = 'velocity-x' | 'phantom-gt' | 'titan-r';
export type TrackId = 'neon-metropolis' | 'inferno-circuit' | 'frostbite' | 'orbital-zero' | 'singularity';

export interface VehicleConfig {
  id: VehicleId;
  name: string;
  tagline: string;
  description: string;
  topSpeed: number; // km/h
  acceleration: number; // 0-100 scale
  handling: number; // 0-100 scale
  braking: number; // 0-100 scale
  mass: number; // kg
  suspensionStiffness: number;
  nitroCapacity: number; // seconds
  nitroRechargeRate: number; // %/sec
}

export const VEHICLE_PRESETS: Record<VehicleId, VehicleConfig> = {
  'velocity-x': {
    id: 'velocity-x',
    name: 'VELOCITY X',
    tagline: 'Balanced Anti-Grav Hybrid',
    description: 'Perfect balance of high cornering grip, responsive handling and linear acceleration.',
    topSpeed: 295,
    acceleration: 82,
    handling: 86,
    braking: 80,
    mass: 950,
    suspensionStiffness: 65,
    nitroCapacity: 8,
    nitroRechargeRate: 12,
  },
  'phantom-gt': {
    id: 'phantom-gt',
    name: 'PHANTOM GT',
    tagline: 'Maximum Velocity Interceptor',
    description: 'Hyper-streamlined titanium alloy chassis built for extreme straight-line speed and high-G loops.',
    topSpeed: 345,
    acceleration: 94,
    handling: 74,
    braking: 72,
    mass: 860,
    suspensionStiffness: 75,
    nitroCapacity: 10,
    nitroRechargeRate: 15,
  },
  'titan-r': {
    id: 'titan-r',
    name: 'TITAN R',
    tagline: 'Heavy Gravity Anchor',
    description: 'Reinforced magnetic chassis with massive downforce, rock-solid wall adhesion and supreme collision resistance.',
    topSpeed: 270,
    acceleration: 75,
    handling: 95,
    braking: 92,
    mass: 1280,
    suspensionStiffness: 90,
    nitroCapacity: 7,
    nitroRechargeRate: 10,
  },
};

export interface TrackMetadata {
  id: TrackId;
  name: string;
  subtitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Championship';
  laps: number;
  lengthMeters: number;
  gravityFeatures: string[];
  description: string;
  accentColor: string;
}

export const TRACK_METADATA: Record<TrackId, TrackMetadata> = {
  'neon-metropolis': {
    id: 'neon-metropolis',
    name: 'NEON METROPOLIS',
    subtitle: 'Cyberpunk Skyline Highway',
    difficulty: 'Beginner',
    laps: 3,
    lengthMeters: 1850,
    gravityFeatures: ['Elevated Skyways', '90° Wall Banking', 'Tunnel Transitions'],
    description: 'Race above towering skyscrapers with vibrant neon signage, wide multi-lane highways and smooth wall-riding sections.',
    accentColor: '#38BDF8',
  },
  'inferno-circuit': {
    id: 'inferno-circuit',
    name: 'INFERNO CIRCUIT',
    subtitle: 'Geothermal Reactor Core',
    difficulty: 'Intermediate',
    laps: 3,
    lengthMeters: 2100,
    gravityFeatures: ['360° Vertical Loop', 'Heated Grate Bridges', 'Inverted Ceiling Climb'],
    description: 'An industrial energy complex with molten conduits, massive cooling towers, and a full vertical gravitational loop.',
    accentColor: '#F59E0B',
  },
  'frostbite': {
    id: 'frostbite',
    name: 'FROSTBITE',
    subtitle: 'Glacial Research Facility',
    difficulty: 'Advanced',
    laps: 3,
    lengthMeters: 2350,
    gravityFeatures: ['Low Friction Glacial Curves', 'Perpendicular Cliff Driving', 'Sub-Zero Caverns'],
    description: 'A frozen mountain track with slippery ice surfaces, steep cliffside ascents and narrow cavern tunnels.',
    accentColor: '#67E8F9',
  },
  'orbital-zero': {
    id: 'orbital-zero',
    name: 'ORBITAL ZERO',
    subtitle: 'Deep Orbit Space Station',
    difficulty: 'Expert',
    laps: 3,
    lengthMeters: 2600,
    gravityFeatures: ['Zero-G Vacuum Gaps', 'Floating Mag-Lev Platforms', 'Inertial Thrusters'],
    description: 'Float between station modules in zero gravity vacuum, utilizing micro-thrusters and magnetic catch rings.',
    accentColor: '#A855F7',
  },
  'singularity': {
    id: 'singularity',
    name: 'SINGULARITY',
    subtitle: 'Tachyon Particle Megastructure',
    difficulty: 'Championship',
    laps: 3,
    lengthMeters: 2950,
    gravityFeatures: ['Full 360° Inverted Ceiling', 'Dynamic Gravity Shifts', 'Event Horizon S-Curves'],
    description: 'The ultimate proving grounds featuring continuous floor-to-wall-to-ceiling transitions around an active singularity core.',
    accentColor: '#EC4899',
  },
};

export interface RaceTelemetry {
  speedKmh: number;
  rpm: number;
  gear: number;
  nitroPercent: number;
  gravityVector: [number, number, number];
  gravityZoneName: string;
  isGrounded: boolean;
  isZeroG: boolean;
  slipAngle: number;
}

export interface RaceState {
  currentLap: number;
  totalLaps: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  position: number; // 1 to 4
  totalRacers: number;
  raceTimer: number; // elapsed seconds
  lapStartTime: number;
  currentLapTime: number;
  bestLapTime: number | null;
  countdown: number | null; // 3, 2, 1, 0 (GO), null (racing)
  isFinished: boolean;
  finalPosition: number | null;
  finalTime: number | null;
  lapTimes: number[];
  raceWarning: string | null;
  coinsCollected: number;
}

export interface FloatingPopup {
  id: string;
  text: string;
  color: string;
  timestamp: number;
}

export interface RadioCommsData {
  speaker: string;
  callsign: string;
  message: string;
  active: boolean;
  timestamp: number;
}

export interface GameStoreState {
  // Screen state
  currentScreen: GameScreen;
  previousScreen: GameScreen;
  setScreen: (screen: GameScreen) => void;

  // Race session lifecycle key
  raceSessionId: number;

  // Save data
  saveData: SaveData;
  updateSettings: (settings: Partial<PlayerSettings>) => void;
  updateCustomization: (vehicleId: VehicleId, customization: Partial<VehicleCustomization>) => void;
  selectVehicle: (vehicleId: VehicleId) => void;
  selectTrack: (trackId: TrackId) => void;
  gameMode: 'career' | 'quick_race';
  setGameMode: (mode: 'career' | 'quick_race') => void;

  // Selected track & vehicle
  selectedVehicleId: VehicleId;
  selectedTrackId: TrackId;

  // Active race live state
  raceState: RaceState;
  telemetry: RaceTelemetry;
  radioComms: RadioCommsData | null;
  floatingPopups: FloatingPopup[];

  setTelemetry: (telemetry: Partial<RaceTelemetry>) => void;
  setRaceState: (state: Partial<RaceState>) => void;
  collectCoin: (coinsEarned: number, nitroBonus: number) => void;
  addFloatingPopup: (text: string, color?: string) => void;
  setRadioComms: (comms: RadioCommsData | null) => void;
  startRace: (trackId?: TrackId, vehicleId?: VehicleId, customLaps?: number) => void;
  finishRace: (finalPosition: number, finalTime: number, lapTimes: number[]) => void;
  resetRace: () => void;
  pauseRace: () => void;
  resumeRace: () => void;

  // Development / debug
  fps: number;
  setFps: (fps: number) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const initialSave = SaveSystem.load();

  const initialRaceState: RaceState = {
    currentLap: 1,
    totalLaps: 3,
    currentCheckpoint: 0,
    totalCheckpoints: 12,
    position: 4,
    totalRacers: 4,
    raceTimer: 0,
    lapStartTime: 0,
    currentLapTime: 0,
    bestLapTime: null,
    countdown: 3,
    isFinished: false,
    finalPosition: null,
    finalTime: null,
    lapTimes: [],
    raceWarning: null,
    coinsCollected: 0,
  };

  const initialTelemetry: RaceTelemetry = {
    speedKmh: 0,
    rpm: 1000,
    gear: 1,
    nitroPercent: 100,
    gravityVector: [0, -1, 0],
    gravityZoneName: 'Normal Ground',
    isGrounded: true,
    isZeroG: false,
    slipAngle: 0,
  };

  return {
    currentScreen: 'intro',
    previousScreen: 'intro',
    setScreen: (screen) =>
      set((state) => ({
        previousScreen: state.currentScreen,
        currentScreen: screen,
      })),

    raceSessionId: 1,

    saveData: initialSave,
    selectedVehicleId: initialSave.selectedVehicleId,
    selectedTrackId: 'neon-metropolis',
    gameMode: 'career',
    setGameMode: (mode) => set({ gameMode: mode }),

    updateSettings: (newSettings) => {
      set((state) => {
        const updated = {
          ...state.saveData,
          settings: { ...state.saveData.settings, ...newSettings },
        };
        SaveSystem.save(updated);
        return { saveData: updated };
      });
    },

    updateCustomization: (vehicleId, customization) => {
      set((state) => {
        const currentCust =
          state.saveData.vehicleCustomizations[vehicleId] ||
          DEFAULT_SAVE_DATA.vehicleCustomizations[vehicleId];
        const updatedCust = { ...currentCust, ...customization };
        const updated = {
          ...state.saveData,
          vehicleCustomizations: {
            ...state.saveData.vehicleCustomizations,
            [vehicleId]: updatedCust,
          },
        };
        SaveSystem.save(updated);
        return { saveData: updated };
      });
    },

    selectVehicle: (vehicleId) => {
      set((state) => {
        const updated = {
          ...state.saveData,
          selectedVehicleId: vehicleId,
        };
        SaveSystem.save(updated);
        return { selectedVehicleId: vehicleId, saveData: updated };
      });
    },

    selectTrack: (trackId) => set({ selectedTrackId: trackId }),

    raceState: initialRaceState,
    telemetry: initialTelemetry,
    radioComms: null,
    floatingPopups: [],

    setTelemetry: (telem) =>
      set((state) => ({
        telemetry: { ...state.telemetry, ...telem },
      })),

    setRaceState: (patch) =>
      set((state) => ({
        raceState: { ...state.raceState, ...patch },
      })),

    collectCoin: (coinsEarned, nitroBonus) => {
      set((state) => {
        const newCoins = state.raceState.coinsCollected + 1;
        const updatedCredits = state.saveData.credits + coinsEarned;
        const updatedSave = {
          ...state.saveData,
          credits: updatedCredits,
        };
        SaveSystem.save(updatedSave);

        const popup: FloatingPopup = {
          id: `popup-${Date.now()}-${Math.random()}`,
          text: `+${coinsEarned} CR // +${nitroBonus}% NITRO`,
          color: '#F59E0B',
          timestamp: Date.now(),
        };

        return {
          saveData: updatedSave,
          floatingPopups: [...state.floatingPopups.slice(-3), popup],
          raceState: {
            ...state.raceState,
            coinsCollected: newCoins,
          },
        };
      });
    },

    addFloatingPopup: (text, color = '#38BDF8') => {
      set((state) => ({
        floatingPopups: [
          ...state.floatingPopups.slice(-3),
          { id: `popup-${Date.now()}-${Math.random()}`, text, color, timestamp: Date.now() },
        ],
      }));
    },

    setRadioComms: (comms) => set({ radioComms: comms }),

    startRace: (trackId, vehicleId, customLaps) => {
      const activeTrack = trackId || get().selectedTrackId;
      const activeVehicle = vehicleId || get().selectedVehicleId;
      const trackMeta = TRACK_METADATA[activeTrack];

      set((state) => ({
        raceSessionId: state.raceSessionId + 1,
        selectedTrackId: activeTrack,
        selectedVehicleId: activeVehicle,
        currentScreen: 'racing',
        raceState: {
          ...initialRaceState,
          totalLaps: customLaps || (trackMeta ? trackMeta.laps : 3),
          countdown: 3,
          raceTimer: 0,
          isFinished: false,
        },
        telemetry: initialTelemetry,
      }));
    },

    finishRace: (finalPosition, finalTime, lapTimes) => {
      const { selectedTrackId } = get();
      const bestLap = lapTimes.length > 0 ? Math.min(...lapTimes) : finalTime;
      const positionPrize = finalPosition === 1 ? 1500 : finalPosition === 2 ? 800 : finalPosition === 3 ? 400 : 150;
      const updatedSave = SaveSystem.updateRecord(selectedTrackId, bestLap, finalTime, finalPosition);
      updatedSave.credits += positionPrize;
      SaveSystem.save(updatedSave);

      set((state) => ({
        saveData: updatedSave,
        raceState: {
          ...state.raceState,
          isFinished: true,
          finalPosition,
          finalTime,
          lapTimes,
        },
        currentScreen: 'results',
      }));
    },

    resetRace: () => {
      const { selectedTrackId } = get();
      const trackMeta = TRACK_METADATA[selectedTrackId];
      set((state) => ({
        raceSessionId: state.raceSessionId + 1,
        raceState: {
          ...initialRaceState,
          totalLaps: trackMeta ? trackMeta.laps : 3,
          countdown: 3,
          raceTimer: 0,
          isFinished: false,
        },
        telemetry: initialTelemetry,
        currentScreen: 'racing',
      }));
    },

    pauseRace: () => {
      set({ currentScreen: 'paused' });
    },

    resumeRace: () => {
      set({ currentScreen: 'racing' });
    },

    fps: 60,
    setFps: (fps) => set({ fps }),
  };
});
