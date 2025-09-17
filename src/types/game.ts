export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface GameState {
  score: number;
  stage: number;
  isPlaying: boolean;
  isGameOver: boolean;
  speed: number;
}

export interface Cat {
  position: Position;
  velocity: Position;
  size: Size;
  collisionBox: {
  offset: Position; // Offset from position to actual collision box
  size: Size;       // Actual collision box size
  // optional shape hint for collision tests
  shape?: 'rect' | 'ellipse';
  };
  isJumping: boolean;
  isSliding: boolean;
  sprite: string;
}

export interface Obstacle {
  position: Position;
  size: Size;
  type: 'cactus' | 'rock' | 'bird' | 'dog' | 'mouse' | 'fish' | 'spider' | 'yarn';
}

export enum GamePhase {
  START = 'start',
  PLAYING = 'playing',
  GAME_OVER = 'game_over',
  STAGE_CLEAR = 'stage_clear'
}