import { test, expect, type Page, type Locator } from '@playwright/test';
import { freshSave } from '../src/game/store';
import { newSquad, newMember } from '../src/game/squad';
async function seed(page: Page) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low', uiScale: 115 }));
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
  });
  const s = freshSave();
  s.position = [0, 1, 10];
  s.active = 'zaplet';
  s.creatures = {
    zaplet: { hp: 65, xp: 300, friendship: 42 },
    aquabub: { hp: 65, xp: 300, friendship: 42 },
    mosshell: { hp: 65, xp: 300, friendship: 42 },
  };
  s.squad = {
    ...newSquad('zaplet'),
    equipped: ['zaplet', 'aquabub', 'mosshell'],
    members: {
      zaplet: { ...newMember(), charge: 100 },
      aquabub: newMember(),
      mosshell: newMember(),
    },
  };
  s.quests.q01 = { status: 'complete', progress: {} };
  s.quests.q02 = { status: 'complete', progress: {} };
  s.quests.q03 = { status: 'active', progress: {} };
  s.quests.q10 = { status: 'active', progress: {} };
  s.inventory = [{ item: 'block', qty: 12 }];
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
  await expect(page.locator('.player-card').getByText('Little Wanderer')).toBeVisible();
}
async function inside(el: Locator, w: number, h: number) {
  const b = await el.boundingBox();
  expect(b).not.toBeNull();
  expect(b!.x).toBeGreaterThanOrEqual(-1);
  expect(b!.y).toBeGreaterThanOrEqual(-1);
  expect(b!.x + b!.width).toBeLessThanOrEqual(w + 1);
  expect(b!.y + b!.height).toBeLessThanOrEqual(h + 1);
  return b!;
}
test.describe('mobile HUD redesign', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('minimal HUD, side drawer, abilities, scaling and building remain usable across phone sizes', async ({
    page,
  }) => {
    test.setTimeout(240000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await seed(page);
    await expect(page.getByRole('button', { name: 'Cast Spark Dash', exact: true })).toBeHidden();
    await expect(page.locator('.menu-dock')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Open tracked mission' })).toBeVisible();
    for (const [w, h] of [
      [320, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [768, 1024],
      [844, 390],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      const elements = [
        page.getByRole('button', { name: 'Open adventure menu' }),
        page.getByRole('group', { name: 'Movement joystick' }),
        page.getByRole('button', { name: 'Basic attack', exact: true }),
        page.getByRole('button', { name: 'Interact or gather' }),
        page.getByRole('button', { name: 'Jump', exact: true }),
        page.getByRole('button', { name: 'Toggle companion abilities' }),
        page.locator('.hotbar'),
      ];
      const boxes = await Promise.all(elements.map((el) => inside(el, w, h)));
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i],
            b = boxes[j];
          expect(
            Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 1 &&
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) > 1,
            `Overlap ${i}/${j} at ${w}x${h}`
          ).toBe(false);
        }
      await page.screenshot({ path: `/tmp/momo-ui-${w}x${h}.png` });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open companion abilities' }).tap();
    await expect(
      page.getByRole('button', { name: 'Cast Chain Lightning', exact: true })
    ).toHaveAttribute('data-state', 'locked');
    await expect(
      page.getByRole('button', { name: 'Cast Thunderstorm', exact: true })
    ).toContainText('Level 10');
    await page.getByRole('button', { name: 'Cast Spark Dash', exact: true }).tap();
    await expect(
      page.getByRole('button', { name: 'Cast Spark Dash', exact: true })
    ).toHaveAttribute('data-state', 'cooldown');
    await inside(page.locator('.ability-tray'), 390, 844);
    await page.screenshot({ path: '/tmp/momo-ui-ability-tray.png' });
    await page.getByRole('button', { name: 'Close companion abilities' }).tap();
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await expect(page.getByRole('heading', { name: 'Adventure menu' })).toBeVisible();
    await page.screenshot({ path: '/tmp/momo-ui-side-menu.png' });
    await expect(page.getByRole('group', { name: 'Movement joystick' })).toBeHidden();
    await page.screenshot({ path: '/tmp/momo-ui-side-menu.png' });
    await page.getByRole('button', { name: 'Switch camera perspective' }).tap();
    await expect(page.getByRole('button', { name: 'Switch camera perspective' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: 'Settings', exact: true }).tap();
    const fontSizes: number[] = [];
    for (const scale of ['90%', '100%', '115%', '130%']) {
      await page.getByRole('button', { name: scale, exact: true }).tap();
      fontSizes.push(
        await page
          .locator('.panel-intro')
          .first()
          .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
      );
    }
    expect(fontSizes[1]).toBeGreaterThan(fontSizes[0]);
    expect(fontSizes[2]).toBeGreaterThan(fontSizes[1]);
    expect(fontSizes[3]).toBeGreaterThan(fontSizes[2]);
    await expect(page.getByRole('button', { name: '130%', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('checkbox', { name: 'Reduced camera motion' }).check();
    await page.getByRole('button', { name: 'Close menu' }).tap();
    await page.setViewportSize({ width: 360, height: 800 });
    await page.screenshot({ path: '/tmp/momo-ui-scale130.png' });
    await inside(page.getByRole('button', { name: 'Open tracked mission' }), 360, 800);
    await page.getByRole('button', { name: 'Expand mission tracker' }).tap();
    await page.getByRole('button', { name: 'Track next mission' }).tap();
    await expect(page.getByRole('button', { name: 'Open tracked mission' })).toContainText(
      'Hidden Forest Secrets'
    );
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await page.getByRole('button', { name: 'World map', exact: true }).tap();
    await page.getByRole('checkbox', { name: 'missions', exact: true }).uncheck();
    await expect(page.locator('.map-art.large .mission-marker')).toHaveCount(0);
    await page.getByRole('checkbox', { name: 'missions', exact: true }).check();
    await expect(page.locator('.map-art.large .mission-marker').first()).toBeVisible();
    await page.getByRole('checkbox', { name: 'habitats', exact: true }).check();
    await expect(page.locator('.map-habitat')).toHaveCount(3);
    await page.getByRole('button', { name: 'Close menu' }).tap();
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await page.getByRole('button', { name: 'Quest journal', exact: true }).tap();
    await page
      .getByRole('group', { name: 'Quest filters' })
      .getByRole('button', { name: 'active', exact: true })
      .tap();
    await expect(page.locator('.journal-quest')).toHaveCount(2);
    await page.getByRole('button', { name: 'Close menu' }).tap();
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await page.getByRole('button', { name: 'Toggle building mode' }).tap();
    await expect(page.getByRole('button', { name: 'Basic attack', exact: true })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Place blocks', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Remove blocks' }).tap();
    await expect(page.getByRole('button', { name: 'Remove blocks' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await page.getByRole('button', { name: 'Rotate building view' }).tap();
    await page.getByRole('button', { name: 'Exit building mode' }).tap();
    await expect(page.getByRole('button', { name: 'Basic attack', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await page.getByRole('button', { name: 'Pause & save', exact: true }).tap();
    await page.getByRole('button', { name: 'Save and quit' }).tap();
    await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'Continue your adventure' }).tap();
    await expect(page.getByRole('button', { name: 'Open tracked mission' })).toContainText(
      'Hidden Forest Secrets'
    );
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('momo-settings')!).uiScale)
    ).toBe(130);
    await expect(page.locator('.game-shell')).toHaveAttribute('data-reduced-motion', 'true');
    expect(errors).toEqual([]);
  });
});
test('desktop drawer is keyboard accessible and menus keep gameplay paused', async ({ page }) => {
  test.setTimeout(120000);
  await seed(page);
  for (const [w, h] of [
    [1280, 720],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await inside(page.locator('.squad-hud'), w, h);
    await page.screenshot({ path: `/tmp/momo-ui-desktop-${w}.png` });
  }
  await page.getByRole('button', { name: 'Open adventure menu' }).click();
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Toggle building mode' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close menu' })).toBeFocused();
  const before = await page.locator('.map-player').first().getAttribute('style');
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyW');
  expect(await page.locator('.map-player').first().getAttribute('style')).toBe(before);
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: 'Open adventure menu' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('heading', { name: 'Creature squad', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('heading', { name: 'Creature squad', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
});
