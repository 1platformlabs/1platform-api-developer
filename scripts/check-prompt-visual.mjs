import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

// Shared by the runtime gate and the real-host nginx evidence runner.
export async function checkPromptVisual(browser, origin, shotsDir) {
  const failures = [];
  const measurements = [];
  if (shotsDir) mkdirSync(shotsDir, {recursive: true});
  const check = (condition, message) => {if (!condition) failures.push(message);};
  for (const width of [375, 390, 768, 1024, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}});
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin});
    try {
      const page = await context.newPage();
      for (const [slug, name] of [['inicio-rapido', 'Prompt para su agente'], ['integrar-con-ia', 'Prompt maestro de integración']]) {
        const label = `${slug}-${width}`;
        console.log(`probe ${label}`);
        await page.goto(`${origin}/docs/saas/1platform-api/${slug}`);
        await page.locator('html[data-has-hydrated="true"]').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const block = page.getByRole('region', {name}).filter({has: page.locator('[aria-live]')});
        await block.waitFor({state: 'attached'});
        await block.evaluate(el => el.scrollIntoView({block: 'center'}));
        const pre = block.locator('pre');
        await pre.waitFor();
        await block.evaluate(el => el.scrollIntoView({block: 'center'}));
        const button = block.getByRole('button', {name: 'Copiar', exact: true});
        const raw = block.getByRole('link', {name: 'Ver como texto'});
        const status = block.locator('[aria-live="polite"]');
        const measure = () => block.evaluate(el => {
          const code = el.querySelector('pre'), status = el.querySelector('[aria-live]');
          const b = code.getBoundingClientRect(), s = status.getBoundingClientRect();
          return {pageOverflow: document.documentElement.scrollWidth - innerWidth,
            codeOverflow: code.scrollWidth - code.clientWidth, codeY: b.y + scrollY,
            height: el.getBoundingClientRect().height, statusHeight: s.height,
            statusY: s.y, scrollY, scrollTop: code.scrollTop};
        });
        const shot = async state => {
          if (!shotsDir || (width !== 390 && !['copiado', 'error'].includes(state))) return;
          await page.screenshot({path: join(shotsDir, `${label}-${state}.png`)});
        };
        const before = await measure();
        check(before.pageOverflow <= 1, `${label}: page horizontal overflow ${before.pageOverflow}px`);
        check(before.codeOverflow <= 1, `${label}: prompt horizontal overflow ${before.codeOverflow}px`);
        // Reach the button using the actual tab order, then activate with Enter.
        await raw.focus();
        await page.keyboard.press('Shift+Tab');
        check(await button.evaluate(el => el === document.activeElement), `${label}: Shift+Tab reaches Copy`);
        const focus = await button.evaluate(el => {const s = getComputedStyle(el);return {style: s.outlineStyle, width: parseFloat(s.outlineWidth)};});
        check(focus.style !== 'none' && focus.width >= 2, `${label}: visible button focus`);
        await shot('focus');
        await page.keyboard.press('Enter');
        await status.getByText('Copiado', {exact: true}).waitFor();
        const copied = await measure();
        check(Math.abs(copied.codeY - before.codeY) < 1 && Math.abs(copied.height - before.height) < 1,
          `${label}: copy shifts prompt ${copied.codeY - before.codeY}px`);
        check(await button.evaluate(el => el === document.activeElement), `${label}: Copy preserves focus`);
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), await pre.textContent(), `${label}: exact clipboard`);
        await shot('copiado');
        await page.keyboard.press('Tab');
        check(await raw.evaluate(el => el === document.activeElement), `${label}: Tab reaches raw link`);
        await page.keyboard.press('Tab');
        check(await pre.evaluate(el => el === document.activeElement), `${label}: Tab reaches prompt`);
        const codeFocus = await pre.evaluate(el => {const s = getComputedStyle(el);return {style: s.outlineStyle, width: parseFloat(s.outlineWidth), offset: parseFloat(s.outlineOffset), color: s.outlineColor};});
        check(codeFocus.style === 'solid' && codeFocus.width >= 2 && codeFocus.offset <= -2,
          `${label}: prompt focus must remain visible inside clipped block (${JSON.stringify(codeFocus)})`);
        await shot('texto-focus');
        // PageDown scrolls the prompt itself; its controls and announcement stay put.
        const windowY = await page.evaluate(() => scrollY);
        await page.keyboard.press('PageDown');
        await page.waitForFunction(el => el.scrollTop > 0, await pre.elementHandle());
        // Allow the browser's keyboard scroll animation to finish before measuring
        // or starting the subsequent manual text selection.
        await page.waitForTimeout(500);
        const scrolled = await measure();
        check(scrolled.scrollY === windowY, `${label}: internal scroll moved the page`);
        check(Math.abs(scrolled.statusY - copied.statusY) < 1, `${label}: internal scroll moved status`);
        await shot('final-texto');
        // Exercise the existing 4 s cleanup once, including a second keyboard activation.
        if (width === 390 && slug === 'integrar-con-ia') {
          await page.waitForFunction(el => el.textContent === '', await status.elementHandle());
          const cleared = await measure();
          check(Math.abs(cleared.codeY - before.codeY) < 1, `${label}: clearing status shifts prompt`);
          await page.keyboard.press('Shift+Tab');
          await page.keyboard.press('Shift+Tab');
          await page.keyboard.press('Space');
          await status.getByText('Copiado', {exact: true}).waitFor();
          check(await button.evaluate(el => el === document.activeElement), `${label}: Space preserves focus`);
        }
        // Browser capability failure, not a mocked API response.
        await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true}));
        await button.click();
        await status.getByText('No se pudo copiar.', {exact: false}).waitFor();
        const error = await measure();
        check(Math.abs(error.codeY - before.codeY) < 1 && Math.abs(error.height - before.height) < 1,
          `${label}: error shifts prompt ${error.codeY - before.codeY}px`);
        await pre.evaluate(el => {el.scrollTop = 0;});
        await page.waitForFunction(el => el.scrollTop === 0, await pre.elementHandle());
        await shot('error');
        // Select real text with a pointer drag, as instructed by the error.
        const rect = await pre.boundingBox();
        await page.mouse.move(rect.x + 30, rect.y + 38);
        await page.mouse.down();
        await page.mouse.move(rect.x + Math.min(rect.width - 30, 220), rect.y + 64, {steps: 10});
        await page.mouse.up();
        const selection = await page.evaluate(() => window.getSelection()?.toString() ?? '');
        const normalize = text => text.replace(/\s+/g, ' ').trim();
        check(selection.length > 5 && normalize(await pre.textContent()).includes(normalize(selection)), `${label}: text is manually selectable (${JSON.stringify(selection)})`);
        if (width === 390) await shot('seleccion');
        measurements.push({label, before, copied, scrolled, error, codeFocus, selectedCharacters: selection.length});
      }
    } finally {await context.close();}
  }
  if (shotsDir) writeFileSync(join(shotsDir, '../visual-measurements.json'), JSON.stringify({measurements, failures}, null, 2) + '\n');
  for (const failure of failures) console.error(`FAIL ${failure}`);
  assert.equal(failures.length, 0, `${failures.length} prompt visual regressions`);
  console.log('ok   prompt: 2 pages × 5 widths; stable notices, wrapping, keyboard, internal scroll and manual selection');
}
