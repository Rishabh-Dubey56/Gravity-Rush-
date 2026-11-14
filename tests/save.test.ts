import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem, DEFAULT_SAVE_DATA } from '../src/systems/SaveSystem';

describe('Save System & Storage Resilience', () => {
  beforeEach(() => {
    SaveSystem.clearStorage();
  });

  it('loads default save data when localStorage is empty', () => {
    const data = SaveSystem.load();
    expect(data.schemaVersion).toBe(1);
    expect(data.selectedVehicleId).toBe('velocity-x');
    expect(data.trackRecords['neon-metropolis'].unlocked).toBe(true);
    expect(data.trackRecords['inferno-circuit'].unlocked).toBe(false);
  });

  it('safely handles corrupted data and resets to defaults without throwing', () => {
    // Save corrupted invalid state
    SaveSystem.save({ invalid: true } as any);
    const data = SaveSystem.load();
    expect(data).toBeDefined();
    expect(data.schemaVersion).toBe(1);
    expect(data.selectedVehicleId).toBe('velocity-x');
  });

  it('updates track records, awards credits, and unlocks next track on podium finish', () => {
    SaveSystem.load();
    // Finish 2nd on Neon Metropolis with 48.5s lap
    const updated = SaveSystem.updateRecord('neon-metropolis', 48.5, 145.2, 2);

    expect(updated.trackRecords['neon-metropolis'].bestLapTime).toBe(48.5);
    expect(updated.trackRecords['neon-metropolis'].bestPosition).toBe(2);
    expect(updated.trackRecords['neon-metropolis'].completedRaces).toBe(1);

    // Next track (Inferno Circuit) should now be unlocked!
    expect(updated.trackRecords['inferno-circuit'].unlocked).toBe(true);

    // Credits should be awarded (+300 for 2nd)
    expect(updated.credits).toBe(DEFAULT_SAVE_DATA.credits + 300);
  });
});
