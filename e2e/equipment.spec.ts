import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('selecting tools and food equips them and harvesting still awards once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low', distance: 6 }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = [28, 0.8, -6];
  s.quests.q01 = { status: 'complete', progress: {} };
  s.inventory = [
    { item: 'pickaxe', qty: 1 },
    { item: 'warmTreat', qty: 2 },
  ];
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
  await page.keyboard.press('Digit5');
  await expect(page.getByText('Holding: Basic pickaxe')).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-pickaxe.png' });
  await page.keyboard.press('Digit6');
  await expect(page.getByText('Holding: Warm berry treat')).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-cookie.png' });
  await page.keyboard.press('Digit5');
  await expect(page.locator('.interaction')).toContainText('Stone deposit', { timeout: 15000 });
  await page.keyboard.press('KeyF');
  await expect(page.getByRole('status')).toContainText('+3 Stone');
  await page.keyboard.press('KeyF');
  await expect(page.getByRole('status')).toContainText('Regrowing');
  expect(errors).toEqual([]);
});
