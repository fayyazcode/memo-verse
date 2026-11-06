import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('mission hover, map destinations and creature detail cards help the player', async ({
  page,
}) => {
  // Two WebGL scenes and a reload make this flow slower under the cloud software renderer.
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const save = freshSave();
  save.quests.q01 = { status: 'complete', progress: {} };
  save.quests.q02 = { status: 'active', progress: { wood: 4 } };
  save.creatures.emberfox = { xp: 125, hp: 45, friendship: 38 };
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
    save
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await page.getByRole('button', { name: 'Expand tasks' }).click();
  await page.locator('.quest-card').hover();
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.getByRole('tooltip')).toContainText('4 more Wood');
  await expect(page.getByRole('tooltip')).toContainText('Make a delivery');
  await page.getByRole('button', { name: 'Show destinations on map' }).click();
  await expect(page.locator('.map-art.large .mission-marker').first()).toBeVisible();
  await page.locator('.map-art.large .mission-marker').first().click();
  await expect(page.locator('.map-mission-info')).toContainText('The Forest Supplies');
  await expect(page.locator('.map-mission-info')).toContainText('4 more Wood');
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyC');
  await expect(page.getByRole('img', { name: 'Emberfox portrait' })).toBeVisible();
  await page.getByRole('button', { name: 'View creature card' }).first().click();
  const card = page.getByRole('region', { name: 'Emberfox creature details' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('45 / 65 HP');
  await expect(card).toContainText('38 / 100');
  await expect(card).toContainText('Warm berry treat');
  await expect(card.locator('canvas')).toBeVisible();
  await expect(card.locator('.creature-3d')).toHaveAttribute('aria-busy', 'false', {
    timeout: 20000,
  });
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/momo-creature-card.png' });
  await page.getByRole('button', { name: 'Close details' }).click();
  await expect(card).not.toBeVisible();
  expect(errors).toEqual([]);
});
