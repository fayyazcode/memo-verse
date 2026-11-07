import { test, expect, type Page } from '@playwright/test';
import { freshSave } from '../src/game/store';
import { BRIDGE, bridgeHeight } from '../src/game/river';
async function launch(page: Page, position: [number, number, number], fruit = false) {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = position;
  if (fruit) {
    s.quests.q02 = { status: 'complete', progress: {} };
    s.inventory = [{ item: 'fruit', qty: 1 }];
  }
  await page.evaluate(
    async (s) =>
      new Promise<void>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(s, 'adventure');
          tx.oncomplete = () => resolve();
        };
      }),
    s
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
}
async function checkpoint(page: Page) {
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: 'Save progress', exact: true }).click();
  await expect(page.getByText('Saved locally', { exact: true })).toBeVisible();
  return page.evaluate(
    async () =>
      new Promise<[number, number, number]>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result.position);
        };
      })
  );
}
const playerX = (page: Page) =>
  page
    .locator('.map-player')
    .first()
    .evaluate((el) => (parseFloat((el as HTMLElement).style.left) / 100) * 144 - 34);
test('the raised wooden arch supports the player and can be climbed from the bank', async ({
  page,
}) => {
  test.setTimeout(120000);
  await launch(page, [39, 2.5, -15]);
  await page.waitForTimeout(2000);
  let p = await checkpoint(page);
  expect(p[1]).toBeGreaterThan(1.9);
  expect(p[1]).toBeLessThan(2.6);
  await page.getByRole('button', { name: 'Back to the adventure' }).click();
  await page.keyboard.down('KeyD');
  try {
    await expect.poll(() => playerX(page), { timeout: 25000 }).toBeGreaterThan(45);
  } finally {
    await page.keyboard.up('KeyD');
  }
  await page.waitForTimeout(1000);
  p = await checkpoint(page);
  expect(p[1]).toBeGreaterThan(0.5);
  expect(p[1]).toBeLessThan(1.3);
  await page.getByRole('button', { name: 'Back to the adventure' }).click();
  await page.keyboard.down('KeyA');
  try {
    await expect.poll(() => playerX(page), { timeout: 25000 }).toBeLessThan(39.6);
  } finally {
    await page.keyboard.up('KeyA');
  }
  p = await checkpoint(page);
  // Software-rendered frames can carry the player beyond the exact apex before keyup.
  // Verify the real deck height at the reached position rather than assuming x=39.
  expect(p[0]).toBeGreaterThan(BRIDGE.left);
  expect(p[0]).toBeLessThan(BRIDGE.right);
  expect(p[1]).toBeCloseTo(bridgeHeight(p[0]) + 0.76, 0);
  await page.getByRole('button', { name: 'Back to the adventure' }).click();
  await page.screenshot({ path: '/tmp/momo-arched-bridge.png' });
});
test('river water has a shallow bed and Aquabub is accessible on the dry riverbank', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' && /shader|THREE.WebGLProgram/i.test(m.text())) errors.push(m.text());
  });
  await launch(page, [39, 0.1, -25]);
  await expect(page.locator('.water-hint')).toBeVisible({ timeout: 15000 });
  const p = await checkpoint(page);
  expect(p[1]).toBeGreaterThan(-0.5);
  expect(p[1]).toBeLessThan(0.5);
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  // A separate fresh context prevents reusing the previous adventure's save.
  const second = await page
    .context()
    .browser()!
    .newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
      viewport: { width: 1440, height: 900 },
    });
  const bank = await second.newPage();
  bank.on('pageerror', (e) => errors.push(e.message));
  await launch(bank, [46, 0.8, -20], true);
  await expect(bank.locator('.interaction')).toContainText('Aquabub', { timeout: 20000 });
  await bank.screenshot({ path: '/tmp/momo-riverbank.png' });
  await bank.keyboard.press('KeyE');
  await expect(bank.getByRole('status')).toContainText('Aquabub is your new friend');
  expect(errors).toEqual([]);
  await second.close();
});
