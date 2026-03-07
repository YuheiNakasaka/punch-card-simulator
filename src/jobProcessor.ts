/**
 * Job Processor — state machine managing the mainframe job submission workflow.
 *
 * Phases: IDLE → SUBMITTING → QUEUED → READING → EXECUTING → PRINTING → COMPLETE
 */

import { t } from './i18n';

export type JobPhase = 'IDLE' | 'SUBMITTING' | 'QUEUED' | 'READING' | 'EXECUTING' | 'PRINTING' | 'COMPLETE';

export type SpeedPreset = 'instant' | 'fast' | 'realistic' | 'slow';

export interface SpeedConfig {
  cardReadMs: number;
  instructionMs: number;
  charOutputMs: number;
  submitMs: number;
  queueMs: number;
}

const SPEED_CONFIGS: Record<SpeedPreset, SpeedConfig> = {
  instant:   { cardReadMs: 0,   instructionMs: 0,   charOutputMs: 0,  submitMs: 0,    queueMs: 0 },
  fast:      { cardReadMs: 20,  instructionMs: 5,   charOutputMs: 5,  submitMs: 300,  queueMs: 200 },
  realistic: { cardReadMs: 150, instructionMs: 50,  charOutputMs: 25, submitMs: 1500, queueMs: 800 },
  slow:      { cardReadMs: 500, instructionMs: 200, charOutputMs: 25, submitMs: 2000, queueMs: 1000 },
};

const JOB_COUNTER_KEY = 'punch-card-job-counter';

export class JobProcessor {
  phase: JobPhase = 'IDLE';
  speed: SpeedPreset = 'realistic';
  jobNumber: number = 0;
  condCode: string = '0000';
  private _aborted = false;
  private _onPhaseChange: ((phase: JobPhase, message: string) => void) | null = null;
  private _onOutput: ((text: string) => void) | null = null;
  private _onCardRead: ((cardIndex: number) => void) | null = null;
  private _onCharOutput: ((char: string) => void) | null = null;

  set onPhaseChange(fn: (phase: JobPhase, message: string) => void) { this._onPhaseChange = fn; }
  set onOutput(fn: (text: string) => void) { this._onOutput = fn; }
  set onCardRead(fn: (cardIndex: number) => void) { this._onCardRead = fn; }
  set onCharOutput(fn: (char: string) => void) { this._onCharOutput = fn; }

  get config(): SpeedConfig {
    return SPEED_CONFIGS[this.speed];
  }

  private _nextJobNumber(): number {
    let counter = parseInt(localStorage.getItem(JOB_COUNTER_KEY) || '0', 10);
    counter++;
    localStorage.setItem(JOB_COUNTER_KEY, String(counter));
    return counter;
  }

  private _formatJobNum(n: number): string {
    return String(n).padStart(4, '0');
  }

  private _setPhase(phase: JobPhase, message: string): void {
    this.phase = phase;
    if (this._onPhaseChange) this._onPhaseChange(phase, message);
  }

  private _output(text: string): void {
    if (this._onOutput) this._onOutput(text);
  }

  abort(): void {
    this._aborted = true;
  }

  isRunning(): boolean {
    return this.phase !== 'IDLE' && this.phase !== 'COMPLETE';
  }

  /** Run the full job workflow. Runs synchronously if speed is 'instant'. */
  submitJobSync(
    cardCount: number,
    executeCardsSync: () => void,
  ): void {
    this._aborted = false;
    this.jobNumber = this._nextJobNumber();
    const jobId = this._formatJobNum(this.jobNumber);
    this.condCode = '0000';

    this._outputJclHeader(jobId);

    // Execute immediately
    this._setPhase('EXECUTING', t('job.executing'));
    executeCardsSync();

    const endMsg = `JOB #${jobId} ENDED - COND CODE ${this.condCode}`;
    this._setPhase('COMPLETE', endMsg);
    this._output(`--- ${endMsg} ---`);
  }

  async submitJob(
    cardCount: number,
    executeCards: () => Promise<string | null>,
  ): Promise<void> {
    this._aborted = false;
    this.jobNumber = this._nextJobNumber();
    const jobId = this._formatJobNum(this.jobNumber);
    this.condCode = '0000';

    const cfg = this.config;

    // --- SUBMITTING ---
    this._setPhase('SUBMITTING', t('job.submitting'));
    if (cfg.submitMs > 0) await this._delay(cfg.submitMs);
    if (this._aborted) return this._abortEnd(jobId);

    // --- QUEUED ---
    this._setPhase('QUEUED', `JOB #${jobId} QUEUED - POSITION 1`);
    if (cfg.queueMs > 0) await this._delay(cfg.queueMs);
    if (this._aborted) return this._abortEnd(jobId);

    // --- JCL Header ---
    this._outputJclHeader(jobId);

    // --- READING ---
    this._setPhase('READING', t('job.reading', { count: cardCount }));
    for (let i = 0; i < cardCount; i++) {
      if (this._aborted) return this._abortEnd(jobId);
      if (this._onCardRead) this._onCardRead(i);
      if (cfg.cardReadMs > 0) await this._delay(cfg.cardReadMs);
    }
    if (this._aborted) return this._abortEnd(jobId);

    // --- EXECUTING ---
    this._setPhase('EXECUTING', t('job.executing'));
    const errorMsg = await executeCards();
    if (this._aborted) return this._abortEnd(jobId);
    if (errorMsg) {
      this.condCode = '0012';
    }

    // --- COMPLETE ---
    const endMsg = `JOB #${jobId} ENDED - COND CODE ${this.condCode}`;
    this._setPhase('COMPLETE', endMsg);
    this._output(`--- ${endMsg} ---`);
  }

  private _outputJclHeader(jobId: string): void {
    this._output(`//JOB${jobId} JOB (ACCT),'USER',CLASS=A`);
    this._output(`//STEP1   EXEC PGM=PUNCHSIM`);
    this._output(`//SYSIN   DD *`);
  }

  private _abortEnd(jobId: string): void {
    this.condCode = '0222';
    const msg = `JOB #${jobId} CANCELLED`;
    this._setPhase('COMPLETE', msg);
    this._output(`--- ${msg} ---`);
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
