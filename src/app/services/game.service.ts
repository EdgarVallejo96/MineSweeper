import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { Cell } from '../models/cell.model';
import { GameState, DifficultyLevel, GameDifficulty, DIFFICULTIES } from '../models/game.model';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // BehaviorSubjects to hold current state and emit changes to subscribers
  private board$ = new BehaviorSubject<Cell[][]>([]);
  private gameState$ = new BehaviorSubject<GameState>('idle');
  private difficulty$ = new BehaviorSubject<GameDifficulty>(DIFFICULTIES.beginner);
  private flagsCount$ = new BehaviorSubject<number>(0);
  private timer$ = new BehaviorSubject<number>(0);
  private timerSub?: Subscription;

  // Expose state as observables for components to subscribe to without being able to modify them directly
  public board = this.board$.asObservable();
  public gameState = this.gameState$.asObservable();
  public difficulty = this.difficulty$.asObservable();
  public flagsCount = this.flagsCount$.asObservable();
  public timer = this.timer$.asObservable();

  // Tracks if the user is making their first move to ensure they don't hit a mine instantly
  private isFirstClick = true;

  constructor() {
    this.initBoard();
  }

  /**
   * Updates the game difficulty and resets the game state.
   */
  setDifficulty(level: DifficultyLevel) {
    this.difficulty$.next(DIFFICULTIES[level]);
    this.resetGame();
  }

  /**
   * Resets all game variables to their initial state for a new game.
   */
  resetGame() {
    this.stopTimer();
    this.timer$.next(0);
    this.gameState$.next('idle');
    this.flagsCount$.next(0);
    this.isFirstClick = true;
    this.initBoard();
  }

  /**
   * Initializes an empty board based on the current difficulty's dimensions.
   */
  private initBoard() {
    const diff = this.difficulty$.getValue();
    const newBoard: Cell[][] = [];
    for (let y = 0; y < diff.rows; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < diff.cols; x++) {
        row.push({
          x,
          y,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        });
      }
      newBoard.push(row);
    }
    this.board$.next(newBoard);
  }

  /**
   * Places mines randomly on the board, ensuring the first click and its surroundings are safe.
   */
  private placeMines(firstClickX: number, firstClickY: number) {
    const diff = this.difficulty$.getValue();
    const board = this.board$.getValue();

    // Ensure the first click and TWO rings of neighbors contain no mines.
    // The inner ring (radius 1) will have neighborMines === 0, which triggers
    // the flood fill to cascade outward and reveal a satisfying opening area.
    // The outer ring (radius 2) acts as a buffer so the inner cells stay at 0.
    const safeZone = new Set<string>();
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = firstClickX + dx;
        const ny = firstClickY + dy;
        if (ny >= 0 && ny < diff.rows && nx >= 0 && nx < diff.cols) {
          safeZone.add(`${nx},${ny}`);
        }
      }
    }

    // Place mines randomly, avoiding cells in the safe zone
    let minesPlaced = 0;
    while (minesPlaced < diff.mines) {
      const x = Math.floor(Math.random() * diff.cols);
      const y = Math.floor(Math.random() * diff.rows);

      // Only place a mine if the cell doesn't already have one and isn't in the safe zone
      if (!board[y][x].isMine && !safeZone.has(`${x},${y}`)) {
        board[y][x].isMine = true;
        minesPlaced++;
      }
    }

    // Pre-calculate the number of adjacent mines for each non-mine cell
    this.calculateNeighbors(board, diff.cols, diff.rows);
  }

  /**
   * Calculates and stores the number of adjacent mines for every safe cell on the board.
   */
  private calculateNeighbors(board: Cell[][], cols: number, rows: number) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (!board[y][x].isMine) {
          let count = 0;
          // Check all 8 neighboring cells
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              // If neighbor is within bounds and is a mine, increment count
              if (ny >= 0 && ny < rows && nx >= 0 && nx < cols && board[ny][nx].isMine) {
                count++;
              }
            }
          }
          board[y][x].neighborMines = count;
        }
      }
    }
  }

  /**
   * Handles user clicks to reveal a cell. Clicking an already-revealed numbered
   * cell instead attempts a "chord" reveal of its unflagged neighbors.
   */
  revealCell(x: number, y: number) {
    const state = this.gameState$.getValue();
    // Do nothing if game is already over
    if (state === 'won' || state === 'lost') return;

    const board = this.board$.getValue();
    const cell = board[y][x];

    if (cell.isRevealed) {
      // Chording only makes sense on numbered cells
      if (cell.neighborMines > 0) {
        this.chordReveal(board, x, y);
        this.board$.next(board.map(row => row.map(c => ({ ...c }))));
      }
      return;
    }

    // Do nothing if cell is flagged by the user
    if (cell.isFlagged) return;

    // On the very first click, we generate the mines ensuring the player doesn't lose instantly
    if (this.isFirstClick) {
      this.isFirstClick = false;
      this.gameState$.next('playing');
      this.placeMines(x, y);
      this.startTimer();
    }

    this.revealSingleCell(board, x, y);
    if (this.gameState$.getValue() !== 'lost') {
      this.checkWinCondition(board);
    }

    // Broadcast the updated board state as new cell objects so Angular detects the change
    this.board$.next(board.map(row => row.map(cell => ({ ...cell }))));
  }

  /**
   * Reveals a single cell: ends the game if it's a mine, otherwise marks it
   * revealed and cascades through connected blank neighbors.
   */
  private revealSingleCell(board: Cell[][], x: number, y: number) {
    const cell = board[y][x];

    if (cell.isMine) {
      // Player revealed a mine, end the game
      this.gameState$.next('lost');
      this.stopTimer();
      this.revealAllMines(board);
      return;
    }

    cell.isRevealed = true;

    // If the cell is blank (no mine, no number), reveal all connected blank neighbors
    if (cell.neighborMines === 0) {
      this.revealNeighborCells(board, x, y);
    }
  }

  /**
   * Chords a revealed numbered cell: if the number of flagged neighbors matches
   * the cell's number, reveals all remaining unflagged neighbors at once.
   * If a flag was misplaced, this can reveal a mine and lose the game.
   */
  private chordReveal(board: Cell[][], x: number, y: number) {
    const diff = this.difficulty$.getValue();
    const cell = board[y][x];

    const neighbors: { x: number, y: number }[] = [];
    let flaggedCount = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (ny < 0 || ny >= diff.rows || nx < 0 || nx >= diff.cols) continue;

        const neighbor = board[ny][nx];
        if (neighbor.isFlagged) flaggedCount++;
        neighbors.push({ x: nx, y: ny });
      }
    }

    // Only reveal if the surrounding flags match the cell's number
    if (flaggedCount !== cell.neighborMines) return;

    for (const n of neighbors) {
      const neighbor = board[n.y][n.x];
      if (neighbor.isRevealed || neighbor.isFlagged) continue;

      this.revealSingleCell(board, n.x, n.y);
      if (this.gameState$.getValue() === 'lost') return;
    }

    this.checkWinCondition(board);
  }

  /**
   * Toggles a flag on a cell to mark a suspected mine.
   */
  toggleFlag(x: number, y: number) {
    const state = this.gameState$.getValue();
    if (state === 'won' || state === 'lost') return;

    const board = this.board$.getValue();
    const cell = board[y][x];

    // Cannot flag an already revealed cell
    if (cell.isRevealed) return;

    const currentFlags = this.flagsCount$.getValue();

    // Toggle flag and update the counter
    if (!cell.isFlagged) {
      cell.isFlagged = true;
      this.flagsCount$.next(currentFlags + 1);
    } else {
      cell.isFlagged = false;
      this.flagsCount$.next(currentFlags - 1);
    }

    this.board$.next(board.map(row => row.map(cell => ({ ...cell }))));
  }

  /**
   * Reveals all neighboring cells of a blank cell (one with neighborMines === 0).
   * If a neighbor is also blank, its neighbors are added to the stack too.
   * This continues until every connected blank cell — and the numbered border
   * cells surrounding them — have been revealed.
   */
  private revealNeighborCells(board: Cell[][], startX: number, startY: number) {
    const diff = this.difficulty$.getValue();
    const stack: { x: number, y: number }[] = [];

    // Seed the stack with the 8 neighbors of the initially clicked blank cell
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dy === 0 && dx === 0) continue; // skip the clicked cell itself
        stack.push({ x: startX + dx, y: startY + dy });
      }
    }

    while (stack.length > 0) {
      const current = stack.pop()!;
      const cx = current.x;
      const cy = current.y;

      // Skip out-of-bounds cells
      if (cy < 0 || cy >= diff.rows || cx < 0 || cx >= diff.cols) continue;

      const c = board[cy][cx];
      // Skip if already revealed, flagged, or is a mine
      if (c.isRevealed || c.isFlagged || c.isMine) continue;

      // Reveal this neighbor
      c.isRevealed = true;

      // If this neighbor is also blank, add ITS neighbors to keep expanding
      if (c.neighborMines === 0) {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue;
            stack.push({ x: cx + dx, y: cy + dy });
          }
        }
      }
      // If c.neighborMines > 0 (numbered cell), it gets revealed but we DON'T expand further.
      // This is what stops the cascade — numbered cells act as the boundary.
    }
  }

  /**
   * Reveals all mines on the board (used when game is lost).
   */
  private revealAllMines(board: Cell[][]) {
    for (let row of board) {
      for (let cell of row) {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      }
    }
  }

  /**
   * Checks if all safe cells have been revealed.
   */
  private checkWinCondition(board: Cell[][]) {
    const diff = this.difficulty$.getValue();
    let revealedCount = 0;

    // Count how many cells have been revealed
    for (let row of board) {
      for (let cell of row) {
        if (cell.isRevealed) revealedCount++;
      }
    }

    // If total revealed equals total cells minus total mines, player wins
    if (revealedCount === (diff.rows * diff.cols) - diff.mines) {
      this.gameState$.next('won');
      this.stopTimer();
      // Auto-flag all remaining mines for visual completeness
      for (let row of board) {
        for (let cell of row) {
          if (cell.isMine && !cell.isFlagged) {
            cell.isFlagged = true;
          }
        }
      }
      this.flagsCount$.next(diff.mines);
    }
  }

  /**
   * Starts the game timer, counting up every second.
   */
  private startTimer() {
    this.timerSub?.unsubscribe();
    this.timerSub = interval(1000).subscribe(() => {
      const current = this.timer$.getValue();
      // Cap timer at 999
      if (current < 999) {
        this.timer$.next(current + 1);
      }
    });
  }

  /**
   * Stops the game timer.
   */
  private stopTimer() {
    this.timerSub?.unsubscribe();
  }
}
