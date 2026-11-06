import { test, expect, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { freshSave, type Save } from '../src/game/store';
import { newMember, newSquad } from '../src/game/squad';
async function seed(page: Page, s: Save) {
  await page.addInitScript(() => {
    if (!localStorage.getItem('momo-settings'))
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }));
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Begin your adventure' })).toBeEnabled({
    timeout: 30000,
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
    s
  );
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByText('Little Wanderer')).toBeVisible();
}
async function saved(page: Page): Promise<Save> {
  return page.evaluate(
    async () =>
      new Promise<Save>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result);
        };
      })
  );
}
function owned() {
  const s = freshSave();
  s.position = [0, 1, 10];
  s.active = 'emberfox';
  s.creatures = {
    emberfox: { hp: 105, xp: 4500, friendship: 41 },
    aquabub: { hp: 105, xp: 4500, friendship: 43 },
    mosshell: { hp: 105, xp: 4500, friendship: 45 },
    zaplet: { hp: 105, xp: 4500, friendship: 47 },
  };
  s.quests.q03 = { status: 'complete', progress: {} };
  s.inventory = [{ item: 'wood', qty: 7 }];
  s.blocks = [{ x: 0, y: 0, z: 22, item: 'block' }];
  return s;
}
test('old one-companion save becomes a playable three-creature squad with cooldowns and persistence', async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const old = owned();
  await seed(page, old);
  await page.keyboard.press('Tab');
  const dialog = page.getByRole('dialog');
  await expect(page.getByRole('heading', { name: 'Creature squad' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Equip Aquabub', exact: true }).click();
  await dialog.getByRole('button', { name: 'Equip Mosshell', exact: true }).click();
  await expect(dialog.getByRole('button', { name: 'Equip Zaplet', exact: true })).toBeDisabled();
  await page.locator('.panel-body').evaluate((el) => {
    el.scrollTop = 0;
  });
  await page.screenshot({ path: '/tmp/momo-phase1-squad.png' });
  await page.keyboard.press('Escape');
  const fireball = page.getByRole('button', { name: 'Cast Fireball', exact: true });
  await fireball.click();
  await expect(fireball).toBeDisabled();
  await expect
    .poll(async () => (await saved(page)).squad!.training.reduce((a, b) => a + b, 0))
    .toBeLessThan(720);
  await page.keyboard.press('Tab');
  const paused = await fireball.textContent();
  await page.waitForTimeout(600);
  expect(await fireball.textContent()).toBe(paused);
  await dialog.getByRole('button', { name: 'Command Mosshell', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Shift+KeyE');
  await expect(page.getByRole('button', { name: 'Cast Stone Shield', exact: true })).toBeDisabled();
  await expect
    .poll(async () => (await saved(page)).squad!.members.mosshell!.shield)
    .toBeGreaterThan(0);
  await page.screenshot({ path: '/tmp/momo-phase1-three-followers.png' });
  const metrics = await page.evaluate(
    () =>
      new Promise<{
        frames: number;
        seconds: number;
        fps: number;
        medianMs: number;
        p95Ms: number;
      }>((resolve) => {
        const start = performance.now(),
          times: number[] = [];
        let last = start;
        const frame = (now: number) => {
          times.push(now - last);
          last = now;
          if (now - start < 4000) requestAnimationFrame(frame);
          else {
            const sorted = [...times].sort((a, b) => a - b);
            resolve({
              frames: times.length,
              seconds: (now - start) / 1000,
              fps: times.length / ((now - start) / 1000),
              medianMs: sorted[Math.floor(sorted.length / 2)],
              p95Ms: sorted[Math.floor(sorted.length * 0.95)],
            });
          }
        };
        requestAnimationFrame(frame);
      })
  );
  writeFileSync(
    '/tmp/momo-phase1-performance.json',
    JSON.stringify(
      {
        scenario: 'Chromium software WebGL, low quality, 1440x900, village, three companions',
        ...metrics,
      },
      null,
      2
    )
  );
  await page.getByRole('button', { name: 'Pause game', exact: true }).click();
  await page.getByRole('button', { name: 'Save and quit' }).click();
  await expect(page.getByRole('button', { name: 'Continue your adventure' })).toBeVisible();
  const checkpoint = await saved(page);
  expect(checkpoint.squad!.equipped).toEqual(['emberfox', 'aquabub', 'mosshell']);
  expect(checkpoint.active).toBe('mosshell');
  expect(checkpoint.inventory).toEqual(old.inventory);
  expect(checkpoint.blocks).toEqual(old.blocks);
  expect(checkpoint.quests).toEqual(old.quests);
  expect(checkpoint.squad!.members.emberfox!.charge).toBeGreaterThan(0);
  await page.reload();
  await page.getByRole('button', { name: 'Continue your adventure' }).click();
  await expect(page.getByRole('button', { name: 'Cast Rock Smash', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Unequip Aquabub', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('KeyZ');
  await expect(page.getByRole('button', { name: 'Cast Water Bolt', exact: true })).toBeVisible();
  await page.keyboard.press('KeyX');
  await expect(page.getByRole('button', { name: 'Cast Water Bolt', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByLabel('Q squad binding', { exact: true }).selectOption('KeyT');
  await page.getByRole('button', { name: 'Close menu' }).click();
  const hpBefore = (await saved(page)).squad!.training.reduce((a, b) => a + b, 0);
  await page.keyboard.press('KeyQ');
  await page.waitForTimeout(250);
  expect((await saved(page)).squad!.training.reduce((a, b) => a + b, 0)).toBe(hpBefore);
  await page.keyboard.press('KeyT');
  await expect
    .poll(async () => (await saved(page)).squad!.training.reduce((a, b) => a + b, 0))
    .toBeLessThan(hpBefore);
  expect(errors).toEqual([]);
});
test.describe('mobile squad abilities', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test('ultimate warning resolves real damage and mobile ability controls remain reachable', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const s = owned();
    s.position = [91, 1, 20];
    s.flags = ['repaired'];
    s.squad = {
      ...newSquad('emberfox'),
      equipped: ['emberfox', 'aquabub', 'mosshell'],
      stance: 'passive',
      members: {
        emberfox: { ...newMember(), charge: 100 },
        aquabub: { ...newMember(), charge: 100 },
        mosshell: newMember(),
      },
    };
    await seed(page, s);
    await page.getByRole('button', { name: 'Open companion abilities' }).tap();
    await page.getByRole('button', { name: 'Cast Meteor Burst', exact: true }).tap();
    await expect(
      page.getByRole('button', { name: 'Cast Meteor Burst', exact: true })
    ).toBeDisabled();
    await expect.poll(async () => (await saved(page)).enemyHp).toBeLessThan(100);
    const after = await saved(page);
    expect(after.squad!.members.emberfox!.charge).toBe(0);
    expect(after.squad!.members.emberfox!.cooldowns.R).toBeGreaterThan(40);
    await page.getByRole('button', { name: 'Close companion abilities' }).tap();
    await page.setViewportSize({ width: 390, height: 844 });
    if (await page.getByRole('button', { name: 'Minimize tasks', exact: true }).isVisible())
      await page.getByRole('button', { name: 'Minimize tasks', exact: true }).tap();
    if (await page.getByRole('button', { name: 'Minimize minimap', exact: true }).isVisible())
      await page.getByRole('button', { name: 'Minimize minimap', exact: true }).tap();
    const companionCard = await page.locator('.companion-card').boundingBox();
    const squadHud = (await page.locator('.squad-hud').boundingBox())!;
    if (companionCard)
      expect(squadHud.y).toBeGreaterThanOrEqual(companionCard.y + companionCard.height);
    await page.screenshot({ path: '/tmp/momo-phase1-mobile.png' });
    await page.getByRole('button', { name: 'Open companion abilities' }).tap();
    for (const label of [
      'Cast Fireball',
      'Cast Flame Trail',
      'Cast Meteor Burst',
      'Open squad management',
    ]) {
      const box = (await page.getByRole('button', { name: label, exact: true }).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(391);
      expect(box.y + box.height).toBeLessThanOrEqual(845);
    }
    await page.getByRole('button', { name: 'Close companion abilities' }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.screenshot({ path: '/tmp/momo-phase1-landscape.png' });
    await page.getByRole('button', { name: 'Open adventure menu' }).tap();
    await page.getByRole('button', { name: 'Creature squad', exact: true }).tap();
    await expect(page.getByRole('heading', { name: 'Creature squad' })).toBeVisible();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Command Aquabub', exact: true })
      .tap();
    await page.getByRole('button', { name: 'Close menu' }).tap();
    await page.getByRole('button', { name: 'Open companion abilities' }).tap();
    await page.getByRole('button', { name: 'Cast Tidal Wave', exact: true }).tap();
    await expect
      .poll(async () => {
        const p = (await saved(page)).squad!.enemyPosition;
        return Math.hypot(p[0] - 92, p[2] - 20);
      })
      .toBeGreaterThan(1);
    expect((await saved(page)).squad!.members.aquabub!.charge).toBe(0);
    expect(errors).toEqual([]);
  });
});
