import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CheckpointSystem, CheckpointNode } from '../src/game/tracks/CheckpointSystem';
import { LapSystem } from '../src/game/race/LapSystem';
import { RankingSystem, RacerProgress } from '../src/game/race/RankingSystem';
import { VEHICLE_PRESETS } from '../src/store/gameStore';
import { getNeonMetropolisData } from '../src/game/tracks/tracks/NeonMetropolis';
import { getInfernoCircuitData } from '../src/game/tracks/tracks/InfernoCircuit';
import { getFrostbiteData } from '../src/game/tracks/tracks/Frostbite';
import { getOrbitalZeroData } from '../src/game/tracks/tracks/OrbitalZero';
import { getSingularityData } from '../src/game/tracks/tracks/Singularity';
import { CoinSystem } from '../src/game/pickups/CoinSystem';

describe('Race Mechanics, Checkpoints & Progression', () => {
  const dummyCheckpoints: CheckpointNode[] = [
    {
      index: 0,
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 0, 1),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      width: 20,
      isFinishLine: true,
    },
    {
      index: 1,
      position: new THREE.Vector3(0, 0, 100),
      direction: new THREE.Vector3(0, 0, 1),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      width: 20,
      isFinishLine: false,
    },
    {
      index: 2,
      position: new THREE.Vector3(100, 0, 100),
      direction: new THREE.Vector3(1, 0, 0),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      width: 20,
      isFinishLine: false,
    },
  ];

  it('validates sequential checkpoint passage and prevents skipping', () => {
    const cpSys = new CheckpointSystem(dummyCheckpoints, 3);
    expect(cpSys.getCurrentCheckpoint()?.index).toBe(0);

    // Skip directly to checkpoint 2 (should be rejected because checkpoint 1 has not been cleared)
    const skipRes = cpSys.checkPlayerProgress(
      new THREE.Vector3(90, 0, 100),
      new THREE.Vector3(110, 0, 100),
      5.0
    );
    expect(skipRes.passedCheckpoint).toBe(false);
    expect(cpSys.getCurrentCheckpoint()?.index).toBe(0);

    // Cross checkpoint 1 properly
    const cp1Res = cpSys.checkPlayerProgress(
      new THREE.Vector3(0, 0, 95),
      new THREE.Vector3(0, 0, 105),
      3.2
    );
    expect(cp1Res.passedCheckpoint).toBe(true);
    expect(cpSys.getCurrentCheckpoint()?.index).toBe(1);

    // Cross checkpoint 2 properly
    const cp2Res = cpSys.checkPlayerProgress(
      new THREE.Vector3(95, 0, 100),
      new THREE.Vector3(105, 0, 100),
      6.8
    );
    expect(cp2Res.passedCheckpoint).toBe(true);
    expect(cpSys.getCurrentCheckpoint()?.index).toBe(2);

    // Cross finish line (checkpoint 0) -> Lap 1 Complete!
    const finishRes = cpSys.checkPlayerProgress(
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, 5),
      12.4
    );
    expect(finishRes.lapCompleted).toBe(true);
    expect(cpSys.getPlayerLaps()).toBe(1);
  });

  it('LapSystem properly records best lap times and signals race finish', () => {
    const lapSys = new LapSystem(2);
    expect(lapSys.currentLap).toBe(1);

    const lap1 = lapSys.completeLap(45.2);
    expect(lap1.isRaceFinished).toBe(false);
    expect(lap1.isNewBest).toBe(true);
    expect(lapSys.bestLapTime).toBe(45.2);
    expect(lapSys.currentLap).toBe(2);

    const lap2 = lapSys.completeLap(42.8);
    expect(lap2.isRaceFinished).toBe(true);
    expect(lap2.isNewBest).toBe(true);
    expect(lapSys.bestLapTime).toBe(42.8);
  });

  it('RankingSystem correctly ranks multi-agent positions', () => {
    const racers: RacerProgress[] = [
      {
        id: 'player',
        name: 'PLAYER',
        isPlayer: true,
        lap: 2,
        checkpointIndex: 4,
        distanceToNextCheckpoint: 30,
        isFinished: false,
        finishTime: null,
        position: 0,
      },
      {
        id: 'speedster',
        name: 'SPEEDSTER',
        isPlayer: false,
        lap: 2,
        checkpointIndex: 5, // ahead by checkpoint
        distanceToNextCheckpoint: 50,
        isFinished: false,
        finishTime: null,
        position: 0,
      },
      {
        id: 'technician',
        name: 'TECHNICIAN',
        isPlayer: false,
        lap: 2,
        checkpointIndex: 4,
        distanceToNextCheckpoint: 15, // ahead of player by proximity to checkpoint 5
        isFinished: false,
        finishTime: null,
        position: 0,
      },
      {
        id: 'challenger',
        name: 'CHALLENGER',
        isPlayer: false,
        lap: 1, // behind by lap
        checkpointIndex: 7,
        distanceToNextCheckpoint: 10,
        isFinished: false,
        finishTime: null,
        position: 0,
      },
    ];

    const ranked = RankingSystem.calculateRanks(racers);

    expect(ranked[0].name).toBe('SPEEDSTER'); // 1st
    expect(ranked[1].name).toBe('TECHNICIAN'); // 2nd
    expect(ranked[2].name).toBe('PLAYER');     // 3rd
    expect(ranked[3].name).toBe('CHALLENGER'); // 4th

    expect(ranked[0].position).toBe(1);
    expect(ranked[1].position).toBe(2);
    expect(ranked[2].position).toBe(3);
    expect(ranked[3].position).toBe(4);
  });

  it('verifies vehicle presets configurations', () => {
    const v1 = VEHICLE_PRESETS['velocity-x'];
    const v2 = VEHICLE_PRESETS['phantom-gt'];
    const v3 = VEHICLE_PRESETS['titan-r'];

    expect(v1.topSpeed).toBeLessThan(v2.topSpeed); // Phantom GT is fastest
    expect(v3.mass).toBeGreaterThan(v1.mass);      // Titan R is heaviest
    expect(v3.handling).toBeGreaterThan(v2.handling); // Titan R handles better than high-speed Phantom
  });

  it('verifies all 5 track definitions have valid checkpoints and gravity zones', () => {
    const tracks = [
      getNeonMetropolisData(),
      getInfernoCircuitData(),
      getFrostbiteData(),
      getOrbitalZeroData(),
      getSingularityData(),
    ];

    expect(tracks.length).toBe(5);

    tracks.forEach((t) => {
      expect(t.splinePoints.length).toBeGreaterThan(50);
      expect(t.checkpoints.length).toBeGreaterThanOrEqual(6);
      expect(t.checkpoints[0].isFinishLine).toBe(true);
      expect(t.spawnPositions.length).toBe(4); // 4 racers grid
      expect(t.gravityZones.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('validates CoinSystem generates track pickups and handles player collection', () => {
    const neonData = getNeonMetropolisData();
    const coinSys = new CoinSystem(neonData.splinePoints);

    expect(coinSys.coins.length).toBeGreaterThan(15);
    const firstCoin = coinSys.coins[0];
    expect(firstCoin.collected).toBe(false);

    let collectedTotal = 0;
    // Step on first coin
    const res = coinSys.checkPickups(firstCoin.position, (total: number, amount: number) => {
      collectedTotal = total;
    });

    expect(res.collectedCount).toBeGreaterThanOrEqual(1);
    expect(firstCoin.collected).toBe(true);
    expect(collectedTotal).toBeGreaterThanOrEqual(1);

    // Respawn for new lap
    coinSys.respawnForLap();
    expect(firstCoin.collected).toBe(false);
  });
});
