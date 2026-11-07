import { test, expect, type Locator } from '@playwright/test';
import { freshSave } from '../src/game/store';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function boxesInside(elements: Locator[], width: number, height: number) {
  const boxes = await Promise.all(
    elements.map(async (el) => {
      await expect(el).toBeVisible();
      const b = (await el.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(0);
      expect(b.y).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width).toBeLessThanOrEqual(width + 1);
      expect(b.y + b.height).toBeLessThanOrEqual(height + 1);
      return b;
    })
  );
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i],
        b = boxes[j];
      expect(
        Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
          Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1,
        `Controls ${i}/${j} overlap at ${width}x${height}`
      ).toBe(false);
    }
}

test('round mobile actions switch directly to compact building tools and restore safely', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 60000,
  });
  const save = freshSave();
  save.position = [2, 1, 27];
  save.quests.q02 = { status: 'complete', progress: {} };
  save.inventory = [{ item: 'block', qty: 30 }];
  await page.evaluate(
    (s) =>
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
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  const actionNames = [
    'Enter building mode',
    'Basic attack',
    'Open companion abilities',
    'Interact or gather',
    'Jump',
  ];
  for (const [w, h] of [
    [320, 640],
    [390, 844],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    const buttons = actionNames.map((name) => page.getByRole('button', { name, exact: true }));
    for (const button of buttons) await expect(button).toHaveCSS('transform', 'none');
    await boxesInside(
      [...buttons, page.locator('.virtual-joystick'), page.locator('.hotbar')],
      w,
      h
    );
    for (const b of buttons) {
      const box = (await b.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(48);
      expect(box.width).toBeLessThanOrEqual(60);
      expect(await b.evaluate((el) => getComputedStyle(el).borderRadius)).toBe('50%');
    }
    await page.screenshot({ path: `/tmp/momo-round-actions-${w}.png` });
    await buttons[0].tap();
    await expect(page.getByRole('group', { name: 'Adventure actions', exact: true })).toBeHidden();
    const tools = page.getByRole('region', { name: 'House building tools' });
    const actions = page.getByRole('group', { name: 'Building actions', exact: true });
    await boxesInside(
      [tools, actions, page.locator('.virtual-joystick'), page.locator('.hotbar')],
      w,
      h
    );
    for (const part of ['wall', 'roof', 'gate', 'starter home']) {
      const button = page.getByRole('button', { name: `Build ${part}`, exact: true });
      await button.tap();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await boxesInside(
        [tools, actions, page.locator('.virtual-joystick'), page.locator('.hotbar')],
        w,
        h
      );
      if (part === 'roof') {
        await page.getByRole('combobox', { name: 'Roof height' }).selectOption('3');
        await expect(page.getByRole('combobox', { name: 'Roof height' })).toHaveValue('3');
      }
      if (part === 'gate')
        await page.getByRole('button', { name: 'Rotate building piece', exact: true }).tap();
    }
    await page.getByRole('button', { name: 'Remove blocks', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Remove blocks', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: 'Build wall', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Place blocks', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.screenshot({ path: `/tmp/momo-build-dock-${w}.png` });
    await page.getByRole('button', { name: 'Remove blocks', exact: true }).tap();
    await page.getByRole('button', { name: 'Exit building mode', exact: true }).tap();
    await expect(buttons[0]).toBeVisible();
    await buttons[0].tap();
    await expect(page.getByRole('button', { name: 'Place blocks', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: 'Exit building mode', exact: true }).tap();
  }
  expect(errors).toEqual([]);
});

test('the direct Build action respects the existing Bruno unlock', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin your adventure' }).tap({ timeout: 60000 });
  await page.getByRole('button', { name: 'Enter building mode', exact: true }).tap();
  await expect(page.getByRole('group', { name: 'Adventure actions', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Building actions', exact: true })).toBeHidden();
});
