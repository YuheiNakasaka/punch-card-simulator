export type Locale = 'en' | 'ja';

export interface Translations {
  meta: {
    title: string;
    headerTitle: string;
    subtitle: string;
  };
  toolbar: {
    prev: string;
    next: string;
    addCard: string;
    remove: string;
    clearCard: string;
    clearDeck: string;
    loadExample: string;
    zoomReset: string;
  };
  tooltips: {
    prev: string;
    next: string;
    addCard: string;
    remove: string;
    clearCard: string;
    clearDeck: string;
    zoomIn: string;
    zoomOut: string;
    zoomReset: string;
    run: string;
    step: string;
    reset: string;
  };
  exec: {
    run: string;
    step: string;
    reset: string;
    helperText: string;
  };
  tabs: {
    deck: string;
    output: string;
    encoding: string;
    tutorial: string;
  };
  app: {
    cardCounter: string;
    confirmClearDeck: string;
    inputPrompt: string;
  };
  renderer: {
    cardLabel: string;
    blank: string;
  };
  interpreter: {
    programEnded: string;
    maxSteps: string;
    divisionByZero: string;
    programError: string;
    unknownLabel: string;
    unknownInstruction: string;
  };
  encoding: {
    intro: string;
    charHeader: string;
    letters: string;
    digits: string;
    special: string;
  };
  tutorial: {
    sections: Array<{ title: string; content: string }>;
  };
  examples: Record<string, string>;
}
