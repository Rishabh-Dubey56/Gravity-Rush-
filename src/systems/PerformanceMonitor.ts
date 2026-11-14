export class PerformanceMonitor {
  private frames: number = 0;
  private prevTime: number = performance.now();
  private fps: number = 60;

  public update(onFpsUpdate?: (fps: number) => void): number {
    this.frames++;
    const now = performance.now();
    const delta = now - this.prevTime;

    if (delta >= 1000) {
      this.fps = Math.round((this.frames * 1000) / delta);
      this.frames = 0;
      this.prevTime = now;
      if (onFpsUpdate) {
        onFpsUpdate(this.fps);
      }
    }

    return this.fps;
  }
}
