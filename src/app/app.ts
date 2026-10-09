import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { BoardComponent } from './components/board/board.component';
import { CommonModule } from '@angular/common';

/**
 * The root component of the Minesweeper application.
 * It serves as the main container for the Header and Board components.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  /** The title of the application */
  title = 'Minesweeper';
}
