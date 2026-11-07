import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('mouse movement, NPC conversation and resource collection work alongside WASD', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  const launch = async (position: [number, number, number], gather = false) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /Begin your adventure|Continue your adventure/ })
    ).toBeEnabled({ timeout: 30000 });
    const save = freshSave();
    save.position = position;
    if (gather) save.quests.q01 = { status: 'complete', progress: {} };
    await page.evaluate(
      async (save) =>
        new Promise<void>((resolve) => {
          const r = indexedDB.open('momoverse', 1);
          r.onsuccess = () => {
            const tx = r.result.transaction('saves', 'readwrite');
            tx.objectStore('saves').put(save, 'adventure');
            tx.oncomplete = () => resolve();
          };
        }),
      save
    );
    await page.reload();
    await page.getByRole('button', { name: 'Continue your adventure' }).click();
    await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
    await page.waitForTimeout(2500);
  };
  await launch([-7, 0.8, -3]);
  await page.mouse.click(720, 390);
  await expect(page.locator('.dialogue-card')).toContainText('Grandpa Moss');
  await page.getByRole('button', { name: 'See you around' }).click();
  const before = await page.locator('.map-player').first().getAttribute('style');
  await page.mouse.click(950, 620);
  await expect
    .poll(() => page.locator('.map-player').first().getAttribute('style'), { timeout: 20000 })
    .not.toBe(before);
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  await launch([25, 0.8, 15], true);
  await page.mouse.click(720, 270);
  await expect(page.getByRole('status')).toContainText('+4 Wood', { timeout: 15000 });
});
