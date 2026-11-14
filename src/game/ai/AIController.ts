import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { VehiclePhysics, VehicleInputs } from '../vehicle/VehiclePhysics';
import { RacingLine } from './RacingLine';
import { CheckpointData } from '../vehicle/VehicleRecovery';
import { VehicleConfig, VehicleCustomization } from '../../store/gameStore';

export type AIPersonalityType = 'speedster' | 'technician' | 'challenger';

export interface AIPersonality {
  name: string;
  type: AIPersonalityType;
  baseSpeedMultiplier: number;
  cornerAggression: number; // 0 to 1
  nitroAggression: number; // 0 to 1
  lookAheadMeters: number;
  customization: VehicleCustomization;
}

export const AI_ROSTER: AIPersonality[] = [
  {
    name: 'SPEEDSTER',
    type: 'speedster',
    baseSpeedMultiplier: 1.08,
    cornerAggression: 0.85,
    nitroAggression: 0.9,
    lookAheadMeters: 22,
    customization: {
      bodyColor: '#EF4444', // Danger Red
      wheelColor: '#F59E0B',
      nitroColor: '#EF4444',
      performancePreset: 'overclocked',
    },
  },
  {
    name: 'TECHNICIAN',
    type: 'technician',
    baseSpeedMultiplier: 0.98,
    cornerAggression: 0.98,
    nitroAggression: 0.6,
    lookAheadMeters: 26,
    customization: {
      bodyColor: '#10B981', // Emerald Tech
      wheelColor: '#38BDF8',
      nitroColor: '#10B981',
      performancePreset: 'downforce',
    },
  },
  {
    name: 'CHALLENGER',
    type: 'challenger',
    baseSpeedMultiplier: 1.02,
    cornerAggression: 0.92,
    nitroAggression: 0.8,
    lookAheadMeters: 24,
    customization: {
      bodyColor: '#A855F7', // Violet Plasma
      wheelColor: '#EC4899',
      nitroColor: '#A855F7',
      performancePreset: 'drift',
    },
  },
];

// Reusable scratch objects for AI simulation
const _aiPos = new THREE.Vector3();
const _aiQuat = new THREE.Quaternion();
const _aiToTarget = new THREE.Vector3();
const _aiInvQuat = new THREE.Quaternion();

export class AIController {
  public physics: VehiclePhysics;
  public personality: AIPersonality;
  public racingLine: RacingLine;

  public currentLap: number = 1;
  public currentCheckpoint: number = 0;
  public distanceToNextCheckpoint: number = 0;
  public raceFinished: boolean = false;
  public finishTime: number | null = null;

  constructor(
    world: RAPIER.World,
    spawnPos: THREE.Vector3,
    spawnQuat: THREE.Quaternion,
    vehicleConfig: VehicleConfig,
    personality: AIPersonality,
    racingLine: RacingLine
  ) {
    this.personality = personality;
    this.racingLine = racingLine;
    this.physics = new VehiclePhysics(world, spawnPos, spawnQuat, vehicleConfig);
  }

  public step(
    dt: number,
    world: RAPIER.World,
    gravityVector: THREE.Vector3,
    surfaceNormal: THREE.Vector3,
    isZeroG: boolean,
    lastCheckpoint: CheckpointData | null,
    countdownActive: boolean = false
  ) {
    if (countdownActive) {
      // Hold brake during race countdown
      const inputs: VehicleInputs = {
        throttle: 0,
        brake: 1,
        steer: 0,
        nitro: false,
        handbrake: true,
        recover: false,
      };
      this.physics.step(dt, inputs, world, gravityVector, surfaceNormal, isZeroG, lastCheckpoint);
      return;
    }

    _aiPos.copy(this.physics.getPosition());
    _aiQuat.copy(this.physics.getRotation());

    // 1. Query target look-ahead point on racing line
    const nav = this.racingLine.getTargetPoint(_aiPos, this.personality.lookAheadMeters);

    // 2. Transform target position to vehicle local coordinate space
    _aiToTarget.copy(nav.targetPos).sub(_aiPos);
    _aiInvQuat.copy(_aiQuat).invert();
    _aiToTarget.applyQuaternion(_aiInvQuat);

    // 3. Compute Steering Angle
    // Local +Z is forward, +X is right
    const angleToTarget = Math.atan2(_aiToTarget.x, Math.max(1.0, _aiToTarget.z));
    let steer = THREE.MathUtils.clamp(angleToTarget * 2.2, -1.0, 1.0);

    // 4. Compute Target Speed based on upcoming corner curvature
    // Lower speed on tight corners
    const maxSpeed = this.physics.config.topSpeed * this.personality.baseSpeedMultiplier;
    let targetSpeed = maxSpeed;

    if (nav.curvature > 0.015) {
      // Corner ahead: scale speed down based on curvature & personality
      const gripFactor = 160 / Math.max(0.01, nav.curvature * (1.2 - this.personality.cornerAggression * 0.4));
      targetSpeed = Math.min(maxSpeed, Math.max(90, gripFactor));
    }

    // 5. Throttle vs Brake
    let throttle = 0;
    let brake = 0;
    const currentSpeed = this.physics.currentSpeedKmh;

    if (currentSpeed < targetSpeed - 5) {
      throttle = 1.0;
      brake = 0;
    } else if (currentSpeed > targetSpeed + 15) {
      throttle = 0;
      brake = THREE.MathUtils.clamp((currentSpeed - targetSpeed) / 40, 0.3, 1.0);
    } else {
      throttle = 0.6;
      brake = 0;
    }

    // 6. Nitro Logic
    // Use nitro on straights with high target speed when battery has enough charge
    const isStraight = nav.curvature < 0.008;
    const wantNitro =
      isStraight &&
      currentSpeed > 140 &&
      this.physics.nitro.currentCharge > 35 &&
      Math.random() < this.personality.nitroAggression * 0.08;

    // Handbrake drift around sharp corners
    const handbrake = nav.curvature > 0.04 && currentSpeed > 130;

    const inputs: VehicleInputs = {
      throttle,
      brake,
      steer,
      nitro: wantNitro,
      handbrake,
      recover: false,
    };

    this.physics.step(dt, inputs, world, gravityVector, surfaceNormal, isZeroG, lastCheckpoint);
  }

  public updateCheckpointTracking(
    checkpoints: THREE.Vector3[],
    totalLaps: number,
    currentTime: number
  ) {
    if (this.raceFinished) return;

    const pos = this.physics.getPosition();
    const nextIdx = (this.currentCheckpoint + 1) % checkpoints.length;
    const nextCpPos = checkpoints[nextIdx];

    const dist = pos.distanceTo(nextCpPos);
    this.distanceToNextCheckpoint = dist;

    // Passed checkpoint
    if (dist < 18) {
      this.currentCheckpoint = nextIdx;
      if (nextIdx === 0) {
        this.currentLap++;
        if (this.currentLap > totalLaps) {
          this.raceFinished = true;
          this.finishTime = currentTime;
        }
      }
    }
  }

  public destroy(world: RAPIER.World) {
    this.physics.destroy(world);
  }
}
