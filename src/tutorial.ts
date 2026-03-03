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
};

export const EXAMPLE_KEYS = ['helloWorld', 'countdown', 'calculator', 'fibonacci'];
