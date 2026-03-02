import { PunchCard } from './card.js';

const STORAGE_KEY = 'punchcard-deck';

export class CardDeck {
  constructor() {
    this.cards = [new PunchCard()];
    this.currentIndex = 0;
    this._onChange = null;
  }

  /**
   * Set a callback that fires when the deck changes
   */
  set onChange(fn) {
    this._onChange = fn;
  }

  _notify() {
    if (this._onChange) this._onChange();
  }

  /**
   * Get the currently active card
   */
  get currentCard() {
    return this.cards[this.currentIndex];
  }

  /**
   * Get total number of cards
   */
  get length() {
    return this.cards.length;
  }

  /**
   * Navigate to the next card
   */
  next() {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this._notify();
      return true;
    }
    return false;
  }

  /**
   * Navigate to the previous card
   */
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this._notify();
      return true;
    }
    return false;
  }

  /**
   * Go to a specific card index
   */
  goTo(index) {
    if (index >= 0 && index < this.cards.length) {
      this.currentIndex = index;
      this._notify();
      return true;
    }
    return false;
  }

  /**
   * Add a new blank card after the current card
   */
  addCard() {
    const card = new PunchCard();
    this.cards.splice(this.currentIndex + 1, 0, card);
    this.currentIndex++;
    this._notify();
    return card;
  }

  /**
   * Add a new card at the end of the deck
   */
  appendCard() {
    const card = new PunchCard();
    this.cards.push(card);
    this.currentIndex = this.cards.length - 1;
    this._notify();
    return card;
  }

  /**
   * Remove the current card
   */
  removeCurrentCard() {
    if (this.cards.length <= 1) {
      // Don't remove the last card, just clear it
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

  /**
   * Clear all cards and reset to a single blank card
   */
  clearDeck() {
    this.cards = [new PunchCard()];
    this.currentIndex = 0;
    this._notify();
  }

  /**
   * Read text from all cards
   * @returns {string[]} array of card texts
   */
  readAllText() {
    return this.cards.map(card => card.readText());
  }

  /**
   * Load a program (array of text lines) into the deck
   * @param {string[]} lines - text lines, one per card
   */
  loadProgram(lines) {
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

  /**
   * Save deck to localStorage
   */
  save() {
    try {
      const data = {
        cards: this.cards.map(c => c.toJSON()),
        currentIndex: this.currentIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage may be unavailable
    }
  }

  /**
   * Load deck from localStorage
   * @returns {boolean} true if loaded successfully
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data.cards || !Array.isArray(data.cards)) return false;
      this.cards = data.cards.map(c => PunchCard.fromJSON(c));
      if (this.cards.length === 0) {
        this.cards = [new PunchCard()];
      }
      this.currentIndex = Math.min(data.currentIndex || 0, this.cards.length - 1);
      this._notify();
      return true;
    } catch (e) {
      return false;
    }
  }
}
