import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';

export interface SuspensionConfig {
  restLength: number; // e.g. 0.55m
  stiffness: number; // k in N/m (e.g. 35000)
  damping: number; // c in N*s/m (e.g. 2800)
  wheelRadius: number; // e.g. 0.38m
  mountPoint: THREE.Vector3; // offset relative to chassis center
}

export interface WheelContact {
  isGrounded: boolean;
  hitDistance: number;
  contactPoint: THREE.Vector3;
  contactNormal: THREE.Vector3;
  compression: number; // meters
  compressionVelocity: number; // m/s
  suspensionForce: number; // Newtons
}

// Reusable scratch objects to eliminate GC pressure
const _worldMount = new THREE.Vector3();
const _localDown = new THREE.Vector3();
const _rayOrigin = { x: 0, y: 0, z: 0 };
const _rayDir = { x: 0, y: 0, z: 0 };

export class SuspensionWheel {
  public config: SuspensionConfig;
  public mountPoint: THREE.Vector3;
  private prevCompression: number = 0;
  private contact: WheelContact;

  constructor(config: SuspensionConfig) {
    this.config = config;
    this.mountPoint = config.mountPoint.clone();
    this.contact = {
      isGrounded: false,
      hitDistance: config.restLength,
      contactPoint: new THREE.Vector3(),
      contactNormal: new THREE.Vector3(0, 1, 0),
      compression: 0,
      compressionVelocity: 0,
      suspensionForce: 0,
    };
  }

  public computeRaycast(
    world: RAPIER.World,
    chassisBody: RAPIER.RigidBody,
    vehiclePos: THREE.Vector3,
    vehicleQuat: THREE.Quaternion,
    dt: number,
    filterPredicate?: (collider: RAPIER.Collider) => boolean
  ): WheelContact {
    // 1. Calculate world position of wheel mount point using scratch vector
    _worldMount.copy(this.mountPoint).applyQuaternion(vehicleQuat).add(vehiclePos);

    // 2. Raycast direction is along vehicle's local -Y (downwards towards ground)
    _localDown.set(0, -1, 0).applyQuaternion(vehicleQuat).normalize();

    const maxRayDist = this.config.restLength + this.config.wheelRadius;
    _rayOrigin.x = _worldMount.x;
    _rayOrigin.y = _worldMount.y;
    _rayOrigin.z = _worldMount.z;

    _rayDir.x = _localDown.x;
    _rayDir.y = _localDown.y;
    _rayDir.z = _localDown.z;

    const ray = new RAPIER.Ray(_rayOrigin, _rayDir);

    // Filter out chassis's own colliders
    const hit = world.castRayAndGetNormal(
      ray,
      maxRayDist,
      true, // solid
      undefined,
      undefined,
      undefined,
      undefined,
      filterPredicate
    );

    if (hit && hit.timeOfImpact < maxRayDist) {
      const hitDist = hit.timeOfImpact;
      const compression = Math.max(0, this.config.restLength - (hitDist - this.config.wheelRadius));
      const compressionVelocity = dt > 0 ? (compression - this.prevCompression) / dt : 0;
      this.prevCompression = compression;

      // Spring + Damping force: F = kx + cv
      const forceMag = Math.max(
        0,
        this.config.stiffness * compression + this.config.damping * compressionVelocity
      );

      this.contact.isGrounded = true;
      this.contact.hitDistance = hitDist;
      this.contact.compression = compression;
      this.contact.compressionVelocity = compressionVelocity;
      this.contact.suspensionForce = forceMag;

      this.contact.contactPoint.set(
        _worldMount.x + _localDown.x * hitDist,
        _worldMount.y + _localDown.y * hitDist,
        _worldMount.z + _localDown.z * hitDist
      );

      if (hit.normal) {
        this.contact.contactNormal.set(hit.normal.x, hit.normal.y, hit.normal.z).normalize();
      } else {
        this.contact.contactNormal.copy(_localDown).negate();
      }
    } else {
      this.prevCompression = 0;
      this.contact.isGrounded = false;
      this.contact.hitDistance = maxRayDist;
      this.contact.compression = 0;
      this.contact.compressionVelocity = 0;
      this.contact.suspensionForce = 0;
      this.contact.contactNormal.copy(_localDown).negate();
    }

    return this.contact;
  }

  public getContact(): WheelContact {
    return this.contact;
  }
}
