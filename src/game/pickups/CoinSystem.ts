import * as THREE from 'three';
import { TrackSplinePoint } from '../tracks/TrackConfig';
import { AudioManager } from '../../audio/AudioManager';
import { VoiceAnnouncer } from '../../audio/VoiceAnnouncer';

export interface QuantumCoin {
  id: string;
  position: THREE.Vector3;
  normal: THREE.Vector3;
  collected: boolean;
  collectAnim: number; // 0 to 1 for shrink/burst
}

export class CoinSystem {
  public coins: QuantumCoin[] = [];
  public coinsCollectedThisSession: number = 0;
  private consecutiveStreak: number = 0;
  private lastPickupTime: number = 0;

  constructor(splinePoints: TrackSplinePoint[]) {
    this.generateTrackCoins(splinePoints);
  }

  // Generates clusters of rotating 3D coins along the racing line
  public generateTrackCoins(splinePoints: TrackSplinePoint[]) {
    this.coins = [];
    const count = splinePoints.length;
    if (count === 0) return;

    // Distribute clusters every 12-16 spline intervals
    const clusterInterval = Math.max(8, Math.floor(count / 10));

    for (let c = 1; c < count; c += clusterInterval) {
      // 3 to 4 coins in an aerodynamic line
      for (let offset = 0; offset < 3; offset++) {
        const ptIdx = (c + offset) % count;
        const pt = splinePoints[ptIdx];

        // Slight curvature weave along the racing line
        const lateralOffset = Math.sin(ptIdx * 0.4) * 2.5;
        const pos = pt.position
          .clone()
          .add(pt.normal.clone().multiplyScalar(1.2))
          .add(pt.binormal.clone().multiplyScalar(lateralOffset));

        this.coins.push({
          id: `coin-${c}-${offset}`,
          position: pos,
          normal: pt.normal.clone(),
          collected: false,
          collectAnim: 0,
        });
      }
    }
  }

  public reset(splinePoints?: TrackSplinePoint[]) {
    this.coinsCollectedThisSession = 0;
    this.consecutiveStreak = 0;
    this.lastPickupTime = 0;
    if (splinePoints) {
      this.generateTrackCoins(splinePoints);
    } else {
      this.coins.forEach((coin) => {
        coin.collected = false;
        coin.collectAnim = 0;
      });
    }
  }

  // Check proximity with player vehicle (radius: 2.8m for fast arcade pickup)
  public checkPickups(
    playerPos: THREE.Vector3,
    onCoinCollected: (total: number, amount: number) => void
  ): { collectedCount: number; lastPos: THREE.Vector3 | null } {
    const pickupRadiusSq = 2.8 * 2.8;
    let newlyCollected = 0;
    let lastPos: THREE.Vector3 | null = null;
    const now = Date.now();

    for (const coin of this.coins) {
      if (coin.collected) continue;

      const distSq = playerPos.distanceToSquared(coin.position);
      if (distSq < pickupRadiusSq) {
        coin.collected = true;
        coin.collectAnim = 1.0;
        this.coinsCollectedThisSession++;
        newlyCollected++;
        lastPos = coin.position.clone();

        // Audio and feedback
        AudioManager.playCoinPickup();

        // Streak detection
        if (now - this.lastPickupTime < 2500) {
          this.consecutiveStreak++;
        } else {
          this.consecutiveStreak = 1;
        }
        this.lastPickupTime = now;

        if (this.consecutiveStreak === 3) {
          VoiceAnnouncer.announceCoinPickup();
        }

        onCoinCollected(this.coinsCollectedThisSession, 50);
      }
    }

    return { collectedCount: newlyCollected, lastPos };
  }

  // Respawns coins at the start of each new lap so players can collect every lap!
  public respawnForLap() {
    this.coins.forEach((coin) => {
      coin.collected = false;
      coin.collectAnim = 0;
    });
  }
}
