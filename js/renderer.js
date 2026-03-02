import { COLS, ROWS, ROW_LABELS } from './encoding.js';

export class CardRenderer {
  /**
   * @param {HTMLElement} container - element to render the card into
   */
  constructor(container) {
    this.container = container;
    this.cursorCol = 0;
    this._onCellClick = null;
    this._cells = []; // cells[col][row]
    this._charCells = []; // decoded char display cells
    this._colNumbers = []; // column number headers
    this._build();
  }

  set onCellClick(fn) {
    this._onCellClick = fn;
  }

  _build() {
    this.container.innerHTML = '';
    this.container.classList.add('punch-card');

    // Top section: decoded characters row
    const charRow = document.createElement('div');
    charRow.className = 'card-char-row';
    // Empty cell for row labels column
    const labelSpacer = document.createElement('div');
    labelSpacer.className = 'row-label spacer';
    charRow.appendChild(labelSpacer);
    this._charCells = [];
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'char-cell';
      cell.dataset.col = col;
      charRow.appendChild(cell);
      this._charCells.push(cell);
    }
    this.container.appendChild(charRow);

    // Column numbers row
    const colNumRow = document.createElement('div');
    colNumRow.className = 'card-col-numbers';
    const numLabelSpacer = document.createElement('div');
    numLabelSpacer.className = 'row-label spacer';
    colNumRow.appendChild(numLabelSpacer);
    this._colNumbers = [];
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'col-num';
      // Show numbers at intervals: 1, 5, 10, 15, ... 80
      const num = col + 1;
      if (num === 1 || num % 10 === 0) {
        cell.textContent = num;
      } else if (num % 5 === 0) {
        cell.textContent = num;
      }
      colNumRow.appendChild(cell);
      this._colNumbers.push(cell);
    }
    this.container.appendChild(colNumRow);

    // Grid section: 12 rows x 80 cols
    this._cells = Array.from({ length: COLS }, () => []);
    const grid = document.createElement('div');
    grid.className = 'card-grid';

    for (let row = 0; row < ROWS; row++) {
      // Row label
      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = ROW_LABELS[row];
      grid.appendChild(label);

      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.col = col;
        cell.dataset.row = row;
        cell.addEventListener('click', () => {
          if (this._onCellClick) this._onCellClick(col, row);
        });
        grid.appendChild(cell);
        this._cells[col][row] = cell;
      }
    }
    this.container.appendChild(grid);
  }

  /**
   * Update the rendering from a PunchCard
   * @param {import('./card.js').PunchCard} card
   */
  render(card) {
    for (let col = 0; col < COLS; col++) {
      // Update punched state
      for (let row = 0; row < ROWS; row++) {
        const cell = this._cells[col][row];
        cell.classList.toggle('punched', card.isPunched(col, row));
      }
      // Update decoded character
      const ch = card.decodeCharAt(col);
      this._charCells[col].textContent = ch;
    }
    this.updateCursor(this.cursorCol);
  }

  /**
   * Update cursor position highlight
   * @param {number} col
   */
  updateCursor(col) {
    // Remove old cursor
    const oldCursor = this.container.querySelectorAll('.cursor');
    oldCursor.forEach(el => el.classList.remove('cursor'));

    this.cursorCol = col;
    if (col >= 0 && col < COLS) {
      // Highlight the entire column
      this._charCells[col].classList.add('cursor');
      for (let row = 0; row < ROWS; row++) {
        this._cells[col][row].classList.add('cursor');
      }
    }
  }
}

/**
 * Render a mini thumbnail of a card for the deck overview
 * @param {import('./card.js').PunchCard} card
 * @param {number} index
 * @param {boolean} isCurrent
 * @returns {HTMLElement}
 */
export function renderCardThumbnail(card, index, isCurrent) {
  const thumb = document.createElement('div');
  thumb.className = 'card-thumbnail' + (isCurrent ? ' current' : '');
  thumb.dataset.index = index;

  const label = document.createElement('div');
  label.className = 'thumb-label';
  label.textContent = `Card ${index + 1}`;
  thumb.appendChild(label);

  const text = document.createElement('div');
  text.className = 'thumb-text';
  text.textContent = card.readText().substring(0, 40) || '(blank)';
  thumb.appendChild(text);

  // Mini grid visualization
  const miniGrid = document.createElement('canvas');
  miniGrid.className = 'thumb-grid';
  miniGrid.width = 160;
  miniGrid.height = 24;
  const ctx = miniGrid.getContext('2d');
  ctx.fillStyle = '#3E2723';
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (card.isPunched(col, row)) {
        ctx.fillRect(col * 2, row * 2, 1.5, 1.5);
      }
    }
  }
  thumb.appendChild(miniGrid);

  return thumb;
}
