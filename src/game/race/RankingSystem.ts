import * as THREE from 'three';

export interface RacerProgress {
  id: string; // 'player' or AI name
  name: string;
  isPlayer: boolean;
  lap: number;
  checkpointIndex: number;
  distanceToNextCheckpoint: number;
  isFinished: boolean;
  finishTime: number | null;
  position: number; // 1, 2, 3, 4
}

export class RankingSystem {
  public static calculateRanks(racers: RacerProgress[]): RacerProgress[] {
    const sorted = [...racers].sort((a, b) => {
      // 1. Finished racers always rank ahead of racers still running
      if (a.isFinished && !b.isFinished) return -1;
      if (!a.isFinished && b.isFinished) return 1;
      if (a.isFinished && b.isFinished) {
        return (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity);
      }

      // 2. Higher lap comes first
      if (a.lap !== b.lap) {
        return b.lap - a.lap;
      }

      // 3. Higher checkpoint comes first
      if (a.checkpointIndex !== b.checkpointIndex) {
        return b.checkpointIndex - a.checkpointIndex;
      }

      // 4. Closer distance to next checkpoint comes first
      return a.distanceToNextCheckpoint - b.distanceToNextCheckpoint;
    });

    sorted.forEach((racer, index) => {
      racer.position = index + 1;
    });

    return sorted;
  }
}
