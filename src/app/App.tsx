import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { IntroScreen } from '../ui/IntroScreen';
import { MainMenu } from '../ui/MainMenu';
import { CareerMode } from '../ui/CareerMode';
import { Garage } from '../ui/Garage';
import { TrackSelection } from '../ui/TrackSelection';
import { Settings } from '../ui/Settings';
import { HowToPlay } from '../ui/HowToPlay';
import { Credits } from '../ui/Credits';
import { HUD } from '../ui/HUD';
import { PauseMenu } from '../ui/PauseMenu';
import { ResultsScreen } from '../ui/ResultsScreen';
import { GameCanvas } from '../game/GameCanvas';
import { PerformanceMonitor } from '../systems/PerformanceMonitor';

export const App: React.FC = () => {
  const { currentScreen, setFps } = useGameStore();

  useEffect(() => {
    const monitor = new PerformanceMonitor();
    let animId: number;

    const loop = () => {
      monitor.update((fps) => {
        setFps(fps);
      });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [setFps]);

  // Determine screen rendering
  const renderScreen = () => {
    switch (currentScreen) {
      case 'intro':
        return <IntroScreen />;
      case 'main_menu':
        return <MainMenu />;
      case 'career':
        return <CareerMode />;
      case 'garage':
        return <Garage />;
      case 'track_select':
        return <TrackSelection />;
      case 'settings':
        return <Settings />;
      case 'how_to_play':
        return <HowToPlay />;
      case 'credits':
        return <Credits />;
      case 'racing':
        return (
          <>
            <GameCanvas />
            <HUD />
          </>
        );
      case 'paused':
        return (
          <>
            <GameCanvas />
            <HUD />
            <PauseMenu />
          </>
        );
      case 'results':
        return (
          <>
            <GameCanvas />
            <ResultsScreen />
          </>
        );
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#101820]">
      {renderScreen()}
    </div>
  );
};
