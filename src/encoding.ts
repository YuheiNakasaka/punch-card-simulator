// IBM 029 Keypunch Character Encoding
// Maps characters to arrays of row punches
// Rows: 12, 11, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
// Row indices: 0=row12, 1=row11, 2=row0, 3=row1, ... 11=row9

export const ROW_LABELS: string[] = ['12', '11', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Map row label to index
export const ROW_INDEX: Record<string, number> = {
  '12': 0, '11': 1, '0': 2, '1': 3, '2': 4, '3': 5,
  '4': 6, '5': 7, '6': 8, '7': 9, '8': 10, '9': 11
};

// IBM 029 encoding: character -> array of row labels that get punched
export const CHAR_TO_PUNCHES: Record<string, string[]> = {
  // Letters A-I: zone 12 + digit 1-9
  'A': ['12', '1'], 'B': ['12', '2'], 'C': ['12', '3'],
  'D': ['12', '4'], 'E': ['12', '5'], 'F': ['12', '6'],
  'G': ['12', '7'], 'H': ['12', '8'], 'I': ['12', '9'],
  // Letters J-R: zone 11 + digit 1-9
  'J': ['11', '1'], 'K': ['11', '2'], 'L': ['11', '3'],
  'M': ['11', '4'], 'N': ['11', '5'], 'O': ['11', '6'],
  'P': ['11', '7'], 'Q': ['11', '8'], 'R': ['11', '9'],
  // Letters S-Z: zone 0 + digit 2-9
  'S': ['0', '2'], 'T': ['0', '3'], 'U': ['0', '4'],
  'V': ['0', '5'], 'W': ['0', '6'], 'X': ['0', '7'],
  'Y': ['0', '8'], 'Z': ['0', '9'],
  // Digits 0-9: single punch
  '0': ['0'], '1': ['1'], '2': ['2'], '3': ['3'], '4': ['4'],
  '5': ['5'], '6': ['6'], '7': ['7'], '8': ['8'], '9': ['9'],
  // Space: no punches
  ' ': [],
  // Special characters (IBM 029 encoding)
  '.': ['12', '3', '8'],
  '<': ['12', '4', '8'],
  '(': ['12', '5', '8'],
  '+': ['12', '6', '8'],
  '|': ['12', '7', '8'],
  '&': ['12'],
  '!': ['11', '1', '8'],
  '$': ['11', '3', '8'],
  '*': ['11', '4', '8'],
  ')': ['11', '5', '8'],
  ';': ['11', '6', '8'],
  '-': ['11'],
  '/': ['0', '1'],
  ',': ['0', '3', '8'],
  '%': ['0', '4', '8'],
  '_': ['0', '5', '8'],
  '>': ['0', '6', '8'],
  '?': ['0', '7', '8'],
  ':': ['2', '8'],
  '#': ['3', '8'],
  '@': ['4', '8'],
  '\'': ['5', '8'],
  '=': ['6', '8'],
  '"': ['7', '8'],
};

// Build reverse map: punch pattern -> character
// Key is sorted row labels joined by ','
const _punchesToChar: Record<string, string> = {};
for (const [char, punches] of Object.entries(CHAR_TO_PUNCHES)) {
  const key = [...punches].sort().join(',');
  _punchesToChar[key] = char;
}
export const PUNCHES_TO_CHAR: Record<string, string> = _punchesToChar;

/**
 * Encode a character to an array of row indices (0-11)
 */
export function encodeChar(char: string): number[] | null {
  const upper = char.toUpperCase();
  const punches = CHAR_TO_PUNCHES[upper];
  if (!punches) return null;
  return punches.map(label => ROW_INDEX[label]);
}

/**
 * Decode row indices back to a character
 */
export function decodeRows(rowIndices: number[]): string {
  if (rowIndices.length === 0) return ' ';
  const labels = rowIndices.map(i => ROW_LABELS[i]);
  const key = [...labels].sort().join(',');
  return PUNCHES_TO_CHAR[key] || '';
}

/**
 * Get all supported characters for reference display
 */
export function getAllEncodings(): Array<{ char: string; punches: string[] }> {
  return Object.entries(CHAR_TO_PUNCHES)
    .filter(([ch]) => ch !== ' ')
    .map(([char, punches]) => ({ char, punches }));
}

export const COLS = 80;
export const ROWS = 12;
