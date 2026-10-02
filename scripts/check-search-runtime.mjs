#!/usr/bin/env node
/** Local built-client regression; this is not the authenticated E2E gate. */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {searchLabelFindings} from './search-label.mjs';

const build = fileURLToPath(new URL('../build/', import.meta.url));
const mime = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp'};
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(build, `.${pathname}`, extname(pathname) ? '' : 'index.html');
    if (!file.startsWith(build.endsWith(sep) ? build : build + sep)) {
      response.writeHead(404).end();
      return;
    }
    const contents = await readFile(file);
    response.writeHead(200, {'Content-Type': mime[extname(file)] ?? 'application/octet-stream'});
    response.end(contents);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const origin = `http://127.0.0.1:${server.address().port}`;

async function checkPage(page, path, width) {
  await page.goto(origin + path);
  await page.locator('html[data-has-hydrated="true"]').waitFor();
  const input = page.locator('input.navbar__search-input');
  const labels = () => input.evaluateAll((elements) => elements.map((element) => element.getAttribute('aria-label')));
  assert.deepEqual(searchLabelFindings(await labels()), [], `${path} at ${width}px after hydration`);
  await input.fill('webhooks');
  assert.equal(await input.inputValue(), 'webhooks');
  await input.press('Tab');
  assert.deepEqual(searchLabelFindings(await labels()), [], 'Typing and blur retain the accessible name');
  // The detector must fail on the actual hydrated control, not a fixture
  // with an unrelated "Buscar" button elsewhere in the document.
  await input.evaluate((element) => element.setAttribute('aria-label', 'Search'));
  assert.ok(searchLabelFindings(await labels()).length);
  await input.evaluate((element) => element.removeAttribute('aria-label'));
  assert.ok(searchLabelFindings(await labels()).length);
  console.log(`ok   ${path} ${width}px: Buscar after hydration, typing/blur, English and missing-name controls`);
}

async function checkViewport(browser, width) {
  const page = await browser.newPage({viewport: {width, height: 900}});
  try {
    // No remote APIs/CDNs: this regression checks the Docusaurus navbar that
    // hosts both documentation and Scalar, not Scalar's remote runtime.
    await page.route('**/*', (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    // Both cases mutate their control. Finish and navigate away before reusing
    // the page so a negative control cannot affect the next case.
    await checkPage(page, '/docs/saas/1platform-api/getting-started', width);
    await checkPage(page, '/api-reference/1platform-api', width);
  } finally {
    await page.close();
  }
}

let browser;
try {
  browser = await chromium.launch({headless: true});
  // Keep one page alive at a time: CI does not need four concurrent browsers.
  await checkViewport(browser, 1440);
  await checkViewport(browser, 390);
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((done) => server.close(done));
}
