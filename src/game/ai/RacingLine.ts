import * as THREE from 'three';

export class RacingLine {
  public waypoints: THREE.Vector3[];
  private totalLength: number = 0;
  private segmentLengths: number[] = [];

  constructor(waypoints: THREE.Vector3[]) {
    this.waypoints = waypoints;
    this.calculateLengths();
  }

  private calculateLengths() {
    this.totalLength = 0;
    this.segmentLengths = [];
    const count = this.waypoints.length;

    for (let i = 0; i < count; i++) {
      const nextI = (i + 1) % count;
      const len = this.waypoints[i].distanceTo(this.waypoints[nextI]);
      this.segmentLengths.push(len);
      this.totalLength += len;
    }
  }

  public findNearestIndex(pos: THREE.Vector3): number {
    let nearestIdx = 0;
    let minDistSq = Infinity;

    for (let i = 0; i < this.waypoints.length; i++) {
      const dSq = this.waypoints[i].distanceToSquared(pos);
      if (dSq < minDistSq) {
        minDistSq = dSq;
        nearestIdx = i;
      }
    }

    return nearestIdx;
  }

  public getTargetPoint(pos: THREE.Vector3, lookAheadDist: number): {
    targetPos: THREE.Vector3;
    targetTangent: THREE.Vector3;
    curvature: number;
    nearestIndex: number;
  } {
    const nearestIdx = this.findNearestIndex(pos);
    const count = this.waypoints.length;

    let accumulatedDist = 0;
    let currIdx = nearestIdx;

    while (accumulatedDist < lookAheadDist) {
      accumulatedDist += this.segmentLengths[currIdx];
      currIdx = (currIdx + 1) % count;
    }

    const targetPos = this.waypoints[currIdx];
    const nextIdx = (currIdx + 1) % count;
    const targetTangent = this.waypoints[nextIdx].clone().sub(targetPos).normalize();

    // Curvature estimation: angle difference between current waypoint tangent and look-ahead tangent
    const currentTangent = this.waypoints[(nearestIdx + 1) % count]
      .clone()
      .sub(this.waypoints[nearestIdx])
      .normalize();

    const dot = THREE.MathUtils.clamp(currentTangent.dot(targetTangent), -1, 1);
    const angle = Math.acos(dot);
    const curvature = angle / Math.max(10, lookAheadDist);

    return {
      targetPos,
      targetTangent,
      curvature,
      nearestIndex: nearestIdx,
    };
  }
}
