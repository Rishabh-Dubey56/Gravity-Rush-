import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import { TrackData } from './TrackConfig';
import { getNeonMetropolisData } from './tracks/NeonMetropolis';
import { getInfernoCircuitData } from './tracks/InfernoCircuit';
import { getFrostbiteData } from './tracks/Frostbite';
import { getOrbitalZeroData } from './tracks/OrbitalZero';
import { getSingularityData } from './tracks/Singularity';

export class TrackManager {
  private activeTrackId: string = 'neon-metropolis';
  private trackData: TrackData;
  private trackColliders: RAPIER.Collider[] = [];

  constructor(trackId: string = 'neon-metropolis') {
    this.activeTrackId = trackId;
    this.trackData = this.loadTrackData(trackId);
  }

  public getTrackData(): TrackData {
    return this.trackData;
  }

  public loadTrack(trackId: string): TrackData {
    this.activeTrackId = trackId;
    this.trackData = this.loadTrackData(trackId);
    return this.trackData;
  }

  private loadTrackData(id: string): TrackData {
    switch (id) {
      case 'inferno-circuit':
        return getInfernoCircuitData();
      case 'frostbite':
        return getFrostbiteData();
      case 'orbital-zero':
        return getOrbitalZeroData();
      case 'singularity':
        return getSingularityData();
      case 'neon-metropolis':
      default:
        return getNeonMetropolisData();
    }
  }

  // Generates Three.js Geometry for Track Road and Barriers
  public buildTrackGeometries(): {
    roadGeometry: THREE.BufferGeometry;
    barrierGeometry: THREE.BufferGeometry;
    neonEdgeGeometry: THREE.BufferGeometry;
    laneLineGeometry: THREE.BufferGeometry;
  } {
    const pts = this.trackData.splinePoints;
    const count = pts.length;

    const roadVerts: number[] = [];
    const roadNorms: number[] = [];
    const roadUvs: number[] = [];
    const roadIndices: number[] = [];

    const barrierVerts: number[] = [];
    const barrierNorms: number[] = [];
    const barrierIndices: number[] = [];

    const neonVerts: number[] = [];
    const neonIndices: number[] = [];

    const laneVerts: number[] = [];
    const laneIndices: number[] = [];

    const barrierHeight = 2.0;

    for (let i = 0; i < count; i++) {
      const pt = pts[i];
      const halfW = pt.width * 0.5;

      // Road surface vertices: left and right
      const leftPt = pt.position.clone().add(pt.binormal.clone().multiplyScalar(-halfW));
      const rightPt = pt.position.clone().add(pt.binormal.clone().multiplyScalar(halfW));

      roadVerts.push(leftPt.x, leftPt.y, leftPt.z);
      roadVerts.push(rightPt.x, rightPt.y, rightPt.z);

      roadNorms.push(pt.normal.x, pt.normal.y, pt.normal.z);
      roadNorms.push(pt.normal.x, pt.normal.y, pt.normal.z);

      const uProgress = i / count;
      roadUvs.push(0, uProgress * 25);
      roadUvs.push(1, uProgress * 25);

      // Center dashed neon lane line (lifted 4cm above road)
      const centerPt = pt.position.clone().add(pt.normal.clone().multiplyScalar(0.04));
      const laneL = centerPt.clone().add(pt.binormal.clone().multiplyScalar(-0.35));
      const laneR = centerPt.clone().add(pt.binormal.clone().multiplyScalar(0.35));
      laneVerts.push(laneL.x, laneL.y, laneL.z);
      laneVerts.push(laneR.x, laneR.y, laneR.z);

      // Barriers (left guard rail & right guard rail)
      const leftTop = leftPt.clone().add(pt.normal.clone().multiplyScalar(barrierHeight));
      const rightTop = rightPt.clone().add(pt.normal.clone().multiplyScalar(barrierHeight));

      barrierVerts.push(leftPt.x, leftPt.y, leftPt.z);       // 0: left bottom
      barrierVerts.push(leftTop.x, leftTop.y, leftTop.z);     // 1: left top
      barrierVerts.push(rightPt.x, rightPt.y, rightPt.z);     // 2: right bottom
      barrierVerts.push(rightTop.x, rightTop.y, rightTop.z);   // 3: right top

      const bNormLeft = pt.binormal.clone().multiplyScalar(1); // pointing inward
      const bNormRight = pt.binormal.clone().multiplyScalar(-1); // pointing inward

      barrierNorms.push(bNormLeft.x, bNormLeft.y, bNormLeft.z);
      barrierNorms.push(bNormLeft.x, bNormLeft.y, bNormLeft.z);
      barrierNorms.push(bNormRight.x, bNormRight.y, bNormRight.z);
      barrierNorms.push(bNormRight.x, bNormRight.y, bNormRight.z);

      // Neon glowing edge ribbons (top of barriers)
      const neonLeft = leftTop.clone().add(pt.normal.clone().multiplyScalar(0.04));
      const neonRight = rightTop.clone().add(pt.normal.clone().multiplyScalar(0.04));
      neonVerts.push(neonLeft.x, neonLeft.y, neonLeft.z);
      neonVerts.push(neonRight.x, neonRight.y, neonRight.z);
    }

    // Connect quads between adjacent slices
    for (let i = 0; i < count; i++) {
      const nextI = (i + 1) % count;

      // Road quads
      const i0 = i * 2;
      const i1 = i * 2 + 1;
      const i2 = nextI * 2;
      const i3 = nextI * 2 + 1;

      roadIndices.push(i0, i1, i2);
      roadIndices.push(i1, i3, i2);

      // Neon edges
      neonIndices.push(i0, i2);
      neonIndices.push(i1, i3);

      // Dashed lane line (connect 2 slices out of 4)
      if (i % 4 < 2) {
        laneIndices.push(i0, i1, i2);
        laneIndices.push(i1, i3, i2);
      }

      // Left barrier quad
      const lb0 = i * 4;
      const lb1 = i * 4 + 1;
      const lb2 = nextI * 4;
      const lb3 = nextI * 4 + 1;
      barrierIndices.push(lb0, lb1, lb2);
      barrierIndices.push(lb1, lb3, lb2);

      // Right barrier quad
      const rb0 = i * 4 + 2;
      const rb1 = i * 4 + 3;
      const rb2 = nextI * 4 + 2;
      const rb3 = nextI * 4 + 3;
      barrierIndices.push(rb0, rb2, rb1);
      barrierIndices.push(rb1, rb2, rb3);
    }

    const roadGeometry = new THREE.BufferGeometry();
    roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(roadNorms, 3));
    roadGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeometry.setIndex(roadIndices);

