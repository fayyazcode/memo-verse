import { test, expect, type Page } from '@playwright/test';
import { freshSave, type Save } from '../src/game/store';
import { homePoint } from '../src/game/villagers';
import { QUESTS } from '../src/game/data';

async function seed(page: Page, save: Save) {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 60000,
  });
  await page.evaluate(
    async (save) =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(save, 'adventure');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    save
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
}
test('villagers visibly work and move on the map, while menus pause their routine', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.playTime = 5;
  s.position = [-7, 1, -2];
  await seed(page, s);
  const marker = page.locator('[data-villager="moss"]').first();
  await expect(marker).toHaveAttribute('title', /Tending the garden|Checking supplies/);
  const start = await marker.getAttribute('style');
  await expect.poll(() => marker.getAttribute('style'), { timeout: 20000 }).not.toBe(start);
  await expect(page.locator('.world-label').filter({ hasText: /^Grandpa Moss$/ })).toHaveCount(1, {
    timeout: 20000,
  });
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  const paused = await marker.getAttribute('style');
  await page.waitForTimeout(1200);
  expect(await marker.getAttribute('style')).toBe(paused);
  await page.getByRole('button', { name: 'Back to the adventure' }).click();
  await page.screenshot({ path: '/tmp/momo-villagers-working.png' });
  expect(errors).toEqual([]);
});
test('nighttime residents remain reachable at home for quest rewards and survive reload', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.playTime = 600;
  const door = homePoint('moss', 3.5);
  s.position = [door[0], 1, door[2] + 1];
  s.quests.q01 = {
    status: 'active',
    progress: Object.fromEntries(QUESTS[0].objectives.map((o) => [o.id, o.count])),
  };
  await seed(page, s);
  await expect(page.locator('[data-villager="moss"]').first()).toHaveAttribute(
    'title',
    /Resting at home/
  );
  await expect(page.locator('.interaction')).toContainText('Grandpa Moss', { timeout: 30000 });
  await expect(page.locator('.world-label').filter({ hasText: /^Grandpa Moss$/ })).toHaveCount(1);
  await page.screenshot({ path: '/tmp/momo-villagers-resting.png' });
  const knock = page.getByRole('button', { name: 'Knock on Grandpa Moss’s door' });
  await expect(knock).toBeVisible();
  await knock.click();
  await expect(page.getByRole('button', { name: 'Villager is coming outside' })).toBeDisabled();
  await expect(page.locator('.dialogue-card')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.dialogue-card')).toContainText('Ready to talk');
  const claim = page.getByRole('button', { name: /Welcome to MomoVerse.*Collect reward/ });
  await expect(claim).toBeEnabled();
  await claim.click();
  await expect(claim).toHaveCount(0);
  await page.getByRole('button', { name: 'See you around' }).click();
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.locator('[data-villager="moss"]').first()).toHaveAttribute(
    'title',
    /Resting at home/
  );
  await expect(page.locator('.interaction')).toContainText('Grandpa Moss', { timeout: 30000 });
  expect(errors).toEqual([]);
});
