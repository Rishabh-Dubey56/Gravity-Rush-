import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameWorld } from './GameWorld';
import { useGameStore } from '../store/gameStore';

export const GameCanvas: React.FC = () => {
  const { saveData, raceSessionId } = useGameStore();
  const quality = saveData.settings.graphicsQuality || 'high';

  const dpr = quality === 'high' ? Math.min(2, window.devicePixelRatio) : quality === 'medium' ? 1.5 : 1.0;
  const shadows = quality !== 'low';

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas
        shadows={shadows}
        dpr={dpr}
        camera={{ position: [0, 5, -10], fov: 68, near: 0.2, far: 1400 }}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a101a');
        }}
      >
        <Suspense fallback={null}>
          <GameWorld key={raceSessionId} />
        </Suspense>
      </Canvas>
    </div>
  );
};
