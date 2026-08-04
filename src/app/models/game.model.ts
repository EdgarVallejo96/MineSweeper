/**
 * Represents the current status of the game session.
 * 'idle': Before the first click.
 * 'playing': Game is active.
 * 'won': Player successfully revealed all non-mine cells.
 * 'lost': Player clicked a mine.
 */
export type GameState = 'idle' | 'playing' | 'won' | 'lost';

/**
 * Standard difficulty presets for Minesweeper.
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert';

/**
 * Configuration for a specific difficulty level.
 */
export interface GameDifficulty {
  /** The identifier for the difficulty */
  level: DifficultyLevel;
  /** Total number of rows on the board */
  rows: number;
  /** Total number of columns on the board */
  cols: number;
  /** Total number of mines to place on the board */
  mines: number;
}

/**
 * Pre-defined configurations for the classic Minesweeper difficulties.
 */
export const DIFFICULTIES: Record<DifficultyLevel, GameDifficulty> = {
  beginner: { level: 'beginner', rows: 9, cols: 9, mines: 10 },
  intermediate: { level: 'intermediate', rows: 16, cols: 16, mines: 40 },
  expert: { level: 'expert', rows: 16, cols: 30, mines: 99 }
};
