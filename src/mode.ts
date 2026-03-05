export type InputMode = 'easy' | 'hard';

const STORAGE_KEY = 'punch-card-mode';

let currentMode: InputMode = 'easy';
const listeners: Array<(mode: InputMode) => void> = [];

export function getMode(): InputMode {
  return currentMode;
}

export function initMode(): void {
  const stored = localStorage.getItem(STORAGE_KEY) as InputMode | null;
  if (stored && (stored === 'easy' || stored === 'hard')) {
    currentMode = stored;
  }
}

export function setMode(mode: InputMode): void {
  if (mode === currentMode) return;
  currentMode = mode;
  localStorage.setItem(STORAGE_KEY, mode);
  for (const fn of listeners) {
    fn(mode);
  }
}

export function onModeChange(fn: (mode: InputMode) => void): void {
  listeners.push(fn);
}
