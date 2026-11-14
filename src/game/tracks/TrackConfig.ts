import * as THREE from 'three';
import { GravityZoneConfig } from '../gravity/GravityZone';
import { CheckpointNode } from './CheckpointSystem';

export interface TrackSplinePoint {
  position: THREE.Vector3;
  normal: THREE.Vector3; // surface normal
  binormal: THREE.Vector3; // sideways track vector
  width: number;
  bankingAngle?: number;
  frictionMultiplier?: number;
  isZeroG?: boolean;
}

export interface TrackData {
  id: string;
  name: string;
  splinePoints: TrackSplinePoint[];
  checkpoints: CheckpointNode[];
  gravityZones: GravityZoneConfig[];
  aiWaypoints: THREE.Vector3[];
  spawnPositions: { position: THREE.Vector3; rotation: THREE.Quaternion }[];
  accentColor: string;
  fogColor: string;
  ambientLightColor: string;
}

// Helper to generate smooth CatmullRom spline and derive normals & binormals
export function buildTrackFromPoints(
  rawPoints: { pos: [number, number, number]; normal?: [number, number, number]; width?: number }[],
  closed: boolean = true
): {
  curve: THREE.CatmullRomCurve3;
  sampledPoints: TrackSplinePoint[];
} {
  const vectors = rawPoints.map((p) => new THREE.Vector3(...p.pos));
  const curve = new THREE.CatmullRomCurve3(vectors, closed, 'centripetal');

  const divisions = rawPoints.length * 8;
  const sampledPoints: TrackSplinePoint[] = [];

  for (let i = 0; i < divisions; i++) {
    const t = i / divisions;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    // Default normal points up unless overridden
    let normal = new THREE.Vector3(0, 1, 0);

    // Find nearest rawPoint normal
    let nearestDist = Infinity;
    let nearestNorm = new THREE.Vector3(0, 1, 0);
    let nearestWidth = 20;

    for (const rp of rawPoints) {
      const pVec = new THREE.Vector3(...rp.pos);
      const d = pVec.distanceTo(pos);
      if (d < nearestDist) {
        nearestDist = d;
        if (rp.normal) nearestNorm.set(...rp.normal).normalize();
        if (rp.width) nearestWidth = rp.width;
      }
    }

    normal.copy(nearestNorm);

    // Compute orthogonal binormal (cross tangent and normal)
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
    // Recompute orthogonal normal
    normal.crossVectors(binormal, tangent).normalize();

    sampledPoints.push({
      position: pos,
      normal,
      binormal,
      width: nearestWidth,
    });
  }

  return { curve, sampledPoints };
}
