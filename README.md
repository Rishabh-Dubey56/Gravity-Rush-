# GRAVITY RUSH
### DEFY GRAVITY. CONTROL THE IMPOSSIBLE.

A premier, high-octane 3D browser-based futuristic anti-gravity racing game engineered with **React**, **Three.js**, **React Three Fiber**, and **Dimforge Rapier3D WebAssembly Physics**.

---

## ⚡ Game Overview

**GRAVITY RUSH** is an advanced single-player anti-gravity racing simulator featuring competitive AI opponents, dynamic multi-surface gravitational transitions, wall and 180° inverted ceiling driving, zero-gravity vacuum jumps, vehicle customization, and five fully playable 3D circuits.

Unlike arcade games that merely rotate the camera or lock vehicles to predetermined paths, **GRAVITY RUSH implements true physical gravity vectors** acting directly upon rigid bodies, simulated with a fixed 1/60-second Rapier timestep and raycast spring suspension.

---

## 🚀 Key Features

### 1. Dynamic Rapier 3D Gravity Physics
- **True Rigid-Body Gravity Vector Field**: Gravity dynamically orients to track surfaces:
  - **Standard Floor**: `(0, -28, 0)` m/s²
  - **90° Right Wall**: `(28, 0, 0)` m/s²
  - **180° Inverted Ceiling**: `(0, 28, 0)` m/s²
  - **90° Left Wall**: `(-28, 0, 0)` m/s²
  - **Zero-Gravity Vacuum**: `(0, 0, 0)` m/s² with 6DOF attitude thrusters and inertial drift
- **Smooth Quaternion Slerp Transitions**: Vehicle and camera seamlessly interpolate reference frames without Gimbal lock or abrupt physics impulses.
- **Surface Adhesion & Downforce**: Aerodynamic downforce proportional to speed squared ($F = \frac{1}{2} \rho C_L A v^2$) plus magnetic wall adhesion prevents vehicles from flinging off vertical surfaces.

### 2. 4-Wheel Raycast Suspension & Tire Model
- **Independent Suspension Struts**: Four wheel raycasts calculate spring compression and damping:
  $$F = kx + cv$$
- **Tire Traction & Drifting**: Longitudinal drive and lateral grip resisting slip angle. Engaging the handbrake (`Shift`) drops lateral friction coefficient for controlled high-speed power-sliding.
- **Multi-Gear Transmission & Engine Audio**: Automatic 6-speed transmission + Reverse with dynamic RPM calculation and gear shift audio triggers.

### 3. Five Unique 3D Circuits
1. **NEON METROPOLIS**: Cyberpunk mega-skyline featuring elevated highways, 90° right wall ride along illuminated skyscraper glass, and high-speed tunnel chicane.
2. **INFERNO CIRCUIT**: Geothermal industrial reactor with glowing molten conduits and a complete 360° vertical loop inversion.
3. **FROSTBITE**: Sub-zero alpine research facility with reduced ice friction, cavern hairpin turns, and steep vertical cliff climbs.
4. **ORBITAL ZERO**: Deep space orbital station featuring zero-gravity vacuum gaps, magnetic capture rings, and solar array decks.
5. **SINGULARITY**: Tachyon particle megastructure with continuous floor-to-wall-to-inverted-ceiling racing around a black hole event horizon.

### 4. Competitive AI Opponents
- **Three Distinct AI Personalities**:
  - **SPEEDSTER**: High acceleration, aggressive nitro usage, high top-speed bias.
  - **TECHNICIAN**: Precise apex targeting, smooth braking, clean cornering lines.
  - **CHALLENGER**: Tactical overtaker, high corner aggression, reactive nitro bursts.
- **Real Physics & Navigation**: AI vehicles run the same Rapier rigid body physics, suspension, and gravity zones as the player.

### 5. Procedural Web Audio API Sound Engine
- **Zero Missing Assets**: Synthesizes all audio client-side using Web Audio API:
  - Multi-oscillator sawtooth/sub engine rumble modulated by RPM and throttle.
  - Resonant bandpass tire screech and drift smoke audio.
  - Frequency-swept plasma nitro boost whoosh.
  - Dual-harmonic checkpoint chimes and countdown beeps.
  - Dynamic arpeggiated synthwave racing pulse music.

