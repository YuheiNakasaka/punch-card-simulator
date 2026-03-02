import { CardDeck } from './deck';
import { CardRenderer, renderCardThumbnail } from './renderer';
import { KeyboardHandler } from './keyboard';
import { Interpreter } from './interpreter';
import { renderEncodingTable, renderTutorial, EXAMPLES } from './tutorial';

function getElementById(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}

interface BaseSizes {
  cellHeight: number;
  cellFontSize: number;
  rowLabelWidth: number;
  rowLabelFontSize: number;
  colNumFontSize: number;
  colNumHeight: number;
  cellMinWidth: number;
}

export class App {
  deck: CardDeck;
  interpreter: Interpreter;
  renderer: CardRenderer | null;
  keyboard: KeyboardHandler | null;
  private _autoSaveTimer: ReturnType<typeof setTimeout> | null;
  private _zoomLevel: number;

  constructor() {
    this.deck = new CardDeck();
    this.interpreter = new Interpreter();
    this.renderer = null;
    this.keyboard = null;
    this._autoSaveTimer = null;
    this._zoomLevel = 1.0;
  }

  init(): void {
    // Initialize renderer
    const cardContainer = getElementById('card-container');
    this.renderer = new CardRenderer(cardContainer);

    // Cell click handler
    this.renderer.onCellClick = (col: number, row: number) => {
      this.deck.currentCard.toggle(col, row);
      this.renderer!.render(this.deck.currentCard);
      this.keyboard!.setCursor(col);
      this._updateDeckOverview();
      this._scheduleSave();
    };

    // Initialize keyboard
    this.keyboard = new KeyboardHandler({
      getCard: () => this.deck.currentCard,
      onCursorMove: (col: number) => {
        this.renderer!.updateCursor(col);
      },
      onColumnChanged: (_col: number) => {
        this.renderer!.render(this.deck.currentCard);
        this._updateDeckOverview();
        this._scheduleSave();
      },
      onNextCard: () => {
        if (this.deck.currentIndex === this.deck.length - 1) {
          this.deck.appendCard();
        } else {
          this.deck.next();
        }
        this.keyboard!.setCursor(0);
        this._updateAll();
      },
    });
    this.keyboard.attach(document);

    // Deck change handler
    this.deck.onChange = () => {
      this._updateAll();
      this._scheduleSave();
    };

    // Setup interpreter callbacks
    this._setupInterpreter();

    // Bind toolbar buttons
    this._bindToolbar();

    // Bind zoom controls
    this._bindZoomControls();

    // Bind tab navigation
    this._bindTabs();

    // Load examples dropdown
    this._buildExamplesDropdown();

    // Render static content
    renderTutorial(getElementById('tab-tutorial'));
    renderEncodingTable(getElementById('tab-reference'));

    // Try to load saved deck
    this.deck.load();

    // Initial render
    this._updateAll();

    // Focus for keyboard
    getElementById('card-container').setAttribute('tabindex', '0');
  }

