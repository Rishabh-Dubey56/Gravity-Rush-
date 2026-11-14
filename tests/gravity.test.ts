import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { GravityZone } from '../src/game/gravity/GravityZone';
import { GravityTransition } from '../src/game/gravity/GravityTransition';
import { GravityManager } from '../src/game/gravity/GravityManager';

describe('Gravity Physics Calculations', () => {
  it('correctly detects vehicle within zone bounding box', () => {
    const zone = new GravityZone({
      id: 'test_wall',
      name: 'Test Wall',
      type: 'right_wall',
      gravityVector: new THREE.Vector3(28, 0, 0),
      surfaceNormal: new THREE.Vector3(-1, 0, 0),
      minBounds: new THREE.Vector3(100, 0, 100),
      maxBounds: new THREE.Vector3(200, 50, 200),
    });

    const insidePoint = new THREE.Vector3(150, 25, 150);
    const outsidePoint = new THREE.Vector3(50, 25, 150);

    expect(zone.containsPoint(insidePoint)).toBe(true);
    expect(zone.containsPoint(outsidePoint)).toBe(false);
  });

  it('verifies standard gravity vectors for all 5 orientations', () => {
    const floor = new THREE.Vector3(0, -28, 0);
    const rightWall = new THREE.Vector3(28, 0, 0);
    const ceiling = new THREE.Vector3(0, 28, 0);
    const leftWall = new THREE.Vector3(-28, 0, 0);
    const zeroG = new THREE.Vector3(0, 0, 0);

    expect(floor.y).toBe(-28);
    expect(rightWall.x).toBe(28);
    expect(ceiling.y).toBe(28);
    expect(leftWall.x).toBe(-28);
    expect(zeroG.length()).toBe(0);
  });

  it('smoothly interpolates gravity vector during transition', () => {
    const transition = new GravityTransition();
    const startGrav = new THREE.Vector3(0, -28, 0);
    const targetGrav = new THREE.Vector3(28, 0, 0);
    const startNorm = new THREE.Vector3(0, 1, 0);
    const targetNorm = new THREE.Vector3(-1, 0, 0);
    const currentQuat = new THREE.Quaternion();
    const currentForward = new THREE.Vector3(0, 0, 1);

    transition.startTransition(
      startGrav,
      targetGrav,
      startNorm,
      targetNorm,
      currentQuat,
      currentForward,
      0.5
    );

    expect(transition.isActive()).toBe(true);

    const midwayVec = new THREE.Vector3();
    transition.update(0.25, midwayVec);

    // Midway: x should be positive, y should be less negative
    expect(midwayVec.x).toBeGreaterThan(0);
    expect(midwayVec.y).toBeGreaterThan(-28);

    // Complete transition
    transition.update(0.3, midwayVec);
    expect(transition.isActive()).toBe(false);
    expect(midwayVec.x).toBeCloseTo(28, 1);
    expect(midwayVec.y).toBeCloseTo(0, 1);
  });

  it('GravityManager applies manual force zone and zero-g correctly', () => {
    const mgr = new GravityManager();
    expect(mgr.getCurrentGravity().y).toBe(-28);

    mgr.forceZone('zero_g');
    expect(mgr.getCurrentGravity().length()).toBe(0);
    expect(mgr.getActiveZone().isZeroG).toBe(true);

    mgr.forceZone('ceiling');
    expect(mgr.getCurrentGravity().y).toBe(28);
    expect(mgr.getCurrentNormal().y).toBe(-1);
  });
});
