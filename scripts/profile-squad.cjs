const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const activeBrowsers = new Set();
const currentUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const scenarios = [
  ...(process.env.MOMO_BASELINE_URL
    ? [{ name: 'Baseline, one companion', url: process.env.MOMO_BASELINE_URL, three: false }]
    : []),
  { name: 'Phase 1, one companion', url: currentUrl, three: false },
  { name: 'Phase 1, three companions', url: currentUrl, three: true },
];
(async () => {
  const launchBrowser = () =>
    chromium.launch({
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
  const results = [];
  for (const scenario of scenarios) {
    const browser = await launchBrowser();
    activeBrowsers.add(browser);
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } }),
      page = await context.newPage();
    await page.addInitScript(() =>
      localStorage.setItem('momo-settings', JSON.stringify({ quality: 'low' }))
    );
    await page.goto(scenario.url);
    await page.getByRole('button', { name: 'Begin your adventure' }).click({ timeout: 30000 });
    await page.getByRole('button', { name: 'Pause game', exact: true }).click();
    await page.getByRole('button', { name: 'Save and quit' }).click();
    await page.getByRole('button', { name: 'Continue your adventure' }).waitFor();
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const r = indexedDB.open('momoverse', 1);
          r.onsuccess = () => {
            const tx = r.result.transaction('saves', 'readwrite'),
              st = tx.objectStore('saves'),
              get = st.get('adventure');
            get.onsuccess = () => {
              const s = get.result;
              s.position = [0, 1, 10];
              s.active = 'emberfox';
              s.creatures = {
                emberfox: { xp: 4500, hp: 105, friendship: 40 },
                aquabub: { xp: 4500, hp: 105, friendship: 40 },
                mosshell: { xp: 4500, hp: 105, friendship: 40 },
              };
              s.quests.q03 = { status: 'complete', progress: {} };
              delete s.squad;
              st.put(s, 'adventure');
            };
            tx.oncomplete = () => resolve();
          };
        })
    );
    await page.getByRole('button', { name: 'Continue your adventure' }).click();
    await page.getByText('Little Wanderer').waitFor({ timeout: 30000 });
    if (scenario.three) {
      await page.getByRole('button', { name: 'Open squad management' }).click();
      const d = page.getByRole('dialog');
      await d.getByRole('button', { name: 'Equip Aquabub', exact: true }).click();
      await d.getByRole('button', { name: 'Equip Mosshell', exact: true }).click();
      await page.keyboard.press('Escape');
    }
    await page.waitForTimeout(10000);
    const samples = [];
    for (let i = 0; i < 3; i++)
      samples.push(
        await page.evaluate(
          () =>
            new Promise((resolve) => {
              const start = performance.now(),
                times = [];
              let last = start;
              function frame(now) {
                times.push(now - last);
                last = now;
                if (now - start < 5000) requestAnimationFrame(frame);
                else {
                  const a = times.sort((x, y) => x - y);
                  resolve({
                    frames: times.length,
                    seconds: (now - start) / 1000,
                    fps: times.length / ((now - start) / 1000),
                    medianMs: a[Math.floor(a.length / 2)],
                    p95Ms: a[Math.floor(a.length * 0.95)],
                  });
                }
              }
              requestAnimationFrame(frame);
            })
        )
      );
    const result = {
      scenario: scenario.name,
      samples,
      meanFps: samples.reduce((n, s) => n + s.fps, 0) / samples.length,
    };
    results.push(result);
    console.log(JSON.stringify(result));
    await browser.close();
    activeBrowsers.delete(browser);
  }
  fs.writeFileSync(
    '/tmp/momo-phase1-comparison.json',
    JSON.stringify(
      {
        renderer: 'Chromium SwiftShader software WebGL',
        viewport: '1440x900',
        quality: 'low',
        location:
          'Momo Village [0,1,10], idle, identical camera, 10s warmup and three 5s rAF samples per scenario',
        results,
      },
      null,
      2
    )
  );
})().catch(async (e) => {
  await Promise.allSettled([...activeBrowsers].map((b) => b.close()));
  console.error(e);
  process.exitCode = 1;
});
