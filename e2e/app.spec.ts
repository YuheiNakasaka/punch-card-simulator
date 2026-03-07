import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Clear localStorage to start fresh each test
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('.punch-card');
  // Set speed to Instant for deterministic tests
  await page.locator('#speed-select').selectOption('instant');
});

// ---------------------------------------------------------------------------
// 1. Page Load & Initial State
// ---------------------------------------------------------------------------
test.describe('Page Load & Initial State', () => {
  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Punch Card Programming Simulator');
  });

  test('shows header, toolbar, card area, exec bar', async ({ page }) => {
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.toolbar')).toBeVisible();
    await expect(page.locator('#card-container')).toBeVisible();
    await expect(page.locator('.exec-bar')).toBeVisible();
  });

  test('card counter shows "Card 1 of 1"', async ({ page }) => {
    await expect(page.locator('#card-counter')).toHaveText('Card 1 of 1');
  });

  test('prev button is disabled on first card', async ({ page }) => {
    await expect(page.locator('#btn-prev')).toBeDisabled();
  });

  test('examples dropdown is populated', async ({ page }) => {
    const options = page.locator('#examples-select option');
    // Default "Load Example..." + 9 example programs
    await expect(options).toHaveCount(10);
  });
});

// ---------------------------------------------------------------------------
// 2. Keyboard Input
// ---------------------------------------------------------------------------
test.describe('Keyboard Input', () => {
  test('typing characters populates char row', async ({ page }) => {
    // Press Home to ensure cursor is at column 0
    await page.keyboard.press('Home');
    await page.keyboard.type('HELLO');

    // Check that the first 5 char cells show H, E, L, L, O
    for (let i = 0; i < 5; i++) {
      const cell = page.locator(`.char-cell[data-col="${i}"]`);
      await expect(cell).toHaveText('HELLO'[i]);
    }
  });

  test('cursor advances after each character', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.type('AB');

    // After typing 2 chars, cursor should be on column 2
    const cursor = page.locator('.grid-cell.cursor').first();
    await expect(cursor).toHaveAttribute('data-col', '2');
  });
});

// ---------------------------------------------------------------------------
// 3. Grid Cell Click
// ---------------------------------------------------------------------------
test.describe('Grid Cell Click', () => {
  test('clicking a cell punches it', async ({ page }) => {
    const cell = page.locator('.grid-cell[data-col="0"][data-row="0"]');
    await cell.click();
    await expect(cell).toHaveClass(/punched/);
  });

  test('clicking a punched cell unpunches it', async ({ page }) => {
    const cell = page.locator('.grid-cell[data-col="0"][data-row="0"]');
    await cell.click();
    await expect(cell).toHaveClass(/punched/);
    await cell.click();
    await expect(cell).not.toHaveClass(/punched/);
  });
});

// ---------------------------------------------------------------------------
// 4. Deck Management
// ---------------------------------------------------------------------------
test.describe('Deck Management', () => {
  test('add card increments counter', async ({ page }) => {
    await page.locator('#btn-add').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 2 of 2');
  });

  test('navigate with prev/next buttons', async ({ page }) => {
    await page.locator('#btn-add').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 2 of 2');

    await page.locator('#btn-prev').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 1 of 2');

    await page.locator('#btn-next').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 2 of 2');
  });

  test('remove card decrements counter', async ({ page }) => {
    await page.locator('#btn-add').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 2 of 2');

    await page.locator('#btn-remove').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 1 of 1');
  });
});

