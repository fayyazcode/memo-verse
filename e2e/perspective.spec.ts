import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test('mobile player can switch between classic and isometric views and keep the choice', async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }));
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin your adventure' }).tap({ timeout: 30000 });
  await expect(page.getByText('Little Wanderer')).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Switch camera perspective', exact: true });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.screenshot({ path: '/tmp/momo-classic-mobile.png' });
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('momo-settings')!).perspective))
    .toBe('adventure');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/momo-isometric-mobile.png' });
  const beforeTap = await page.locator('.map-player').first().getAttribute('style');
  await page.touchscreen.tap(195, 375);
  await expect
    .poll(() => page.locator('.map-player').first().getAttribute('style'), { timeout: 20000 })
    .not.toBe(beforeTap);
  const stick = (await page.getByRole('group', { name: 'Movement joystick' }).boundingBox())!;
  const before = await page.locator('.map-player').first().getAttribute('style');
  const cdp = await page.context().newCDPSession(page);
  const x = stick.x + stick.width / 2,
    y = stick.y + stick.height / 2;
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
      .not.toBe(before);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByRole('button', { name: /Isometric view High diagonal/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: /Classic view The existing/ }).tap();
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.tap();
  await page.getByRole('button', { name: 'Pause game', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(toggle).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/momo-isometric-landscape.png' });
  expect(errors).toEqual([]);
});
