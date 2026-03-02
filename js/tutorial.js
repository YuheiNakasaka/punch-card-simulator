import { getAllEncodings, ROW_LABELS } from './encoding.js';

/**
 * Render the encoding reference table
 */
export function renderEncodingTable(container) {
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.textContent = 'IBM 029 Keypunch Encoding Reference — each character is represented by a combination of punched rows:';
  container.appendChild(intro);

  const table = document.createElement('table');
  table.className = 'encoding-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Char', ...ROW_LABELS].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  const encodings = getAllEncodings();

  // Group: Letters, Digits, Special
  const groups = [
    { label: 'Letters', items: encodings.filter(e => /^[A-Z]$/.test(e.char)) },
    { label: 'Digits', items: encodings.filter(e => /^[0-9]$/.test(e.char)) },
    { label: 'Special', items: encodings.filter(e => !/^[A-Z0-9]$/.test(e.char)) },
  ];

  for (const group of groups) {
    // Group header
    const groupRow = document.createElement('tr');
    groupRow.className = 'group-header';
    const groupTd = document.createElement('td');
    groupTd.colSpan = ROW_LABELS.length + 1;
    groupTd.textContent = group.label;
    groupRow.appendChild(groupTd);
    tbody.appendChild(groupRow);

    for (const { char, punches } of group.items) {
      const tr = document.createElement('tr');
      const charTd = document.createElement('td');
      charTd.className = 'char-col';
      charTd.textContent = char;
      tr.appendChild(charTd);

      for (const rowLabel of ROW_LABELS) {
        const td = document.createElement('td');
        if (punches.includes(rowLabel)) {
          td.className = 'punch-mark';
          td.textContent = '\u2588'; // block char
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Render the tutorial content
 */
export function renderTutorial(container) {
  container.innerHTML = '';

  const sections = [
    {
      title: 'What is a Punch Card?',
      content: `<p>Punch cards were the primary way to input programs into computers from the 1890s through the 1970s.
      The standard IBM 80-column punch card measures 7⅜ × 3¼ inches and has 80 columns and 12 rows.</p>
      <p>Each column represents one character. A character is encoded by punching holes in specific rows of that column.
      The combination of punched rows determines which character is stored.</p>
      <p>The 12 rows are divided into <strong>zone punches</strong> (rows 12, 11, 0) and <strong>digit punches</strong> (rows 0-9).
      Note that row 0 serves as both a zone and digit row.</p>`
    },
    {
      title: 'How Characters are Encoded',
      content: `<p>Letters use a combination of one zone punch and one digit punch:</p>
      <ul>
        <li><strong>A-I</strong>: Row 12 + Rows 1-9</li>
        <li><strong>J-R</strong>: Row 11 + Rows 1-9</li>
        <li><strong>S-Z</strong>: Row 0 + Rows 2-9</li>
      </ul>
      <p>Digits use a single punch in their corresponding row (0-9).</p>
      <p>Special characters use combinations of two or three punches.</p>`
    },
    {
      title: 'Tutorial: Your First Punch Card',
      content: `<ol>
        <li><strong>Click on the grid</strong> — Click any cell to punch or unpunch a hole. Try clicking row 12, column 1 and row 1, column 1. You just encoded the letter "A"!</li>
        <li><strong>Use the keyboard</strong> — Simply type on your keyboard. Each character is automatically encoded into the current column, and the cursor advances. Try typing "HELLO".</li>
        <li><strong>Navigate</strong> — Use arrow keys to move the cursor. Backspace deletes the previous column. Home/End jump to the start/end.</li>
        <li><strong>Manage your deck</strong> — Click "Add Card" to create new cards. Use Prev/Next to navigate between them. Press Enter to move to the next card.</li>
      </ol>`
    },
    {
      title: 'Tutorial: Running a Program',
      content: `<ol>
        <li>Load an example program from the "Examples" dropdown, or type your own.</li>
        <li>Each card is one instruction. The format is: <code>OPCODE ARG1 ARG2</code></li>
        <li>Click <strong>Run</strong> to execute all cards, or <strong>Step</strong> to execute one instruction at a time.</li>
        <li>Output appears in the terminal panel below.</li>
        <li>Click <strong>Reset</strong> to clear the execution state and start over.</li>
      </ol>`
    },
    {
      title: 'Instruction Reference',
      content: `<table class="instruction-table">
        <thead><tr><th>Instruction</th><th>Format</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>PRT</td><td>PRT text</td><td>Print text to output</td></tr>
          <tr><td>NUM</td><td>NUM var val</td><td>Assign a number to a variable</td></tr>
          <tr><td>ADD</td><td>ADD var val</td><td>Add value to variable</td></tr>
          <tr><td>SUB</td><td>SUB var val</td><td>Subtract value from variable</td></tr>
          <tr><td>MUL</td><td>MUL var val</td><td>Multiply variable by value</td></tr>
          <tr><td>DIV</td><td>DIV var val</td><td>Divide variable by value</td></tr>
          <tr><td>SHW</td><td>SHW var</td><td>Show variable value</td></tr>
          <tr><td>LBL</td><td>LBL name</td><td>Define a label</td></tr>
          <tr><td>JMP</td><td>JMP name</td><td>Jump to label</td></tr>
          <tr><td>JEZ</td><td>JEZ var name</td><td>Jump if variable equals zero</td></tr>
          <tr><td>JGZ</td><td>JGZ var name</td><td>Jump if variable greater than zero</td></tr>
          <tr><td>INP</td><td>INP var</td><td>Read user input into variable</td></tr>
          <tr><td>END</td><td>END</td><td>End program</td></tr>
          <tr><td>REM</td><td>REM text</td><td>Comment (ignored)</td></tr>
        </tbody>
      </table>`
    },
    {
      title: 'History of Punch Cards',
      content: `<p>The punch card was invented by Herman Hollerith in the 1880s for use in the 1890 US Census.
      His company later became IBM. The 80-column card format was introduced by IBM in 1928 and became the industry standard.</p>
      <p>At their peak in the 1960s-70s, billions of punch cards were produced annually. Programmers would prepare their
      programs on cards using a keypunch machine (like the IBM 029), submit the card deck to the computer operator,
      and wait — sometimes hours — for their output.</p>
      <p>The phrase "do not fold, spindle, or mutilate" printed on many cards became a cultural catchphrase.
      Though replaced by terminals and keyboards, punch cards left a lasting legacy: the 80-character line width
      standard in many programming languages and terminals traces back to the 80 columns of a punch card.</p>`
    }
  ];

  for (const section of sections) {
    const div = document.createElement('div');
    div.className = 'tutorial-section';
    const h3 = document.createElement('h3');
    h3.textContent = section.title;
    div.appendChild(h3);
    const content = document.createElement('div');
    content.innerHTML = section.content;
    div.appendChild(content);
    container.appendChild(div);
  }
}

/**
 * Example programs
 */
export const EXAMPLES = {
  'Hello World': [
    'PRT HELLO WORLD',
    'END',
  ],
  'Countdown': [
    'NUM COUNT 10',
    'LBL LOOP',
    'SHW COUNT',
    'SUB COUNT 1',
    'JGZ COUNT LOOP',
    'PRT LIFTOFF',
    'END',
  ],
  'Calculator': [
    'PRT ENTER FIRST NUMBER',
    'INP A',
    'PRT ENTER SECOND NUMBER',
    'INP B',
    'ADD A B',
    'PRT SUM IS',
    'SHW A',
    'END',
  ],
  'Fibonacci': [
    'NUM A 0',
    'NUM B 1',
    'NUM COUNT 10',
    'LBL LOOP',
    'SHW A',
    'NUM TEMP 0',
    'ADD TEMP A',
    'ADD TEMP B',
    'NUM A 0',
    'ADD A B',
    'NUM B 0',
    'ADD B TEMP',
    'SUB COUNT 1',
    'JGZ COUNT LOOP',
    'END',
  ],
};
