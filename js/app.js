import { CardDeck } from './deck.js';
import { CardRenderer, renderCardThumbnail } from './renderer.js';
import { KeyboardHandler } from './keyboard.js';
import { Interpreter } from './interpreter.js';
import { renderEncodingTable, renderTutorial, EXAMPLES } from './tutorial.js';

class App {
  constructor() {
    this.deck = new CardDeck();
    this.interpreter = new Interpreter();
    this.renderer = null;
    this.keyboard = null;
    this._autoSaveTimer = null;
  }

  init() {
    // Initialize renderer
    const cardContainer = document.getElementById('card-container');
    this.renderer = new CardRenderer(cardContainer);

    // Cell click handler
    this.renderer.onCellClick = (col, row) => {
      this.deck.currentCard.toggle(col, row);
      this.renderer.render(this.deck.currentCard);
      this.keyboard.setCursor(col);
      this._updateDeckOverview();
      this._scheduleSave();
    };

    // Initialize keyboard
    this.keyboard = new KeyboardHandler({
      getCard: () => this.deck.currentCard,
      onCursorMove: (col) => {
        this.renderer.updateCursor(col);
      },
      onColumnChanged: (col) => {
        this.renderer.render(this.deck.currentCard);
        this._updateDeckOverview();
        this._scheduleSave();
      },
      onNextCard: () => {
        if (this.deck.currentIndex === this.deck.length - 1) {
          this.deck.appendCard();
        } else {
          this.deck.next();
        }
        this.keyboard.setCursor(0);
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

    // Bind tab navigation
    this._bindTabs();

    // Load examples dropdown
    this._buildExamplesDropdown();

    // Render static content
    renderTutorial(document.getElementById('tab-tutorial'));
    renderEncodingTable(document.getElementById('tab-reference'));

    // Try to load saved deck
    if (!this.deck.load()) {
      // No saved data, start fresh
    }

    // Initial render
    this._updateAll();

    // Focus for keyboard
    document.getElementById('card-container').setAttribute('tabindex', '0');
  }

  _setupInterpreter() {
    const output = document.getElementById('terminal-output');

    this.interpreter.onOutput = (text) => {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = `> ${text}`;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
    };

    this.interpreter.onInput = (varName, callback) => {
      const inputArea = document.getElementById('terminal-input-area');
      const inputField = document.getElementById('terminal-input');
      const inputLabel = document.getElementById('terminal-input-label');

      inputLabel.textContent = `Enter value for ${varName}:`;
      inputArea.classList.remove('hidden');
      inputField.value = '';
      inputField.focus();

      const handler = (e) => {
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

    this.interpreter.onStep = (pc, line) => {
      // Highlight current card during execution
      if (pc < this.deck.length) {
        this.deck.goTo(pc);
      }
    };

    this.interpreter.onFinish = (message) => {
      const line = document.createElement('div');
      line.className = 'terminal-line system';
      line.textContent = `--- ${message} ---`;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
      this._updateRunButtons();
    };
  }

  _bindToolbar() {
    // Deck navigation
    document.getElementById('btn-prev').addEventListener('click', () => {
      this.deck.prev();
      this.keyboard.setCursor(0);
    });

    document.getElementById('btn-next').addEventListener('click', () => {
      if (this.deck.currentIndex === this.deck.length - 1) {
        this.deck.appendCard();
      } else {
        this.deck.next();
      }
      this.keyboard.setCursor(0);
    });

    document.getElementById('btn-add').addEventListener('click', () => {
      this.deck.addCard();
      this.keyboard.setCursor(0);
    });

    document.getElementById('btn-remove').addEventListener('click', () => {
      this.deck.removeCurrentCard();
      this.keyboard.setCursor(0);
    });

    document.getElementById('btn-clear-card').addEventListener('click', () => {
      this.deck.currentCard.clearAll();
      this.keyboard.setCursor(0);
      this._updateAll();
      this._scheduleSave();
    });

    document.getElementById('btn-clear-deck').addEventListener('click', () => {
      if (confirm('Clear all cards in the deck?')) {
        this.deck.clearDeck();
        this.keyboard.setCursor(0);
      }
    });

    // Execution buttons
    document.getElementById('btn-run').addEventListener('click', () => {
      this._runProgram();
    });

    document.getElementById('btn-step').addEventListener('click', () => {
      this._stepProgram();
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      this._resetProgram();
    });
  }

  _bindTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        panels.forEach(p => p.classList.toggle('active', p.id === `tab-${target}`));
      });
    });
  }

  _buildExamplesDropdown() {
    const select = document.getElementById('examples-select');
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
        this.keyboard.setCursor(0);
        this._resetProgram();
        select.value = '';
      }
    });
  }

  _runProgram() {
    if (!this.interpreter.running && !this.interpreter.waitingForInput) {
      const lines = this.deck.readAllText();
      this.interpreter.load(lines);
      this._clearTerminal();
      this.interpreter.run();
      this._updateRunButtons();
    }
  }

  _stepProgram() {
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

  _resetProgram() {
    this.interpreter.reset();
    this._clearTerminal();
    this._updateRunButtons();
    document.getElementById('terminal-input-area').classList.add('hidden');
  }

  _clearTerminal() {
    document.getElementById('terminal-output').innerHTML = '';
  }

  _updateRunButtons() {
    const running = this.interpreter.running;
    document.getElementById('btn-run').disabled = running;
    document.getElementById('btn-step').disabled = running;
  }

  _updateAll() {
    // Render current card
    this.renderer.render(this.deck.currentCard);

    // Update card counter
    document.getElementById('card-counter').textContent =
      `Card ${this.deck.currentIndex + 1} of ${this.deck.length}`;

    // Update prev/next button states
    document.getElementById('btn-prev').disabled = this.deck.currentIndex === 0;

    // Update deck overview
    this._updateDeckOverview();
  }

  _updateDeckOverview() {
    const container = document.getElementById('deck-overview');
    container.innerHTML = '';
    for (let i = 0; i < this.deck.length; i++) {
      const thumb = renderCardThumbnail(this.deck.cards[i], i, i === this.deck.currentIndex);
      thumb.addEventListener('click', () => {
        this.deck.goTo(i);
        this.keyboard.setCursor(0);
      });
      container.appendChild(thumb);
    }
  }

  _scheduleSave() {
    clearTimeout(this._autoSaveTimer);
    this._autoSaveTimer = setTimeout(() => {
      this.deck.save();
    }, 500);
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
