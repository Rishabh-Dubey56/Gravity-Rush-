import * as THREE from 'three';

export type GravityZoneType =
  | 'floor'
  | 'right_wall'
  | 'ceiling'
  | 'left_wall'
  | 'zero_g'
  | 'loop'
  | 'custom';

export interface GravityZoneConfig {
  id: string;
  name: string;
  type: GravityZoneType;
  gravityVector: THREE.Vector3; // Acceleration in m/s^2, e.g. (0, -28, 0)
  surfaceNormal: THREE.Vector3; // Direction pointing away from surface into track space
  minBounds: THREE.Vector3;
  maxBounds: THREE.Vector3;
  transitionDuration?: number; // seconds, default 0.5s
  isZeroG?: boolean;
  energyColor?: string;
}

export class GravityZone {
  public id: string;
  public name: string;
  public type: GravityZoneType;
  public gravityVector: THREE.Vector3;
  public surfaceNormal: THREE.Vector3;
  public minBounds: THREE.Vector3;
  public maxBounds: THREE.Vector3;
  public transitionDuration: number;
  public isZeroG: boolean;
  public energyColor: string;

  constructor(config: GravityZoneConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.gravityVector = config.gravityVector.clone();
    this.surfaceNormal = config.surfaceNormal.clone().normalize();
    this.minBounds = config.minBounds.clone();
    this.maxBounds = config.maxBounds.clone();
    this.transitionDuration = config.transitionDuration ?? 0.5;
    this.isZeroG = config.isZeroG ?? (config.type === 'zero_g');
    this.energyColor = config.energyColor ?? '#38BDF8';
  }

  public containsPoint(pos: THREE.Vector3): boolean {
    return (
      pos.x >= this.minBounds.x &&
      pos.x <= this.maxBounds.x &&
      pos.y >= this.minBounds.y &&
      pos.y <= this.maxBounds.y &&
      pos.z >= this.minBounds.z &&
      pos.z <= this.maxBounds.z
    );
  }
}