    const barrierGeometry = new THREE.BufferGeometry();
    barrierGeometry.setAttribute('position', new THREE.Float32BufferAttribute(barrierVerts, 3));
    barrierGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(barrierNorms, 3));
    barrierGeometry.setIndex(barrierIndices);

    const neonEdgeGeometry = new THREE.BufferGeometry();
    neonEdgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(neonVerts, 3));
    neonEdgeGeometry.setIndex(neonIndices);

    const laneLineGeometry = new THREE.BufferGeometry();
    laneLineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(laneVerts, 3));
    laneLineGeometry.setIndex(laneIndices);

    return { roadGeometry, barrierGeometry, neonEdgeGeometry, laneLineGeometry };
  }

  // Generates Rapier physical colliders for track surface and side walls
  public buildPhysicsColliders(world: RAPIER.World) {
    this.clearColliders(world);

    const { roadGeometry, barrierGeometry } = this.buildTrackGeometries();

    // 1. Road surface trimesh
    const roadPos = roadGeometry.attributes.position.array as Float32Array;
    const roadIdx = new Uint32Array(roadGeometry.index!.array);

    const roadDesc = RAPIER.ColliderDesc.trimesh(roadPos, roadIdx)
      .setFriction(1.6)
      .setRestitution(0.1);
    const roadCollider = world.createCollider(roadDesc);
    this.trackColliders.push(roadCollider);

    // 2. Barrier guard rails trimesh
    const barrierPos = barrierGeometry.attributes.position.array as Float32Array;
    const barrierIdx = new Uint32Array(barrierGeometry.index!.array);

    const barrierDesc = RAPIER.ColliderDesc.trimesh(barrierPos, barrierIdx)
      .setFriction(0.25)
      .setRestitution(0.35);
    const barrierCollider = world.createCollider(barrierDesc);
    this.trackColliders.push(barrierCollider);
  }

  public clearColliders(world: RAPIER.World) {
    for (const col of this.trackColliders) {
      try {
        world.removeCollider(col, false);
      } catch {}
    }
    this.trackColliders = [];
  }
}
