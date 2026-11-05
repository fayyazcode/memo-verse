import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('a crafting slider previews and produces a batch of wooden blocks', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = [10, 0.8, 12];
  s.inventory = [{ item: 'wood', qty: 10 }];
  s.quests.q02 = { status: 'complete', progress: {} };
  s.quests.q09 = { status: 'active', progress: {} };
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
  await expect(page.locator('.interaction')).toContainText('crafting bench', { timeout: 20000 });
  await page.keyboard.press('KeyE');
  const row = page
    .locator('.batch-recipe')
    .filter({ has: page.getByRole('heading', { name: /Wooden block/ }) });
  await row.getByRole('spinbutton', { name: 'Wooden block batch count' }).fill('6');
  await expect(row.getByRole('slider', { name: 'Wooden block batches', exact: true })).toHaveValue(
    '6'
  );
  await expect(row).toContainText('6 Wood (have 10)');
  await expect(row.getByRole('button', { name: 'Craft 12' })).toBeEnabled();
  await row.getByRole('slider', { name: 'Wooden block batches', exact: true }).focus();
  await page.keyboard.press('End');
  await expect(row.getByRole('spinbutton')).toHaveValue('10');
  await row.getByRole('spinbutton').fill('6');
  await row.getByRole('button', { name: 'Craft 12' }).click();
  await expect(page.getByRole('status')).toContainText('Crafted 12 Wooden block');
  await expect(row).toContainText('have 4');
  await row.getByRole('button', { name: 'Max', exact: true }).click();
  await expect(row.getByRole('spinbutton')).toHaveValue('4');
  await page.screenshot({ path: '/tmp/momo-batch-crafting.png' });
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyJ');
  await expect(
    page
      .locator('.journal-quest')
      .filter({ has: page.getByRole('heading', { name: 'Home Sweet Home' }) })
  ).toContainText('12/12');
});