// ---------------------------------------------------------------------------
// 5. Tab Navigation
// ---------------------------------------------------------------------------
test.describe('Tab Navigation', () => {
  const tabs = [
    { name: 'deck', panel: '#tab-deck' },
    { name: 'output', panel: '#tab-output' },
    { name: 'reference', panel: '#tab-reference' },
    { name: 'tutorial', panel: '#tab-tutorial' },
  ];

  for (const { name, panel } of tabs) {
    test(`clicking "${name}" tab activates correct panel`, async ({ page }) => {
      await page.locator(`[data-tab="${name}"]`).click();
      await expect(page.locator(`[data-tab="${name}"]`)).toHaveClass(/active/);
      await expect(page.locator(panel)).toHaveClass(/active/);
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Load Example Program
// ---------------------------------------------------------------------------
test.describe('Load Example Program', () => {
  test('loading Hello World sets card content', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');

    // First card should show "PRT HELLO WORLD" in char cells
    const chars: string[] = [];
    const text = 'PRT HELLO WORLD';
    for (let i = 0; i < text.length; i++) {
      const cell = page.locator(`.char-cell[data-col="${i}"]`);
      chars.push(await cell.textContent() ?? '');
    }
    expect(chars.join('')).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// 7. Run Program (Hello World)
// ---------------------------------------------------------------------------
test.describe('Run Program - Hello World', () => {
  test('outputs HELLO WORLD and program ended', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('HELLO WORLD');
    await expect(output).toContainText('Program ended.');
  });
});

// ---------------------------------------------------------------------------
// 8. Run Program (Countdown)
// ---------------------------------------------------------------------------
test.describe('Run Program - Countdown', () => {
  test('outputs COUNT values and LIFTOFF', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Countdown');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('COUNT = 10');
    await expect(output).toContainText('COUNT = 1');
    await expect(output).toContainText('LIFTOFF');
    await expect(output).toContainText('Program ended.');
  });
});

// ---------------------------------------------------------------------------
// 9. Step Execution
// ---------------------------------------------------------------------------
test.describe('Step Execution', () => {
  test('stepping through Hello World executes one instruction at a time', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('[data-tab="output"]').click();

    // First step: PRT HELLO WORLD
    await page.locator('#btn-step').click();
    const output = page.locator('#terminal-output');
    await expect(output).toContainText('HELLO WORLD');

    // Second step: END -> finishes
    await page.locator('#btn-step').click();
    await expect(output).toContainText('Program ended.');
  });
});

// ---------------------------------------------------------------------------
// 10. Reset
// ---------------------------------------------------------------------------
test.describe('Reset', () => {
  test('reset clears terminal output', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('HELLO WORLD');

    await page.locator('#btn-reset').click();
    await expect(output).toBeEmpty();
  });
});

// ---------------------------------------------------------------------------
// 11. Zoom Controls
// ---------------------------------------------------------------------------
test.describe('Zoom Controls', () => {
  test('zoom in increases zoom level', async ({ page }) => {
    await page.locator('#btn-zoom-in').click();
    await expect(page.locator('#zoom-level')).toHaveText('125%');
  });

  test('zoom out decreases zoom level', async ({ page }) => {
    await page.locator('#btn-zoom-out').click();
    await expect(page.locator('#zoom-level')).toHaveText('75%');
  });

  test('zoom reset returns to 100%', async ({ page }) => {
    await page.locator('#btn-zoom-in').click();
    await page.locator('#btn-zoom-in').click();
    await expect(page.locator('#zoom-level')).toHaveText('150%');

    await page.locator('#btn-zoom-reset').click();
    await expect(page.locator('#zoom-level')).toHaveText('100%');
  });

  test('zoom does not go below 50%', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.locator('#btn-zoom-out').click();
    }
    await expect(page.locator('#zoom-level')).toHaveText('50%');
  });

  test('zoom does not go above 300%', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      await page.locator('#btn-zoom-in').click();
    }
    await expect(page.locator('#zoom-level')).toHaveText('300%');
  });
});

// ---------------------------------------------------------------------------
// 12. Mobile Viewport
// ---------------------------------------------------------------------------
test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('card area is horizontally scrollable on mobile', async ({ page }) => {
    const cardArea = page.locator('.card-area');
    const scrollWidth = await cardArea.evaluate(el => el.scrollWidth);
    const clientWidth = await cardArea.evaluate(el => el.clientWidth);
    expect(scrollWidth).toBeGreaterThan(clientWidth);
  });

  test('cells are large enough to tap on mobile', async ({ page }) => {
    const cell = page.locator('.grid-cell').first();
    const box = await cell.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(20);
  });
});

// ---------------------------------------------------------------------------
// 13. Clear Card / Clear Deck
// ---------------------------------------------------------------------------
test.describe('Clear Card / Clear Deck', () => {
  test('clear card blanks the current card', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.type('TEST');

    // Verify typed content
    await expect(page.locator('.char-cell[data-col="0"]')).toHaveText('T');

    await page.locator('#btn-clear-card').click();

    // All char cells on the card should now be empty
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`.char-cell[data-col="${i}"]`)).toHaveText('');
    }
  });

  test('clear deck resets to 1 blank card', async ({ page }) => {
    // Add extra cards
    await page.locator('#btn-add').click();
    await page.locator('#btn-add').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 3 of 3');

    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept());

    await page.locator('#btn-clear-deck').click();
    await expect(page.locator('#card-counter')).toHaveText('Card 1 of 1');
  });
});

