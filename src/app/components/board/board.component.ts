import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { CellComponent } from '../cell/cell.component';

/**
 * Component responsible for rendering the Minesweeper game board.
 * It subscribes to the game state and handles user interactions on the grid.
 */
@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, CellComponent],
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent {
  /** Service providing the game logic and state */
  gameService = inject(GameService);
  
  /** Observable stream of the current board grid */
  board$ = this.gameService.board;
  
  /** Observable stream of the current game difficulty configuration */
  difficulty$ = this.gameService.difficulty;

  /**
   * Handles a standard left-click on a cell to reveal it.
   */
  onCellClick(x: number, y: number) {
    this.gameService.revealCell(x, y);
  }

  /**
   * Handles a right-click on a cell to toggle its flag status.
   */
  onCellRightClick(x: number, y: number) {
    this.gameService.toggleFlag(x, y);
  }
}
