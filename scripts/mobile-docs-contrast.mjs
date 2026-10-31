import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';

// Inspect the rendered rich labels, whose own colours override menu__link.
async function contrasts(page, root) {
  return page.locator(`${root} [class*='richTitle_'], ${root} [class*='richDesc_'], ${root} [class*='richIcon_']`).evaluateAll(elements => {
    const rgba = text => text.match(/[\d.]+/g).map(Number);
    const luminance = rgb => rgb.slice(0, 3).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
    const over = (fg, bg) => fg.slice(0, 3).map((c, i) => c * (fg[3] ?? 1) + bg[i] * (1 - (fg[3] ?? 1)));
    return elements.filter(element => element.checkVisibility()).map(element => {
      const ancestors = [];
      for (let node = element; node; node = node.parentElement) ancestors.push(node);
      const background = ancestors.reverse().reduce((bg, node) => over(rgba(getComputedStyle(node).backgroundColor), bg), [255, 255, 255]);
      const foreground = over(rgba(getComputedStyle(element).color), background);
      const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
      return {label: element.textContent || 'icon', ratio: (high + .05) / (low + .05), minimum: element.className.includes('richIcon_') ? 3 : 4.5};
    });
  });
}

function assertReadable(rows, state) {
  assert.ok(rows.length > 0, `${state}: rich labels must be present`);
  for (const row of rows) assert.ok(row.ratio >= row.minimum, `${state}: ${row.label} contrast ${row.ratio.toFixed(2)} < ${row.minimum}`);
}

export async function checkMobileDocsContrast(browser, origin, home) {
  for (const width of [320, 390, 1440]) {
    const page = await browser.newPage({viewport: {width, height: 900}, reducedMotion: 'reduce'});
    await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    try {
      await page.goto(origin + home);
      await page.locator('html[data-has-hydrated="true"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      if (width === 1440) {
        assertReadable(await contrasts(page, '.theme-doc-sidebar-container'), 'desktop');
        continue;
      }
      const toggle = page.locator('.navbar__toggle');
      await toggle.click();
      const root = '.navbar-sidebar';
      await page.locator(`${root} [class*='richTitle_']`).first().waitFor({state: 'visible'});
      assertReadable(await contrasts(page, root), `${width}px collapsed`);
      const collapsed = page.locator(`${root} [aria-expanded="false"]:visible`).first();
      assert.ok(await collapsed.count(), 'a collapsed documentation category must be exercised');
      const category = await collapsed.elementHandle();
      await category.click();
      await page.waitForFunction(node => node.getAttribute('aria-expanded') === 'true', category);
      assertReadable(await contrasts(page, root), `${width}px expanded`);
      const active = page.locator(`${root} .menu__link--active:has([class*='richTitle_'])`).first();
      assert.ok(await active.count(), 'active documentation entry must be exercised');
      await active.focus();
      assert.ok(await active.evaluate(node => node === document.activeElement));
      assertReadable(await contrasts(page, root), `${width}px focused`);
      if (process.env.DOCS_EVIDENCE_DIR) {
        await mkdir(process.env.DOCS_EVIDENCE_DIR, {recursive: true});
        await page.screenshot({path: `${process.env.DOCS_EVIDENCE_DIR}/docs-menu-${width}.png`});
      }
      // Restore the defective inherited palette: the same check must reject it.
      await page.locator(root).evaluate(node => node.style.setProperty('--color-text', 'var(--ink)'));
      await page.waitForFunction(selector => getComputedStyle(document.querySelector(`${selector} [class*='richTitle_']`)).color === 'rgb(23, 38, 64)', root);
      assert.ok((await contrasts(page, root)).some(row => row.ratio < row.minimum), 'old light ink on the dark drawer must fail');
      await page.keyboard.press('Escape');
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      assert.ok(await toggle.evaluate(node => node === document.activeElement), 'Escape restores the opener');
    } finally { await page.close(); }
  }
  console.log('ok   mobile documentation titles, descriptions and icons: collapsed/expanded/active/focus, desktop control and negative palette');
}
