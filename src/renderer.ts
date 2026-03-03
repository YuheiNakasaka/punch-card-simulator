import { COLS, ROWS, ROW_LABELS } from './encoding';
import { PunchCard } from './card';
import { t } from './i18n';

export class CardRenderer {
  container: HTMLElement;
  cursorCol: number;
  private _onCellClick: ((col: number, row: number) => void) | null;
  private _cells: HTMLDivElement[][]; // cells[col][row]
  private _charCells: HTMLDivElement[];
  private _colNumbers: HTMLDivElement[];

  constructor(container: HTMLElement) {
    this.container = container;
    this.cursorCol = 0;
    this._onCellClick = null;
    this._cells = [];
    this._charCells = [];
    this._colNumbers = [];
    this._build();
  }

  set onCellClick(fn: (col: number, row: number) => void) {
    this._onCellClick = fn;
  }

  private _build(): void {
    this.container.innerHTML = '';
    this.container.classList.add('punch-card');

    // Top section: decoded characters row
    const charRow = document.createElement('div');
    charRow.className = 'card-char-row';
    const labelSpacer = document.createElement('div');
    labelSpacer.className = 'row-label spacer';
    charRow.appendChild(labelSpacer);
    this._charCells = [];
    for (let col = 0; col < COLS; col++) {
      const cell = document.createElement('div');
      cell.className = 'char-cell';
      cell.dataset.col = String(col);
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
      const num = col + 1;
      if (num === 1 || num % 10 === 0) {
        cell.textContent = String(num);
      } else if (num % 5 === 0) {
        cell.textContent = String(num);
      }
      colNumRow.appendChild(cell);
      this._colNumbers.push(cell);
    }
    this.container.appendChild(colNumRow);

    // Grid section: 12 rows x 80 cols
    this._cells = Array.from({ length: COLS }, () => [] as HTMLDivElement[]);
    const grid = document.createElement('div');
    grid.className = 'card-grid';

    for (let row = 0; row < ROWS; row++) {
      const label = document.createElement('div');
      label.className = 'row-label';
      label.textContent = ROW_LABELS[row];
      grid.appendChild(label);

      for (let col = 0; col < COLS; col++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        cell.dataset.col = String(col);
        cell.dataset.row = String(row);
        cell.addEventListener('click', () => {
          if (this._onCellClick) this._onCellClick(col, row);
        });
        grid.appendChild(cell);
        this._cells[col][row] = cell;
      }
    }
    this.container.appendChild(grid);
  }

  render(card: PunchCard): void {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const cell = this._cells[col][row];
        cell.classList.toggle('punched', card.isPunched(col, row));
      }
      const ch = card.decodeCharAt(col);
      this._charCells[col].textContent = ch;
    }
    this.updateCursor(this.cursorCol);
  }

  updateCursor(col: number): void {
    const oldCursor = this.container.querySelectorAll('.cursor');
    oldCursor.forEach(el => el.classList.remove('cursor'));

    this.cursorCol = col;
    if (col >= 0 && col < COLS) {
      this._charCells[col].classList.add('cursor');
      for (let row = 0; row < ROWS; row++) {
        this._cells[col][row].classList.add('cursor');
      }
    }
  }
}

export function renderCardThumbnail(card: PunchCard, index: number, isCurrent: boolean): HTMLElement {
  const thumb = document.createElement('div');
  thumb.className = 'card-thumbnail' + (isCurrent ? ' current' : '');
  thumb.dataset.index = String(index);

  const label = document.createElement('div');
  label.className = 'thumb-label';
  label.textContent = t('renderer.cardLabel', { n: index + 1 });
  thumb.appendChild(label);

  const text = document.createElement('div');
  text.className = 'thumb-text';
  text.textContent = card.readText().substring(0, 40) || t('renderer.blank');
  thumb.appendChild(text);

  // Mini grid visualization
  const miniGrid = document.createElement('canvas');
  miniGrid.className = 'thumb-grid';
  miniGrid.width = 160;
  miniGrid.height = 24;
  const ctx = miniGrid.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3E2723';
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (card.isPunched(col, row)) {
          ctx.fillRect(col * 2, row * 2, 1.5, 1.5);
        }
      }
    }
  }
  thumb.appendChild(miniGrid);

  return thumb;
}
