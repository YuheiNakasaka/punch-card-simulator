import type { Translations } from "./types";

export const en: Translations = {
  meta: {
    title: "Punch Card Programming Simulator",
    headerTitle: "PUNCH CARD SIMULATOR",
    subtitle: "IBM 80-Column Card",
  },
  toolbar: {
    prev: "\u2190 Prev",
    next: "Next \u2192",
    addCard: "+ Add Card",
    remove: "\u00D7 Remove",
    clearCard: "Clear Card",
    clearDeck: "Clear Deck",
    loadExample: "Load Example...",
    zoomReset: "Reset",
  },
  tooltips: {
    prev: "Previous card",
    next: "Next card (or add new)",
    addCard: "Insert new card after current",
    remove: "Remove current card",
    clearCard: "Clear current card",
    clearDeck: "Clear all cards",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    zoomReset: "Reset zoom",
    run: "Run entire program",
    step: "Execute one instruction",
    reset: "Reset execution state",
  },
  exec: {
    run: "\u25B6 Run",
    step: "Step",
    reset: "Reset",
    helperText:
      "Type to punch characters \u2022 Click cells to toggle \u2022 Arrow keys to navigate",
    helperTextHard:
      "Click cells to punch holes \u2022 Arrow keys to navigate",
  },
  mode: {
    easy: "EASY",
    hard: "HARD",
    tooltip: "Toggle input mode",
  },
  tabs: {
    deck: "Deck",
    output: "Output",
    encoding: "Encoding",
    tutorial: "Tutorial",
  },
  app: {
    cardCounter: "Card {current} of {total}",
    confirmClearDeck: "Clear all cards in the deck?",
    inputPrompt: "Enter value for {varName}:",
  },
  renderer: {
    cardLabel: "Card {n}",
    blank: "(blank)",
  },
  interpreter: {
    programEnded: "Program ended.",
    maxSteps: "Execution stopped: maximum steps (10,000) reached.",
    divisionByZero: "Error: Division by zero",
    programError: "Program error.",
    unknownLabel: "Error: Unknown label '{label}'",
    unknownInstruction: "Unknown instruction: {op}",
    abendDivZero: "ABEND S0C7 - DATA EXCEPTION AT CARD {n}",
    abendLabelNotFound: "ABEND S806-04 - LABEL NOT FOUND '{label}'",
    abendInvalidOp: "ABEND S013-14 - INVALID OPERATION '{op}'",
    abendTimeLimit: "ABEND S122 - TIME LIMIT EXCEEDED",
    jobEndedOk: "JOB ENDED - COND CODE 0000",
  },
  job: {
    submitJob: "Submit Job",
    stopJob: "Stop Job",
    submitting: "Submitting job...",
    reading: "Reading {count} cards...",
    executing: "Executing...",
    phaseLabel: "Phase: {phase}",
  },
  speed: {
    label: "Speed",
    instant: "Instant",
    fast: "Fast",
    realistic: "Realistic",
    slow: "Slow",
  },
  audio: {
    mute: "Sound OFF",
    unmute: "Sound ON",
  },
  encoding: {
    intro:
      "IBM 029 Keypunch Encoding Reference \u2014 each character is represented by a combination of punched rows:",
    charHeader: "Char",
    letters: "Letters",
    digits: "Digits",
    special: "Special",
  },
  tutorial: {
    sections: [
      {
        title: "What is a Punch Card?",
        content: `<p>Punch cards were the primary way to input programs into computers from the 1890s through the 1970s.
      The standard IBM 80-column punch card measures 7\u215C \u00D7 3\u00BC inches and has 80 columns and 12 rows.</p>
      <p>Each column represents one character. A character is encoded by punching holes in specific rows of that column.
      The combination of punched rows determines which character is stored.</p>
      <p>The 12 rows are divided into <strong>zone punches</strong> (rows 12, 11, 0) and <strong>digit punches</strong> (rows 0-9).
      Note that row 0 serves as both a zone and digit row.</p>`,
      },
      {
        title: "How Characters are Encoded",
        content: `<p>Letters use a combination of one zone punch and one digit punch:</p>
      <ul>
        <li><strong>A-I</strong>: Row 12 + Rows 1-9</li>
        <li><strong>J-R</strong>: Row 11 + Rows 1-9</li>
        <li><strong>S-Z</strong>: Row 0 + Rows 2-9</li>
      </ul>
      <p>Digits use a single punch in their corresponding row (0-9).</p>
      <p>Special characters use combinations of two or three punches.</p>`,
      },
      {
        title: "Tutorial: Your First Punch Card",
        content: `<ol>
        <li><strong>Click on the grid</strong> \u2014 Click any cell to punch or unpunch a hole. Try clicking row 12, column 1 and row 1, column 1. You just encoded the letter "A"!</li>
        <li><strong>Use the keyboard</strong> \u2014 Simply type on your keyboard. Each character is automatically encoded into the current column, and the cursor advances. Try typing "HELLO".</li>
        <li><strong>Navigate</strong> \u2014 Use arrow keys to move the cursor. Backspace deletes the previous column. Home/End jump to the start/end.</li>
        <li><strong>Manage your deck</strong> \u2014 Click "Add Card" to create new cards. Use Prev/Next to navigate between them. Press Enter to move to the next card.</li>
      </ol>`,
      },
      {
        title: "Tutorial: Running a Program",
        content: `<ol>
        <li>Load an example program from the "Examples" dropdown, or type your own.</li>
        <li>Each card is one instruction. The format is: <code>OPCODE ARG1 ARG2</code></li>
        <li>Click <strong>Run</strong> to execute all cards, or <strong>Step</strong> to execute one instruction at a time.</li>
        <li>Output appears in the terminal panel below.</li>
        <li>Click <strong>Reset</strong> to clear the execution state and start over.</li>
      </ol>`,
      },
      {
        title: "Instruction Reference",
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
      </table>`,
      },
      {
        title: "History of Punch Cards",
        content: `<p>The punch card was invented by Herman Hollerith in the 1880s for use in the 1890 US Census.
      His company later became IBM. The 80-column card format was introduced by IBM in 1928 and became the industry standard.</p>
      <p>At their peak in the 1960s-70s, billions of punch cards were produced annually. Programmers would prepare their
      programs on cards using a keypunch machine (like the IBM 029), submit the card deck to the computer operator,
      and wait \u2014 sometimes hours \u2014 for their output.</p>
      <p>The phrase "do not fold, spindle, or mutilate" printed on many cards became a cultural catchphrase.
      Though replaced by terminals and keyboards, punch cards left a lasting legacy: the 80-character line width
      standard in many programming languages and terminals traces back to the 80 columns of a punch card.</p>`,
      },
    ],
  },
  examples: {
    helloWorld: "Hello World",
    countdown: "Countdown",
    calculator: "Calculator",
    fibonacci: "Fibonacci",
  },
};