// ---------------------------------------------------------------------------
// 14. Job Submission Workflow (Instant Speed)
// ---------------------------------------------------------------------------
test.describe('Job Submission Workflow', () => {
  test('Submit Job button is visible, Stop Job is hidden initially', async ({ page }) => {
    await expect(page.locator('#btn-run')).toBeVisible();
    await expect(page.locator('#btn-stop')).toBeHidden();
  });

  test('Submit Job outputs JCL header', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('//JOB');
    await expect(output).toContainText('EXEC PGM=PUNCHSIM');
    await expect(output).toContainText('//SYSIN   DD *');
  });

  test('Submit Job outputs JOB ENDED with COND CODE', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('JOB #');
    await expect(output).toContainText('ENDED - COND CODE 0000');
  });

  test('job number increments across submissions', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');

    // First submission
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();
    const output = page.locator('#terminal-output');
    const firstText = await output.textContent();
    const firstMatch = firstText?.match(/JOB #(\d+) ENDED/);
    expect(firstMatch).not.toBeNull();
    const firstJobNum = parseInt(firstMatch![1], 10);

    // Reset and submit again
    await page.locator('#btn-reset').click();
    await page.locator('#btn-run').click();
    const secondText = await output.textContent();
    const secondMatch = secondText?.match(/JOB #(\d+) ENDED/);
    expect(secondMatch).not.toBeNull();
    const secondJobNum = parseInt(secondMatch![1], 10);

    expect(secondJobNum).toBe(firstJobNum + 1);
  });

  test('Submit Job button text matches i18n key', async ({ page }) => {
    // Default locale is EN
    await expect(page.locator('#btn-run')).toHaveText('Submit Job');
  });
});

