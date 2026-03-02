const MAX_STEPS = 10000;

export class Interpreter {
  constructor() {
    this.reset();
    this._onOutput = null;
    this._onInput = null;
    this._onStep = null;
    this._onFinish = null;
  }

  set onOutput(fn) { this._onOutput = fn; }
  set onInput(fn) { this._onInput = fn; }
  set onStep(fn) { this._onStep = fn; }
  set onFinish(fn) { this._onFinish = fn; }

  reset() {
    this.variables = {};
    this.labels = {};
    this.program = [];
    this.pc = 0;
    this.stepCount = 0;
    this.running = false;
    this.waitingForInput = false;
    this._inputVar = null;
  }

  /**
   * Load a program from card text lines
   * @param {string[]} lines
   */
  load(lines) {
    this.reset();
    this.program = lines.map(line => line.trim()).filter(line => line.length > 0);

    // First pass: find labels
    for (let i = 0; i < this.program.length; i++) {
      const parts = this._parseLine(this.program[i]);
      if (parts.op === 'LBL') {
        this.labels[parts.args[0]] = i;
      }
    }
  }

  _parseLine(line) {
    const parts = line.split(/\s+/);
    const op = (parts[0] || '').toUpperCase();
    const args = parts.slice(1);
    // For PRT and REM, join the rest as a single arg
    if (op === 'PRT' || op === 'REM') {
      return { op, args: [parts.slice(1).join(' ')] };
    }
    return { op, args: args.map(a => a.toUpperCase()) };
  }

  _getVal(token) {
    // If it's a number, return it; otherwise look up variable
    const num = parseFloat(token);
    if (!isNaN(num)) return num;
    return this.variables[token] || 0;
  }

  _output(text) {
    if (this._onOutput) this._onOutput(text);
  }

  /**
   * Execute one step
   * @returns {boolean} true if program should continue
   */
  step() {
    if (this.pc >= this.program.length) {
      this._finish('Program ended.');
      return false;
    }

    if (this.stepCount >= MAX_STEPS) {
      this._finish('Execution stopped: maximum steps (10,000) reached.');
      return false;
    }

    const line = this.program[this.pc];
    const { op, args } = this._parseLine(line);

    if (this._onStep) this._onStep(this.pc, line);

    this.stepCount++;

    switch (op) {
      case 'PRT':
        this._output(args[0] || '');
        this.pc++;
        break;

      case 'NUM': {
        const varName = args[0];
        const val = parseFloat(args[1]);
        if (varName) this.variables[varName] = isNaN(val) ? 0 : val;
        this.pc++;
        break;
      }

      case 'ADD': {
        const varName = args[0];
        const val = this._getVal(args[1]);
        if (varName) this.variables[varName] = (this.variables[varName] || 0) + val;
        this.pc++;
        break;
      }

      case 'SUB': {
        const varName = args[0];
        const val = this._getVal(args[1]);
        if (varName) this.variables[varName] = (this.variables[varName] || 0) - val;
        this.pc++;
        break;
      }

      case 'MUL': {
        const varName = args[0];
        const val = this._getVal(args[1]);
        if (varName) this.variables[varName] = (this.variables[varName] || 0) * val;
        this.pc++;
        break;
      }

      case 'DIV': {
        const varName = args[0];
        const val = this._getVal(args[1]);
        if (varName) {
          if (val === 0) {
            this._output('Error: Division by zero');
            this._finish('Program error.');
            return false;
          }
          this.variables[varName] = (this.variables[varName] || 0) / val;
        }
        this.pc++;
        break;
      }

      case 'SHW': {
        const varName = args[0];
        const val = this.variables[varName];
        this._output(`${varName} = ${val !== undefined ? val : 'undefined'}`);
        this.pc++;
        break;
      }

      case 'LBL':
        // Labels are preprocessed; just advance
        this.pc++;
        break;

      case 'JMP': {
        const label = args[0];
        if (this.labels[label] !== undefined) {
          this.pc = this.labels[label];
        } else {
          this._output(`Error: Unknown label '${label}'`);
          this._finish('Program error.');
          return false;
        }
        break;
      }

      case 'JEZ': {
        const varName = args[0];
        const label = args[1];
        const val = this.variables[varName] || 0;
        if (val === 0) {
          if (this.labels[label] !== undefined) {
            this.pc = this.labels[label];
          } else {
            this._output(`Error: Unknown label '${label}'`);
            this._finish('Program error.');
            return false;
          }
        } else {
          this.pc++;
        }
        break;
      }

      case 'JGZ': {
        const varName = args[0];
        const label = args[1];
        const val = this.variables[varName] || 0;
        if (val > 0) {
          if (this.labels[label] !== undefined) {
            this.pc = this.labels[label];
          } else {
            this._output(`Error: Unknown label '${label}'`);
            this._finish('Program error.');
            return false;
          }
        } else {
          this.pc++;
        }
        break;
      }

      case 'INP': {
        const varName = args[0];
        if (varName && this._onInput) {
          this.waitingForInput = true;
          this._inputVar = varName;
          this._onInput(varName, (value) => {
            this.variables[varName] = parseFloat(value) || 0;
            this.waitingForInput = false;
            this._inputVar = null;
            this.pc++;
            if (this.running) {
              this._runLoop();
            }
          });
          return true; // Suspend execution, wait for input
        }
        this.pc++;
        break;
      }

      case 'END':
        this._finish('Program ended.');
        return false;

      case 'REM':
        // Comment, skip
        this.pc++;
        break;

      default:
        this._output(`Unknown instruction: ${op}`);
        this.pc++;
        break;
    }

    return true;
  }

  _finish(message) {
    this.running = false;
    if (this._onFinish) this._onFinish(message);
  }

  /**
   * Run the entire program
   */
  run() {
    this.running = true;
    this._runLoop();
  }

  _runLoop() {
    while (this.running && !this.waitingForInput) {
      if (!this.step()) break;
    }
  }

  /**
   * Execute a single step (for step-through debugging)
   */
  stepOnce() {
    this.running = false;
    return this.step();
  }
}
