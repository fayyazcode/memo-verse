import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('outfits persist and a companion walks, rests and performs attacks', async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(
    () =>
      !localStorage.getItem('momo-settings') &&
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.creatures.emberfox = { hp: 60, xp: 0, friendship: 20 };
  s.active = 'emberfox';
  s.quests.q03 = { status: 'complete', progress: {} };
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
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await expect(page.getByText('Resting nearby', { exact: true })).toBeVisible({ timeout: 20000 });
  await page.keyboard.down('KeyD');
  try {
    await expect(page.getByText('Following you', { exact: true })).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: '/tmp/momo-pet-walking.png' });
  } finally {
    await page.keyboard.up('KeyD');
  }
  await expect(page.getByText('Resting nearby', { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Wear Starlight', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wear Starlight' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Close menu' }).click();
  await page.keyboard.press('KeyQ');
  await expect(page.getByRole('status')).toContainText('Guardian waits');
  await page.screenshot({ path: '/tmp/momo-starlight-skin.png' });
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Wear Starlight' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(errors).toEqual([]);
});
