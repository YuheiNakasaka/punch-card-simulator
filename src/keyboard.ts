import { COLS, CHAR_TO_PUNCHES } from './encoding';
import { PunchCard } from './card';

interface KeyboardHandlerOptions {
  getCard: () => PunchCard;
  onCursorMove: (col: number) => void;
  onColumnChanged: (col: number) => void;
  onNextCard: () => void;
}

export class KeyboardHandler {
  getCard: () => PunchCard;
  onCursorMove: (col: number) => void;
  onColumnChanged: (col: number) => void;
  onNextCard: () => void;
  cursorCol: number;
  enabled: boolean;
  private _handler: (e: KeyboardEvent) => void;
  private _element: EventTarget | null;

  constructor({ getCard, onCursorMove, onColumnChanged, onNextCard }: KeyboardHandlerOptions) {
    this.getCard = getCard;
    this.onCursorMove = onCursorMove;
    this.onColumnChanged = onColumnChanged;
    this.onNextCard = onNextCard;
    this.cursorCol = 0;
    this.enabled = true;
    this._handler = this._handleKey.bind(this);
    this._element = null;
  }

  attach(element: EventTarget): void {
    this._element = element;
    element.addEventListener('keydown', this._handler as EventListener);
  }

  detach(): void {
    if (this._element) {
      this._element.removeEventListener('keydown', this._handler as EventListener);
    }
  }

  setCursor(col: number): void {
    this.cursorCol = Math.max(0, Math.min(col, COLS - 1));
    this.onCursorMove(this.cursorCol);
  }

  private _handleKey(e: KeyboardEvent): void {
    if (!this.enabled) return;

    // Don't handle if typing in input/textarea
    if ((e.target as Element).tagName === 'INPUT' || (e.target as Element).tagName === 'TEXTAREA') return;

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
