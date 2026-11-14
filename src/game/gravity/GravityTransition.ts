import * as THREE from 'three';

export interface TransitionState {
  isActive: boolean;
  progress: number; // 0 to 1
  duration: number; // seconds
  startGravity: THREE.Vector3;
  targetGravity: THREE.Vector3;
  startNormal: THREE.Vector3;
  targetNormal: THREE.Vector3;
  startQuat: THREE.Quaternion;
  targetQuat: THREE.Quaternion;
}

export class GravityTransition {
  private state: TransitionState;

  constructor() {
    this.state = {
      isActive: false,
      progress: 1,
      duration: 0.5,
      startGravity: new THREE.Vector3(0, -25, 0),
      targetGravity: new THREE.Vector3(0, -25, 0),
      startNormal: new THREE.Vector3(0, 1, 0),
      targetNormal: new THREE.Vector3(0, 1, 0),
      startQuat: new THREE.Quaternion(),
      targetQuat: new THREE.Quaternion(),
    };
  }

  public startTransition(
    currentGravity: THREE.Vector3,
    targetGravity: THREE.Vector3,
    currentNormal: THREE.Vector3,
    targetNormal: THREE.Vector3,
    currentQuat: THREE.Quaternion,
    currentForward: THREE.Vector3,
    duration: number = 0.5
  ) {
    this.state.isActive = true;
    this.state.progress = 0;
    this.state.duration = Math.max(0.1, duration);
    this.state.startGravity.copy(currentGravity);
    this.state.targetGravity.copy(targetGravity);
    this.state.startNormal.copy(currentNormal);
    this.state.targetNormal.copy(targetNormal);
    this.state.startQuat.copy(currentQuat);

    // Calculate target orientation:
    // We want the new Up vector to match targetNormal.
    // We want the forward vector projected onto the plane of targetNormal.
    const forwardProjected = currentForward.clone().sub(
      targetNormal.clone().multiplyScalar(currentForward.dot(targetNormal))
    );

    if (forwardProjected.lengthSq() < 0.001) {
      // Vehicle was pointing directly into or away from the new surface normal;
      // pick an orthogonal fallback
      forwardProjected.set(0, 0, 1).sub(
        targetNormal.clone().multiplyScalar(targetNormal.z)
      );
      if (forwardProjected.lengthSq() < 0.001) {
        forwardProjected.set(1, 0, 0);
      }
    }
    forwardProjected.normalize();

    const right = new THREE.Vector3().crossVectors(forwardProjected, targetNormal).normalize();
    const up = new THREE.Vector3().crossVectors(right, forwardProjected).normalize();

    // Construct rotation matrix from [right, up, -forward] (Three.js standard camera/mesh coordinates)
    const m = new THREE.Matrix4();
    m.makeBasis(right, up, forwardProjected.clone().negate());
    this.state.targetQuat.setFromRotationMatrix(m);
  }

  public update(dt: number, currentVecOut: THREE.Vector3, currentQuatOut?: THREE.Quaternion): boolean {
    if (!this.state.isActive) {
      currentVecOut.copy(this.state.targetGravity);
      return false;
    }

    this.state.progress += dt / this.state.duration;

    if (this.state.progress >= 1.0) {
      this.state.progress = 1.0;
      this.state.isActive = false;
      currentVecOut.copy(this.state.targetGravity);
      if (currentQuatOut) {
        currentQuatOut.copy(this.state.targetQuat);
      }
      return false;
    }

    // Smooth cubic ease in-out
    const t = this.state.progress;
    const smoothT = t * t * (3 - 2 * t);

    // Interpolate gravity vector
    currentVecOut.lerpVectors(this.state.startGravity, this.state.targetGravity, smoothT);

    // Interpolate quaternion if requested
    if (currentQuatOut) {
      currentQuatOut.copy(this.state.startQuat).slerp(this.state.targetQuat, smoothT);
    }

    return true;
  }

  public isActive(): boolean {
    return this.state.isActive;
  }

  public getProgress(): number {
    return this.state.progress;
  }
}
