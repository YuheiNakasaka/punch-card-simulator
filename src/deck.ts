import { PunchCard, PunchCardJSON } from './card';

const STORAGE_KEY = 'punchcard-deck' as const;

export class CardDeck {
  cards: PunchCard[];
  currentIndex: number;
  private _onChange: (() => void) | null;

  constructor() {
    this.cards = [new PunchCard()];
    this.currentIndex = 0;
    this._onChange = null;
  }

  set onChange(fn: (() => void) | null) {
    this._onChange = fn;
  }

  private _notify(): void {
    if (this._onChange) this._onChange();
  }

  get currentCard(): PunchCard {
    return this.cards[this.currentIndex];
  }

  get length(): number {
    return this.cards.length;
  }

  next(): boolean {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this._notify();
      return true;
    }
    return false;
  }

  prev(): boolean {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._notify();
      return true;
    }
    return false;
  }

  goTo(index: number): boolean {
    if (index >= 0 && index < this.cards.length) {
      this.currentIndex = index;
      this._notify();
      return true;
    }
    return false;
  }

  addCard(): PunchCard {
    const card = new PunchCard();
    this.cards.splice(this.currentIndex + 1, 0, card);
    this.currentIndex++;
    this._notify();
    return card;
  }

  appendCard(): PunchCard {
    const card = new PunchCard();
    this.cards.push(card);
    this.currentIndex = this.cards.length - 1;
    this._notify();
    return card;
  }

  removeCurrentCard(): void {
    if (this.cards.length <= 1) {
      this.currentCard.clearAll();
      this._notify();
      return;
    }
    this.cards.splice(this.currentIndex, 1);
    if (this.currentIndex >= this.cards.length) {
      this.currentIndex = this.cards.length - 1;
    }
    this._notify();
  }

  clearDeck(): void {
    this.cards = [new PunchCard()];
    this.currentIndex = 0;
    this._notify();
  }

  readAllText(): string[] {
    return this.cards.map(card => card.readText());
  }

  loadProgram(lines: string[]): void {
    this.cards = lines.map(line => {
      const card = new PunchCard();
      card.writeText(line);
      return card;
    });
    if (this.cards.length === 0) {
      this.cards = [new PunchCard()];
    }
    this.currentIndex = 0;
    this._notify();
  }

  save(): void {
    try {
      const data = {
        cards: this.cards.map(c => c.toJSON()),
        currentIndex: this.currentIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage may be unavailable
    }
  }

  load(): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as { cards?: PunchCardJSON[]; currentIndex?: number };
      if (!data.cards || !Array.isArray(data.cards)) return false;
      this.cards = data.cards.map(c => PunchCard.fromJSON(c));
      if (this.cards.length === 0) {
        this.cards = [new PunchCard()];
      }
      this.currentIndex = Math.min(data.currentIndex || 0, this.cards.length - 1);
      this._notify();
      return true;
    } catch {
      return false;
    }
  }
}
