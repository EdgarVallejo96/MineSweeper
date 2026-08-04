/**
 * Represents a single cell on the Minesweeper board.
 */
export interface Cell {
  /** The 0-indexed column position of the cell */
  x: number;
  /** The 0-indexed row position of the cell */
  y: number;
  /** Whether this cell contains a mine */
  isMine: boolean;
  /** Whether the user has revealed this cell */
  isRevealed: boolean;
  /** Whether the user has flagged this cell as a suspected mine */
  isFlagged: boolean;
  /** The number of adjacent mines (0-8) */
  neighborMines: number;
}
