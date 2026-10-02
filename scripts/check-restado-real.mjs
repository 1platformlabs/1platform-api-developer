/** Optional real-bank acceptance. Requires the production build and local API. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { informalForms } from './editorial-prose.mjs';

const target = process.env.E2E_TARGET || 'branch';
const origin = `http://127.0.0.1:${target === 'control' ? 4001 : 3901}`;
const api = `http://127.0.0.1:${target === 'control' ? 9010 : 8910}`;
const output = `${process.env.E2E_BENCH}/screenshots/${target}/developer`;
assert.ok(process.env.E2E_BENCH, 'Private evidence directory required');
mkdirSync(output, { recursive: true });
const changed = execFileSync('git', ['diff', 'origin/main', '--name-only'], { encoding: 'utf8' });
// Optional fixed manifest allows the identical branch cases to run on control.
const routes = process.env.E2E_DOC_ROUTES
  ? JSON.parse(process.env.E2E_DOC_ROUTES)
  : [...new Set(changed.split('\n').filter(p => /^docs\/.*\.mdx?$/.test(p))
      .map(p => p === 'docs/saas/atlas-api/index.mdx' ? '/docs/saas/atlas-api/overview' : '/' + p.replace(/\.mdx?$/, '').replace(/\/index$/, '')))];
assert.ok(routes.length, 'No changed documentation routes');
const browser = await chromium.launch();
const findings = [], checks = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({viewport: {width, height: width === 390 ? 844 : 900}, reducedMotion: 'reduce'});
    page.setDefaultTimeout(20000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of routes) {
      const response = await page.goto(origin + route);
      assert.equal(response.status(), 200, route);
      await page.locator('html[data-has-hydrated="true"]').waitFor();
      await page.locator('main article').first().waitFor();
      const prose = await page.locator('main').first().evaluate(el => {
        const copy = el.cloneNode(true);copy.querySelectorAll('code,pre,script,style').forEach(e => e.remove());return copy.textContent;
      });
      const informal = informalForms(prose);
      if (informal.length) findings.push({ route, width, informal: [...new Set(informal)] });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) findings.push({ route, width, overflow });
      // Every changed documentation screen gets an inspectable capture.
      await page.screenshot({path: `${output}/${route.replaceAll('/', '_')}-${width}.png`, animations: 'disabled'});
      checks.push({route, width, status: 200, informal: informal.length, overflow});
    }
    for (const route of ['/docs/saas/1platform-api/getting-started', '/api-reference/1platform-api']) {
      await page.goto(origin + route);
      await page.locator('html[data-has-hydrated="true"]').waitFor();
      const search = page.locator('input.navbar__search-input');
      if (await search.getAttribute('aria-label') !== 'Buscar') findings.push({route, width, searchName: 'not Buscar'});
      await search.fill('webhooks');
      await page.locator('[class*="dropdownMenu"] a, .ds-suggestions').first().waitFor();
      await search.press('Escape');await search.fill('');
      if (route.startsWith('/api-reference')) {
        await page.locator('main.references-rendered').waitFor();
        const text = await page.locator('main.references-rendered').innerText();
        if (!text.includes('APP_API_KEY_EXAMPLE') || !text.includes('USER_API_KEY_EXAMPLE')) findings.push({route,width,markers:'missing'});
        await page.getByText('/api/v1/health/',{exact:true}).filter({visible:true}).first().click();
        await page.getByRole('button').filter({hasText:/Probar solicitud/}).first().click();
        const response = page.waitForResponse(r => r.url() === api + '/api/v1/health/');
        await page.locator('button:visible').filter({hasText: /^EnviarEnviar solicitud get a/}).first().click();
        const real = await response;
        assert.equal(real.status(),200);
        const health = await real.json();assert.equal(health.data.database, 'ok');
        await page.waitForTimeout(300);
        checks.push({route,width,realApi:api,status:real.status(),database:health.data.database});
      }
      await page.screenshot({path:`${output}/${route.startsWith('/api-reference')?'scalar-health':'search'}-${width}.png`,animations:'disabled'});
    }
    if (errors.length) findings.push({width,errors});
    await page.close();
  }
} finally {
  await browser.close();
  writeFileSync(`${process.env.E2E_BENCH}/developer-${target}.json`, JSON.stringify({routes,checks,findings}, null, 2));
}
console.log(JSON.stringify({target,checks:checks.length,findings}));
assert.equal(findings.length,0,'Real-browser findings (details in evidence JSON)');
