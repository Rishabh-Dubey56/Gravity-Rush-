import * as THREE from 'three';
import { TrackData, buildTrackFromPoints } from '../TrackConfig';
import { GravityZoneConfig } from '../../gravity/GravityZone';
import { CheckpointNode } from '../CheckpointSystem';

export function getSingularityData(): TrackData {
  const rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[] = [
    // 1. Collider runway approaching singularity core
    { pos: [0, 25, 0], normal: [0, 1, 0], width: 22 },
    { pos: [0, 25, 120], normal: [0, 1, 0], width: 22 },

    // 2. Continuous 90-degree transition to right wall
    { pos: [40, 28, 220], normal: [-0.6, 0.8, 0], width: 22 },
    { pos: [110, 40, 290], normal: [-1, 0, 0], width: 24 }, // Right wall

    // 3. FULL INVERSION UP ONTO THE CEILING (upside down at Y=65, normal points down (0, -1, 0), gravity points up (0, 28, 0))
    { pos: [190, 58, 320], normal: [-0.7, -0.7, 0], width: 24 },
    { pos: [290, 68, 300], normal: [0, -1, 0], width: 26 }, // FULL CEILING RACING!
    { pos: [380, 68, 230], normal: [0, -1, 0], width: 26 }, // Inverted sprint above reactor
    { pos: [420, 68, 140], normal: [0, -1, 0], width: 26 },

    // 4. Transition down onto left wall
    { pos: [410, 52, 40], normal: [0.7, -0.7, 0], width: 24 },
    { pos: [380, 35, -40], normal: [1, 0, 0], width: 24 }, // Left wall

    // 5. Diving through the tachyon event horizon back to standard floor
    { pos: [310, 25, -120], normal: [0.6, 0.8, 0], width: 22 },
    { pos: [210, 25, -170], normal: [0, 1, 0], width: 22 },
    { pos: [110, 25, -140], normal: [0, 1, 0], width: 22 },
    { pos: [30, 25, -70], normal: [0, 1, 0], width: 22 },
  ];

  const { sampledPoints } = buildTrackFromPoints(rawPoints, true);

  const cpIndices = [0, 14, 28, 44, 60, 75, 90, 105];
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
      id: 'singularity_right_wall',
      name: 'Outer Containment Wall',
      type: 'right_wall',
      gravityVector: new THREE.Vector3(28, 0, 0),
      surfaceNormal: new THREE.Vector3(-1, 0, 0),
      minBounds: new THREE.Vector3(70, 15, 230),
      maxBounds: new THREE.Vector3(160, 55, 340),
      transitionDuration: 0.45,
      energyColor: '#EC4899',
    },
    {
      id: 'singularity_inverted_ceiling',
      name: 'Inverted Ceiling Megastructure',
      type: 'ceiling',
      gravityVector: new THREE.Vector3(0, 28, 0),
      surfaceNormal: new THREE.Vector3(0, -1, 0),
      minBounds: new THREE.Vector3(220, 50, 90),
      maxBounds: new THREE.Vector3(450, 90, 360),
      transitionDuration: 0.5,
      energyColor: '#F43F5E',
    },
    {
      id: 'singularity_left_wall',
      name: 'Flux Return Wall',
      type: 'left_wall',
      gravityVector: new THREE.Vector3(-28, 0, 0),
      surfaceNormal: new THREE.Vector3(1, 0, 0),
      minBounds: new THREE.Vector3(340, 15, -70),
      maxBounds: new THREE.Vector3(440, 55, 80),
      transitionDuration: 0.45,
      energyColor: '#EC4899',
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
    id: 'singularity',
    name: 'SINGULARITY',
    splinePoints: sampledPoints,
    checkpoints,
    gravityZones,
    aiWaypoints,
    spawnPositions,
    accentColor: '#EC4899',
    fogColor: '#120414',
    ambientLightColor: '#2b0c30',
  };
}
