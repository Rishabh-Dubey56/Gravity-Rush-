import { AudioManager } from '../../audio/AudioManager';

export interface NitroConfig {
  capacitySeconds: number; // e.g. 8.0
  rechargeRatePercent: number; // e.g. 10% per second
  thrustForce: number; // e.g. 12000 Newtons
  topSpeedMultiplier: number; // e.g. 1.25
}

export class NitroSystem {
  public config: NitroConfig;
  public currentCharge: number; // 0 to 100
  public isActive: boolean = false;

  constructor(config?: Partial<NitroConfig>) {
    this.config = {
      capacitySeconds: config?.capacitySeconds ?? 8.0,
      rechargeRatePercent: config?.rechargeRatePercent ?? 12.0,
      thrustForce: config?.thrustForce ?? 14000,
      topSpeedMultiplier: config?.topSpeedMultiplier ?? 1.25,
    };
    this.currentCharge = 100;
  }

  public update(dt: number, requestNitro: boolean, isDrifting: boolean): { isActive: boolean; thrustForce: number; chargePercent: number } {
    if (requestNitro && this.currentCharge > 2) {
      if (!this.isActive) {
        this.isActive = true;
        AudioManager.setNitro(true);
      }
      // Consume charge: 100% / capacitySeconds * dt
      const burnRate = 100 / this.config.capacitySeconds;
      this.currentCharge = Math.max(0, this.currentCharge - burnRate * dt);

      if (this.currentCharge <= 0) {
        this.isActive = false;
        AudioManager.setNitro(false);
      }
    } else {
      if (this.isActive) {
        this.isActive = false;
        AudioManager.setNitro(false);
      }

      // Recharge over time, bonus recharge if drifting
      const driftMultiplier = isDrifting ? 2.5 : 1.0;
      this.currentCharge = Math.min(100, this.currentCharge + this.config.rechargeRatePercent * driftMultiplier * dt);
    }

    return {
      isActive: this.isActive,
      thrustForce: this.isActive ? this.config.thrustForce : 0,
      chargePercent: this.currentCharge,
    };
  }

  public reset() {
    this.currentCharge = 100;
    this.isActive = false;
    AudioManager.setNitro(false);
  }
}
