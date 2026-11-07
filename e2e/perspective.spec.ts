import { test, expect } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test('mobile camera perspectives remain available in the side menu and persist', async ({
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
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
  await page.screenshot({ path: '/tmp/momo-classic-mobile.png' });
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  const toggle = page.getByRole('button', { name: 'Switch camera perspective' });
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/momo-isometric-mobile.png' });
  const box = (await page.getByRole('group', { name: 'Movement joystick' }).boundingBox())!,
    before = await page.locator('.map-player').first().getAttribute('style');
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
      .not.toBe(before);
  } finally {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByRole('button', { name: /Isometric view High diagonal/ })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: /Classic view The existing/ }).tap();
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await toggle.tap();
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await page.getByRole('button', { name: 'Pause & save', exact: true }).tap();
  await page.getByRole('button', { name: 'Save and quit' }).tap();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).tap();
  await page.getByRole('button', { name: 'Open adventure menu' }).tap();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Close menu' }).tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({ path: '/tmp/momo-isometric-landscape.png' });
  expect(errors).toEqual([]);
});
