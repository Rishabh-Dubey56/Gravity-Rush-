import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import RAPIER from '@dimforge/rapier3d-compat';
import { useGameStore, VEHICLE_PRESETS } from '../store/gameStore';
import { Vehicle } from './vehicle/Vehicle';
import { VehiclePhysics } from './vehicle/VehiclePhysics';
import { VehicleController } from './vehicle/VehicleController';
import { GravityManager } from './gravity/GravityManager';
import { GravityZone } from './gravity/GravityZone';
import { TrackManager } from './tracks/TrackManager';
import { CheckpointSystem } from './tracks/CheckpointSystem';
import { AIController, AI_ROSTER } from './ai/AIController';
import { RacingLine } from './ai/RacingLine';
import { Opponent } from './ai/Opponent';
import { RaceManager } from './race/RaceManager';
import { ChaseCamera, CameraMode } from './camera/ChaseCamera';
import { NitroEffects } from './effects/NitroEffects';
import { GravityEffects } from './effects/GravityEffects';
import { SciFiEnvironment } from './environment/SciFiEnvironment';
import { CoinSystem } from './pickups/CoinSystem';
import { CoinMeshGroup } from './pickups/CoinMeshGroup';
import { DriftEffects } from './effects/DriftEffects';
import { VoiceAnnouncer } from '../audio/VoiceAnnouncer';

