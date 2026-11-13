#!/usr/bin/env node
/** Rendered chrome geometry for the wider One Platform wordmark. One page at a time. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveBuild} from './build-server.mjs';
const {origin, close} = await serveBuild();
const browser = await chromium.launch();
try {
  for (const width of [320, 390, 844, 1024, 1280, 1291, 1366, 1440, 1600]) {
    console.log(`checking brand and navigation at ${width}px`);
    // A fresh page isolates viewport lifecycle effects; only one page is live.
    const page = await browser.newPage({viewport: {width, height: 900}});
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await page.goto(`${origin}/docs/saas/1platform-api/getting-started`);
    await page.locator('html[data-has-hydrated="true"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.navbar__brand').first().getAttribute('aria-label'), 'One Platform, inicio');
    for (const search of [false, true]) {
      if (search) await page.locator('.navbar__search-input').focus();
      const failures = await page.locator('.navbar').evaluate(nav => {
        const items = [...nav.querySelectorAll('.navbar__inner a, .navbar__inner button, .navbar__search-input')]
          .filter(el => el.getBoundingClientRect().width && getComputedStyle(el).visibility !== 'hidden')
          .map(el => ({label: el.getAttribute('aria-label') || el.textContent, rect: el.getBoundingClientRect()}));
        const errors = [];
        const frame = nav.getBoundingClientRect();
        for (let i = 0; i < items.length; i++) {
          const a = items[i];
          if (a.rect.left < frame.left || a.rect.right > frame.right) errors.push(`outside: ${a.label}`);
          for (const b of items.slice(i + 1)) if (Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left) > 1 && Math.min(a.rect.bottom, b.rect.bottom) > Math.max(a.rect.top, b.rect.top)) errors.push(`${a.label} overlaps ${b.label}`);
        }
        return errors;
      });
      assert.deepEqual(failures, [], `${width}px search=${search}`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`);
    }
    if (width <= 1290) {
      await page.locator('.navbar__toggle').click();
      await page.locator('.navbar-sidebar__close').waitFor({state: 'visible'});
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.navbar__toggle').getAttribute('aria-expanded'), 'false');
    }
    await page.close();
  }
  // Slow local indexing preserves the visitor's current intent in both directions.
  for (const destination of ['search', 'menu']) {
    const delayed = await browser.newPage({viewport: {width: 390, height: 844}});
    let releaseIndex;
    const indexGate = new Promise(resolve => { releaseIndex = resolve; });
    await delayed.context().route('**/search-index.json*', async route => { await indexGate; await route.continue(); });
    await delayed.goto(`${origin}/docs/saas/1platform-api/getting-started`);
    await delayed.locator('html[data-has-hydrated="true"]').waitFor();
    const requested = delayed.context().waitForEvent('request', {predicate: request => new URL(request.url()).pathname === '/search-index.json'});
    await delayed.locator('.navbar__search-input').focus();
    await requested;
    if (destination === 'menu') {
      await delayed.locator('.navbar__toggle').click();
      await delayed.locator('.navbar-sidebar__close').waitFor({state: 'visible'});
      await delayed.waitForFunction(() => document.activeElement?.matches('.navbar-sidebar__close'));
    }
    releaseIndex();
    await delayed.locator('.navbar__search-input[role="combobox"]').waitFor({state: 'attached'});
    const expected = destination === 'menu' ? '.navbar-sidebar__close' : '.navbar__search-input';
    assert.ok(await delayed.locator(expected).evaluate(el => el === document.activeElement), `late index must preserve ${destination} focus`);
    await delayed.close();
  }
  const page = await browser.newPage();
  await page.goto(`${origin}/docs/saas/1platform-api/getting-started`);
  const mcp = page.locator('footer a[href$="integrar-con-ia#mcp"]');
  await mcp.click();
  await page.locator('#mcp').waitFor({state: 'visible'});
  console.log('ok   One Platform brand, navigation, search, menu and MCP at 9 viewport widths');
} finally { await browser.close(); await close(); }
