export interface LapData {
  currentLap: number;
  totalLaps: number;
  currentLapTime: number;
  bestLapTime: number | null;
  lapHistory: number[];
  isFinished: boolean;
}

export class LapSystem {
  public currentLap: number = 1;
  public totalLaps: number = 3;
  public currentLapTime: number = 0;
  public bestLapTime: number | null = null;
  public lapHistory: number[] = [];
  public isFinished: boolean = false;

  constructor(totalLaps: number = 3) {
    this.totalLaps = totalLaps;
    this.reset();
  }

  public reset(totalLaps?: number) {
    if (totalLaps) this.totalLaps = totalLaps;
    this.currentLap = 1;
    this.currentLapTime = 0;
    this.bestLapTime = null;
    this.lapHistory = [];
    this.isFinished = false;
  }

  public update(dt: number) {
    if (!this.isFinished) {
      this.currentLapTime += dt;
    }
  }

  public completeLap(lapDuration: number): { isRaceFinished: boolean; isNewBest: boolean } {
    this.lapHistory.push(lapDuration);

    let isNewBest = false;
    if (this.bestLapTime === null || lapDuration < this.bestLapTime) {
      this.bestLapTime = lapDuration;
      isNewBest = true;
    }

    if (this.currentLap >= this.totalLaps) {
      this.isFinished = true;
      return { isRaceFinished: true, isNewBest };
    }

    this.currentLap++;
    this.currentLapTime = 0;
    return { isRaceFinished: false, isNewBest };
  }

  public getData(): LapData {
    return {
      currentLap: this.currentLap,
      totalLaps: this.totalLaps,
      currentLapTime: this.currentLapTime,
      bestLapTime: this.bestLapTime,
      lapHistory: [...this.lapHistory],
      isFinished: this.isFinished,
    };
  }
}