### 6. Vehicle Garage & Career Progression
- **3 Vehicle Presets**:
  - **VELOCITY X**: Balanced anti-grav hybrid (295 km/h, 950 kg).
  - **PHANTOM GT**: High-speed interceptor (345 km/h, 860 kg).
  - **TITAN R**: Heavy gravity anchor with maximum downforce (270 km/h, 1280 kg).
- **Customization Matrix**: Body paint, wheel rim neon glow, nitro plasma trail, and performance profiles.
- **Persistent Save System**: Versioned localStorage schema with automated migration and corrupted data recovery.

---

## 🕹️ Controls Guide

| Key | Action | Description |
| :--- | :--- | :--- |
| **W / ↑** | **Accelerate** | Engages engine throttle and forward wheel traction |
| **S / ↓** | **Brake / Reverse** | Applies 4-wheel disc braking; reverses at zero speed |
| **A / D / ← / →** | **Steer** | Steers front wheels with speed-sensitive sensitivity |
| **Space** | **Nitro Boost** | Activates dual plasma thrusters for extreme acceleration |
| **Shift** | **Drift / Handbrake** | Unlocks rear wheels to slide around sharp hairpins |
| **G** | **Gravity Switch** | Manual gravity zone cycle override |
| **R** | **Vehicle Recovery** | Resets vehicle to last valid checkpoint if stuck or flipped |
| **C** | **Change Camera** | Toggles Chase Close, Chase Far, and Hood view |
| **Escape** | **Pause** | Opens race pause menu |

---

## 🏗️ Project Architecture

```
src/
  app/
    App.tsx                 # Screen router & root layout
    router.tsx              # Application route configurations

  game/
    GameCanvas.tsx          # Three.js R3F Canvas with adaptive quality & DPR
    GameWorld.tsx           # Rapier physics world, loop & scene manager

    vehicle/
      Vehicle.tsx           # 3D vehicle visual model with animated wheels & lights
      VehiclePhysics.ts     # Rapier rigid body, aero downforce & drag simulator
      VehicleController.ts  # Input listener with clean cleanup
      Suspension.ts         # Raycast spring & damper struts (F = kx + cv)
      TireModel.ts          # Friction circle, slip angle & lateral grip
      EngineSystem.ts       # 6-speed automatic transmission & RPM curve
      NitroSystem.ts        # Nitro boost consumption & recharge logic
      VehicleRecovery.ts    # Out-of-bounds & upside-down recovery

    gravity/
      GravityManager.ts     # Zone detection & local gravitational acceleration
      GravityZone.ts        # Zone boundaries, surface normals & gravity vectors
      GravityTransition.ts  # Smooth quaternion slerp transition logic

    camera/
      ChaseCamera.tsx       # Local-up chase camera stable on walls & ceilings

    tracks/
      TrackConfig.ts        # CatmullRom track spline mathematical curves
      TrackManager.ts       # Procedural road mesh & Rapier trimesh colliders
      CheckpointSystem.ts   # Checkpoint plane crossing & lap validation
      tracks/
        NeonMetropolis.tsx  # Track 01 - Cyber Skyline
        InfernoCircuit.tsx  # Track 02 - Reactor Loop
        Frostbite.tsx       # Track 03 - Glacial Cliff
        OrbitalZero.tsx     # Track 04 - Space Station Zero-G
        Singularity.tsx     # Track 05 - Championship Inverted Megastructure

    ai/
      AIController.ts       # Look-ahead steering & speed modulation
      RacingLine.ts         # Optimal waypoint trajectory calculation
      Opponent.tsx          # 3D visual AI racer model

    race/
      RaceManager.ts        # Countdown, timing, rankings & finish detection
      LapSystem.ts          # Lap splits & best time recording
      RankingSystem.ts      # Real-time multi-agent positional hierarchy

    audio/
      AudioManager.ts       # Web Audio API engine synth & sound effects

    effects/
      NitroEffects.tsx      # Warp speed lines & plasma particle emitters
      GravityEffects.tsx    # Holographic gravity portal rings

  ui/
    IntroScreen.tsx         # Cinematic intro & Start action
    MainMenu.tsx            # Main hub with 3D interactive vehicle preview
    CareerMode.tsx          # 5-track progression tree & rewards
    Garage.tsx              # Vehicle specs & visual customization
    TrackSelection.tsx      # 5 track preview cards & lap selectors
    HUD.tsx                 # Speedometer, tachometer, gravity indicator & minimap
    PauseMenu.tsx           # In-race pause options
    ResultsScreen.tsx       # Podium finish, lap splits & credit rewards
    Settings.tsx            # Volume sliders, graphics quality & display toggles
    HowToPlay.tsx           # Controls manual & gravitational dynamics guide
    Credits.tsx             # Technology stack & engine credits

  store/
    gameStore.ts            # Zustand shared state & reactive telemetry

  systems/
    SaveSystem.ts           # Schema-versioned localStorage persistence
    PerformanceMonitor.ts   # Dynamic 60 FPS counter

  styles/
    globals.css             # Tailwind CSS & futuristic cyberpunk shaders

tests/
  gravity.test.ts           # Unit tests for gravity vector fields & slerp
  race.test.ts              # Checkpoint progression, laps & ranking tests
  save.test.ts              # Save persistence & data migration tests
```