  private _setupInterpreter(): void {
    const output = getElementById('terminal-output');

    this.interpreter.onOutput = (text: string) => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = `> ${text}`;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    this.interpreter.onInput = (varName: string, callback: (value: string) => void) => {
      const inputArea = getElementById('terminal-input-area');
      const inputField = getElementById('terminal-input') as HTMLInputElement;
      const inputLabel = getElementById('terminal-input-label');

      inputLabel.textContent = `Enter value for ${varName}:`;
      inputArea.classList.remove('hidden');
      inputField.value = '';
      inputField.focus();

      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const value = inputField.value;
          inputField.removeEventListener('keydown', handler);
          inputArea.classList.add('hidden');

          const line = document.createElement('div');
          line.className = 'terminal-line input-echo';
          line.textContent = `< ${value}`;
          output.appendChild(line);

          callback(value);
        }
      };
      inputField.addEventListener('keydown', handler);
    };

    this.interpreter.onStep = (pc: number, _line: string) => {
      if (pc < this.deck.length) {
        this.deck.goTo(pc);
      }
    };

    this.interpreter.onFinish = (message: string) => {
      const line = document.createElement('div');
      line.className = 'terminal-line system';
      line.textContent = `--- ${message} ---`;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
      this._updateRunButtons();
    };
  }

  private _bindToolbar(): void {
    getElementById('btn-prev').addEventListener('click', () => {
      this.deck.prev();
      this.keyboard!.setCursor(0);
    });

    getElementById('btn-next').addEventListener('click', () => {
      if (this.deck.currentIndex === this.deck.length - 1) {
        this.deck.appendCard();
      } else {
        this.deck.next();
      }
      this.keyboard!.setCursor(0);
    });

    getElementById('btn-add').addEventListener('click', () => {
      this.deck.addCard();
      this.keyboard!.setCursor(0);
    });

    getElementById('btn-remove').addEventListener('click', () => {
      this.deck.removeCurrentCard();
      this.keyboard!.setCursor(0);
    });

    getElementById('btn-clear-card').addEventListener('click', () => {
      this.deck.currentCard.clearAll();
      this.keyboard!.setCursor(0);
      this._updateAll();
      this._scheduleSave();
    });

    getElementById('btn-clear-deck').addEventListener('click', () => {
      if (confirm('Clear all cards in the deck?')) {
        this.deck.clearDeck();
        this.keyboard!.setCursor(0);
      }
    });

    getElementById('btn-run').addEventListener('click', () => {
      this._runProgram();
    });

    getElementById('btn-step').addEventListener('click', () => {
      this._stepProgram();
    });

    getElementById('btn-reset').addEventListener('click', () => {
      this._resetProgram();
    });
  }

  private _bindTabs(): void {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = (tab as HTMLElement).dataset.tab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
      });
    });
  }

  private _buildExamplesDropdown(): void {
    const select = getElementById('examples-select') as HTMLSelectElement;
    select.innerHTML = '<option value="">Load Example...</option>';
    for (const name of Object.keys(EXAMPLES)) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => {
      const name = select.value;
      if (name && EXAMPLES[name]) {
        this.deck.loadProgram(EXAMPLES[name]);
        this.keyboard!.setCursor(0);
        this._resetProgram();
        select.value = '';
      }
    });
  }

  private _runProgram(): void {
    if (!this.interpreter.running && !this.interpreter.waitingForInput) {
      const lines = this.deck.readAllText();
      this.interpreter.load(lines);
      this._clearTerminal();
      this.interpreter.run();
      this._updateRunButtons();
    }
  }

  private _stepProgram(): void {
    if (!this.interpreter.running && !this.interpreter.waitingForInput) {
      if (this.interpreter.pc === 0 && this.interpreter.stepCount === 0) {
        const lines = this.deck.readAllText();
        this.interpreter.load(lines);
        this._clearTerminal();
      }
      this.interpreter.stepOnce();
      this._updateRunButtons();
    }
  }

  private _resetProgram(): void {
    this.interpreter.reset();
    this._clearTerminal();
    this._updateRunButtons();
    getElementById('terminal-input-area').classList.add('hidden');
  }

  private _clearTerminal(): void {
    getElementById('terminal-output').innerHTML = '';
  }

  private _updateRunButtons(): void {
    const running = this.interpreter.running;
    (getElementById('btn-run') as HTMLButtonElement).disabled = running;
    (getElementById('btn-step') as HTMLButtonElement).disabled = running;
  }

  private _updateAll(): void {
    this.renderer!.render(this.deck.currentCard);

    getElementById('card-counter').textContent =
      `Card ${this.deck.currentIndex + 1} of ${this.deck.length}`;

    (getElementById('btn-prev') as HTMLButtonElement).disabled = this.deck.currentIndex === 0;

    this._updateDeckOverview();
  }

  private _updateDeckOverview(): void {
    const container = getElementById('deck-overview');
    container.innerHTML = '';
    for (let i = 0; i < this.deck.length; i++) {
      const thumb = renderCardThumbnail(this.deck.cards[i], i, i === this.deck.currentIndex);
      thumb.addEventListener('click', () => {
        this.deck.goTo(i);
        this.keyboard!.setCursor(0);
      });
      container.appendChild(thumb);
    }
  }

  private _getBaseSizes(): BaseSizes {
    const w = window.innerWidth;
    if (w <= 768) {
      return {
        cellHeight: 28, cellFontSize: 14, rowLabelWidth: 32,
        rowLabelFontSize: 12, colNumFontSize: 9, colNumHeight: 16, cellMinWidth: 16,
      };
    } else if (w <= 1200) {
      return {
        cellHeight: 12, cellFontSize: 8, rowLabelWidth: 20,
        rowLabelFontSize: 7, colNumFontSize: 5, colNumHeight: 9, cellMinWidth: 0,
      };
    }
    return {
      cellHeight: 14, cellFontSize: 9, rowLabelWidth: 22,
      rowLabelFontSize: 8, colNumFontSize: 6, colNumHeight: 10, cellMinWidth: 0,
    };
  }

  private _setZoom(level: number): void {
    this._zoomLevel = Math.max(0.5, Math.min(3.0, level));
    const base = this._getBaseSizes();
    const z = this._zoomLevel;
    const style = document.documentElement.style;
    style.setProperty('--cell-height', `${Math.round(base.cellHeight * z)}px`);
    style.setProperty('--cell-font-size', `${Math.round(base.cellFontSize * z)}px`);
    style.setProperty('--row-label-width', `${Math.round(base.rowLabelWidth * z)}px`);
    style.setProperty('--row-label-font-size', `${Math.round(base.rowLabelFontSize * z)}px`);
    style.setProperty('--col-num-font-size', `${Math.round(base.colNumFontSize * z)}px`);
    style.setProperty('--col-num-height', `${Math.round(base.colNumHeight * z)}px`);
    if (base.cellMinWidth > 0) {
      style.setProperty('--cell-min-width', `${Math.round(base.cellMinWidth * z)}px`);
    }
    getElementById('zoom-level').textContent = `${Math.round(this._zoomLevel * 100)}%`;
  }

  private _bindZoomControls(): void {
    getElementById('btn-zoom-in').addEventListener('click', () => {
      this._setZoom(this._zoomLevel + 0.25);
    });
    getElementById('btn-zoom-out').addEventListener('click', () => {
      this._setZoom(this._zoomLevel - 0.25);
    });
    getElementById('btn-zoom-reset').addEventListener('click', () => {
      this._setZoom(1.0);
      // Remove inline overrides so CSS media queries take effect
      const style = document.documentElement.style;
      style.removeProperty('--cell-height');
      style.removeProperty('--cell-font-size');
      style.removeProperty('--row-label-width');
      style.removeProperty('--row-label-font-size');
      style.removeProperty('--col-num-font-size');
      style.removeProperty('--col-num-height');
      style.removeProperty('--cell-min-width');
    });
  }

  private _scheduleSave(): void {
    if (this._autoSaveTimer !== null) {
      clearTimeout(this._autoSaveTimer);
    }
    this._autoSaveTimer = setTimeout(() => {
      this.deck.save();
    }, 500);
  }
}
