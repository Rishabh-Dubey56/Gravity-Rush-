import * as THREE from 'three';
import { WheelContact } from './Suspension';

export interface TireConfig {
  frictionCoefficient: number; // e.g. 1.4
  lateralStiffness: number; // e.g. 18.0
  rollingResistance: number; // e.g. 0.015
  driftFrictionMultiplier: number; // e.g. 0.55
}

export interface TireForces {
  longitudinalForce: THREE.Vector3;
  lateralForce: THREE.Vector3;
  totalForce: THREE.Vector3;
  slipRatio: number;
  slipAngle: number;
  isSkidding: boolean;
}

export class TireModel {
  public config: TireConfig;

  constructor(config?: Partial<TireConfig>) {
    this.config = {
      frictionCoefficient: config?.frictionCoefficient ?? 1.45,
      lateralStiffness: config?.lateralStiffness ?? 22.0,
      rollingResistance: config?.rollingResistance ?? 0.015,
      driftFrictionMultiplier: config?.driftFrictionMultiplier ?? 0.55,
    };
  }

  public computeForces(
    contact: WheelContact,
    wheelVelocity: THREE.Vector3,
    wheelForward: THREE.Vector3,
    wheelRight: THREE.Vector3,
    driveTorque: number,
    brakeTorque: number,
    isHandbrake: boolean,
    wheelRadius: number
  ): TireForces {
    const result: TireForces = {
      longitudinalForce: new THREE.Vector3(),
      lateralForce: new THREE.Vector3(),
      totalForce: new THREE.Vector3(),
      slipRatio: 0,
      slipAngle: 0,
      isSkidding: false,
    };

    if (!contact.isGrounded || contact.suspensionForce <= 0) {
      return result;
    }

    const normalForce = contact.suspensionForce;
    const mu = isHandbrake
      ? this.config.frictionCoefficient * this.config.driftFrictionMultiplier
      : this.config.frictionCoefficient;
    const maxFrictionForce = normalForce * mu;

    // Decompose contact velocity relative to wheel orientation
    const vLong = wheelVelocity.dot(wheelForward);
    const vLat = wheelVelocity.dot(wheelRight);

    // 1. Longitudinal Force (drive torque vs brake force)
    let fLong = 0;
    if (driveTorque !== 0) {
      fLong = driveTorque / wheelRadius;
    }
    if (brakeTorque > 0) {
      // Oppose direction of travel
      const brakeDir = Math.sign(vLong) || 1;
      fLong -= brakeDir * (brakeTorque / wheelRadius);
    }
    if (isHandbrake) {
      fLong -= Math.sign(vLong) * (brakeTorque > 0 ? brakeTorque : 2500);
    }

    // 2. Lateral Force (resists sideways slipping)
    // Lateral slip angle = arctan(vLat / max(1.0, |vLong|))
    const slipAngle = Math.atan2(vLat, Math.max(1.0, Math.abs(vLong)));
    result.slipAngle = slipAngle;

    let fLat = -this.config.lateralStiffness * slipAngle * (normalForce * 0.1);

    // 3. Friction Circle / Ellipse Clamping
    const frictionNorm = Math.sqrt(fLong * fLong + fLat * fLat);
    if (frictionNorm > maxFrictionForce && frictionNorm > 0.001) {
      const scale = maxFrictionForce / frictionNorm;
      fLong *= scale;
      fLat *= scale;
      result.isSkidding = true;
    }

    if (Math.abs(slipAngle) > 0.28 || isHandbrake) {
      result.isSkidding = true;
    }

    result.longitudinalForce.copy(wheelForward).multiplyScalar(fLong);
    result.lateralForce.copy(wheelRight).multiplyScalar(fLat);
    result.totalForce.addVectors(result.longitudinalForce, result.lateralForce);

    return result;
  }
}