---

## 🛠️ Technology Stack

- **Runtime & UI**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 5](https://vitejs.dev/) with optimized manual chunking
- **3D Graphics**: [Three.js](https://threejs.org/), [React Three Fiber (R3F)](https://docs.pmnd.rs/react-three-fiber), [@react-three/drei](https://github.com/pmndrs/drei)
- **Physics**: [@dimforge/rapier3d-compat](https://rapier.rs/) (WebAssembly 3D Physics Engine)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Audio**: Procedural Web Audio API synthesis
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
- **Testing**: [Vitest](https://vitest.dev/)

---

## 📦 Installation & Development

### Prerequisites
- Node.js >= 18
- npm >= 9

### Setup
```bash
# Clone the repository
git clone https://github.com/sandeepdubey/gravity-rush.git
cd gravity-rush

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Run Unit Tests
```bash
npm test
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 🚀 Deployment (Vercel)

The project includes `vercel.json` configured with:
- SPA rewrite rules (`/(.*) -> /index.html`)
- Strict security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`)
- 1-year immutable caching for static assets in `/assets/`

To deploy:
```bash
vercel --prod
```

---

## 🏆 Hackathon Acceptance Criteria Checklist

- [x] Launches smoothly in browser with zero console errors.
- [x] Full main menu navigation (Play, Career, Garage, Track Select, Settings, How to Play, Credits).
- [x] Real 3D vehicle control with responsive acceleration, steering, and braking.
- [x] 4-wheel raycast spring suspension ($F = kx + cv$).
- [x] Dynamic Rapier gravity physics influencing rigid bodies (Floor, Right Wall, Ceiling, Left Wall, Zero-G).
- [x] 90° Wall and 180° Inverted Ceiling driving supported by downforce and surface adhesion.
- [x] Zero-gravity orbital vacuum zones with 6DOF attitude thrusters.
- [x] Third-person chase camera aligned to vehicle local-up with speed-dependent dynamic FOV.
- [x] Nitro boost system with particle flares and camera speed lines.
- [x] 3 competitive AI opponents running physical vehicles and racing lines.
- [x] All 5 unique circuits drivable and tested (Neon Metropolis, Inferno Circuit, Frostbite, Orbital Zero, Singularity).
- [x] Checkpoint plane crossing validation, lap tracking, and multi-agent position rankings.
- [x] Vehicle garage with 3 vehicle presets, real-time 3D inspection, and paint/wheel/trail customizations.
- [x] Career progression with podium unlock requirements and rewards.
- [x] Procedural Web Audio API sound engine (engine revs, nitro whoosh, drift screech, checkpoint chimes, synthwave music).
- [x] Graphics quality presets (Low, Medium, High) and FPS monitor.
- [x] Save data persistence with schema versioning and corruption recovery.
- [x] Clean production build with optimized asset chunks and Vercel configuration.

---

## 📄 License

MIT License. Built for the Google Antigravity Hackathon 2026.
