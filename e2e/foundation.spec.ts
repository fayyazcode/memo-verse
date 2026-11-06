import { test, expect } from '@playwright/test';
import { freshSave } from '../src/game/store';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
});
const saved = async (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('momoverse', 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    return new Promise<{ position: number[]; quests: Record<string, unknown> }>(
      (resolve, reject) => {
        const r = db.transaction('saves').objectStore('saves').get('adventure');
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      }
    );
  });
test('a guest can enter the world, move, pause, save and resume', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  await page.screenshot({ path: '/tmp/momo-title.png' });
  await page.getByRole('button', { name: 'Begin your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await expect(page.getByText('Saved locally')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/momo-game.png' });
  const initialTop = await page
    .locator('.map-player')
    .first()
    .evaluate((el) => parseFloat((el as HTMLElement).style.top));
  await page.keyboard.down('KeyW');
  try {
    await expect
      .poll(
        async () =>
          page
            .locator('.map-player')
            .first()
            .evaluate((el) => parseFloat((el as HTMLElement).style.top)),
        { timeout: 30000 }
      )
      .toBeLessThan(initialTop - 2);
  } finally {
    await page.keyboard.up('KeyW');
  }
  await page.keyboard.press('KeyI');
  await expect(page.getByRole('heading', { name: 'Your backpack' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Take a little breather' })).toBeVisible();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const checkpoint = await saved(page);
  expect(checkpoint.position[2]).toBeLessThan(4);
  expect(checkpoint.position[1]).toBeGreaterThan(0.5);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const resumed = await saved(page);
  expect(resumed.position[2]).toBeCloseTo(checkpoint.position[2], 0);
  expect(errors).toEqual([]);
});
test('NPC interaction accepts a real mission and journal survives reload', async ({ page }) => {
  const s = freshSave();
  s.position = [-7, 0.8, -3];
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  await page.evaluate(async (save) => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open('momoverse', 1);
      r.onsuccess = () => {
        const tx = r.result.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(save, 'adventure');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }, s);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.locator('.interaction')).toContainText('Grandpa Moss', { timeout: 30000 });
  await page.keyboard.press('KeyE');
  await expect(page.locator('.dialogue-card')).toBeVisible();
  await page.getByRole('button', { name: /Welcome to MomoVerse/ }).click();
  await page.getByRole('button', { name: 'See you around' }).click();
  await page.keyboard.press('KeyJ');
  await expect(page.getByRole('heading', { name: 'Adventure journal' })).toBeVisible();
  await expect(page.locator('.journal-quest').first()).toContainText('ACTIVE');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save and quit' }).click();
  expect((await saved(page)).quests).toHaveProperty('q01');
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await page.getByRole('button', { name: 'Open tracked mission', exact: true }).click();
  await expect(page.locator('.journal-quest').first()).toContainText('ACTIVE');
});
test('gathering consumes a node once and persists the actual items', async ({ page }) => {
  const s = freshSave();
  s.position = [25, 0.8, 15];
  s.quests.q01 = { status: 'complete', progress: {} };
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  await page.evaluate(async (save) => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open('momoverse', 1);
      r.onsuccess = () => {
        const tx = r.result.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(save, 'adventure');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }, s);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.locator('.interaction')).toContainText('Willow tree', { timeout: 30000 });
  await page.keyboard.press('KeyF');
  await expect(page.getByRole('button', { name: 'Hotbar 1 Wood' })).toContainText('4');
  await page.keyboard.press('KeyF');
  await expect(page.locator('.toast')).toHaveCount(0);
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const inventory = await page.evaluate(async () => {
    return new Promise<{ item: string; qty: number }[]>((resolve) => {
      const r = indexedDB.open('momoverse', 1);
      r.onsuccess = () => {
        const q = r.result.transaction('saves').objectStore('saves').get('adventure');
        q.onsuccess = () => resolve(q.result.inventory);
      };
    });
  });
  expect(inventory).toEqual([{ item: 'wood', qty: 4 }]);
});
test('a player can place a real block on the housing plot and reload it', async ({ page }) => {
  const s = freshSave();
  s.position = [2, 0.8, 27];
  s.quests.q02 = { status: 'complete', progress: {} };
  s.inventory = [{ item: 'block', qty: 12 }];
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  await page.evaluate(async (save) => {
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open('momoverse', 1);
      r.onsuccess = () => {
        const tx = r.result.transaction('saves', 'readwrite');
        tx.objectStore('saves').put(save, 'adventure');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
    });
  }, s);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await page.waitForTimeout(3000);
  await page.keyboard.press('Digit4');
  await page.keyboard.press('KeyB');
  await expect(page.locator('.build-banner')).toBeVisible();
  await page.mouse.click(720, 450);
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const blocks = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result.blocks);
        };
      })
  );
  expect(blocks).toHaveLength(1);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await page.getByRole('button', { name: 'Pause game' }).click();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const reloaded = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result.blocks);
        };
      })
  );
  expect(reloaded).toEqual(blocks);
});
