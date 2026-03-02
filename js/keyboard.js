import { COLS, CHAR_TO_PUNCHES } from './encoding.js';

export class KeyboardHandler {
  /**
   * @param {object} opts
   * @param {() => import('./card.js').PunchCard} opts.getCard - get current card
   * @param {(col: number) => void} opts.onCursorMove - cursor moved
   * @param {(col: number) => void} opts.onColumnChanged - column data changed
   * @param {() => void} opts.onNextCard - enter/advance to next card
   */
  constructor({ getCard, onCursorMove, onColumnChanged, onNextCard }) {
    this.getCard = getCard;
    this.onCursorMove = onCursorMove;
    this.onColumnChanged = onColumnChanged;
    this.onNextCard = onNextCard;
    this.cursorCol = 0;
    this.enabled = true;
    this._handler = this._handleKey.bind(this);
  }

  /**
   * Attach to a DOM element for keyboard events
   */
  attach(element) {
    this._element = element;
    element.addEventListener('keydown', this._handler);
  }

  /**
   * Detach keyboard handler
   */
  detach() {
    if (this._element) {
      this._element.removeEventListener('keydown', this._handler);
    }
  }

  /**
   * Set cursor position
   */
  setCursor(col) {
    this.cursorCol = Math.max(0, Math.min(col, COLS - 1));
    this.onCursorMove(this.cursorCol);
  }

  _handleKey(e) {
    if (!this.enabled) return;

    // Don't handle if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const card = this.getCard();
    if (!card) return;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this.cursorCol > 0) {
          this.setCursor(this.cursorCol - 1);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (this.cursorCol < COLS - 1) {
          this.setCursor(this.cursorCol + 1);
        }
        break;

      case 'Home':
        e.preventDefault();
        this.setCursor(0);
        break;

      case 'End':
        e.preventDefault();
        this.setCursor(COLS - 1);
        break;

      case 'Backspace':
        e.preventDefault();
        if (this.cursorCol > 0) {
          this.setCursor(this.cursorCol - 1);
          card.clearColumn(this.cursorCol);
          this.onColumnChanged(this.cursorCol);
        }
        break;

      case 'Delete':
        e.preventDefault();
        card.clearColumn(this.cursorCol);
        this.onColumnChanged(this.cursorCol);
        break;

      case 'Enter':
        e.preventDefault();
        this.onNextCard();
        break;

      default:
        // Try to encode the character
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          const upper = e.key.toUpperCase();
          if (CHAR_TO_PUNCHES[upper] !== undefined) {
            e.preventDefault();
            card.encodeCharAt(this.cursorCol, upper);
            this.onColumnChanged(this.cursorCol);
            if (this.cursorCol < COLS - 1) {
              this.setCursor(this.cursorCol + 1);
            }
          }
        }
        break;
    }
  }
}
