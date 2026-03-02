import { COLS, ROWS, encodeChar, decodeRows } from './encoding';

export interface PunchCardJSON {
  punches: [number, number][];
}

export class PunchCard {
  grid: boolean[][];

  constructor(grid?: boolean[][]) {
    if (grid) {
      this.grid = grid;
    } else {
      // Initialize empty 80-column x 12-row grid
      this.grid = Array.from({ length: COLS }, () => Array(ROWS).fill(false) as boolean[]);
    }
  }

  toggle(col: number, row: number): void {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = !this.grid[col][row];
  }

  punch(col: number, row: number): void {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = true;
  }

  clear(col: number, row: number): void {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = false;
  }

  isPunched(col: number, row: number): boolean {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return this.grid[col][row];
  }

  clearColumn(col: number): void {
    if (col < 0 || col >= COLS) return;
    this.grid[col] = Array(ROWS).fill(false) as boolean[];
  }

  encodeCharAt(col: number, char: string): boolean {
    if (col < 0 || col >= COLS) return false;
    const rowIndices = encodeChar(char);
    if (rowIndices === null) return false;
    this.clearColumn(col);
    for (const row of rowIndices) {
      this.grid[col][row] = true;
    }
    return true;
  }

  decodeCharAt(col: number): string {
    if (col < 0 || col >= COLS) return '';
    const punchedRows: number[] = [];
    for (let row = 0; row < ROWS; row++) {
      if (this.grid[col][row]) {
        punchedRows.push(row);
      }
    }
    return decodeRows(punchedRows);
  }

  readText(): string {
    let text = '';
    for (let col = 0; col < COLS; col++) {
      text += this.decodeCharAt(col) || ' ';
    }
    return text.trimEnd();
  }

  writeText(text: string, startCol: number = 0): number {
    let written = 0;
    for (let i = 0; i < text.length && startCol + i < COLS; i++) {
      if (this.encodeCharAt(startCol + i, text[i])) {
        written++;
      }
    }
    return written;
  }

  clearAll(): void {
    for (let col = 0; col < COLS; col++) {
      this.grid[col] = Array(ROWS).fill(false) as boolean[];
    }
  }

  isBlank(): boolean {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (this.grid[col][row]) return false;
      }
    }
    return true;
  }

  toJSON(): PunchCardJSON {
    const punches: [number, number][] = [];
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (this.grid[col][row]) {
          punches.push([col, row]);
        }
      }
    }
    return { punches };
  }

  static fromJSON(data: PunchCardJSON): PunchCard {
    const card = new PunchCard();
    if (data.punches) {
      for (const [col, row] of data.punches) {
        card.punch(col, row);
      }
    }
    return card;
  }
}
