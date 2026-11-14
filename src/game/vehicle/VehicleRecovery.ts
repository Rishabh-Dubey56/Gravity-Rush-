import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { AudioManager } from '../../audio/AudioManager';

export interface CheckpointData {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  surfaceNormal: THREE.Vector3;
}

export class VehicleRecovery {
  private upsideDownTimer: number = 0;
  private airborneTimer: number = 0;
  private recoveryCooldown: number = 0;

  public checkAndRecover(
    dt: number,
    rigidBody: RAPIER.RigidBody,
    vehiclePos: THREE.Vector3,
    vehicleQuat: THREE.Quaternion,
    surfaceNormal: THREE.Vector3,
    isGrounded: boolean,
    manualResetRequested: boolean,
    lastCheckpoint: CheckpointData | null,
    outOfBoundsDistance: number = 180
  ): boolean {
    if (this.recoveryCooldown > 0) {
      this.recoveryCooldown -= dt;
    }

    // Vehicle local UP vector
    const vehicleUp = new THREE.Vector3(0, 1, 0).applyQuaternion(vehicleQuat).normalize();
    const alignment = vehicleUp.dot(surfaceNormal);

    // 1. Check if upside down (inverted relative to expected surface normal)
    if (isGrounded && alignment < -0.3) {
      this.upsideDownTimer += dt;
    } else {
      this.upsideDownTimer = Math.max(0, this.upsideDownTimer - dt);
    }

    // 2. Check if airborne for too long (fallen off track or launched into outer space)
    if (!isGrounded) {
      this.airborneTimer += dt;
    } else {
      this.airborneTimer = 0;
    }

    // 3. Check fall distance
    const isOutOfBounds = vehiclePos.length() > outOfBoundsDistance || vehiclePos.y < -120;

    const needsRecovery =
      manualResetRequested ||
      (this.upsideDownTimer > 2.5) ||
      (this.airborneTimer > 6.0 && isOutOfBounds) ||
      vehiclePos.y < -100;

    if (needsRecovery && this.recoveryCooldown <= 0 && lastCheckpoint) {
      this.executeRecovery(rigidBody, lastCheckpoint);
      this.upsideDownTimer = 0;
      this.airborneTimer = 0;
      this.recoveryCooldown = 1.5;
      return true;
    }

    return false;
  }

  public executeRecovery(rigidBody: RAPIER.RigidBody, checkpoint: CheckpointData) {
    const targetPos = checkpoint.position.clone().add(checkpoint.surfaceNormal.clone().multiplyScalar(1.2));

    // Align with checkpoint direction and surface normal
    const forward = checkpoint.direction.clone().normalize();
    const up = checkpoint.surfaceNormal.clone().normalize();
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();

    const m = new THREE.Matrix4().makeBasis(right, up, forward.clone().negate());
    const targetQuat = new THREE.Quaternion().setFromRotationMatrix(m);

    // Teleport physics body safely
    rigidBody.setTranslation({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, true);
    rigidBody.setRotation({ x: targetQuat.x, y: targetQuat.y, z: targetQuat.z, w: targetQuat.w }, true);

    // Give slight forward momentum in checkpoint direction to avoid immediate stall
    const initialVel = forward.clone().multiplyScalar(15);
    rigidBody.setLinvel({ x: initialVel.x, y: initialVel.y, z: initialVel.z }, true);
    rigidBody.setAngvel({ x: 0, y: 0, z: 0 }, true);

    AudioManager.playGravitySwitch();
  }
}
