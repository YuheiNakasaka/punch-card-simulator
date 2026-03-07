import { t } from './i18n';

const MAX_STEPS = 10000;

export interface InterpreterSpeed {
  instructionMs: number;
  charOutputMs: number;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class Interpreter {
  variables: Record<string, number>;
  labels: Record<string, number>;
  program: string[];
  pc: number;
  stepCount: number;
  running: boolean;
  waitingForInput: boolean;
  hasError: boolean;
  speed: InterpreterSpeed = { instructionMs: 0, charOutputMs: 0 };
  private _aborted: boolean;
  private _inputVar: string | null;
  private _onOutput: ((text: string) => void) | null;
  private _onCharOutput: ((char: string) => Promise<void> | void) | null;
  private _onInput: ((varName: string, callback: (value: string) => void) => void) | null;
  private _onStep: ((pc: number, line: string) => void) | null;
  private _onFinish: ((message: string) => void) | null;
  private _onCardRead: ((cardIndex: number) => void) | null;

  constructor() {
    this.variables = {};
    this.labels = {};
    this.program = [];
    this.pc = 0;
    this.stepCount = 0;
    this.running = false;
    this.waitingForInput = false;
    this.hasError = false;
    this._aborted = false;
    this._inputVar = null;
    this._onOutput = null;
    this._onCharOutput = null;
    this._onInput = null;
    this._onStep = null;
    this._onFinish = null;
    this._onCardRead = null;
  }

  set onOutput(fn: (text: string) => void) { this._onOutput = fn; }
  set onCharOutput(fn: (char: string) => Promise<void> | void) { this._onCharOutput = fn; }
  set onInput(fn: (varName: string, callback: (value: string) => void) => void) { this._onInput = fn; }
  set onStep(fn: (pc: number, line: string) => void) { this._onStep = fn; }
  set onFinish(fn: (message: string) => void) { this._onFinish = fn; }
  set onCardRead(fn: (cardIndex: number) => void) { this._onCardRead = fn; }

  reset(): void {
    this.variables = {};
    this.labels = {};
    this.program = [];
    this.pc = 0;
    this.stepCount = 0;
    this.running = false;
    this.waitingForInput = false;
    this.hasError = false;
    this._aborted = false;
    this._inputVar = null;
  }

  abort(): void {
    this._aborted = true;
    this.running = false;
  }

  load(lines: string[]): void {
    this.reset();
    this.program = lines.map(line => line.trim()).filter(line => line.length > 0);

    for (let i = 0; i < this.program.length; i++) {
      const parts = this._parseLine(this.program[i]);
      if (parts.op === 'LBL') {
        this.labels[parts.args[0]] = i;
      }
    }
  }

  private _parseLine(line: string): { op: string; args: string[] } {
    const parts = line.split(/\s+/);
    const op = (parts[0] || '').toUpperCase();
    const args = parts.slice(1);
    if (op === 'PRT' || op === 'REM') {
      return { op, args: [parts.slice(1).join(' ')] };
    }
    return { op, args: args.map(a => a.toUpperCase()) };
  }

  private _getVal(token: string): number {
    const num = parseFloat(token);
    if (!isNaN(num)) return num;
    return this.variables[token] || 0;
  }

  private _output(text: string): void {
    if (this._onOutput) this._onOutput(text);
  }

  /** Output text character-by-character with delay (for line printer effect) */
  private async _outputWithDelay(text: string): Promise<void> {
    if (this.speed.charOutputMs <= 0 || !this._onCharOutput) {
      this._output(text);
      return;
    }
    for (const char of text) {
      if (this._aborted) return;
      await this._onCharOutput(char);
      await delay(this.speed.charOutputMs);
    }
  }

  step(): boolean {
    if (this.pc >= this.program.length) {
      this._finish(t('interpreter.programEnded'));
      return false;
    }

    if (this.stepCount >= MAX_STEPS) {
      this._output(t('interpreter.abendTimeLimit'));
      this._finish(t('interpreter.maxSteps'), true);
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
            this._output(t('interpreter.abendDivZero', { n: this.pc + 1 }));
            this._output(t('interpreter.divisionByZero'));
            this._finish(t('interpreter.programError'), true);
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
        this.pc++;
        break;

      case 'JMP': {
        const label = args[0];
        if (this.labels[label] !== undefined) {
          this.pc = this.labels[label];
        } else {
          this._output(t('interpreter.abendLabelNotFound', { label }));
          this._output(t('interpreter.unknownLabel', { label }));
          this._finish(t('interpreter.programError'), true);
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
            this._output(t('interpreter.abendLabelNotFound', { label }));
            this._output(t('interpreter.unknownLabel', { label }));
            this._finish(t('interpreter.programError'), true);
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
            this._output(t('interpreter.abendLabelNotFound', { label }));
            this._output(t('interpreter.unknownLabel', { label }));
            this._finish(t('interpreter.programError'), true);
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
          this._onInput(varName, (value: string) => {
            this.variables[varName] = parseFloat(value) || 0;
            this.waitingForInput = false;
            this._inputVar = null;
            this.pc++;
            if (this.running) {
              this._runLoopAsync();
            }
          });
          return true;
        }
        this.pc++;
        break;
      }

      case 'END':
        this._finish(t('interpreter.programEnded'));
        return false;

      case 'REM':
        this.pc++;
        break;

      default:
        this._output(t('interpreter.abendInvalidOp', { op }));
        this._output(t('interpreter.unknownInstruction', { op }));
        this.pc++;
        break;
    }

    return true;
  }

  private _finish(message: string, isError = false): void {
    this.running = false;
    if (isError) this.hasError = true;
    if (this._onFinish) this._onFinish(message);
  }

  /** Synchronous run — used for Instant speed and backward compat */
  run(): void {
    this.running = true;
    this._aborted = false;
    if (this.speed.instructionMs <= 0) {
      this._runLoopSync();
    } else {
      this._runLoopAsync();
    }
  }

  /** Async run — used for delayed execution. Runs sync if speed is 0. */
  async runAsync(): Promise<string | null> {
    this.running = true;
    this._aborted = false;
    if (this.speed.instructionMs <= 0) {
      this._runLoopSync();
      return null;
    }
    return this._runLoopAsync();
  }

  private _runLoopSync(): void {
    while (this.running && !this.waitingForInput) {
      if (!this.step()) break;
    }
  }

  private async _runLoopAsync(): Promise<string | null> {
    while (this.running && !this.waitingForInput && !this._aborted) {
      const cont = this.step();
      if (!cont) {
        return this.hasError ? 'error' : null;
      }
      if (this.speed.instructionMs > 0) {
        await delay(this.speed.instructionMs);
      }
    }
    if (this._aborted) return 'aborted';
    return null;
  }

  stepOnce(): boolean {
    this.running = false;
    return this.step();
  }
}
