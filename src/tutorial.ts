import { getAllEncodings, ROW_LABELS } from './encoding';
import { t } from './i18n';

export function renderEncodingTable(container: HTMLElement): void {
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.textContent = t('encoding.intro');
  container.appendChild(intro);

  const table = document.createElement('table');
  table.className = 'encoding-table';

  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  [t('encoding.charHeader'), ...ROW_LABELS].forEach(label => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  const encodings = getAllEncodings();

  const groups: Array<{ label: string; items: Array<{ char: string; punches: string[] }> }> = [
    { label: t('encoding.letters'), items: encodings.filter(e => /^[A-Z]$/.test(e.char)) },
    { label: t('encoding.digits'), items: encodings.filter(e => /^[0-9]$/.test(e.char)) },
    { label: t('encoding.special'), items: encodings.filter(e => !/^[A-Z0-9]$/.test(e.char)) },
  ];

  for (const group of groups) {
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
          td.textContent = '\u2588';
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

export function renderTutorial(container: HTMLElement): void {
  container.innerHTML = '';

  const sections = t('tutorial.sections') as unknown as Array<{ title: string; content: string }>;

  // Fallback: if t() returned a string key instead of array, use raw access
  const sectionData: Array<{ title: string; content: string }> = Array.isArray(sections)
    ? sections
    : getTutorialSections();

  for (const section of sectionData) {
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

function getTutorialSections(): Array<{ title: string; content: string }> {
  const result: Array<{ title: string; content: string }> = [];
  for (let i = 0; ; i++) {
    const title = t(`tutorial.sections.${i}.title`);
    if (title === `tutorial.sections.${i}.title`) break;
    const content = t(`tutorial.sections.${i}.content`);
    result.push({ title, content });
  }
  return result;
}

export const EXAMPLES: Record<string, string[]> = {
  helloWorld: [
    'PRT HELLO WORLD',
    'END',
  ],
  countdown: [
    'NUM COUNT 10',
    'LBL LOOP',
    'SHW COUNT',
    'SUB COUNT 1',
    'JGZ COUNT LOOP',
    'PRT LIFTOFF',
    'END',
  ],
  calculator: [
    'PRT ENTER FIRST NUMBER',
    'INP A',
    'PRT ENTER SECOND NUMBER',
    'INP B',
    'ADD A B',
    'PRT SUM IS',
    'SHW A',
    'END',
  ],
  fibonacci: [
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
  multiTable: [
    'REM TIMES TABLE GENERATOR',
    'REM 9 X 9 MULTIPLICATION',
    'PRT GENERATING TABLE',
    'NUM I 1',
    'NUM ILIM 9',
    'LBL OUTER',
    'PRT ---- ROW ----',
    'SHW I',
    'NUM J 1',
    'NUM JLIM 9',
    'LBL INNER',
    'NUM T 0',
    'ADD T I',
    'MUL T J',
    'PRT PRODUCT =',
    'SHW I',
    'SHW J',
    'SHW T',
    'ADD J 1',
    'SUB JLIM 1',
    'JGZ JLIM INNER',
    'ADD I 1',
    'SUB ILIM 1',
    'JGZ ILIM OUTER',
    'PRT TABLE COMPLETE',
    'END',
  ],
  bankLedger: [
    'REM COMPOUND INTEREST CALC',
    'REM 5 PCT ANNUAL 24 MONTHS',
    'REM INITIAL BALANCE 1000',
    'PRT ========================',
    'PRT BANK LEDGER REPORT',
    'PRT RATE = 5 PCT ANNUAL',
    'PRT STARTING BAL = 1000',
    'PRT ========================',
    'NUM BAL 1000',
    'NUM RATE 5',
    'NUM MONTHS 24',
    'NUM M 0',
    'LBL MONTH',
    'ADD M 1',
    'PRT --- MONTH ---',
    'SHW M',
    'NUM INT 0',
    'ADD INT BAL',
    'MUL INT RATE',
    'DIV INT 1200',
    'ADD BAL INT',
    'PRT INTEREST =',
    'SHW INT',
    'PRT BALANCE =',
    'SHW BAL',
    'SUB MONTHS 1',
    'JGZ MONTHS MONTH',
    'PRT ========================',
    'PRT LEDGER COMPLETE',
    'END',
  ],
  rocketTrajectory: [
    'REM ROCKET TRAJECTORY SIM',
    'REM THRUST AND COAST PHASE',
    'PRT ========================',
    'PRT ROCKET TRAJECTORY SIM',
    'PRT ========================',
    'NUM VEL 0',
    'NUM ALT 0',
    'NUM FUEL 25',
    'NUM ACC 10',
    'NUM STEP 50',
    'NUM T 0',
    'LBL LOOP',
    'ADD T 1',
    'PRT --- STEP ---',
    'SHW T',
    'JGZ FUEL BURN',
    'NUM ACC -2',
    'JMP APPLY',
    'LBL BURN',
    'NUM ACC 10',
    'SUB FUEL 1',
    'PRT FUEL =',
    'SHW FUEL',
    'LBL APPLY',
    'ADD VEL ACC',
    'ADD ALT VEL',
    'PRT VELOCITY =',
    'SHW VEL',
    'PRT ALTITUDE =',
    'SHW ALT',
    'SUB STEP 1',
    'JGZ STEP LOOP',
    'PRT ========================',
    'PRT SIMULATION COMPLETE',
    'PRT FINAL ALT =',
    'SHW ALT',
    'END',
  ],
  payrollBatch: [
    'REM PAYROLL BATCH JOB',
    'PRT ========================',
    'PRT PAYROLL REPORT',
    'PRT ACME CORP Q1 1965',
    'PRT ========================',
    'PRT --- SMITH ---',
    'NUM HRS 40',
    'NUM RATE 12',
    'NUM G 0',
    'ADD G HRS',
    'MUL G RATE',
    'PRT GROSS =',
    'SHW G',
    'NUM T 0',
    'ADD T G',
    'DIV T 5',
    'PRT TAX =',
    'SHW T',
    'NUM P 0',
    'ADD P G',
    'SUB P T',
    'PRT NET =',
    'SHW P',
    'PRT --- JONES ---',
    'NUM HRS 35',
    'NUM RATE 15',
    'NUM G 0',
    'ADD G HRS',
    'MUL G RATE',
    'PRT GROSS =',
    'SHW G',
    'NUM T 0',
    'ADD T G',
    'DIV T 5',
    'PRT TAX =',
    'SHW T',
    'NUM P 0',
    'ADD P G',
    'SUB P T',
    'PRT NET =',
    'SHW P',
    'PRT --- CLARK ---',
    'NUM HRS 45',
    'NUM RATE 10',
    'NUM G 0',
    'ADD G HRS',
    'MUL G RATE',
    'PRT GROSS =',
    'SHW G',
    'NUM T 0',
    'ADD T G',
    'DIV T 5',
    'PRT TAX =',
    'SHW T',
    'NUM P 0',
    'ADD P G',
    'SUB P T',
    'PRT NET =',
    'SHW P',
    'PRT ========================',
    'PRT BATCH COMPLETE',
    'PRT 3 RECORDS PROCESSED',
    'END',
  ],
  piCalc: [
    'REM PI CALCULATION',
    'REM LEIBNIZ SERIES METHOD',
    'PRT ========================',
    'PRT PI CALCULATION',
    'PRT LEIBNIZ SERIES',
    'PRT ========================',
    'NUM SUM 0',
    'NUM SGN 1',
    'NUM DENOM 1',
    'NUM N 100',
    'NUM I 0',
    'LBL ITER',
    'ADD I 1',
    'NUM T 0',
    'ADD T SGN',
    'DIV T DENOM',
    'ADD SUM T',
    'NUM PI 0',
    'ADD PI SUM',
    'MUL PI 4',
    'PRT --- ITERATION ---',
    'SHW I',
    'PRT DENOM =',
    'SHW DENOM',
    'PRT PI ESTIMATE =',
    'SHW PI',
    'ADD DENOM 2',
    'MUL SGN -1',
    'SUB N 1',
    'JGZ N ITER',
    'PRT ========================',
    'PRT FINAL ESTIMATE =',
    'SHW PI',
    'PRT CALCULATION DONE',
    'END',
  ],
};

export const EXAMPLE_KEYS = [
  'helloWorld', 'countdown', 'calculator', 'fibonacci',
  'multiTable', 'bankLedger', 'rocketTrajectory', 'payrollBatch', 'piCalc',
];
