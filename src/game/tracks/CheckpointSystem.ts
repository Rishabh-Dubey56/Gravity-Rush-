import * as THREE from 'three';
import { AudioManager } from '../../audio/AudioManager';

export interface CheckpointNode {
  index: number;
  position: THREE.Vector3;
  direction: THREE.Vector3; // tangent along track
  surfaceNormal: THREE.Vector3; // normal to surface
  width: number;
  isFinishLine: boolean;
}

export class CheckpointSystem {
  public checkpoints: CheckpointNode[] = [];
  private playerCurrentIndex: number = 0;
  private playerLapsCompleted: number = 0;
  private totalLaps: number = 3;
  private lapStartTime: number = 0;
  private currentLapTimes: number[] = [];

  constructor(checkpoints: CheckpointNode[], totalLaps: number = 3) {
    this.checkpoints = checkpoints;
    this.totalLaps = totalLaps;
    this.reset();
  }

  public reset() {
    this.playerCurrentIndex = 0;
    this.playerLapsCompleted = 0;
    this.lapStartTime = 0;
    this.currentLapTimes = [];
  }

  public checkPlayerProgress(
    prevPos: THREE.Vector3,
    currentPos: THREE.Vector3,
    currentTime: number
  ): {
    passedCheckpoint: boolean;
    checkpointIndex: number;
    lapCompleted: boolean;
    raceFinished: boolean;
    lapTime: number | null;
  } {
    if (this.checkpoints.length === 0) {
      return {
        passedCheckpoint: false,
        checkpointIndex: 0,
        lapCompleted: false,
        raceFinished: false,
        lapTime: null,
      };
    }

    const targetIdx = (this.playerCurrentIndex + 1) % this.checkpoints.length;
    const targetCp = this.checkpoints[targetIdx];

    // Vector from checkpoint to vehicle
    const toCurrent = currentPos.clone().sub(targetCp.position);
    const toPrev = prevPos.clone().sub(targetCp.position);

    const distToPlane = toCurrent.dot(targetCp.direction);
    const prevDistToPlane = toPrev.dot(targetCp.direction);

    // Lateral distance check (must be within checkpoint width)
    const lateralDist = toCurrent.clone().sub(targetCp.direction.clone().multiplyScalar(distToPlane)).length();

    // Check if vehicle crossed the checkpoint plane in forward direction
    const crossedForward = prevDistToPlane <= 0.5 && distToPlane > 0 && lateralDist < targetCp.width;
    // Or close proximity fallback if vehicle was travelling fast
    const proximityHit = toCurrent.length() < 14 && Math.abs(distToPlane) < 4;

    if (crossedForward || proximityHit) {
      this.playerCurrentIndex = targetIdx;
      AudioManager.playCheckpoint();

      // Check if finished lap (crossed finish line checkpoint 0)
      if (targetCp.isFinishLine) {
        this.playerLapsCompleted++;
        const lapDuration = this.lapStartTime > 0 ? currentTime - this.lapStartTime : currentTime;
        this.lapStartTime = currentTime;
        this.currentLapTimes.push(lapDuration);

        const raceFinished = this.playerLapsCompleted >= this.totalLaps;
        if (raceFinished) {
          AudioManager.playVictory();
        }

        return {
          passedCheckpoint: true,
          checkpointIndex: targetIdx,
          lapCompleted: true,
          raceFinished,
          lapTime: lapDuration,
        };
      }

      return {
        passedCheckpoint: true,
        checkpointIndex: targetIdx,
        lapCompleted: false,
        raceFinished: false,
        lapTime: null,
      };
    }

    return {
      passedCheckpoint: false,
      checkpointIndex: this.playerCurrentIndex,
      lapCompleted: false,
      raceFinished: false,
      lapTime: null,
    };
  }

  public getCurrentCheckpoint(): CheckpointNode | null {
    return this.checkpoints[this.playerCurrentIndex] || null;
  }

  public getNextCheckpoint(): CheckpointNode | null {
    const nextIdx = (this.playerCurrentIndex + 1) % this.checkpoints.length;
    return this.checkpoints[nextIdx] || null;
  }

  public getPlayerLaps(): number {
    return this.playerLapsCompleted;
  }

  public getLapTimes(): number[] {
    return [...this.currentLapTimes];
  }
}
