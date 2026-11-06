import { test, expect, type Page } from '@playwright/test';
import { freshSave, validateSave, type Save } from '../src/game/store';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
async function disk(page: Page): Promise<Save> {
  return page.evaluate(
    () =>
      new Promise<Save>((resolve, reject) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result);
          q.onerror = () => reject(q.error);
        };
      })
  );
}
async function put(page: Page, save: Save) {
  validateSave(save);
  await page.evaluate(
    (s) =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(s, 'adventure');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    save
  );
}
async function quit(page: Page) {
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Pause & save', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
}
test('mission 9 can craft, preview and build a roofed home, open its gate, enter it, and claim once', async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem(
        'momo-settings',
        JSON.stringify({ quality: 'low', perspective: 'classic' })
      );
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 60000,
  });
  const s = freshSave();
  s.position = [10, 1, 11];
  s.inventory = [{ item: 'wood', qty: 12 }];
  s.quests.q02 = { status: 'complete', progress: {} };
  s.quests.q09 = { status: 'active', progress: {} };
  await put(page, s);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.interaction')).toContainText('crafting bench', { timeout: 30000 });
  await page.getByRole('button', { name: 'Interact or gather' }).tap();
  const recipe = page
    .locator('.batch-recipe')
    .filter({ has: page.getByRole('heading', { name: 'Wooden block' }) });
  await recipe.getByRole('spinbutton', { name: 'Wooden block batch count' }).fill('12');
  await recipe.getByRole('button', { name: 'Craft 24', exact: true }).tap();
  await expect(recipe).toContainText('have 0');
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await quit(page);
  const crafted = await disk(page);
  expect(crafted.quests.q09.progress.craft).toBe(12);
  // Resume the real crafted checkpoint at the plot to keep the test focused on housing, not travel time.
  await put(page, { ...crafted, position: [2, 1, 27] });
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Quest journal', exact: true }).tap();
  await expect(
    page
      .locator('.journal-quest')
      .filter({ has: page.getByRole('heading', { name: 'Home Sweet Home' }) })
      .locator('.quest-number')
  ).toHaveText('09');
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Toggle building mode' }).tap();
  await expect(page.getByRole('region', { name: 'House building tools' })).toBeVisible();
  await page.getByRole('button', { name: 'Build roof', exact: true }).tap();
  await page.getByRole('combobox', { name: 'Roof height' }).selectOption('3');
  await expect(page.getByRole('combobox', { name: 'Roof height' })).toHaveValue('3');
  await page.getByRole('button', { name: 'Build gate', exact: true }).tap();
  await expect(page.getByRole('combobox', { name: 'Gate floor' })).toHaveValue('0');
  await page.getByRole('button', { name: 'Rotate building piece' }).tap();
  await page.getByRole('button', { name: 'Build starter home', exact: true }).tap();
  const build = page.getByRole('button', { name: 'Build starter home · 24 blocks', exact: true });
  await expect(build).toBeEnabled();
  await page.screenshot({ path: '/tmp/momo-house-preview.png' });
  await build.tap();
  await expect(page.getByRole('region', { name: 'House building tools' })).toContainText(
    '0 wooden blocks'
  );
  await page.getByRole('button', { name: 'Exit building mode' }).tap();
  await expect(page.getByRole('button', { name: 'Open tracked mission' })).toContainText('REWARD');
  await page.screenshot({ path: '/tmp/momo-house-built.png' });
  await quit(page);
  const built = await disk(page);
  expect(built.blocks).toHaveLength(24);
  expect(built.blocks.filter((b) => b.part === 'roof')).toHaveLength(9);
  const gate = built.blocks.find((b) => b.part === 'gate')!;
  expect(gate.rotation).toBe(1);
  await put(page, { ...built, position: [gate.x + 2, 1, gate.z + 0.5] });
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.getByRole('button', { name: 'Open wooden gate' })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole('button', { name: 'Open wooden gate' }).tap();
  await expect(page.getByRole('button', { name: 'Close wooden gate' })).toBeVisible();
  const start = await page
    .locator('.map-player')
    .first()
    .evaluate((el) => parseFloat((el as HTMLElement).style.left));
  await page.keyboard.down('KeyA');
  try {
    await expect
      .poll(
        () =>
          page
            .locator('.map-player')
            .first()
            .evaluate((el) => parseFloat((el as HTMLElement).style.left)),
        { timeout: 30000 }
      )
      .toBeLessThan(start - 1.4);
  } finally {
    await page.keyboard.up('KeyA');
  }
  await page.screenshot({ path: '/tmp/momo-house-gate-open.png' });
  await quit(page);
  const entered = await disk(page);
  expect(entered.position[0]).toBeLessThan(gate.x + 0.5);
  expect(entered.flags).toContain(`open:gate:${gate.x}:${gate.y}:${gate.z}`);
  await put(page, { ...entered, position: [7, 1, 9] });
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.interaction')).toContainText('Bruno', { timeout: 30000 });
  await page.getByRole('button', { name: 'Interact or gather' }).tap();
  const claim = page.getByRole('button', { name: /Home Sweet Home.*Collect reward/ });
  await expect(claim).toBeEnabled();
  await claim.tap();
  await expect(claim).toHaveCount(0);
  await page.getByRole('button', { name: 'See you around' }).tap();
  await quit(page);
  const result = await disk(page);
  expect(result.quests.q09.status).toBe('complete');
  expect(result.coins).toBe(200);
  expect(result.blocks).toHaveLength(24);
  expect(result.version).toBe(1);
  expect(errors).toEqual([]);
});
