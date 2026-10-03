/** Optional real-bank acceptance. Requires production builds and a local API. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { informalForms } from './editorial-prose.mjs';

const target = process.env.E2E_TARGET || 'branch';
const origin = `http://127.0.0.1:${target === 'control' ? 4001 : 3901}`;
const api = `http://127.0.0.1:${target === 'control' ? 9010 : 8910}`;
assert.ok(process.env.E2E_BENCH, 'Private evidence directory required');
const output = `${process.env.E2E_BENCH}/screenshots/${target}/developer`;
mkdirSync(output, { recursive: true });
const changed = execFileSync('/usr/bin/git', ['diff', 'origin/main', '--name-only'], { encoding: 'utf8' });
function docRoute(path) {
  return path === 'docs/saas/atlas-api/index.mdx'
    ? '/docs/saas/atlas-api/overview'
    : '/' + path.replace(/\.mdx?$/, '').replace(/\/index$/, '');
}
// A fixed manifest runs the identical branch cases against the control build.
const routes = process.env.E2E_DOC_ROUTES
  ? JSON.parse(process.env.E2E_DOC_ROUTES)
  : [...new Set(changed.split('\n').filter(p => /^docs\/.*\.mdx?$/.test(p)).map(docRoute))];
assert.ok(routes.length, 'No changed documentation routes');
const findings = [], checks = [];
// Each callback navigates the same page, so operations must remain sequential.
const sequential = (values, action) => values.reduce(
  (previous, value) => previous.then(() => action(value)), Promise.resolve());

async function capture(page, name, width) {
  await page.screenshot({ path: `${output}/${name}-${width}.png`, animations: 'disabled' });
}
async function documentPage(page, route, width) {
  const response = await page.goto(origin + route);
  assert.equal(response.status(), 200, route);
  await page.locator('html[data-has-hydrated="true"]').waitFor();
  await page.locator('main article').first().waitFor();
  const prose = await page.locator('main').first().evaluate(el => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('code,pre,script,style').forEach(e => e.remove());
    return copy.textContent;
  });
  const informal = informalForms(prose);
  if (informal.length) findings.push({ route, width, informal: [...new Set(informal)] });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) findings.push({ route, width, overflow });
  await capture(page, route.replaceAll('/', '_'), width);
  checks.push({ route, width, status: 200, informal: informal.length, overflow });
}
async function scalarHealth(page, route, width) {
  await page.locator('main.references-rendered').waitFor();
  const content = await page.locator('main.references-rendered').innerText();
  if (!content.includes('APP_API_KEY_EXAMPLE') || !content.includes('USER_API_KEY_EXAMPLE'))
    findings.push({ route, width, markers: 'missing' });
  await page.getByText('/api/v1/health/', { exact: true }).filter({ visible: true }).first().click();
  await page.getByRole('button').filter({ hasText: /Probar solicitud/ }).first().click();
  const pending = page.waitForResponse(r => r.url() === api + '/api/v1/health/');
  await page.locator('button:visible').filter({ hasText: /^EnviarEnviar solicitud get a/ }).first().click();
  const response = await pending;
  assert.equal(response.status(), 200);
  const health = await response.json();
  assert.equal(health.data.database, 'ok');
  await page.waitForTimeout(300);
  checks.push({ route, width, realApi: api, status: response.status(), database: health.data.database });
}
async function searchPage(page, route, width) {
  await page.goto(origin + route);
  await page.locator('html[data-has-hydrated="true"]').waitFor();
  const search = page.locator('input.navbar__search-input');
  if (await search.getAttribute('aria-label') !== 'Buscar')
    findings.push({ route, width, searchName: 'not Buscar' });
  await search.fill('webhooks');
  await page.locator('[class*="dropdownMenu"] a, .ds-suggestions').first().waitFor();
  await search.press('Escape');
  await search.fill('');
  const isReference = route.startsWith('/api-reference');
  if (isReference) await scalarHealth(page, route, width);
  await capture(page, isReference ? 'scalar-health' : 'search', width);
}
const browser = await chromium.launch();
async function viewport(width) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await sequential(routes, route => documentPage(page, route, width));
    await sequential(['/docs/saas/1platform-api/getting-started', '/api-reference/1platform-api'],
      route => searchPage(page, route, width));
    if (errors.length) findings.push({ width, errors });
  } finally { await page.close(); }
}
try { await sequential([1440, 390], viewport); }
finally {
  await browser.close();
  writeFileSync(`${process.env.E2E_BENCH}/developer-${target}.json`, JSON.stringify({ routes, checks, findings }, null, 2));
}
console.log(JSON.stringify({ target, checks: checks.length, findings }));
assert.equal(findings.length, 0, 'Real-browser findings (details in evidence JSON)');
