#!/usr/bin/env node
/**
 * «Prompt para su agente» in a real browser over the built site (épica
 * infraestructura-para-agentes-ia, IPA-02 CA-1 / T-6). jsdom cannot answer what
 * matters here: that the button stays disabled until the text arrives, that
 * Copy writes exactly the file to the clipboard without moving focus, that the
 * live region announces it, that a failed fetch offers a retry, and that the
 * raw link is there without JavaScript.
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
import {serveBuild} from './build-server.mjs';
import {checkPromptVisual} from './check-prompt-visual.mjs';

const PAGE = '/docs/saas/1platform-api/inicio-rapido';
const PROMPT = '/prompts/inicio-rapido.md';
const expected = readFileSync(new URL(`../static${PROMPT}`, import.meta.url), 'utf8');

const {origin, close} = await serveBuild();
const browser = await chromium.launch();
try {
  const context = await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {origin});
  const page = await context.newPage();

  let release;
  const held = new Promise((resolve) => { release = resolve; });
  let fail = true;
  await page.route(`**${PROMPT}`, async (route) => {
    await held;
    if (fail) return route.fulfill({status: 500, body: 'error'});
    return route.continue();
  });

  await page.goto(origin + PAGE);
  await page.locator('html[data-has-hydrated="true"]').waitFor();
  // The SSR fallback carries the same region name and is replaced when the
  // lazy chunk arrives; only the resolved block has the live region.
  const block = page.getByRole('region', {name: 'Prompt para su agente'}).filter({has: page.locator('[aria-live]')});
  await block.waitFor({state: 'attached'});
  await block.evaluate((el) => el.scrollIntoView());
  const copyButton = block.getByRole('button', {name: 'Copiar'});
  await copyButton.waitFor();
  assert.equal(await copyButton.isDisabled(), true, 'Copy is disabled before the text loads');
  assert.equal(await block.getByRole('link', {name: 'Ver como texto'}).getAttribute('href'), PROMPT);

  release();
  const retry = block.getByRole('button', {name: 'Reintentar'});
  await retry.waitFor();
  assert.equal(await block.getByRole('alert').count(), 1, 'a failed prompt load is announced as an alert');
  console.log('ok   disabled while loading; a failed fetch offers Reintentar and the raw link');

  fail = false;
  await retry.click();
  await block.locator('pre code').waitFor();
  assert.equal(await block.locator('pre code').textContent(), expected, 'the block shows the file verbatim');
  await copyButton.focus();
  await copyButton.click();
  await block.getByText('Copiado').waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected, 'the clipboard holds the file verbatim');
  assert.equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Copiar', 'focus stays on the button');
  assert.equal(await block.locator('[aria-live="polite"]').textContent(), 'Copiado');
  // Seen, not only announced (verify-epic-e2e 2026-10-31): a 1×1 clipped region
  // passes `waitFor` and tells a sighted reader nothing.
  const shown = await block.locator('[aria-live="polite"]').boundingBox();
  assert.ok(shown && shown.width > 40 && shown.height > 10, `«Copiado» is visible (${JSON.stringify(shown)})`);
  console.log('ok   retry loads the prompt; Copy writes the exact file, keeps focus and announces «Copiado»');

  // IPA-06 CA-1: «Integrar con IA» sits right after «Inicio rápido».
  const labels = await page.locator('.theme-doc-sidebar-menu > li > a, .theme-doc-sidebar-menu > li > div > a').allInnerTexts();
  const order = labels.map((label) => label.split('\n')[0].trim());
  assert.deepEqual(order.slice(0, 3), ['Inicio', 'Inicio rápido', 'Integrar con IA'], `sidebar order: ${order.slice(0, 4)}`);
  await page.goto(origin + '/docs/saas/1platform-api/integrar-con-ia');
  await page.locator('html[data-has-hydrated="true"]').waitFor();
  const master = page.getByRole('region', {name: 'Prompt maestro de integración'}).filter({has: page.locator('[aria-live]')});
  await master.waitFor({state: 'attached'});
  await master.evaluate((el) => el.scrollIntoView());
  await master.locator('pre code').waitFor();
  assert.match(await master.locator('pre code').textContent(), /<contexto>/);
  console.log('ok   «Integrar con IA» follows «Inicio rápido» and its master prompt loads');

  const noJs = await browser.newPage({javaScriptEnabled: false});
  await noJs.goto(origin + PAGE);
  // Streaming SSR ships the fallback visible and the resolved block hidden until
  // a script swaps them; without JavaScript the reader keeps the fallback.
  assert.equal(await noJs.locator(`a[href="${PROMPT}"]`).filter({visible: true}).count(), 1, 'one visible raw link');
  console.log('ok   without JavaScript the raw link is present');
  const raw = await (await fetch(origin + PROMPT)).text();
  assert.equal(raw, expected, 'the build serves the static prompt');
  await checkPromptVisual(browser, origin);
} finally {
  await browser.close();
  await close();
}
