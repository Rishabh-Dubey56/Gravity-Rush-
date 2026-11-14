import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { SuspensionWheel, SuspensionConfig, WheelContact } from './Suspension';
import { TireModel } from './TireModel';
import { EngineSystem } from './EngineSystem';
import { NitroSystem } from './NitroSystem';
import { VehicleRecovery, CheckpointData } from './VehicleRecovery';
import { VehicleConfig } from '../../store/gameStore';
import { AudioManager } from '../../audio/AudioManager';

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to +1
  nitro: boolean;
  handbrake: boolean;
  recover: boolean;
}

export interface WheelTransform {
  position: THREE.Vector3;
  rotation: THREE.Quaternion;
  steerAngle: number;
  isGrounded: boolean;
  suspensionCompression: number;
}

// High-performance reusable scratch vectors to eliminate garbage collection
const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _velocity = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wheelOffset = new THREE.Vector3();
const _wheelFwd = new THREE.Vector3();
const _wheelRt = new THREE.Vector3();
const _suspensionForce = new THREE.Vector3();
const _contactOffset = new THREE.Vector3();
const _dragForce = new THREE.Vector3();
const _downforce = new THREE.Vector3();
const _adhesion = new THREE.Vector3();
const _torque = new THREE.Vector3();
const _impulse = { x: 0, y: 0, z: 0 };
const _impulsePt = { x: 0, y: 0, z: 0 };

export class VehiclePhysics {
  public rigidBody: RAPIER.RigidBody;
  public collider: RAPIER.Collider;
  public config: VehicleConfig;

  // Suspension & Wheels (FL, FR, RL, RR)
  public wheels: SuspensionWheel[];
  public wheelTransforms: WheelTransform[];
  private tireModel: TireModel;
  public engine: EngineSystem;
  public nitro: NitroSystem;
  public recovery: VehicleRecovery;

  // State
  public currentSpeedKmh: number = 0;
  public isGrounded: boolean = false;
  public isSkidding: boolean = false;
  public currentSteerAngle: number = 0;
  private maxSteerAngle: number = THREE.MathUtils.degToRad(28);

  // Aerodynamics & Adhesion
  private dragCoefficient: number = 0.32;
  private downforceCoefficient: number = 2.8;
  private airDensity: number = 1.225;

  constructor(
    world: RAPIER.World,
    spawnPos: THREE.Vector3,
    spawnQuat: THREE.Quaternion,
    config: VehicleConfig
  ) {
    this.config = config;

    // 1. Create Rapier Dynamic Rigid Body
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(spawnPos.x, spawnPos.y, spawnPos.z)
      .setRotation({ x: spawnQuat.x, y: spawnQuat.y, z: spawnQuat.z, w: spawnQuat.w })
      .setLinearDamping(0.2)
      .setAngularDamping(2.2)
      .setCanSleep(false);

    this.rigidBody = world.createRigidBody(bodyDesc);

    // 2. Create Chassis Box Collider
    const halfWidth = 0.95;
    const halfHeight = 0.35;
    const halfLength = 2.1;
    const colliderDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight, halfLength)
      .setMass(config.mass)
      .setFriction(0.3)
      .setRestitution(0.1);

    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // 3. Setup 4 Suspension Wheels (FL, FR, RL, RR)
    // Front: +Z, Rear: -Z, Left: -X, Right: +X
    const mountY = -0.15;
    const frontZ = 1.35;
    const rearZ = -1.35;
    const trackWidth = 0.92;

    const suspensionConfig: SuspensionConfig = {
      restLength: 0.52,
      stiffness: config.suspensionStiffness * 500, // e.g. 32000 - 45000 N/m
      damping: 3200,
      wheelRadius: 0.38,
      mountPoint: new THREE.Vector3(),
    };

    const mounts = [
      new THREE.Vector3(-trackWidth, mountY, frontZ), // Front-Left
      new THREE.Vector3(trackWidth, mountY, frontZ),  // Front-Right
      new THREE.Vector3(-trackWidth, mountY, rearZ),  // Rear-Left
      new THREE.Vector3(trackWidth, mountY, rearZ),   // Rear-Right
    ];

    this.wheels = mounts.map(
      (m) =>
        new SuspensionWheel({
          ...suspensionConfig,
          mountPoint: m,
        })
    );

    this.wheelTransforms = mounts.map((m) => ({
      position: m.clone(),
      rotation: new THREE.Quaternion(),
      steerAngle: 0,
      isGrounded: false,
      suspensionCompression: 0,
    }));

    this.tireModel = new TireModel({
      frictionCoefficient: 1.55,
      lateralStiffness: 24.0,
      driftFrictionMultiplier: 0.52,
    });

    this.engine = new EngineSystem({
      topSpeedKmh: config.topSpeed,
      maxPowerKw: (config.acceleration / 100) * 620,
    });

    this.nitro = new NitroSystem({
      capacitySeconds: config.nitroCapacity,
      rechargeRatePercent: config.nitroRechargeRate,
      thrustForce: 16000,
      topSpeedMultiplier: 1.25,
    });

