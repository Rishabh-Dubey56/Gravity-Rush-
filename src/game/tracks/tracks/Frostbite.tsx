import * as THREE from 'three';
import { TrackData, buildTrackFromPoints } from '../TrackConfig';
import { GravityZoneConfig } from '../../gravity/GravityZone';
import { CheckpointNode } from '../CheckpointSystem';

export function getFrostbiteData(): TrackData {
  const rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[] = [
    // 1. Glacier valley start
    { pos: [0, 10, 0], normal: [0, 1, 0], width: 22 },
    { pos: [0, 10, 130], normal: [0, 1, 0], width: 22 },

    // 2. Frozen ice tunnel with hairpin turn
    { pos: [40, 12, 230], normal: [0, 1, 0], width: 20 },
    { pos: [110, 15, 290], normal: [0, 1, 0], width: 20 },
    { pos: [190, 18, 270], normal: [0, 1, 0], width: 20 },

    // 3. Steep vertical mountain cliff wall ascent (right wall gravity)
    { pos: [240, 35, 180], normal: [-1, 0, 0], width: 22 },
    { pos: [260, 65, 80], normal: [-1, 0, 0], width: 22 },
    { pos: [260, 80, -40], normal: [-1, 0, 0], width: 22 },

    // 4. Crest of the frozen ridge descending into subterranean crevasse
    { pos: [210, 60, -140], normal: [0, 1, 0], width: 22 },
    { pos: [130, 35, -200], normal: [0, 1, 0], width: 20 },
    { pos: [40, 20, -180], normal: [0, 1, 0], width: 20 },

    // 5. High-speed frozen suspension bridge back to valley start
    { pos: [-20, 12, -120], normal: [0, 1, 0], width: 22 },
    { pos: [-30, 10, -40], normal: [0, 1, 0], width: 22 },
  ];

  const { sampledPoints } = buildTrackFromPoints(rawPoints, true);

  const cpIndices = [0, 15, 30, 45, 60, 75, 90, 100];
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
      id: 'frostbite_cliff_wall',
      name: 'Glacial Cliff Ascent',
      type: 'right_wall',
      gravityVector: new THREE.Vector3(28, 0, 0),
      surfaceNormal: new THREE.Vector3(-1, 0, 0),
      minBounds: new THREE.Vector3(200, 20, -70),
      maxBounds: new THREE.Vector3(300, 95, 210),
      transitionDuration: 0.45,
      energyColor: '#67E8F9',
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
    id: 'frostbite',
    name: 'FROSTBITE',
    splinePoints: sampledPoints,
    checkpoints,
    gravityZones,
    aiWaypoints,
    spawnPositions,
    accentColor: '#67E8F9',
    fogColor: '#091520',
    ambientLightColor: '#122536',
  };
}
