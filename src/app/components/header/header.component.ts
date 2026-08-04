import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { DifficultyLevel } from '../../models/game.model';
import { map, combineLatest } from 'rxjs';

/**
 * Component displaying the game's top bar, including the remaining mines counter,
 * the reset button (smiley face), the timer, and difficulty selection.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  /** Service providing the game logic and state */
  gameService = inject(GameService);
  
  /** Observable of the current game state (e.g., 'playing', 'won', 'lost') */
  gameState$ = this.gameService.gameState;
  
  /** Observable of the current elapsed time in seconds */
  timer$ = this.gameService.timer;
  
  /** Observable of the current difficulty configuration */
  difficulty$ = this.gameService.difficulty;
  
  /** 
   * Observable calculating the remaining unflagged mines.
   * Derived by subtracting placed flags from total mines.
   */
  minesRemaining$ = combineLatest([
    this.gameService.difficulty,
    this.gameService.flagsCount
  ]).pipe(
    map(([diff, flags]) => diff.mines - flags)
  );

  /** Options for the difficulty dropdown */
  difficulties: { label: string, value: DifficultyLevel }[] = [
    { label: 'Beginner', value: 'beginner' },
    { label: 'Intermediate', value: 'intermediate' },
    { label: 'Expert', value: 'expert' }
  ];

  /** Currently selected difficulty level */
  selectedDifficulty: DifficultyLevel = 'beginner';

  constructor() {
    // Keep the local selectedDifficulty in sync with the service's state
    this.difficulty$.subscribe(diff => {
      this.selectedDifficulty = diff.level;
    });
  }

  /**
   * Changes the game difficulty and starts a new game.
   */
  onDifficultyChange(level: DifficultyLevel) {
    this.gameService.setDifficulty(level);
  }

  /**
   * Restarts the game with the current difficulty settings.
   */
  resetGame() {
    this.gameService.resetGame();
  }

  /**
   * Returns an emoji representing the game state for the reset button.
   */
  getFaceIcon(state: string): string {
    switch(state) {
      case 'won': return '😎';
      case 'lost': return '😵';
      default: return '🙂';
    }
  }

  /**
   * Formats a number to a standard 3-digit string (e.g., '005', '-02').
   * Used for the classic Minesweeper LCD display styling.
   */
  formatNumber(num: number): string {
    if (num < 0) return '-' + Math.abs(num).toString().padStart(2, '0');
    return num.toString().padStart(3, '0');
  }
}
