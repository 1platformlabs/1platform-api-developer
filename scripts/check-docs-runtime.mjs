#!/usr/bin/env node
/** Built-client checks with a controlled CDN; not the real-auth E2E gate. */
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {serveBuild} from './build-server.mjs';

const {origin, close} = await serveBuild();
const runtime = `window.Scalar = {createApiReference(element, configuration) {
  window.referenceMounts = (window.referenceMounts || 0) + 1;
  const node = document.createElement('pre');
  node.className = 'runtime-contract';
  node.textContent = JSON.stringify(configuration.content.servers);
  element.appendChild(node);
  configuration.onLoaded();
  return {destroy() {node.remove();}};
}};`;
const cdnPattern = '**cdn.jsdelivr.net/**';
const guide = '/docs/saas/1platform-api/inicio-rapido';
const home = '/docs/saas/1platform-api/getting-started';
const reference = '/api-reference/1platform-api';

async function wordLines(page) {
  return page.locator('.docs-masthead h1').evaluate(heading => {
    const words = [];
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      for (const word of node.textContent.matchAll(/\S+/g)) {
        const range = document.createRange();
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        words.push({word: word[0], lines: new Set([...range.getClientRects()].map(rect => rect.top)).size});
      }
    }
    return words;
  });
}

async function checkReadingViewport(browser, width) {
  const page = await browser.newPage({viewport: {width, height: 900}});
  let requests = 0;
  await page.route(cdnPattern, async route => {requests += 1; await route.abort();});
  try {
    await page.goto(origin + home, {waitUntil: 'domcontentloaded'});
    await page.locator('.docs-masthead h1').waitFor({state: 'visible'});
    await page.evaluate(() => document.fonts.ready);
    const words = await wordLines(page);
    assert.ok(words.length > 0);
    assert.ok(words.every(word => word.lines === 1), `${width}px: ${JSON.stringify(words)}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (process.env.DOCS_EVIDENCE_DIR && [360, 1440].includes(width)) {
      await mkdir(process.env.DOCS_EVIDENCE_DIR, {recursive: true});
      await page.screenshot({path: `${process.env.DOCS_EVIDENCE_DIR}/developer-fixed-${width}.png`});
    }
    if (width === 360) {
      await page.locator('.docs-masthead h1').evaluate(node => {node.style.fontSize = '47px';});
      assert.ok((await wordLines(page)).some(word => word.lines > 1), 'old fixed size must fail');
    }
    assert.equal(requests, 0, 'the home page must never request the reference runtime');
  } finally {
    await page.close();
  }
}

async function checkReading(browser) {
  // Each viewport owns a page: concurrent checks cannot change one another's DOM.
  await Promise.all([320, 360, 390, 520, 1440].map(width => checkReadingViewport(browser, width)));
  const page = await browser.newPage();
  let requests = 0;
  await page.route(cdnPattern, async route => {requests += 1; await route.abort();});
  try {
    await page.goto(origin + guide, {waitUntil: 'domcontentloaded'});
    await page.locator('h1').waitFor({state: 'visible'});
    assert.equal(requests, 0, 'guides must never request the reference runtime');
  } finally {
    await page.close();
  }
}

async function checkReference(browser, path) {
  const page = await browser.newPage();
  let requests = 0;
  await page.route(cdnPattern, async route => {
    requests += 1;
    if (requests === 1) await route.abort();
    else await route.fulfill({contentType: 'text/javascript', body: runtime});
  });
  await page.goto(origin + path);
  await page.getByRole('alert').waitFor();
  await page.getByRole('button', {name: 'Volver a cargar'}).click();
  await page.locator('.runtime-contract').waitFor();
  const servers = JSON.parse(await page.locator('.runtime-contract').innerText());
  assert.ok(servers.some(server => /prod/i.test(server.description)));
  assert.ok(servers.some(server => /qa/i.test(server.description)));
  assert.equal(requests, 2, 'one failed attempt and one explicit retry');
  await page.getByRole('link', {name: 'Primeros pasos', exact: true}).click();
  await page.locator('.api-reference-page').waitFor({state: 'detached'});
  await page.locator('h1').waitFor({state: 'visible'});
  assert.equal(await page.locator('.runtime-contract').count(), 0);
  assert.equal(await page.locator('script[src*="cdn.jsdelivr.net"]').count(), 0);
  await page.close();
}

async function checkPendingNavigation(browser) {
  const page = await browser.newPage();
  let release;
  const held = new Promise(resolve => {release = resolve;});
  let requests = 0;
  await page.route(cdnPattern, async route => {
    requests += 1;
    if (requests === 1) await held;
    await route.fulfill({contentType: 'text/javascript', body: runtime}).catch(() => {});
  });
  try {
    await page.goto(origin + home);
    await page.locator('html[data-has-hydrated="true"]').waitFor();
    await page.getByRole('link', {name: 'Referencia de API', exact: true}).click();
    await page.locator('script[src*="cdn.jsdelivr.net"]').waitFor({state: 'attached'});
    await page.getByRole('link', {name: 'Primeros pasos', exact: true}).click();
    await page.locator('html.docs-wrapper').waitFor();
    assert.equal(await page.locator('script[src*="cdn.jsdelivr.net"]').count(), 0);
    await page.goBack();
    await page.locator('script[src*="cdn.jsdelivr.net"]').waitFor({state: 'attached'});
    assert.equal(await page.locator('script[src*="cdn.jsdelivr.net"]').count(), 1);
    // Chromium may reuse the in-flight request even after its original tag
    // was removed. Release the transport only after the new route owns it.
    release();
    await page.locator('.runtime-contract').waitFor();
    assert.equal(await page.evaluate(() => window.referenceMounts), 1, 'only the current route may initialize');
    assert.equal(await page.locator('script[src*="cdn.jsdelivr.net"]').count(), 1);
  } finally {
    release();
    await page.close();
  }
}

let browser;
try {
  browser = await chromium.launch({headless: true});
  await checkReading(browser);
  await checkReference(browser, reference);
  await checkReference(browser, '/api-reference/atlas-api');
  await checkPendingNavigation(browser);
  console.log('ok   reading without CDN, intact words 320–1440px, reference retry/servers/SPA/unmount');
} finally {
  await browser?.close();
  await close();
}
