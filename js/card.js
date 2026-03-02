import { COLS, ROWS, encodeChar, decodeRows } from './encoding.js';

export class PunchCard {
  /**
   * @param {boolean[][]} [grid] - optional 80x12 grid (grid[col][row])
   */
  constructor(grid) {
    if (grid) {
      this.grid = grid;
    } else {
      // Initialize empty 80-column x 12-row grid
      this.grid = Array.from({ length: COLS }, () => Array(ROWS).fill(false));
    }
  }

  /**
   * Toggle a punch at the given position
   */
  toggle(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = !this.grid[col][row];
  }

  /**
   * Set a punch at the given position
   */
  punch(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = true;
  }

  /**
   * Clear a punch at the given position
   */
  clear(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;
    this.grid[col][row] = false;
  }

  /**
   * Check if a position is punched
   */
  isPunched(col, row) {
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return false;
    return this.grid[col][row];
  }

  /**
   * Clear an entire column
   */
  clearColumn(col) {
    if (col < 0 || col >= COLS) return;
    this.grid[col] = Array(ROWS).fill(false);
  }

  /**
   * Encode a character into a column
   * @param {number} col - column index (0-79)
   * @param {string} char - character to encode
   * @returns {boolean} true if character was valid and encoded
   */
  encodeCharAt(col, char) {
    if (col < 0 || col >= COLS) return false;
    const rowIndices = encodeChar(char);
    if (rowIndices === null) return false;
    this.clearColumn(col);
    for (const row of rowIndices) {
      this.grid[col][row] = true;
    }
    return true;
  }

  /**
   * Decode the character at a given column
   * @param {number} col - column index (0-79)
   * @returns {string} decoded character or ''
   */
  decodeCharAt(col) {
    if (col < 0 || col >= COLS) return '';
    const punchedRows = [];
    for (let row = 0; row < ROWS; row++) {
      if (this.grid[col][row]) {
        punchedRows.push(row);
      }
    }
    return decodeRows(punchedRows);
  }

  /**
   * Read the entire card as a string (80 chars, trailing spaces trimmed)
   */
  readText() {
    let text = '';
    for (let col = 0; col < COLS; col++) {
      text += this.decodeCharAt(col) || ' ';
    }
    return text.trimEnd();
  }

  /**
   * Write a string starting at a given column
   * @param {string} text - text to write
   * @param {number} [startCol=0] - starting column
   * @returns {number} number of characters written
   */
  writeText(text, startCol = 0) {
    let written = 0;
    for (let i = 0; i < text.length && startCol + i < COLS; i++) {
      if (this.encodeCharAt(startCol + i, text[i])) {
        written++;
      }
    }
    return written;
  }

  /**
   * Clear the entire card
   */
  clearAll() {
    for (let col = 0; col < COLS; col++) {
      this.grid[col] = Array(ROWS).fill(false);
    }
  }

  /**
   * Check if the card is blank
   */
  isBlank() {
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (this.grid[col][row]) return false;
      }
    }
    return true;
  }

  /**
   * Serialize to JSON-compatible object
   */
  toJSON() {
    // Store as sparse format: only punched positions
    const punches = [];
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        if (this.grid[col][row]) {
          punches.push([col, row]);
        }
      }
    }
    return { punches };
  }

  /**
   * Deserialize from JSON object
   */
  static fromJSON(data) {
    const card = new PunchCard();
    if (data.punches) {
      for (const [col, row] of data.punches) {
        card.punch(col, row);
      }
    }
    return card;
  }
}
