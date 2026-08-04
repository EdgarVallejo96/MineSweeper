import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cell } from '../../models/cell.model';

/**
 * Component representing a single interactive cell on the Minesweeper board.
 */
@Component({
  selector: 'app-cell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell.component.html',
  styleUrls: ['./cell.component.scss']
})
export class CellComponent {
  /** The cell data containing its state (revealed, mine, flagged, etc.) */
  @Input() cell!: Cell;
  
  /** Event emitted when the user left-clicks the cell */
  @Output() cellClick = new EventEmitter<void>();
  
  /** Event emitted when the user right-clicks the cell */
  @Output() cellRightClick = new EventEmitter<Event>();

  /**
   * Triggers the cellClick event.
   */
  onClick() {
    this.cellClick.emit();
  }

  /**
   * Prevents the default context menu and triggers the cellRightClick event.
   */
  onRightClick(event: Event) {
    event.preventDefault();
    this.cellRightClick.emit(event);
  }
}
