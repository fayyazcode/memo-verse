import { test, expect, type Page } from '@playwright/test';
import { freshSave, type Save } from '../src/game/store';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
async function seed(page: Page, s: Save) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }));
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
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
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
}
async function saved(page: Page): Promise<Save> {
  return page.evaluate(
    () =>
      new Promise<Save>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result);
        };
      })
  );
}
function oldSave() {
  const s = freshSave();
  s.position = [0, 1, 10];
  s.active = 'zaplet';
  s.creatures.zaplet = { xp: 300, hp: 65, friendship: 30 };
  s.flags = ['chest'];
  s.coins = 110;
  s.inventory = [{ item: 'crystal', qty: 2 }];
  s.quests.q03 = { status: 'complete', progress: {} };
  s.quests.q10 = { status: 'active', progress: { oak: 1, river: 1, crystal: 1 } };
  s.discoveries = ['ancientOak', 'riverBend', 'crystalClearing'];
  return s;
}
test('quest and full HUD minimize independently, restore after reload, and object labels stay sharp', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await seed(page, oldSave());
  await expect(page.getByRole('button', { name: 'Open tracked mission' })).toContainText(
    'REWARD READY'
  );
  expect((await saved(page)).quests.q10.progress.chest).toBe(1);
  const tracker = page.locator('.tracked-mission');
  const height = (await tracker.boundingBox())!.height;
  await page.getByRole('button', { name: 'Minimize mission tracker' }).tap();
  expect((await tracker.boundingBox())!.height).toBeLessThan(height);
  expect((await tracker.boundingBox())!.height).toBeLessThanOrEqual(50);
  await page.getByRole('button', { name: 'Expand mission tracker' }).tap();
  await expect(page.getByRole('button', { name: 'Open tracked mission' })).toContainText(
    'Hidden Forest Secrets'
  );
  await page.getByRole('button', { name: 'Minimize mission tracker' }).tap();
  await page.getByRole('button', { name: 'Minimize HUD' }).tap();
  await expect(page.locator('.left-hud')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Toggle companion abilities' })).toBeHidden();
  await expect(page.getByRole('group', { name: 'Movement joystick' })).toBeVisible();
  await expect(page.locator('.hotbar')).toBeVisible();
  const label = page.locator('.world-label:visible').filter({ hasText: 'Practice stone' }).first();
  await expect(label).toBeVisible({ timeout: 15000 });
  expect(
    await label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  ).toBeGreaterThanOrEqual(14);
  expect((await label.boundingBox())!.height).toBeGreaterThanOrEqual(24);
  expect(await label.evaluate((el) => getComputedStyle(el).transform)).toMatch(
    /^matrix\(1, 0, 0, 1,/
  );
  await page.screenshot({ path: '/tmp/momo-minimized-hud-sharp-labels.png' });
  await page.getByRole('button', { name: 'Open companion abilities' }).tap();
  await expect(page.getByRole('button', { name: 'Cast Spark Dash', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close companion abilities' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Switch camera perspective' }).tap();
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await expect(label).toBeVisible();
  expect(
    await label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  ).toBeGreaterThanOrEqual(14);
  await page.screenshot({ path: '/tmp/momo-sharp-labels-isometric.png' });
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.getByRole('button', { name: 'Show HUD' })).toBeVisible();
  await expect(page.locator('.left-hud')).toBeHidden();
  await page.getByRole('button', { name: 'Show HUD' }).tap();
  await expect(page.getByRole('button', { name: 'Expand mission tracker' })).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-compact-quest.png' });
  expect(errors).toEqual([]);
});
test('an already-opened forest secret can be claimed once from the original NPC', async ({
  page,
}) => {
  test.setTimeout(120000);
  const s = oldSave();
  s.position = [21, 1, -0.5];
  await seed(page, s);
  await expect(page.locator('.interaction')).toContainText('Bloop', { timeout: 15000 });
  await page.getByRole('button', { name: 'Interact or gather' }).tap();
  const claim = page.getByRole('button', { name: /Hidden Forest Secrets.*Collect reward/ });
  await expect(claim).toBeEnabled();
  await claim.tap();
  await expect(claim).toHaveCount(0);
  await page.getByRole('button', { name: 'See you around' }).tap();
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const result = await saved(page);
  expect(result.quests.q10.status).toBe('complete');
  expect(result.coins).toBe(285);
  expect(result.inventory).toEqual(s.inventory);
  expect(result.xp).toBe(90);
});
