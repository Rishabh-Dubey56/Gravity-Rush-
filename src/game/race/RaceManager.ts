import * as THREE from 'three';
import { LapSystem } from './LapSystem';
import { RankingSystem, RacerProgress } from './RankingSystem';
import { CheckpointSystem } from '../tracks/CheckpointSystem';
import { AIController } from '../ai/AIController';
import { AudioManager } from '../../audio/AudioManager';
import { VoiceAnnouncer } from '../../audio/VoiceAnnouncer';

export interface RaceManagerCallbacks {
  onCountdownUpdate: (countdown: number | null) => void;
  onPositionUpdate: (position: number) => void;
  onLapUpdate: (lap: number, totalLaps: number, currentLapTime: number, bestLapTime: number | null) => void;
  onRaceFinished: (position: number, totalTime: number, lapTimes: number[]) => void;
}

export class RaceManager {
  public lapSystem: LapSystem;
  public checkpointSystem: CheckpointSystem;
  private callbacks: RaceManagerCallbacks;

  public countdownTimer: number = 3.6; // 3, 2, 1, GO
  public isCountdownActive: boolean = true;
  public raceTimer: number = 0;
  public isRaceFinished: boolean = false;
  private currentCountdownStep: number = 3;
  private prevPositionRank: number = 4;

  constructor(
    checkpointSystem: CheckpointSystem,
    totalLaps: number,
    callbacks: RaceManagerCallbacks
  ) {
    this.checkpointSystem = checkpointSystem;
    this.lapSystem = new LapSystem(totalLaps);
    this.callbacks = callbacks;
  }

  public reset(totalLaps: number = 3) {
    this.checkpointSystem.reset();
    this.lapSystem.reset(totalLaps);
    this.countdownTimer = 3.6;
    this.isCountdownActive = true;
    this.raceTimer = 0;
    this.isRaceFinished = false;
    this.currentCountdownStep = 3;
    this.callbacks.onCountdownUpdate(3);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    prevPlayerPos: THREE.Vector3,
    aiControllers: AIController[]
  ) {
    // 1. Handle Countdown Sequence
    if (this.isCountdownActive) {
      this.countdownTimer -= dt;

      let step = 3;
      if (this.countdownTimer > 2.0) {
        step = 3;
      } else if (this.countdownTimer > 1.0) {
        step = 2;
      } else if (this.countdownTimer > 0.0) {
        step = 1;
      } else if (this.countdownTimer > -0.85) {
        step = 0; // "GO!"
      } else {
        step = -1; // Racing (overlay cleared)
      }

      if (step !== this.currentCountdownStep) {
        this.currentCountdownStep = step;
        if (step >= 1) {
          AudioManager.playCountdown(false);
          VoiceAnnouncer.announceCountdown(step);
          this.callbacks.onCountdownUpdate(step);
        } else if (step === 0) {
          AudioManager.playCountdown(true);
          VoiceAnnouncer.announceCountdown(0);
          this.callbacks.onCountdownUpdate(0);
          AudioManager.startMusic();
        } else if (step === -1) {
          this.isCountdownActive = false;
          this.callbacks.onCountdownUpdate(null);
        }
      }

      // Hold race simulation & timer during 3, 2, 1
      if (this.countdownTimer > 0) {
        return;
      }
    }

    if (this.isRaceFinished) return;

    // 2. Race Timer & Lap Timer
    this.raceTimer += dt;
    this.lapSystem.update(dt);

    // 3. Player Checkpoint & Lap Validation
    const cpResult = this.checkpointSystem.checkPlayerProgress(
      prevPlayerPos,
      playerPos,
      this.raceTimer
    );

    if (cpResult.lapCompleted && cpResult.lapTime !== null) {
      const lapStatus = this.lapSystem.completeLap(cpResult.lapTime);
      if (this.lapSystem.currentLap === this.lapSystem.totalLaps && !lapStatus.isRaceFinished) {
        VoiceAnnouncer.announceFinalLap();
      }
      if (lapStatus.isRaceFinished) {
        this.isRaceFinished = true;
      }
    }

    // 4. Update AI Checkpoint Tracking
    const cpPositions = this.checkpointSystem.checkpoints.map((c) => c.position);
    for (const ai of aiControllers) {
      ai.updateCheckpointTracking(cpPositions, this.lapSystem.totalLaps, this.raceTimer);
    }

    // 5. Calculate Real-Time Positions (1st to 4th)
    const nextCp = this.checkpointSystem.getNextCheckpoint();
    const playerDistToNext = nextCp ? playerPos.distanceTo(nextCp.position) : 0;

    const racers: RacerProgress[] = [
      {
        id: 'player',
        name: 'PLAYER',
        isPlayer: true,
        lap: this.lapSystem.currentLap,
        checkpointIndex: this.checkpointSystem.getCurrentCheckpoint()?.index ?? 0,
        distanceToNextCheckpoint: playerDistToNext,
        isFinished: this.isRaceFinished,
        finishTime: this.isRaceFinished ? this.raceTimer : null,
        position: 1,
      },
      ...aiControllers.map((ai) => ({
        id: ai.personality.name,
        name: ai.personality.name,
        isPlayer: false,
        lap: ai.currentLap,
        checkpointIndex: ai.currentCheckpoint,
        distanceToNextCheckpoint: ai.distanceToNextCheckpoint,
        isFinished: ai.raceFinished,
        finishTime: ai.finishTime,
        position: 2,
      })),
    ];

    const ranked = RankingSystem.calculateRanks(racers);
    const playerRacer = ranked.find((r) => r.isPlayer);
    const playerPosRank = playerRacer?.position ?? 1;

    // Trigger overtake / position voice feedback
    if (playerPosRank !== this.prevPositionRank) {
      VoiceAnnouncer.announcePositionChange(playerPosRank, this.prevPositionRank);
      this.prevPositionRank = playerPosRank;
    }

    this.callbacks.onPositionUpdate(playerPosRank);
    this.callbacks.onLapUpdate(
      this.lapSystem.currentLap,
      this.lapSystem.totalLaps,
      this.lapSystem.currentLapTime,
      this.lapSystem.bestLapTime
    );

    // If finished on this step, fire finish callback and announce victory/defeat!
    if (this.isRaceFinished && this.checkpointSystem.getPlayerLaps() >= this.lapSystem.totalLaps) {
      if (playerPosRank === 1) {
        VoiceAnnouncer.announceVictory();
      } else if (playerPosRank <= 3) {
        VoiceAnnouncer.announcePodium(playerPosRank);
      } else {
        VoiceAnnouncer.announceDefeat();
      }

      this.callbacks.onRaceFinished(
        playerPosRank,
        this.raceTimer,
        this.lapSystem.lapHistory
      );
    }
  }
}
