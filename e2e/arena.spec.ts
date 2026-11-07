import { test, expect, type Page } from '@playwright/test';
import type { RoomView } from '../src/arena/rules';
import type { Save } from '../src/game/store';
function watch(page: Page) {
  let latest: RoomView | null = null;
  page.on('websocket', (socket) =>
    socket.on('framereceived', ({ payload }) => {
      try {
        const m = JSON.parse(String(payload));
        if (m.type === 'state') latest = m.room;
      } catch {}
    })
  );
  return () => latest;
}
async function disk(page: Page): Promise<Save> {
  return page.evaluate(
    () =>
      new Promise<Save>((resolve) => {
        const r = indexedDB.open('momoverse', 1);
        r.onsuccess = () => {
          const q = r.result.transaction('saves').objectStore('saves').get('adventure');
          q.onsuccess = () => resolve(q.result);
        };
      })
  );
}
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
test('two real private players duel, exchange damage, rematch and keep the adventure save intact', async ({
  browser,
}) => {
  test.setTimeout(180000);
  const ca = await browser.newContext(phone),
    cb = await browser.newContext(phone),
    a = await ca.newPage(),
    b = await cb.newPage();
  const errors: string[] = [];
  a.on('pageerror', (e) => errors.push(e.message));
  b.on('pageerror', (e) => errors.push(e.message));
  const state = watch(a);
  try {
    await a.addInitScript(() =>
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
    );
    await a.goto('/');
    await a.getByRole('button', { name: 'Begin your adventure' }).tap({ timeout: 60000 });
    await a.getByRole('button', { name: 'Open adventure menu' }).tap();
    await a.getByRole('button', { name: 'Versus Arena', exact: true }).tap();
    await expect(a).toHaveURL(/\/arena$/);
    const checkpoint = await disk(a);
    await a.getByRole('button', { name: 'Create room', exact: true }).tap();
    await a.getByRole('textbox', { name: 'Fighter name' }).fill('Aster');
    await a.getByRole('button', { name: 'Create private room', exact: true }).tap();
    const code = await a.getByLabel('Your room code').innerText();
    expect(code).toMatch(/^[A-Z2-9]{7}$/);
    await a.screenshot({ path: '/tmp/momo-arena-private-room.png' });
    await b.goto(`/arena?room=${code}`);
    await b.getByRole('textbox', { name: 'Fighter name' }).fill('Birch');
    await b.getByRole('button', { name: 'Join room', exact: true }).tap();
    await expect(a.getByText('Birch', { exact: true })).toBeVisible();
    await a.getByRole('button', { name: 'Ready to fight', exact: true }).tap();
    await b.getByRole('button', { name: 'Ready to fight', exact: true }).tap();
    await expect(a.getByRole('button', { name: 'Arena attack', exact: true })).toBeEnabled({
      timeout: 20000,
    });
    await expect(b.getByRole('button', { name: 'Arena attack', exact: true })).toBeEnabled({
      timeout: 20000,
    });
    const id = state()!.players.find((p) => p.name === 'Aster')!.id;
    await a.keyboard.down('KeyD');
    await a.keyboard.down('KeyS');
    try {
      await expect
        .poll(
          () => {
            const [p, q] = state()?.players ?? [];
            return p && q
              ? Math.hypot(p.position.x - q.position.x, p.position.z - q.position.z)
              : 99;
          },
          { timeout: 20000 }
        )
        .toBeLessThan(2.3);
    } finally {
      await a.keyboard.up('KeyD');
      await a.keyboard.up('KeyS');
    }
    await a.getByRole('button', { name: 'Arena attack', exact: true }).tap();
    await expect(b.getByRole('progressbar', { name: 'Your arena health' })).toHaveAttribute(
      'aria-valuenow',
      '80'
    );
    await b.getByRole('button', { name: 'Arena attack', exact: true }).tap();
    await expect(a.getByRole('progressbar', { name: 'Your arena health' })).toHaveAttribute(
      'aria-valuenow',
      '80'
    );
    await b.getByRole('button', { name: 'Switch arena weapon' }).tap();
    await expect(b.getByRole('button', { name: 'Switch arena weapon' })).toContainText('Bow');
    await expect.poll(() => state()?.players.find((p) => p.name === 'Birch')?.cooldown).toBe(0);
    await b.getByRole('button', { name: 'Arena attack', exact: true }).tap();
    await expect(a.getByRole('progressbar', { name: 'Your arena health' })).toHaveAttribute(
      'aria-valuenow',
      '66'
    );
    await a.screenshot({ path: '/tmp/momo-arena-duel-phone.png' });
    await a.keyboard.down('KeyH');
    try {
      await expect(a.getByRole('heading', { name: 'You won!', exact: true })).toBeVisible({
        timeout: 15000,
      });
    } finally {
      await a.keyboard.up('KeyH');
    }
    expect(state()!.winner).toBe(id);
    expect(state()!.reason).toBe('knockout');
    await a.getByRole('button', { name: 'Ready for rematch', exact: true }).tap();
    await b.getByRole('button', { name: 'Ready for rematch', exact: true }).tap();
    await expect(a.getByRole('button', { name: 'Arena attack', exact: true })).toBeEnabled({
      timeout: 15000,
    });
    await expect(a.getByRole('progressbar', { name: 'Your arena health' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    );
    await expect.poll(() => state()?.round).toBe(2);
    await b.getByRole('button', { name: 'Leave duel', exact: true }).tap();
    await expect(a.getByRole('heading', { name: 'You won!', exact: true })).toBeVisible();
    expect(await disk(a)).toEqual(checkpoint);
    await a.getByRole('link', { name: 'Return to adventure' }).tap();
    await expect(a.locator('.player-card')).toBeVisible();
    expect((await disk(a)).hp).toBe(checkpoint.hp);
    expect(errors).toEqual([]);
  } finally {
    await ca.close();
    await cb.close();
  }
});
test('public quick match waits for a real challenger, supports cancel and reconnects the same fighter after reload', async ({
  browser,
}) => {
  test.setTimeout(120000);
  const ca = await browser.newContext(phone),
    cb = await browser.newContext(phone),
    a = await ca.newPage(),
    b = await cb.newPage();
  const state = watch(a),
    other = watch(b);
  try {
    await a.goto('/arena');
    await a.getByRole('textbox', { name: 'Fighter name' }).fill('Public A');
    await a.getByRole('button', { name: 'Find opponent', exact: true }).tap();
    await expect(
      a.getByRole('heading', { name: 'Finding your challenger…', exact: true })
    ).toBeVisible();
    expect(state()).toBeNull();
    await a.getByRole('button', { name: 'Cancel search', exact: true }).tap();
    await a.getByRole('button', { name: 'Find opponent', exact: true }).tap();
    await b.goto('/arena');
    await b.getByRole('textbox', { name: 'Fighter name' }).fill('Public B');
    await b.getByRole('button', { name: 'Find opponent', exact: true }).tap();
    await expect(
      a.getByRole('heading', { name: 'Your match is ready', exact: true })
    ).toBeVisible();
    await expect(b.getByText('Public A', { exact: true })).toBeVisible();
    expect(state()!.publicMatch).toBe(true);
    expect(state()!.code).toBe(other()!.code);
    await a.getByRole('button', { name: 'Ready to fight', exact: true }).tap();
    await b.getByRole('button', { name: 'Ready to fight', exact: true }).tap();
    await expect(b.getByRole('button', { name: 'Arena attack', exact: true })).toBeEnabled({
      timeout: 20000,
    });
    await b.evaluate(() => {
      const badge = document.createElement('a');
      badge.id = 'arena-badge-test';
      badge.href = 'https://www.netlify.com';
      badge.textContent = 'Powered by Netlify';
      badge.style.cssText =
        'position:fixed;bottom:16px;right:16px;width:180px;height:44px;z-index:99999';
      document.body.append(badge);
    });
    await expect(b.locator('#arena-badge-test')).toBeHidden();
    const identity = other()!.players.find((p) => p.name === 'Public B')!.id;
    await b.reload();
    await expect(b.getByRole('button', { name: 'Arena attack', exact: true })).toBeEnabled({
      timeout: 15000,
    });
    expect(other()!.players.find((p) => p.name === 'Public B')!.id).toBe(identity);
    expect(other()!.round).toBe(1);
    const joystick = b.getByRole('group', { name: 'Arena movement joystick' });
    const before = { ...other()!.players.find((p) => p.id === identity)!.position };
    const box = (await joystick.boundingBox())!,
      cdp = await cb.newCDPSession(b),
      x = box.x + box.width / 2,
      y = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, id: 1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - 30, id: 1 }],
    });
    try {
      await expect
        .poll(
          () => {
            const p = other()?.players.find((p) => p.id === identity)?.position;
            return p ? Math.hypot(p.x - before.x, p.z - before.z) : 0;
          },
          { timeout: 15000 }
        )
        .toBeGreaterThan(0.5);
    } finally {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    }
    for (const [w, h] of [
      [320, 640],
      [390, 844],
      [844, 390],
    ]) {
      await b.setViewportSize({ width: w, height: h });
      for (const el of [
        joystick,
        b.getByRole('button', { name: 'Arena attack', exact: true }),
        b.getByRole('button', { name: 'Switch arena weapon' }),
      ]) {
        const r = (await el.boundingBox())!;
        expect(r.x).toBeGreaterThanOrEqual(0);
        expect(r.y).toBeGreaterThanOrEqual(0);
        expect(r.x + r.width).toBeLessThanOrEqual(w + 1);
        expect(r.y + r.height).toBeLessThanOrEqual(h + 1);
      }
      await b.screenshot({ path: `/tmp/momo-arena-${w}x${h}.png` });
    }
    await b.getByRole('button', { name: 'Leave duel', exact: true }).tap();
    await expect(a.getByRole('heading', { name: 'You won!', exact: true })).toBeVisible();
  } finally {
    await ca.close();
    await cb.close();
  }
});
