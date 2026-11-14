import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { VehiclePhysics } from '../vehicle/VehiclePhysics';

export type CameraMode = 'chase_close' | 'chase_far' | 'hood';

interface ChaseCameraProps {
  physics: VehiclePhysics;
  cameraMode?: CameraMode;
  collisionShake?: number;
}

// Scratch objects to avoid GC allocations in camera frame loop
const _camForward = new THREE.Vector3();
const _camUp = new THREE.Vector3();
const _desiredPos = new THREE.Vector3();
const _desiredLookAt = new THREE.Vector3();
const _shakeOffset = new THREE.Vector3();

export const ChaseCamera: React.FC<ChaseCameraProps> = ({
  physics,
  cameraMode = 'chase_close',
  collisionShake = 0,
}) => {
  const { camera } = useThree();
  const perspectiveCamera = camera as THREE.PerspectiveCamera;

  const currentCamPos = useRef(new THREE.Vector3(0, 5, -10));
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const currentUp = useRef(new THREE.Vector3(0, 1, 0));

  // Base camera parameters per mode
  const modeParams = {
    chase_close: { distance: 6.8, height: 2.3, lookAhead: 9.0, baseFov: 68 },
    chase_far: { distance: 9.5, height: 3.6, lookAhead: 12.0, baseFov: 62 },
    hood: { distance: -0.2, height: 1.05, lookAhead: 15.0, baseFov: 75 },
  }[cameraMode];

  useEffect(() => {
    // Initial camera alignment on mount
    const p = physics.getPosition();
    currentCamPos.current.set(p.x, p.y + 4, p.z - 8);
    currentLookAt.current.copy(p);
  }, [physics]);

  useFrame((_, delta) => {
    const vehiclePos = physics.getPosition();
    const vehicleQuat = physics.getRotation();

    // Compute vehicle's local basis vectors
    _camForward.set(0, 0, 1).applyQuaternion(vehicleQuat).normalize();
    _camUp.set(0, 1, 0).applyQuaternion(vehicleQuat).normalize();

    // Speed-dependent dynamic follow distance & FOV
    const speedKmh = physics.currentSpeedKmh;
    const speedRatio = Math.min(1.0, speedKmh / 320);
    const isNitro = physics.nitro.isActive;

    const dynamicDistance = modeParams.distance + speedRatio * 1.5 + (isNitro ? 1.6 : 0);
    const dynamicHeight = modeParams.height + speedRatio * 0.4;

    // Desired camera position in vehicle's local frame
    _desiredPos
      .copy(vehiclePos)
      .addScaledVector(_camForward, -dynamicDistance)
      .addScaledVector(_camUp, dynamicHeight);

    // Desired look-at target ahead of vehicle
    _desiredLookAt
      .copy(vehiclePos)
      .addScaledVector(_camForward, modeParams.lookAhead + (isNitro ? 4.0 : 0))
      .addScaledVector(_camUp, 0.75);

    // Dynamic Camera Shake on Nitro & High Speed
    const totalShake = (isNitro ? 0.35 : 0) + (speedKmh > 260 ? 0.15 : 0) + collisionShake;
    if (totalShake > 0.01) {
      _shakeOffset.set(
        (Math.random() - 0.5) * totalShake * 0.35,
        (Math.random() - 0.5) * totalShake * 0.35,
        (Math.random() - 0.5) * totalShake * 0.35
      );
      _desiredPos.add(_shakeOffset);
    }

    // Smooth position interpolation (slower in reverse, snappy at speed)
    const posLerp = Math.min(1.0, delta * (15 + speedRatio * 6));
    currentCamPos.current.lerp(_desiredPos, posLerp);

    const lookLerp = Math.min(1.0, delta * (18 + speedRatio * 6));
    currentLookAt.current.lerp(_desiredLookAt, lookLerp);

    // CRUCIAL: Smooth camera Up vector matching vehicle's local up vector
    // This maintains perfect stability upside down on ceilings and at 90 deg walls!
    const upLerp = Math.min(1.0, delta * 12);
    currentUp.current.lerp(_camUp, upLerp).normalize();

    // Apply to Three.js camera
    perspectiveCamera.position.copy(currentCamPos.current);
    perspectiveCamera.up.copy(currentUp.current);
    perspectiveCamera.lookAt(currentLookAt.current);

    // Speed & Nitro based dynamic FOV punch
    const targetFov = modeParams.baseFov + speedRatio * 16 + (isNitro ? 14 : 0);
    perspectiveCamera.fov += (targetFov - perspectiveCamera.fov) * Math.min(1.0, delta * 7);
    perspectiveCamera.updateProjectionMatrix();
  });

  return null;
};
