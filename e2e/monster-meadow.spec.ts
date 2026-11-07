import { test, expect, type Page } from '@playwright/test';
import { freshSave, validateSave, type Save } from '../src/game/store';
import { newSquad } from '../src/game/squad';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
async function enter(page: Page, s: Save) {
  validateSave(s);
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem(
        'momo-settings',
        JSON.stringify({ quality: 'low', perspective: 'adventure' })
      );
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 60000,
  });
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
    s
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
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
async function quit(page: Page) {
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Pause & save', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
}
test('reference name plates show the player, companion portrait, level and actual health in both views', async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.active = 'mosshell';
  s.creatures.mosshell = { hp: 45, xp: 0, friendship: 20 };
  s.squad = newSquad('mosshell');
  await enter(page, s);
  const player = page.locator('.world-label[data-kind="player"]'),
    pet = page.locator('.world-label[data-kind="companion"]:visible');
  await expect(player).toBeVisible({ timeout: 30000 });
  await expect(player).toContainText('Little Wanderer');
  await expect(pet).toContainText('Mosshell');
  await expect(pet).toContainText('Lv. 1');
  await expect(pet.locator('img')).toHaveAttribute('src', '/portraits/mosshell.svg');
  expect(
    await pet.locator('.name-tag-health i').evaluate((el) => (el as HTMLElement).style.width)
  ).toBe('75%');
  for (const name of [player, pet]) {
    expect(
      await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
    ).toBeGreaterThanOrEqual(14);
    const box = await name.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  await page.screenshot({ path: '/tmp/momo-reference-nameplates-isometric.png' });
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Switch camera perspective' }).tap();
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await expect(player).toBeVisible();
  await expect(pet).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-reference-nameplates-classic.png' });
  expect(errors).toEqual([]);
});
test('monsters can be defeated, looted and fought again without duplicate or story rewards', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.position = [17, 1, 21.3];
  s.active = 'emberfox';
  s.creatures.emberfox = { hp: 60, xp: 0, friendship: 20 };
  s.squad = newSquad('emberfox');
  s.squad.hunting!.hp[0] = 6;
  await enter(page, s);
  const enemy = page
    .locator('.world-label[data-kind="enemy"]:visible')
    .filter({ hasText: 'Wild Sproutling' });
  await expect(enemy).toBeVisible({ timeout: 30000 });
  await page.screenshot({ path: '/tmp/momo-monster-meadow.png' });
  await page.getByRole('button', { name: 'Basic attack', exact: true }).tap();
  await expect(page.locator('.coin-pill b')).toHaveText('53');
  const collect = page.getByRole('button', { name: 'Interact or gather' });
  await expect(collect).toContainText('Collect');
  await collect.tap();
  await expect(collect).toContainText('Wait');
  await expect(collect).toBeDisabled();
  await quit(page);
  const checkpoint = await saved(page);
  expect(checkpoint.coins).toBe(53);
  expect(checkpoint.inventory).toEqual([{ item: 'fiber', qty: 2 }]);
  expect(checkpoint.squad!.hunting!.loot[0]).toBe(false);
  expect(checkpoint.flags).not.toContain('guardianDefeated');
  expect(checkpoint.quests).toEqual({});
  expect(checkpoint.squad!.hunting!.respawn[0]).toBeGreaterThan(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(enemy).toBeVisible({ timeout: 90000 });
  await expect(enemy.locator('.name-tag-health')).toHaveAttribute('aria-label', '70/70 HP');
  await expect(page.locator('.coin-pill b')).toHaveText('53');
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Monster Meadow', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Monster Meadow', exact: true })).toBeVisible();
  await expect(page.locator('.meadow-guide')).toContainText('20–30');
  expect(errors).toEqual([]);
});

test('the meadow sign and map open an explicit guide with one nearby object name', async ({
  page,
}) => {
  test.setTimeout(120000);
  const s = freshSave();
  s.position = [23, 1, 16.3];
  await enter(page, s);
  await expect(page.locator('.world-label[data-kind="object"]:visible')).toHaveCount(1, {
    timeout: 30000,
  });
  await expect(page.locator('.world-label[data-kind="object"]:visible')).toHaveText(
    'Monster Meadow'
  );
  await page.getByRole('button', { name: 'Interact or gather' }).tap();
  await expect(page.getByRole('heading', { name: 'Monster Meadow', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'View world map' }).tap();
  const marker = page.getByRole('button', { name: 'Monster Meadow training area' });
  await expect(marker).toBeVisible();
  await marker.tap();
  await expect(page.getByRole('heading', { name: 'Monster Meadow', exact: true })).toBeVisible();
});
