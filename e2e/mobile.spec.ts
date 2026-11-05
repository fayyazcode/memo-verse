import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test('mobile joystick, collapsible HUD, touch actions and landscape menus work', async ({
  page,
}) => {
  test.setTimeout(150000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin your adventure' }).tap({ timeout: 30000 });
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand tasks', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand minimap', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Expand tasks', exact: true }).tap();
  await expect(page.locator('.quest-card')).toBeVisible();
  await page.getByRole('button', { name: 'Minimize tasks', exact: true }).tap();
  await expect(page.locator('.quest-card')).toBeHidden();
  await page.getByRole('button', { name: 'Expand minimap', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Open world map', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Minimize minimap', exact: true }).tap();
  await expect(page.locator('.minimap')).toBeHidden();
  const joystick = page.getByRole('group', { name: 'Movement joystick' });
  await expect(joystick).toBeVisible();
  const initial = await page.locator('.map-player').first().getAttribute('style');
  const box = (await joystick.boundingBox())!;
  // Native touch input holds the stick while the game renders.
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x, y: y - 36, id: 1 }],
  });
  try {
    await expect
      .poll(() => page.locator('.map-player').first().getAttribute('style'), { timeout: 20000 })
      .not.toBe(initial);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await expect(joystick.locator('.joystick-knob')).toHaveAttribute(
    'style',
    /translate\(0px,\s*0px\)/
  );
  await page.getByRole('button', { name: 'Toggle sprint' }).tap();
  await expect(page.getByRole('button', { name: 'Toggle sprint' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await expect(joystick).toBeHidden();
  await page.getByRole('button', { name: 'Back to the adventure' }).tap();
  await expect(page.getByRole('button', { name: 'Toggle sprint' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await page.getByRole('button', { name: 'Interact or gather', exact: true }).tap();
  await page.screenshot({ path: '/tmp/momo-mobile-portrait.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(joystick).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-mobile-landscape.png' });
  for (const label of ['Movement joystick', 'Jump', 'Interact or gather']) {
    const el = page.getByRole(label === 'Movement joystick' ? 'group' : 'button', {
      name: label,
      exact: true,
    });
    const b = (await el.boundingBox())!;
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.y).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(845);
    expect(b.y + b.height).toBeLessThanOrEqual(391);
  }
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('touch interact opens NPC dialogue and a camera drag does not move the player', async ({
  page,
}) => {
  const { freshSave } = await import('../src/game/store');
  await page.addInitScript(() =>
    localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = [-7, 0.8, -3];
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
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(page.locator('.interaction')).toContainText('Grandpa Moss', { timeout: 15000 });
  const before = await page.locator('.map-player').first().getAttribute('style');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: 300, y: 330, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 250, y: 360, id: 1 }],
  });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.getByRole('button', { name: 'Interact or gather', exact: true }).tap();
  await expect(page.locator('.dialogue-card')).toContainText('Grandpa Moss');
  expect(await page.locator('.map-player').first().getAttribute('style')).toBe(before);
  await page.getByRole('button', { name: /Welcome to MomoVerse/ }).tap();
  await expect(page.locator('.dialogue-option')).toContainText('In progress');
});
