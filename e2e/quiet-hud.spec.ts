import { test, expect, type Page } from '@playwright/test';
import { freshSave, validateSave, type Save } from '../src/game/store';
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
async function enter(page: Page, save: Save) {
  validateSave(save);
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
    async (s) =>
      new Promise<void>((resolve, reject) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const tx = r.result.transaction('saves', 'readwrite');
          tx.objectStore('saves').put(s, 'adventure');
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        };
      }),
    save
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
}
test('quiet mobile play has one mission arrow, uncluttered names and an unobstructed inventory', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const s = freshSave();
  s.position = [0, 1, 5];
  s.coins = 980;
  s.xp = 600;
  s.active = 'mosshell';
  s.creatures.mosshell = { xp: 0, hp: 60, friendship: 30 };
  s.quests.q01 = { status: 'complete', progress: {} };
  s.quests.q02 = { status: 'complete', progress: {} };
  s.quests.q03 = { status: 'active', progress: {} };
  s.inventory = [
    { item: 'fiber', qty: 83 },
    { item: 'stone', qty: 81 },
    { item: 'berry', qty: 99 },
    { item: 'berry', qty: 99 },
    { item: 'berry', qty: 81 },
    { item: 'wood', qty: 64 },
    { item: 'warmTreat', qty: 12 },
  ];
  await enter(page, s);
  await expect(page.locator('#mission-direction')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.world-label[data-kind="object"]:visible')).toHaveCount(0);
  await expect(page.locator('.toast')).toHaveCount(0);
  await expect(page.locator('.tracked-mission')).toHaveAttribute('data-minimized', 'true');
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.id = 'injected-brand-test';
    a.href = 'https://www.netlify.com';
    a.textContent = 'Powered by Netlify';
    a.style.cssText =
      'position:fixed;right:16px;bottom:16px;width:180px;height:44px;z-index:999999;background:black;color:white';
    document.body.append(a);
  });
  await expect(page.locator('#injected-brand-test')).toBeHidden();
  for (const [w, h] of [
    [320, 640],
    [390, 844],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    const selectors = [
      '.hotbar',
      '.virtual-joystick',
      '.touch-attack',
      '.touch-ability',
      '.touch-interact',
      '.touch-jump',
    ];
    const boxes = [];
    for (const selector of selectors) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(w + 1);
      expect(box!.y + box!.height).toBeLessThanOrEqual(h + 1);
      boxes.push(box!);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i],
          b = boxes[j];
        expect(
          Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
            Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1,
          `${selectors[i]} overlaps ${selectors[j]} at ${w}x${h}`
        ).toBe(false);
      }
    expect(
      await page.locator('.touch-attack').evaluate((el) => getComputedStyle(el).borderTopLeftRadius)
    ).toBe('65%');
    await page.screenshot({ path: `/tmp/momo-quiet-${w}x${h}.png` });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Hotbar 2 Stone' }).tap();
  await expect(page.getByRole('button', { name: 'Hotbar 2 Stone' })).toHaveClass(/selected/);
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Backpack', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Your backpack' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('nearby objects show a single clear name without routine pickup popups', async ({ page }) => {
  test.setTimeout(120000);
  const s = freshSave();
  s.position = [25, 1, 15];
  s.quests.q01 = { status: 'complete', progress: {} };
  await enter(page, s);
  const label = page.locator('.world-label[data-kind="object"]:visible');
  await expect(label).toHaveCount(1, { timeout: 30000 });
  await expect(label).toContainText('Willow tree');
  expect(
    await label.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  ).toBeGreaterThanOrEqual(14);
  await page.getByRole('button', { name: 'Interact or gather' }).tap();
  await expect(page.getByRole('button', { name: 'Hotbar 1 Wood' })).toContainText('4');
  await expect(page.locator('.toast')).toHaveCount(0);
  await page.screenshot({ path: '/tmp/momo-quiet-nearby-name.png' });
});