export const GameWorld: React.FC = () => {
  const {
    selectedTrackId,
    selectedVehicleId,
    saveData,
    setTelemetry,
    setRaceState,
    finishRace,
    pauseRace,
    currentScreen,
    collectCoin,
    setRadioComms,
  } = useGameStore();

  const [isReady, setIsReady] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase_close');

  // Physics & World references (kept outside React state for high performance!)
  const rapierWorldRef = useRef<RAPIER.World | null>(null);
  const trackManagerRef = useRef<TrackManager | null>(null);
  const gravityManagerRef = useRef<GravityManager | null>(null);
  const checkpointSystemRef = useRef<CheckpointSystem | null>(null);
  const controllerRef = useRef<VehicleController | null>(null);
  const playerPhysicsRef = useRef<VehiclePhysics | null>(null);
  const aiControllersRef = useRef<AIController[]>([]);
  const raceManagerRef = useRef<RaceManager | null>(null);
  const coinSystemRef = useRef<CoinSystem | null>(null);
  const prevGravityZoneType = useRef<string>('floor');

  // Position history for checkpoint plane crossing
  const prevPlayerPos = useRef(new THREE.Vector3());
  const telemetryTimer = useRef(0);
  const physicsAccumulator = useRef(0);

  // Road geometries
  const [trackGeos, setTrackGeos] = useState<{
    roadGeometry: THREE.BufferGeometry;
    barrierGeometry: THREE.BufferGeometry;
    neonEdgeGeometry: THREE.BufferGeometry;
    laneLineGeometry: THREE.BufferGeometry;
  } | null>(null);

  const vehicleCustomization = useMemo(() => {
    return (
      saveData.vehicleCustomizations[selectedVehicleId] ||
      saveData.vehicleCustomizations['velocity-x']
    );
  }, [saveData, selectedVehicleId]);

  // INITIALIZE RAPIER & RACE CIRCUIT
  useEffect(() => {
    let isCancelled = false;

    const initWorld = async () => {
      await RAPIER.init();
      if (isCancelled) return;

      // Create Rapier physics world with 0 world gravity (since GravityManager applies local gravity)
      const world = new RAPIER.World({ x: 0, y: 0, z: 0 });
      rapierWorldRef.current = world;

      // 1. Track Manager & Colliders
      const trackMgr = new TrackManager(selectedTrackId);
      trackManagerRef.current = trackMgr;
      const geos = trackMgr.buildTrackGeometries();
      setTrackGeos(geos);
      trackMgr.buildPhysicsColliders(world);

      const trackData = trackMgr.getTrackData();

      // 1b. Track Coins & Energy Orbs
      const coinSys = new CoinSystem(trackData.splinePoints);
      coinSystemRef.current = coinSys;

      // Subscribe Tactical Voice Announcer to radio comms UI
      const unsubVoice = VoiceAnnouncer.subscribe((event) => {
        setRadioComms(event);
      });

      // 2. Gravity Manager
      const gravMgr = new GravityManager();
      const zones = trackData.gravityZones.map((cfg) => new GravityZone(cfg));
      gravMgr.setZones(zones);
      gravityManagerRef.current = gravMgr;

      // 3. Checkpoints
      const cpSys = new CheckpointSystem(trackData.checkpoints, 3);
      checkpointSystemRef.current = cpSys;

      // 4. Vehicle Controller
      const ctrl = new VehicleController();
      controllerRef.current = ctrl;

      ctrl.onCameraToggle(() => {
        setCameraMode((prev) => {
          if (prev === 'chase_close') return 'chase_far';
          if (prev === 'chase_far') return 'hood';
          return 'chase_close';
        });
      });

      ctrl.onPause(() => {
        pauseRace();
      });

      ctrl.onGravitySwitch(() => {
        // Player manual override cycling gravity (for high-level play)
        const currentZone = gravMgr.getActiveZone();
        if (currentZone.type === 'floor') gravMgr.forceZone('right_wall');
        else if (currentZone.type === 'right_wall') gravMgr.forceZone('ceiling');
        else if (currentZone.type === 'ceiling') gravMgr.forceZone('left_wall');
        else gravMgr.forceZone('floor');
      });

      // 5. Spawn Player Vehicle (Grid slot 0)
      const vConfig = VEHICLE_PRESETS[selectedVehicleId];
      const pSpawn = trackData.spawnPositions[0];
      const playerPhysics = new VehiclePhysics(world, pSpawn.position, pSpawn.rotation, vConfig);
      playerPhysicsRef.current = playerPhysics;
      prevPlayerPos.current.copy(playerPhysics.getPosition());

      // 6. Spawn 3 AI Opponents (Grid slots 1, 2, 3)
      const racingLine = new RacingLine(trackData.aiWaypoints);
      const ais: AIController[] = [];

      for (let i = 0; i < 3; i++) {
        const personality = AI_ROSTER[i];
        const spawn = trackData.spawnPositions[i + 1] || trackData.spawnPositions[0];
        // AI vehicle configuration
        const aiVConfig = VEHICLE_PRESETS['velocity-x'];
        const aiCtrl = new AIController(world, spawn.position, spawn.rotation, aiVConfig, personality, racingLine);
        ais.push(aiCtrl);
      }
      aiControllersRef.current = ais;

      // 7. Race Manager
      const raceMgr = new RaceManager(cpSys, 3, {
        onCountdownUpdate: (countdown) => {
          setRaceState({ countdown });
        },
        onPositionUpdate: (position) => {
          setRaceState({ position });
        },
        onLapUpdate: (currentLap, totalLaps, currentLapTime, bestLapTime) => {
          setRaceState({ currentLap, totalLaps, currentLapTime, bestLapTime });
        },
        onRaceFinished: (finalPosition, finalTime, lapTimes) => {
          finishRace(finalPosition, finalTime, lapTimes);
        },
      });
      raceManagerRef.current = raceMgr;

      setIsReady(true);
    };

    initWorld();

    return () => {
      isCancelled = true;
      if (controllerRef.current) {
        controllerRef.current.destroy();
      }
      if (playerPhysicsRef.current && rapierWorldRef.current) {
        playerPhysicsRef.current.destroy(rapierWorldRef.current);
      }
      aiControllersRef.current.forEach((ai) => {
        if (rapierWorldRef.current) ai.destroy(rapierWorldRef.current);
      });
      if (trackManagerRef.current && rapierWorldRef.current) {
        trackManagerRef.current.clearColliders(rapierWorldRef.current);
      }
      if (trackGeos) {
        trackGeos.roadGeometry.dispose();
        trackGeos.barrierGeometry.dispose();
        trackGeos.neonEdgeGeometry.dispose();
        trackGeos.laneLineGeometry.dispose();
      }
    };
  }, [selectedTrackId, selectedVehicleId]);

  // MAIN HIGH-FREQUENCY PHYSICS & SIMULATION LOOP
  useFrame((_, delta) => {
    if (!isReady || currentScreen === 'paused') return;

    const world = rapierWorldRef.current;
    const playerPhysics = playerPhysicsRef.current;
    const gravMgr = gravityManagerRef.current;
    const ctrl = controllerRef.current;
    const cpSys = checkpointSystemRef.current;
    const raceMgr = raceManagerRef.current;
    const ais = aiControllersRef.current;

    if (!world || !playerPhysics || !gravMgr || !ctrl || !cpSys || !raceMgr) return;

    // Deterministic fixed physics timestep (1/60s) with accumulator and delta clamp
    const fixedDt = 1 / 60;
    const clampedDelta = Math.min(0.08, delta);
    physicsAccumulator.current += clampedDelta;

    let latestGravState: ReturnType<typeof gravMgr.update> | null = null;

    // Sub-step physics (capped to max 4 sub-steps to guarantee rock-solid 60 FPS without death-spiral)
    let subSteps = 0;
    while (physicsAccumulator.current >= fixedDt && subSteps < 4) {
      // 1. Update Player inputs & Gravity
      const inputs = ctrl.getInputs();
      if (raceMgr.isCountdownActive && raceMgr.countdownTimer > 0) {
        inputs.throttle = 0;
        inputs.handbrake = true;
      }
      const pPos = playerPhysics.getPosition();
      const pRot = playerPhysics.getRotation();
      const pFwd = playerPhysics.getForward();

      const gravState = gravMgr.update(fixedDt, pPos, pRot, pFwd);
      latestGravState = gravState;

      // 2. Step Player Physics
      const lastPassedCp = cpSys.getCurrentCheckpoint();
      playerPhysics.step(
        fixedDt,
        inputs,
        world,
        gravState.currentGravity,
        gravState.currentNormal,
        gravState.isZeroG,
        lastPassedCp
      );

      // 3. Step 3 AI Opponents
      for (const ai of ais) {
        const aiPos = ai.physics.getPosition();
        const aiGravState = gravMgr.update(fixedDt, aiPos, ai.physics.getRotation(), ai.physics.getForward());
        ai.step(
          fixedDt,
          world,
          aiGravState.currentGravity,
          aiGravState.currentNormal,
          aiGravState.isZeroG,
          lastPassedCp,
          raceMgr.isCountdownActive && raceMgr.countdownTimer > 0
        );
      }

      // 4. Advance Rapier Simulation
      world.step();

      // 4b. Coin Pickups & Audio Rewards
      const coinSys = coinSystemRef.current;
      if (coinSys) {
        coinSys.checkPickups(pPos, (total, amount) => {
          collectCoin(amount, 10);
          playerPhysics.nitro.currentCharge = Math.min(100, playerPhysics.nitro.currentCharge + 10);
        });
      }

      // 4c. Gravity shift voice announcer trigger
      if (gravState.activeZone && gravState.activeZone.type !== prevGravityZoneType.current) {
        prevGravityZoneType.current = gravState.activeZone.type;
        VoiceAnnouncer.announceGravitySwitch(gravState.activeZone.type);
      }

      physicsAccumulator.current -= fixedDt;
      subSteps++;
    }

    // 4d. Nitro voice announcer trigger
    if (playerPhysics.nitro.isActive && Math.random() < 0.006) {
      VoiceAnnouncer.announceNitro();
    }

    // 5. Update Race Manager & Lap/Checkpoint progress
    const currentPPos = playerPhysics.getPosition();
    raceMgr.update(clampedDelta, currentPPos, prevPlayerPos.current, ais);
    prevPlayerPos.current.copy(currentPPos);

    // 6. Throttled UI Telemetry updates (15 times per second to prevent React re-render overhead)
    telemetryTimer.current += clampedDelta;
    if (telemetryTimer.current >= 0.066) {
      telemetryTimer.current = 0;
      const gVec = latestGravState ? latestGravState.currentGravity : gravMgr.getCurrentGravity();
      const gZone = latestGravState?.activeZone || gravMgr.getActiveZone();
      const gZoneName = gZone?.name || 'Standard Ground';
      const isZG = latestGravState ? latestGravState.isZeroG : gZone.isZeroG;

      setTelemetry({
        speedKmh: Math.round(playerPhysics.currentSpeedKmh),
        rpm: Math.round(playerPhysics.engine.rpm),
        gear: playerPhysics.engine.currentGear,
        nitroPercent: Math.round(playerPhysics.nitro.currentCharge),
        gravityVector: [
          Number(gVec.x.toFixed(1)),
          Number(gVec.y.toFixed(1)),
          Number(gVec.z.toFixed(1)),
        ],
        gravityZoneName: gZoneName,
        isGrounded: playerPhysics.isGrounded,
        isZeroG: isZG,
        slipAngle: playerPhysics.currentSteerAngle,
      });
      setRaceState({
        raceTimer: raceMgr.raceTimer,
      });
    }
  });

  if (!isReady || !playerPhysicsRef.current || !trackGeos) {
    return null;
  }

  const trackData = trackManagerRef.current!.getTrackData();

  return (
    <>
      {/* 1. PROCEDURAL SCI-FI CELESTIAL ENVIRONMENT & SKYLINE */}
      <SciFiEnvironment trackId={trackData.id} accentColor={trackData.accentColor} />

      {/* 2. DYNAMIC CINEMATIC SCI-FI LIGHTING SETUP */}
      {/* Soft atmospheric blue-shifted ambient light */}
      <ambientLight color="#93c5fd" intensity={1.3} />

      {/* Primary Key Sunlight / Orbital Spotlight */}
      <directionalLight
        position={[140, 240, 120]}
        intensity={2.4}
        color="#f0f9ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={650}
        shadow-camera-left={-180}
        shadow-camera-right={180}
        shadow-camera-top={180}
        shadow-camera-bottom={-180}
      />

      {/* Cyberpunk City Under-Glow Fill Light */}
      <directionalLight
        position={[-120, -60, -100]}
        intensity={1.1}
        color={trackData.accentColor}
      />

      {/* Atmospheric Fog */}
      <fog attach="fog" args={[trackData.fogColor, 150, 650]} />

      {/* 3. TRACK 3D SURFACE, LANES & BARRIERS */}
      {/* High-Grip Asphalt/Carbon Roadbed */}
      <mesh geometry={trackGeos.roadGeometry} receiveShadow>
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.4}
          roughness={0.45}
        />
      </mesh>

      {/* Center Dashed Neon Lane Dividers */}
      <mesh geometry={trackGeos.laneLineGeometry}>
        <meshBasicMaterial
          color={trackData.accentColor}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Armored Roadside Safety Barriers */}
      <mesh geometry={trackGeos.barrierGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.82}
          roughness={0.28}
        />
      </mesh>

      {/* Glowing Neon Barrier Top Ribbons */}
      <lineSegments geometry={trackGeos.neonEdgeGeometry}>
        <lineBasicMaterial
          color={trackData.accentColor}
          linewidth={2}
        />
      </lineSegments>

      {/* 4. ARCHITECTURAL START/FINISH ARCH & CHECKPOINTS */}
      {trackData.checkpoints.map((cp) => {
        // Calculate 3D orientation matching track surface normal and direction
        const right = new THREE.Vector3().crossVectors(cp.direction, cp.surfaceNormal).normalize();
        const m = new THREE.Matrix4().makeBasis(right, cp.surfaceNormal, cp.direction);
        const quat = new THREE.Quaternion().setFromRotationMatrix(m);

        return (
          <group key={cp.index} position={cp.position} quaternion={quat}>
            {cp.isFinishLine ? (
              // 10-Meter High Architectural Start/Finish Arch
              <group position={[0, 0, 0]}>
                {/* Left Structural Support Pillar */}
                <mesh position={[-cp.width * 0.5 - 0.8, 5.0, 0]} castShadow>
                  <boxGeometry args={[1.2, 10, 1.8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[-cp.width * 0.5 - 1.45, 5.0, 0]}>
                  <boxGeometry args={[0.1, 9.6, 0.4]} />
                  <meshBasicMaterial color={trackData.accentColor} />
                </mesh>

                {/* Right Structural Support Pillar */}
                <mesh position={[cp.width * 0.5 + 0.8, 5.0, 0]} castShadow>
                  <boxGeometry args={[1.2, 10, 1.8]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
                </mesh>
                <mesh position={[cp.width * 0.5 + 1.45, 5.0, 0]}>
                  <boxGeometry args={[0.1, 9.6, 0.4]} />
                  <meshBasicMaterial color={trackData.accentColor} />
                </mesh>

                {/* Overhead Crossbeam Truss */}
                <mesh position={[0, 10.4, 0]} castShadow>
                  <boxGeometry args={[cp.width + 3.2, 1.4, 2.0]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.25} />
                </mesh>

                {/* Digital Start/Finish LED Billboard (Facing approaching drivers) */}
                <mesh position={[0, 10.4, 1.05]}>
                  <boxGeometry args={[cp.width - 2, 1.0, 0.1]} />
                  <meshBasicMaterial color={trackData.accentColor} transparent opacity={0.9} />
                </mesh>

                {/* Overhead Lighting Array */}
                <pointLight
                  color={trackData.accentColor}
                  intensity={4.5}
                  distance={35}
                  position={[0, 9.5, 0]}
                />
              </group>
            ) : (
              // Intermediate Holographic Sector Timing Beacons
              <group position={[0, 0, 0]}>
                {/* Left Holographic Pylon */}
                <mesh position={[-cp.width * 0.5 - 0.6, 2.5, 0]}>
                  <cylinderGeometry args={[0.2, 0.35, 5, 8]} />
                  <meshBasicMaterial color={trackData.accentColor} />
                </mesh>
                {/* Right Holographic Pylon */}
                <mesh position={[cp.width * 0.5 + 0.6, 2.5, 0]}>
                  <cylinderGeometry args={[0.2, 0.35, 5, 8]} />
                  <meshBasicMaterial color={trackData.accentColor} />
                </mesh>
                {/* Overhead Holographic Timing Gate Ribbon */}
                <mesh position={[0, 5.0, 0]}>
                  <boxGeometry args={[cp.width + 1.2, 0.08, 0.2]} />
                  <meshBasicMaterial color={trackData.accentColor} transparent opacity={0.35} />
                </mesh>
                <pointLight
                  color={trackData.accentColor}
                  intensity={1.8}
                  distance={22}
                  position={[0, 3.5, 0]}
                />
              </group>
            )}
          </group>
        );
      })}

      {/* 5. DYNAMIC GRAVITY ZONE VISUAL RINGS */}
      <GravityEffects zones={trackData.gravityZones} />

      {/* 5b. TRACK 3D QUANTUM ENERGY COINS & PICKUPS */}
      <CoinMeshGroup
        coins={coinSystemRef.current?.coins || []}
        accentColor={trackData.accentColor}
      />

      {/* 5c. HIGH-SPEED DRIFT SMOKE & SPARKS */}
      <DriftEffects
        vehiclePos={playerPhysicsRef.current.getPosition()}
        vehicleQuat={playerPhysicsRef.current.getRotation()}
        speedKmh={playerPhysicsRef.current.currentSpeedKmh}
        slipAngle={playerPhysicsRef.current.currentSteerAngle}
        isHandbraking={controllerRef.current?.getInputs().handbrake}
      />

      {/* 6. PLAYER VEHICLE */}
      <Vehicle
        physics={playerPhysicsRef.current}
        vehicleId={selectedVehicleId}
        customization={vehicleCustomization}
        isNitroActive={playerPhysicsRef.current.nitro.isActive}
      />

      {/* 7. 3 AI RACERS */}
      {aiControllersRef.current.map((ai, index) => (
        <Opponent key={index} controller={ai} />
      ))}

      {/* 8. THIRD-PERSON CHASE CAMERA */}
      <ChaseCamera
        physics={playerPhysicsRef.current}
        cameraMode={cameraMode}
        collisionShake={playerPhysicsRef.current.nitro.isActive ? 0.35 : 0}
      />

      {/* 9. SPEED WARP & NITRO PARTICLES */}
      <NitroEffects
        speedKmh={playerPhysicsRef.current.currentSpeedKmh}
        isNitroActive={playerPhysicsRef.current.nitro.isActive}
        vehiclePos={playerPhysicsRef.current.getPosition()}
        vehicleForward={playerPhysicsRef.current.getForward()}
      />
    </>
  );
};
