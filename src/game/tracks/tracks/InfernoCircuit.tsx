import * as THREE from 'three';
import { TrackData, buildTrackFromPoints } from '../TrackConfig';
import { GravityZoneConfig } from '../../gravity/GravityZone';
import { CheckpointNode } from '../CheckpointSystem';

export function getInfernoCircuitData(): TrackData {
  const rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[] = [
    // 1. Starting grid over geothermal reactor
    { pos: [0, 15, 0], normal: [0, 1, 0], width: 22 },
    { pos: [0, 15, 140], normal: [0, 1, 0], width: 22 },

    // 2. High-speed approach into 360-degree vertical loop
    { pos: [0, 18, 260], normal: [0, 1, 0], width: 22 },
    { pos: [0, 35, 340], normal: [0, 0.7, -0.7], width: 22 }, // climbing vertical loop
    { pos: [0, 68, 380], normal: [0, -1, 0], width: 22 },   // inverted apex of loop!
    { pos: [0, 35, 420], normal: [0, 0.7, 0.7], width: 22 },  // descending
    { pos: [0, 15, 500], normal: [0, 1, 0], width: 22 },   // loop exit

    // 3. Sharp turn right over magma conduits
    { pos: [80, 15, 560], normal: [0, 1, 0], width: 24 },
    { pos: [200, 18, 540], normal: [-0.6, 0.8, 0], width: 22 },
    { pos: [280, 22, 440], normal: [0, 1, 0], width: 22 },

    // 4. Industrial cooling tower interior wall ride (left wall gravity)
    { pos: [290, 30, 320], normal: [1, 0, 0], width: 24 }, // on interior cylinder wall
    { pos: [290, 32, 180], normal: [1, 0, 0], width: 24 },
    { pos: [250, 20, 60], normal: [0, 1, 0], width: 22 },

    // 5. High-speed curved bridge over blast furnaces
    { pos: [170, 18, -40], normal: [0, 1, 0], width: 22 },
    { pos: [80, 15, -60], normal: [0, 1, 0], width: 22 },
    { pos: [0, 15, -40], normal: [0, 1, 0], width: 22 },
  ];

  const { sampledPoints } = buildTrackFromPoints(rawPoints, true);

  const cpIndices = [0, 14, 28, 42, 58, 74, 90, 105];
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
      id: 'inferno_loop_apex',
      name: 'Magma Loop Inversion',
      type: 'ceiling',
      gravityVector: new THREE.Vector3(0, 28, 0),
      surfaceNormal: new THREE.Vector3(0, -1, 0),
      minBounds: new THREE.Vector3(-40, 45, 320),
      maxBounds: new THREE.Vector3(40, 85, 440),
      transitionDuration: 0.35,
      energyColor: '#F59E0B',
    },
    {
      id: 'inferno_cooling_wall',
      name: 'Reactor Cylinder Wall',
      type: 'left_wall',
      gravityVector: new THREE.Vector3(-28, 0, 0),
      surfaceNormal: new THREE.Vector3(1, 0, 0),
      minBounds: new THREE.Vector3(240, 10, 140),
      maxBounds: new THREE.Vector3(330, 50, 360),
      transitionDuration: 0.4,
      energyColor: '#EF4444',
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
    id: 'inferno-circuit',
    name: 'INFERNO CIRCUIT',
    splinePoints: sampledPoints,
    checkpoints,
    gravityZones,
    aiWaypoints,
    spawnPositions,
    accentColor: '#F59E0B',
    fogColor: '#1a0d0a',
    ambientLightColor: '#2b140b',
  };
}
