import { GameScreen } from '../store/gameStore';

export interface RouteConfig {
  path: string;
  screen: GameScreen;
}

export const GAME_ROUTES: RouteConfig[] = [
  { path: '/', screen: 'intro' },
  { path: '/menu', screen: 'main_menu' },
  { path: '/career', screen: 'career' },
  { path: '/garage', screen: 'garage' },
  { path: '/tracks', screen: 'track_select' },
  { path: '/race', screen: 'racing' },
  { path: '/settings', screen: 'settings' },
  { path: '/how-to-play', screen: 'how_to_play' },
  { path: '/credits', screen: 'credits' },
];
