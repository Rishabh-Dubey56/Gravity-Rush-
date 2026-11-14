import * as THREE from 'three';
import { GravityZone } from './GravityZone';
import { GravityTransition } from './GravityTransition';
import { AudioManager } from '../../audio/AudioManager';

export interface GravityState {
  currentGravity: THREE.Vector3;
  targetGravity: THREE.Vector3;
  currentNormal: THREE.Vector3;
  activeZone: GravityZone | null;
  isTransitioning: boolean;
  isZeroG: boolean;
  gravityMagnitude: number;
}

export class GravityManager {
  private zones: GravityZone[] = [];
  private defaultZone: GravityZone;
  private currentZone: GravityZone;
  private currentGravity: THREE.Vector3;
  private currentNormal: THREE.Vector3;
  private transition: GravityTransition;

  // Listeners for VFX/Audio
  private onGravityChangeCallbacks: ((zone: GravityZone) => void)[] = [];

  constructor() {
    // Standard earth-like gravity oriented downwards: (0, -28 m/s^2 for responsive arcade racing)
    this.defaultZone = new GravityZone({
      id: 'default_floor',
      name: 'Standard Track Gravity',
      type: 'floor',
      gravityVector: new THREE.Vector3(0, -28, 0),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      minBounds: new THREE.Vector3(-99999, -99999, -99999),
      maxBounds: new THREE.Vector3(99999, 99999, 99999),
      transitionDuration: 0.4,
      isZeroG: false,
      energyColor: '#38BDF8',
    });

    this.currentZone = this.defaultZone;
    this.currentGravity = this.defaultZone.gravityVector.clone();
    this.currentNormal = this.defaultZone.surfaceNormal.clone();
    this.transition = new GravityTransition();
  }

  public setZones(zones: GravityZone[]) {
    this.zones = [...zones];
    this.currentZone = this.defaultZone;
    this.currentGravity.copy(this.defaultZone.gravityVector);
    this.currentNormal.copy(this.defaultZone.surfaceNormal);
  }

  public addZone(zone: GravityZone) {
    this.zones.push(zone);
  }

  public onGravityChange(callback: (zone: GravityZone) => void) {
    this.onGravityChangeCallbacks.push(callback);
  }

  public update(
    dt: number,
    vehiclePosition: THREE.Vector3,
    vehicleRotation: THREE.Quaternion,
    vehicleForward: THREE.Vector3
  ): GravityState {
    // 1. Detect candidate zone matching vehicle position
    let detectedZone: GravityZone = this.defaultZone;
    for (let i = 0; i < this.zones.length; i++) {
      if (this.zones[i].containsPoint(vehiclePosition)) {
        detectedZone = this.zones[i];
        break;
      }
    }

    // 2. If zone changed, start smooth transition
    if (detectedZone.id !== this.currentZone.id) {
      const prevZone = this.currentZone;
      this.currentZone = detectedZone;

      this.transition.startTransition(
        this.currentGravity,
        detectedZone.gravityVector,
        prevZone.surfaceNormal,
        detectedZone.surfaceNormal,
        vehicleRotation,
        vehicleForward,
        detectedZone.transitionDuration
      );

      // Play warp audio effect
      AudioManager.playGravitySwitch();

      // Notify VFX listeners
      for (const cb of this.onGravityChangeCallbacks) {
        cb(detectedZone);
      }
    }

    // 3. Update transition interpolation
    const isTransitioning = this.transition.update(dt, this.currentGravity);

    // Surface normal smoothly matches current zone or interpolates
    this.currentNormal.copy(this.currentZone.surfaceNormal);

    return {
      currentGravity: this.currentGravity.clone(),
      targetGravity: this.currentZone.gravityVector.clone(),
      currentNormal: this.currentNormal.clone(),
      activeZone: this.currentZone,
      isTransitioning,
      isZeroG: this.currentZone.isZeroG,
      gravityMagnitude: this.currentGravity.length(),
    };
  }

  public forceZone(zoneType: 'floor' | 'right_wall' | 'ceiling' | 'left_wall' | 'zero_g') {
    let grav = new THREE.Vector3(0, -28, 0);
    let norm = new THREE.Vector3(0, 1, 0);

    if (zoneType === 'right_wall') {
      grav.set(28, 0, 0);
      norm.set(-1, 0, 0);
    } else if (zoneType === 'ceiling') {
      grav.set(0, 28, 0);
      norm.set(0, -1, 0);
    } else if (zoneType === 'left_wall') {
      grav.set(-28, 0, 0);
      norm.set(1, 0, 0);
    } else if (zoneType === 'zero_g') {
      grav.set(0, 0, 0);
      norm.set(0, 1, 0);
    }

    const manualZone = new GravityZone({
      id: `manual_${zoneType}_${Date.now()}`,
      name: `Manual ${zoneType.toUpperCase()}`,
      type: zoneType,
      gravityVector: grav,
      surfaceNormal: norm,
      minBounds: new THREE.Vector3(-99999, -99999, -99999),
      maxBounds: new THREE.Vector3(99999, 99999, 99999),
      transitionDuration: 0.5,
      isZeroG: zoneType === 'zero_g',
    });

    this.currentZone = manualZone;
    this.currentGravity.copy(grav);
    this.currentNormal.copy(norm);
    AudioManager.playGravitySwitch();
  }

  public getCurrentGravity(): THREE.Vector3 {
    return this.currentGravity.clone();
  }

  public getCurrentNormal(): THREE.Vector3 {
    return this.currentNormal.clone();
  }

  public getActiveZone(): GravityZone {
    return this.currentZone;
  }
}
