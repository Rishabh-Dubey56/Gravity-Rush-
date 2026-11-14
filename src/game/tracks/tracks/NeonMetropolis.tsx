import * as THREE from 'three';
import { TrackData, buildTrackFromPoints } from '../TrackConfig';
import { GravityZoneConfig } from '../../gravity/GravityZone';
import { CheckpointNode } from '../CheckpointSystem';

export function getNeonMetropolisData(): TrackData {
  // Key points along the city highway circuit
  const rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[] = [
    // 1. Starting straight (Highway over city)
    { pos: [0, 20, 0], normal: [0, 1, 0], width: 22 },
    { pos: [0, 20, 120], normal: [0, 1, 0], width: 22 },
    { pos: [0, 20, 240], normal: [0, 1, 0], width: 22 },

    // 2. Sweeping turn right transitioning into 90-degree right wall banking
    { pos: [60, 22, 340], normal: [0, 1, 0], width: 22 },
    { pos: [150, 30, 390], normal: [-0.7, 0.7, 0], width: 24 }, // banking begins
    { pos: [260, 45, 370], normal: [-1, 0, 0], width: 24 }, // full 90-degree right wall on skyscraper facade!
    { pos: [330, 50, 280], normal: [-1, 0, 0], width: 24 }, // high-speed wall ride
    { pos: [340, 40, 180], normal: [-0.7, 0.7, 0], width: 24 }, // descending back

    // 3. Elevated bridge section
    { pos: [290, 25, 80], normal: [0, 1, 0], width: 22 },
    { pos: [220, 20, 0], normal: [0, 1, 0], width: 22 },

    // 4. S-Chicane between holographic towers
    { pos: [170, 20, -100], normal: [0, 1, 0], width: 20 },
    { pos: [110, 20, -180], normal: [0, 1, 0], width: 20 },
    { pos: [60, 20, -250], normal: [0, 1, 0], width: 22 },

    // 5. High-speed tunnel turn back to finish line
    { pos: [-40, 20, -220], normal: [0, 1, 0], width: 22 },
    { pos: [-80, 20, -120], normal: [0, 1, 0], width: 22 },
    { pos: [-40, 20, -40], normal: [0, 1, 0], width: 22 },
  ];

  const { sampledPoints } = buildTrackFromPoints(rawPoints, true);

  // Checkpoints at strategic points
  const cpIndices = [0, 15, 32, 48, 65, 80, 95, 110];
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

  // Gravity Zones:
  // Zone 1: Standard highway floor
  // Zone 2: Vertical skyscraper wall section (normal: (-1, 0, 0), gravity: (28, 0, 0))
  const gravityZones: GravityZoneConfig[] = [
    {
      id: 'neon_wall_ride',
      name: 'Skyscraper Wall Ride',
      type: 'right_wall',
      gravityVector: new THREE.Vector3(28, 0, 0),
      surfaceNormal: new THREE.Vector3(-1, 0, 0),
      minBounds: new THREE.Vector3(200, 10, 150),
      maxBounds: new THREE.Vector3(380, 80, 420),
      transitionDuration: 0.45,
      energyColor: '#38BDF8',
    },
  ];

  // AI Waypoints
  const aiWaypoints = sampledPoints.map((p) => p.position.clone());

  // Spawn positions (Grid for 4 racers: Player, Speedster, Technician, Challenger)
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
    id: 'neon-metropolis',
    name: 'NEON METROPOLIS',
    splinePoints: sampledPoints,
    checkpoints,
    gravityZones,
    aiWaypoints,
    spawnPositions,
    accentColor: '#38BDF8',
    fogColor: '#0a101a',
    ambientLightColor: '#172532',
  };
}