    this.recovery = new VehicleRecovery();
  }

  public step(
    dt: number,
    inputs: VehicleInputs,
    world: RAPIER.World,
    gravityVector: THREE.Vector3,
    surfaceNormal: THREE.Vector3,
    isZeroG: boolean,
    lastCheckpoint: CheckpointData | null
  ) {
    const rawPos = this.rigidBody.translation();
    const rawRot = this.rigidBody.rotation();
    _pos.set(rawPos.x, rawPos.y, rawPos.z);
    _quat.set(rawRot.x, rawRot.y, rawRot.z, rawRot.w);

    const rawVel = this.rigidBody.linvel();
    _velocity.set(rawVel.x, rawVel.y, rawVel.z);
    const speedMs = _velocity.length();
    this.currentSpeedKmh = speedMs * 3.6;

    // Vehicle basis vectors
    _forward.set(0, 0, 1).applyQuaternion(_quat).normalize();
    _up.set(0, 1, 0).applyQuaternion(_quat).normalize();
    _right.set(1, 0, 0).applyQuaternion(_quat).normalize();

    // 1. Steering interpolation (speed-sensitive steering reduction)
    const steerSpeedFactor = Math.max(0.4, 1.0 - (this.currentSpeedKmh / 350) * 0.55);
    const targetSteerAngle = -inputs.steer * this.maxSteerAngle * steerSpeedFactor;
    this.currentSteerAngle += (targetSteerAngle - this.currentSteerAngle) * Math.min(1.0, dt * 14);

    // 2. Vehicle Recovery check
    this.recovery.checkAndRecover(
      dt,
      this.rigidBody,
      _pos,
      _quat,
      surfaceNormal,
      this.isGrounded,
      inputs.recover,
      lastCheckpoint
    );

    // 3. Raycast 4 Suspension Wheels
    let groundedCount = 0;
    const wheelContacts: WheelContact[] = [];

    // Filter to avoid self-collision
    const filterSelf = (col: RAPIER.Collider) => col.handle !== this.collider.handle;

    for (let i = 0; i < this.wheels.length; i++) {
      const contact = this.wheels[i].computeRaycast(world, this.rigidBody, _pos, _quat, dt, filterSelf);
      wheelContacts.push(contact);
      if (contact.isGrounded) groundedCount++;

      // Update visual transform for wheel
      const isFront = i < 2;
      const steer = isFront ? this.currentSteerAngle : 0;
      this.wheelTransforms[i].isGrounded = contact.isGrounded;
      this.wheelTransforms[i].suspensionCompression = contact.compression;
      this.wheelTransforms[i].steerAngle = steer;

      // Visual position = mount point minus travel along local down
      const currentWheelHeight = this.wheels[i].config.restLength - contact.compression;
      _wheelOffset.set(0, -currentWheelHeight, 0);
      this.wheelTransforms[i].position
        .copy(this.wheels[i].mountPoint)
        .add(_wheelOffset);

      // Visual rotation combines steering yaw
      this.wheelTransforms[i].rotation.setFromAxisAngle(_up, steer);
    }

    this.isGrounded = groundedCount >= 2;

    // 4. Update Engine & Nitro
    const engineOutput = this.engine.update(
      dt,
      inputs.throttle,
      inputs.brake,
      this.currentSpeedKmh,
      this.isGrounded
    );

    const nitroOutput = this.nitro.update(dt, inputs.nitro, this.isSkidding);

    // 5. Apply Forces to Rigid Body

    // A. Local Gravity: F = m * g_local
    if (!isZeroG) {
      _impulse.x = gravityVector.x * this.config.mass * dt;
      _impulse.y = gravityVector.y * this.config.mass * dt;
      _impulse.z = gravityVector.z * this.config.mass * dt;
      this.rigidBody.applyImpulse(_impulse, true);
    }

    // B. Suspension & Tire Traction Forces
    let skiddingFlag = false;

    for (let i = 0; i < this.wheels.length; i++) {
      const contact = wheelContacts[i];
      if (!contact.isGrounded) continue;

      // 1. Suspension Spring Force: applied along surface normal or local UP
      const sForce = contact.suspensionForce * dt;
      _suspensionForce.copy(contact.contactNormal).multiplyScalar(sForce);

      // Contact point offset from COM
      _contactOffset.copy(contact.contactPoint).sub(_pos);

      _impulse.x = _suspensionForce.x;
      _impulse.y = _suspensionForce.y;
      _impulse.z = _suspensionForce.z;

      _impulsePt.x = _pos.x + _contactOffset.x * 0.4;
      _impulsePt.y = _pos.y + _contactOffset.y * 0.4;
      _impulsePt.z = _pos.z + _contactOffset.z * 0.4;

      this.rigidBody.applyImpulseAtPoint(_impulse, _impulsePt, true);

      // 2. Wheel orientation (steered for front wheels)
      const isFront = i < 2;
      const steer = isFront ? this.currentSteerAngle : 0;
      _wheelFwd.copy(_forward).applyAxisAngle(_up, steer).normalize();
      _wheelRt.copy(_right).applyAxisAngle(_up, steer).normalize();

      // Torque distribution: AWD (50% front, 50% rear)
      const driveTorquePerWheel = engineOutput.driveTorque * 0.25;
      const brakeTorquePerWheel = engineOutput.brakeTorque * 0.25;

      const tireForces = this.tireModel.computeForces(
        contact,
        _velocity,
        _wheelFwd,
        _wheelRt,
        driveTorquePerWheel,
        brakeTorquePerWheel,
        inputs.handbrake,
        this.wheels[i].config.wheelRadius
      );

      if (tireForces.isSkidding) {
        skiddingFlag = true;
      }

      // Apply tire forces at contact point
      _impulse.x = tireForces.totalForce.x * dt;
      _impulse.y = tireForces.totalForce.y * dt;
      _impulse.z = tireForces.totalForce.z * dt;

      _impulsePt.x = _pos.x + _contactOffset.x * 0.5;
      _impulsePt.y = _pos.y + _contactOffset.y * 0.5;
      _impulsePt.z = _pos.z + _contactOffset.z * 0.5;

      this.rigidBody.applyImpulseAtPoint(_impulse, _impulsePt, true);
    }

    this.isSkidding = skiddingFlag;

    // C. Nitro Boost Thrust
    if (nitroOutput.isActive && nitroOutput.thrustForce > 0) {
      const nThrust = nitroOutput.thrustForce * dt;
      _impulse.x = _forward.x * nThrust;
      _impulse.y = _forward.y * nThrust;
      _impulse.z = _forward.z * nThrust;
      this.rigidBody.applyImpulse(_impulse, true);
    }

    // D. Aerodynamic Drag: F_drag = -0.5 * rho * C_d * A * v * |v|
    const frontalArea = 2.2;
    const dragMag = 0.5 * this.airDensity * this.dragCoefficient * frontalArea * speedMs * speedMs;
    _dragForce.copy(_velocity).normalize().multiplyScalar(-dragMag * dt);
    _impulse.x = _dragForce.x;
    _impulse.y = _dragForce.y;
    _impulse.z = _dragForce.z;
    this.rigidBody.applyImpulse(_impulse, true);

    // E. Aerodynamic Downforce & Surface Adhesion
    // Crucial for vertical wall & ceiling racing adhesion!
    if (!isZeroG && (this.isGrounded || this.currentSpeedKmh > 60)) {
      const downforceMag = 0.5 * this.airDensity * this.downforceCoefficient * frontalArea * speedMs * speedMs;
      _downforce.copy(_up).multiplyScalar(-downforceMag * dt);

      if (surfaceNormal.y < 0.8) {
        _adhesion.copy(surfaceNormal).multiplyScalar(-14000 * dt);
        _downforce.add(_adhesion);
      }

      _impulse.x = _downforce.x;
      _impulse.y = _downforce.y;
      _impulse.z = _downforce.z;
      this.rigidBody.applyImpulse(_impulse, true);
    }

    // F. Airborne / Zero-G Attitude Stabilization
    if (!this.isGrounded || isZeroG) {
      const airPitch = inputs.throttle - inputs.brake;

      if (isZeroG) {
        // Full 6DOF thruster response
        const pTorque = airPitch * 6500 * dt;
        const yTorque = -inputs.steer * 7500 * dt;
        _torque.set(
          _right.x * pTorque + _up.x * yTorque,
          _right.y * pTorque + _up.y * yTorque,
          _right.z * pTorque + _up.z * yTorque
        );
        this.rigidBody.applyTorqueImpulse(_torque, true);

        const thrustMag = (inputs.throttle - inputs.brake * 0.6) * 12000 * dt;
        _impulse.x = _forward.x * thrustMag;
        _impulse.y = _forward.y * thrustMag;
        _impulse.z = _forward.z * thrustMag;
        this.rigidBody.applyImpulse(_impulse, true);
      } else {
        // Gentle alignment with surface normal to land cleanly
        _torque.crossVectors(_up, surfaceNormal).multiplyScalar(5500 * dt);
        _torque.addScaledVector(_up, -inputs.steer * 4500 * dt);
        this.rigidBody.applyTorqueImpulse(_torque, true);
      }
    }

    // Audio updates
    AudioManager.updateEngine(engineOutput.rpm, inputs.throttle > 0.1, this.currentSpeedKmh);
    AudioManager.updateDrift(this.isSkidding ? 0.75 : 0);
  }

  public getPosition(): THREE.Vector3 {
    const p = this.rigidBody.translation();
    return new THREE.Vector3(p.x, p.y, p.z);
  }

  public getRotation(): THREE.Quaternion {
    const r = this.rigidBody.rotation();
    return new THREE.Quaternion(r.x, r.y, r.z, r.w);
  }

  public getForward(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 1).applyQuaternion(this.getRotation()).normalize();
  }

  public getUp(): THREE.Vector3 {
    return new THREE.Vector3(0, 1, 0).applyQuaternion(this.getRotation()).normalize();
  }

  public destroy(world: RAPIER.World) {
    AudioManager.stopEngine();
    AudioManager.setNitro(false);
    AudioManager.updateDrift(0);
    world.removeRigidBody(this.rigidBody);
  }
}
