/**
 * Web Audio API sound effects for mainframe experience.
 * All sounds are synthesized programmatically — no external files needed.
 */

const STORAGE_KEY = 'punch-card-audio-muted';

let ctx: AudioContext | null = null;
let muted = true; // default OFF (opt-in)

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function initAudio(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  muted = stored !== 'false'; // default muted unless explicitly unmuted
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  localStorage.setItem(STORAGE_KEY, String(!value));
}

export function toggleMute(): boolean {
  setMuted(!muted);
  return muted;
}

/** Short white noise burst — keypunch "click" */
export function playKeypunch(): void {
  if (muted) return;
  const ac = getCtx();
  const duration = 0.04;
  const bufferSize = Math.ceil(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * env * 0.3;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2000;

  source.connect(filter);
  filter.connect(ac.destination);
  source.start();
}

/** Low-frequency oscillator — card reader "whirr" */
export function playCardReader(durationMs: number = 200): void {
  if (muted) return;
  const ac = getCtx();
  const duration = durationMs / 1000;

  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.value = 80;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.06, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + duration);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

/** Short click — line printer character */
export function playPrinterClick(): void {
  if (muted) return;
  const ac = getCtx();
  const duration = 0.015;
  const bufferSize = Math.ceil(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    const env = 1 - i / bufferSize;
    data[i] = (Math.random() * 2 - 1) * env * 0.08;
  }
  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 3000;
  filter.Q.value = 2;

  source.connect(filter);
  filter.connect(ac.destination);
  source.start();
}

/** Sine wave bell — job completion "ding" */
export function playJobBell(): void {
  if (muted) return;
  const ac = getCtx();
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 800;

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.15, ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.6);

  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + 0.6);
}