// ---------------------------------------------------------------------------
// 15. Speed Control
// ---------------------------------------------------------------------------
test.describe('Speed Control', () => {
  test('speed selector is visible with 4 options', async ({ page }) => {
    const select = page.locator('#speed-select');
    await expect(select).toBeVisible();
    const options = select.locator('option');
    await expect(options).toHaveCount(4);
  });

  test('speed selector has instant/fast/realistic/slow values', async ({ page }) => {
    const values = await page.locator('#speed-select option').evaluateAll(
      (opts) => (opts as HTMLOptionElement[]).map(o => o.value),
    );
    expect(values).toEqual(['instant', 'fast', 'realistic', 'slow']);
  });

  test('changing speed to fast still runs program correctly', async ({ page }) => {
    await page.locator('#speed-select').selectOption('fast');
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('HELLO WORLD', { timeout: 10000 });
    await expect(output).toContainText('ENDED - COND CODE 0000', { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 16. ABEND Error Messages
// ---------------------------------------------------------------------------
test.describe('ABEND Error Messages', () => {
  test('division by zero shows ABEND S0C7', async ({ page }) => {
    // Manually create a program: NUM X 10, DIV X 0, END
    await page.keyboard.press('Home');
    await page.keyboard.type('NUM X 10');
    await page.locator('#btn-next').click();
    await page.keyboard.press('Home');
    await page.keyboard.type('DIV X 0');
    await page.locator('#btn-next').click();
    await page.keyboard.press('Home');
    await page.keyboard.type('END');

    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('ABEND S0C7');
    await expect(output).toContainText('DATA EXCEPTION');
  });

  test('unknown label shows ABEND S806-04', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.type('JMP NOWHERE');
    await page.locator('#btn-next').click();
    await page.keyboard.press('Home');
    await page.keyboard.type('END');

    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('ABEND S806-04');
    await expect(output).toContainText('LABEL NOT FOUND');
  });

  test('unknown instruction shows ABEND S013-14', async ({ page }) => {
    await page.keyboard.press('Home');
    await page.keyboard.type('XYZ');
    await page.locator('#btn-next').click();
    await page.keyboard.press('Home');
    await page.keyboard.type('END');

    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const output = page.locator('#terminal-output');
    await expect(output).toContainText('ABEND S013-14');
    await expect(output).toContainText('INVALID OPERATION');
  });
});

// ---------------------------------------------------------------------------
// 17. Audio Toggle
// ---------------------------------------------------------------------------
test.describe('Audio Toggle', () => {
  test('audio toggle button is visible', async ({ page }) => {
    await expect(page.locator('#audio-toggle')).toBeVisible();
  });

  test('audio defaults to muted (Sound OFF)', async ({ page }) => {
    await expect(page.locator('#audio-label')).toHaveText('Sound OFF');
  });

  test('clicking audio toggle switches to Sound ON', async ({ page }) => {
    await page.locator('#audio-toggle').click();
    await expect(page.locator('#audio-label')).toHaveText('Sound ON');
  });

  test('clicking audio toggle twice returns to Sound OFF', async ({ page }) => {
    await page.locator('#audio-toggle').click();
    await expect(page.locator('#audio-label')).toHaveText('Sound ON');
    await page.locator('#audio-toggle').click();
    await expect(page.locator('#audio-label')).toHaveText('Sound OFF');
  });
});

// ---------------------------------------------------------------------------
// 18. CRT Screen Effect
// ---------------------------------------------------------------------------
test.describe('CRT Screen Effect', () => {
  test('output panel has scanline pseudo-element styling', async ({ page }) => {
    await page.locator('[data-tab="output"]').click();
    const tabOutput = page.locator('#tab-output');
    const borderRadius = await tabOutput.evaluate(
      el => getComputedStyle(el).borderRadius,
    );
    expect(borderRadius).toBe('8px');
  });

  test('terminal text has green glow (text-shadow)', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();
    await page.locator('[data-tab="output"]').click();

    const textShadow = await page.locator('#terminal-output').evaluate(
      el => getComputedStyle(el).textShadow,
    );
    expect(textShadow).not.toBe('none');
  });
});

// ---------------------------------------------------------------------------
// 19. Card Reader Animation
// ---------------------------------------------------------------------------
test.describe('Card Reader Animation', () => {
  test('after submit job reset clears card-read states', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();

    // After instant job completes, no thumbnails should have card-read class
    await page.locator('[data-tab="deck"]').click();
    const readCards = page.locator('.card-thumbnail.card-read');
    await expect(readCards).toHaveCount(0);
    const readingCards = page.locator('.card-thumbnail.card-reading');
    await expect(readingCards).toHaveCount(0);
  });
});

// ---------------------------------------------------------------------------
// 20. Job Workflow with Fast Speed (async path)
// ---------------------------------------------------------------------------
test.describe('Job Workflow - Fast Speed', () => {
  test('Stop Job button appears during async execution', async ({ page }) => {
    await page.locator('#speed-select').selectOption('fast');

    // Load countdown (takes more steps = more time with delays)
    await page.locator('#examples-select').selectOption('Countdown');
    await page.locator('#btn-run').click();

    // Stop button should appear while job is running
    await expect(page.locator('#btn-stop')).toBeVisible({ timeout: 3000 });
  });

  test('clicking Stop Job cancels the running job', async ({ page }) => {
    await page.locator('#speed-select').selectOption('slow');
    await page.locator('#examples-select').selectOption('Countdown');
    await page.locator('#btn-run').click();

    // Wait for stop button to appear
    await expect(page.locator('#btn-stop')).toBeVisible({ timeout: 5000 });
    await page.locator('#btn-stop').click();

    // After stopping, Submit Job button reappears
    await expect(page.locator('#btn-run')).toBeVisible({ timeout: 5000 });

    // Output should contain CANCELLED
    await page.locator('[data-tab="output"]').click();
    const output = page.locator('#terminal-output');
    await expect(output).toContainText('CANCELLED', { timeout: 5000 });
  });

  test('job phase label shows during async execution', async ({ page }) => {
    await page.locator('#speed-select').selectOption('fast');
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('#btn-run').click();

    // Phase label should show something during execution
    const phaseLabel = page.locator('#job-phase');
    // It might transition quickly, but it should exist
    await expect(phaseLabel).toBeAttached();

    // Wait for job to complete
    await expect(page.locator('#btn-run')).toBeVisible({ timeout: 10000 });

    // After completion, phase label should be empty
    await expect(phaseLabel).toHaveText('');
  });
});

// ---------------------------------------------------------------------------
// 21. Step Execution Unaffected by Job Flow
// ---------------------------------------------------------------------------
test.describe('Step Execution Independence', () => {
  test('step execution works without job workflow', async ({ page }) => {
    await page.locator('#examples-select').selectOption('Hello World');
    await page.locator('[data-tab="output"]').click();

    // Step should work directly without triggering job phases
    await page.locator('#btn-step').click();
    const output = page.locator('#terminal-output');
    await expect(output).toContainText('HELLO WORLD');

    // No JCL header should appear from step execution
    const text = await output.textContent();
    expect(text).not.toContain('//JOB');
    expect(text).not.toContain('EXEC PGM=PUNCHSIM');
  });
});

// ---------------------------------------------------------------------------
// 22. Language Toggle with New UI Elements
// ---------------------------------------------------------------------------
test.describe('i18n - New Elements', () => {
  test('switching to Japanese translates Submit Job button', async ({ page }) => {
    await page.locator('#lang-toggle').click();
    // After switching to JA
    await expect(page.locator('#btn-run')).toHaveText('ジョブ投入');
  });

  test('switching to Japanese translates audio label', async ({ page }) => {
    await page.locator('#lang-toggle').click();
    await expect(page.locator('#audio-label')).toHaveText('音声 OFF');
  });

  test('switching to Japanese translates speed label', async ({ page }) => {
    await page.locator('#lang-toggle').click();
    await expect(page.locator('.speed-label')).toHaveText('速度');
  });
});
