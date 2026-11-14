import * as THREE from 'three';
import { TrackData, buildTrackFromPoints } from '../TrackConfig';
import { GravityZoneConfig } from '../../gravity/GravityZone';
import { CheckpointNode } from '../CheckpointSystem';

export function getOrbitalZeroData(): TrackData {
  const rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[] = [
    // 1. Pressurized docking bay runway
    { pos: [0, 40, 0], normal: [0, 1, 0], width: 24 },
    { pos: [0, 40, 130], normal: [0, 1, 0], width: 24 },

    // 2. Airlock exit ramp leading into open-space vacuum jump gap
    { pos: [0, 42, 230], normal: [0, 1, 0], width: 24 },

    // 3. ZERO-GRAVITY VACUUM JUMP ZONE (floating platforms and magnetic accelerator rings)
    { pos: [40, 45, 330], normal: [0, 1, 0], width: 26 }, // Zero-G entrance
    { pos: [120, 50, 400], normal: [0, 1, 0], width: 26 }, // Zero-G orbital drift
    { pos: [220, 52, 380], normal: [0, 1, 0], width: 26 }, // Zero-G catch ring

    // 4. Touchdown onto solar array receiver deck (gravity restored)
    { pos: [300, 45, 290], normal: [0, 1, 0], width: 24 },
    { pos: [320, 35, 180], normal: [-0.7, 0.7, 0], width: 22 },

    // 5. Centrifuge perimeter ring (left wall gravity)
    { pos: [290, 30, 80], normal: [1, 0, 0], width: 22 },
    { pos: [220, 25, 0], normal: [0, 1, 0], width: 22 },

    // 6. Return corridor to main hub
    { pos: [150, 30, -80], normal: [0, 1, 0], width: 22 },
    { pos: [60, 38, -60], normal: [0, 1, 0], width: 24 },
    { pos: [0, 40, -30], normal: [0, 1, 0], width: 24 },
  ];

  const { sampledPoints } = buildTrackFromPoints(rawPoints, true);

  const cpIndices = [0, 15, 30, 45, 60, 75, 90, 105];
  const checkpoints: CheckpointNode[] = cpIndices.map((idx, cpIdx) => {
    const pt = sampledPoints[idx % sampledPoints.length];
    const nextPt = sampledPoints[(idx + 1) % sampledPoints.length];
    const dir = nextPt.position.clone().sub(pt.position).normalize();

    return {
      index: cpIdx,
      position: pt.position.clone(),
      direction: dir,
      surfaceNormal: pt.normal.clone(),
      width: pt.width,
      isFinishLine: cpIdx === 0,
    };
  });

  const gravityZones: GravityZoneConfig[] = [
    {
      id: 'orbital_vacuum_zero_g',
      name: 'Zero-G Orbital Vacuum',
      type: 'zero_g',
      gravityVector: new THREE.Vector3(0, 0, 0),
      surfaceNormal: new THREE.Vector3(0, 1, 0),
      minBounds: new THREE.Vector3(20, 20, 270),
      maxBounds: new THREE.Vector3(260, 80, 450),
      transitionDuration: 0.5,
      isZeroG: true,
      energyColor: '#A855F7',
    },
    {
      id: 'orbital_centrifuge_wall',
      name: 'Centrifuge Ring Wall',
      type: 'left_wall',
      gravityVector: new THREE.Vector3(-28, 0, 0),
      surfaceNormal: new THREE.Vector3(1, 0, 0),
      minBounds: new THREE.Vector3(240, 10, 40),
      maxBounds: new THREE.Vector3(330, 50, 120),
      transitionDuration: 0.4,
      energyColor: '#C084FC',
    },
  ];

  const aiWaypoints = sampledPoints.map((p) => p.position.clone());

  const startPt = sampledPoints[0];
  const startDir = sampledPoints[1].position.clone().sub(startPt.position).normalize();
  const startRight = new THREE.Vector3().crossVectors(startDir, startPt.normal).normalize();

  const m = new THREE.Matrix4().makeBasis(startRight, startPt.normal, startDir.clone().negate());
  const startQuat = new THREE.Quaternion().setFromRotationMatrix(m);

  const spawnPositions = [
    {
      position: startPt.position.clone().add(startRight.clone().multiplyScalar(-3.5)).add(new THREE.Vector3(0, 0.8, 0)),
      rotation: startQuat.clone(),
    },
    {
      position: startPt.position.clone().add(startRight.clone().multiplyScalar(3.5)).add(new THREE.Vector3(0, 0.8, -8)),
      rotation: startQuat.clone(),
    },
    {
      position: startPt.position.clone().add(startRight.clone().multiplyScalar(-3.5)).add(new THREE.Vector3(0, 0.8, -16)),
      rotation: startQuat.clone(),
    },
    {
      position: startPt.position.clone().add(startRight.clone().multiplyScalar(3.5)).add(new THREE.Vector3(0, 0.8, -24)),
      rotation: startQuat.clone(),
    },
  ];

  return {
    id: 'orbital-zero',
    name: 'ORBITAL ZERO',
    splinePoints: sampledPoints,
    checkpoints,
    gravityZones,
    aiWaypoints,
    spawnPositions,
    accentColor: '#A855F7',
    fogColor: '#070512',
    ambientLightColor: '#170f28',
  };
}
