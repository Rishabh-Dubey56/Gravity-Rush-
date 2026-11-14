import { AudioManager } from '../../audio/AudioManager';

export interface EngineConfig {
  maxPowerKw: number; // e.g. 480 kW (650 hp)
  idleRpm: number; // 1000
  redlineRpm: number; // 8500
  topSpeedKmh: number; // e.g. 300
}

export class EngineSystem {
  public config: EngineConfig;
  public rpm: number;
  public currentGear: number; // -1 = Reverse, 1..6 = Forward
  private gearRatios: number[] = [3.8, 2.6, 1.9, 1.4, 1.1, 0.85];
  private reverseRatio: number = -3.2;
  private finalDrive: number = 3.6;
  private shiftCooldown: number = 0;

  constructor(config?: Partial<EngineConfig>) {
    this.config = {
      maxPowerKw: config?.maxPowerKw ?? 520,
      idleRpm: config?.idleRpm ?? 1000,
      redlineRpm: config?.redlineRpm ?? 8500,
      topSpeedKmh: config?.topSpeedKmh ?? 300,
    };
    this.rpm = this.config.idleRpm;
    this.currentGear = 1;
  }

  public update(
    dt: number,
    throttle: number,
    brake: number,
    vehicleSpeedKmh: number,
    isGrounded: boolean
  ): { driveTorque: number; brakeTorque: number; rpm: number; gear: number } {
    if (this.shiftCooldown > 0) {
      this.shiftCooldown -= dt;
    }

    // Determine Reverse vs Forward
    if (brake > 0.5 && vehicleSpeedKmh < 3 && this.currentGear !== -1) {
      this.currentGear = -1;
      AudioManager.playGearShift();
    } else if (throttle > 0.1 && this.currentGear === -1 && vehicleSpeedKmh < 3) {
      this.currentGear = 1;
      AudioManager.playGearShift();
    }

    // Calculate wheel angular velocity estimate
    const wheelRadius = 0.38;
    const speedMs = (Math.abs(vehicleSpeedKmh) * 1000) / 3600;
    const wheelRadPerSec = speedMs / wheelRadius;

    // Estimate RPM from speed and gear ratio
    const currentRatio = this.currentGear === -1 ? Math.abs(this.reverseRatio) : this.gearRatios[this.currentGear - 1];
    let targetRpm = wheelRadPerSec * currentRatio * this.finalDrive * (60 / (2 * Math.PI));

    if (!isGrounded && throttle > 0) {
      // Free revving when airborne
      targetRpm = this.config.redlineRpm * 0.95;
    }

    targetRpm = Math.max(this.config.idleRpm, targetRpm);

    // Smooth RPM response
    this.rpm += (targetRpm - this.rpm) * Math.min(1.0, dt * 10);
    this.rpm = Math.min(this.config.redlineRpm, Math.max(this.config.idleRpm, this.rpm));

    // Automatic transmission shifting
    if (this.currentGear > 0 && this.shiftCooldown <= 0) {
      if (this.rpm > 7600 && this.currentGear < this.gearRatios.length) {
        this.currentGear++;
        this.shiftCooldown = 0.35;
        AudioManager.playGearShift();
      } else if (this.rpm < 3200 && this.currentGear > 1) {
        this.currentGear--;
        this.shiftCooldown = 0.35;
        AudioManager.playGearShift();
      }
    }

    // Calculate available engine torque: Torque = Power / omega
    const maxTorque = (this.config.maxPowerKw * 1000) / (Math.max(100, (this.rpm * 2 * Math.PI) / 60));
    let driveTorque = 0;

    if (this.currentGear === -1) {
      driveTorque = -brake * maxTorque * 0.6;
    } else {
      driveTorque = throttle * maxTorque * (this.gearRatios[this.currentGear - 1] / this.gearRatios[0]);
    }

    // Braking torque
    let brakeTorque = 0;
    if (this.currentGear !== -1 && brake > 0) {
      brakeTorque = brake * 4500;
    }

    return {
      driveTorque,
      brakeTorque,
      rpm: this.rpm,
      gear: this.currentGear,
    };
  }
}
