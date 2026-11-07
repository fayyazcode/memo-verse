import { test, expect, type Page } from '@playwright/test';
import { freshSave, validateSave, type Save } from '../src/game/store';
import { newSquad } from '../src/game/squad';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
async function enter(page: Page, save: Save) {
  validateSave(save);
  await page.addInitScript(() =>
    localStorage.setItem(
      'momo-settings',
      JSON.stringify({ quality: 'low', perspective: 'adventure' })
    )
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 60000,
  });
  await page.evaluate(
    (s) =>
      new Promise<void>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(s, 'adventure');
          tx.oncomplete = () => resolve();
        };
      }),
    save
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
}
async function quit(page: Page) {
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Pause & save', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
}
async function disk(page: Page): Promise<Save> {
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
test('a player with no companion takes monster damage, uses both weapons, collects a kill and reloads equipment', async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.position = [17, 1, 21.4];
  s.squad = newSquad(null);
  await enter(page, s);
  const health = page.getByRole('progressbar', { name: 'Player health' });
  await expect
    .poll(async () => Number(await health.getAttribute('aria-valuenow')), { timeout: 30000 })
    .toBeLessThan(100);
  const enemy = page
    .locator('.world-label[data-kind="enemy"]:visible')
    .filter({ hasText: 'Wild Sproutling' });
  const attack = page.getByRole('button', { name: 'Basic attack', exact: true });
  await attack.tap();
  await expect(enemy.locator('.name-tag-health')).toHaveAttribute('aria-label', '52/70 HP');
  await page.screenshot({ path: '/tmp/momo-player-sword.png' });
  await expect(attack).toBeEnabled();
  await attack.tap();
  await expect(enemy.locator('.name-tag-health')).toHaveAttribute('aria-label', '34/70 HP');
  await page.getByRole('button', { name: 'Switch to bow', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Switch to sword', exact: true })).toBeVisible();
  for (const hp of [20, 6, 0]) {
    await expect(attack).toBeEnabled();
    await attack.tap();
    if (hp)
      await expect(enemy.locator('.name-tag-health')).toHaveAttribute('aria-label', `${hp}/70 HP`);
    else await expect(page.locator('.coin-pill b')).toHaveText('53');
  }
  const collect = page.getByRole('button', { name: 'Interact or gather', exact: true });
  await expect(collect).toContainText('Collect');
  await collect.tap();
  await quit(page);
  const saved = await disk(page);
  expect(saved.weapon).toBe('bow');
  expect(saved.creatures).toEqual({});
  expect(saved.hp).toBeLessThan(100);
  expect(saved.coins).toBe(53);
  expect(saved.inventory).toEqual([{ item: 'fiber', qty: 2 }]);
  expect(saved.version).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.getByRole('button', { name: 'Switch to sword', exact: true })).toBeVisible();
  await page.keyboard.press('g');
  await expect(page.getByRole('button', { name: 'Switch to bow', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test('bow hits at range and backpack equipment choices stay reachable without covering other actions', async ({
  page,
}) => {
  test.setTimeout(120000);
  const s = freshSave();
  s.position = [15, 1, 21];
  s.squad = newSquad(null);
  s.squad.hunting!.positions = [
    [23, 0, 27],
    [25, 0, 32],
    [24, 0, 33],
  ];
  await enter(page, s);
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Backpack', exact: true }).tap();
  await page.getByRole('button', { name: 'Equip bow', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Equip bow', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Close menu' }).tap();
  const attack = page.getByRole('button', { name: 'Basic attack', exact: true });
  await expect(attack).toContainText('Shoot');
  await page.keyboard.press('h');
  const enemy = page
    .locator('.world-label[data-kind="enemy"]:visible')
    .filter({ hasText: 'Wild Sproutling' });
  await expect(enemy.locator('.name-tag-health')).toHaveAttribute('aria-label', '56/70 HP', {
    timeout: 15000,
  });
  await page.screenshot({ path: '/tmp/momo-player-bow.png' });
  for (const [w, h] of [
    [320, 640],
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    const toggle = page.getByRole('button', { name: 'Switch to sword', exact: true });
    await expect(toggle).toHaveCSS('transform', 'none');
    const b = (await toggle.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(w);
    expect(b.y + b.height).toBeLessThanOrEqual(h);
    for (const selector of [
      '.touch-attack',
      '.touch-ability',
      '.touch-build',
      '.touch-interact',
      '.touch-jump',
    ]) {
      const a = (await page.locator(selector).boundingBox())!;
      expect(
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
          Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1
      ).toBe(false);
    }
  }
  await quit(page);
  const saved = await disk(page);
  expect(saved.squad!.hunting!.hp).toEqual([56, 100, 130]);
  expect(saved.hp).toBe(100);
});
