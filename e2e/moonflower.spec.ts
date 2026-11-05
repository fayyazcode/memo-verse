import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test('a player can locate the moonflower from the map and water it with Aquabub', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low', distance: 8 }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = [46.5, 0.8, -14];
  s.quests.q07 = { status: 'active', progress: { aqua: 1, moss: 1, node: 1 } };
  s.creatures.aquabub = { hp: 60, xp: 0, friendship: 20 };
  s.active = 'aquabub';
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
  await expect(page.locator('.interaction')).toContainText('Thirsty moonflower', {
    timeout: 20000,
  });
  await page.screenshot({ path: '/tmp/momo-moonflower-before.png' });
  await page.keyboard.press('KeyM');
  await page
    .getByRole('button', { name: 'Mission destination: Water the marked plant', exact: true })
    .click();
  await expect(page.locator('.map-mission-info')).toContainText('east end of the wooden bridge');
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyE');
  await expect(page.getByRole('status')).toContainText('Aquabub used');
  await expect(page.locator('.interaction')).toContainText('Moonflower · watered');
  await expect(page.locator('.return-note')).toContainText('Luna');
  await page.keyboard.press('KeyM');
  await expect(
    page.getByRole('button', { name: 'Mission destination: Water the marked plant', exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Mission destination: Claim your reward', exact: true })
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.screenshot({ path: '/tmp/momo-moonflower-after.png' });
  expect(errors).toEqual([]);
});
