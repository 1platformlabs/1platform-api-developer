#!/usr/bin/env node
// Check the actual built/candidate pages and copied payload at every supported viewport.
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {serveBuild} from './build-server.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'docs/saas/1platform-api');
const walk = dir => readdirSync(dir, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]);
const pages = walk(source).filter(f => f.endsWith('.mdx')).flatMap(file => {
  const text = readFileSync(file, 'utf8');
  const block = text.match(/<PromptParaAgente slug="([a-z0-9-]+)"(?: title="([^"]+)")?\s*\/>/);
  if (!block) return [];
  return [{route: '/docs/saas/1platform-api/' + file.slice(source.length + 1).replace(/(?:\/index)?\.mdx$/, ''), slug: block[1], title: block[2] ?? 'Prompt para su agente'}];
});
const hosted = process.env.PROMPT_MATRIX_ORIGIN;
const server = hosted ? {origin: hosted, close: async () => {}} : await serveBuild();
const evidence = process.env.PROMPT_MATRIX_EVIDENCE;
if (evidence) mkdirSync(evidence, {recursive: true});
const browser = await chromium.launch();
const results = [], failures = [];
try {
  for (const [width, height] of [[1440,900], [390,844], [360,844], [430,844], [844,390]]) {
    const context = await browser.newContext({viewport: {width,height}});
    await context.grantPermissions(['clipboard-read','clipboard-write'], {origin: server.origin});
    const page = await context.newPage();
    for (const item of pages) {
      const label = `${item.slug}-${width}x${height}`;
      await page.goto(server.origin + item.route);
      await page.locator('html[data-has-hydrated="true"]').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const block = page.getByRole('region', {name: item.title, exact: true}).filter({has: page.locator('[aria-live]')});
      // SSR fallbacks have no live region; wait for the lazy component only when
      // the page actually declares a prompt (old product pages do not).
      const region = page.getByRole('region', {name: item.title, exact: true});
      if (await region.count() === 0) {
        failures.push(`${label}: missing product prompt`);
        if (evidence) await page.screenshot({path: join(evidence, `${label}.png`)});
        continue;
      }
      // The lazy chunk loads on mount and REPLACES the SSR fallback region, so
      // acting on the fallback can hit a detached node (CI run 41871825572).
      // Wait for the hydrated block (the one with a live region) and act on it.
      await block.waitFor();
      await block.scrollIntoViewIfNeeded();
      const pre = block.locator('pre'); await pre.waitFor();
      await block.evaluate(el => el.scrollIntoView({block:'start'}));
      const code = await pre.textContent();
      const expected = readFileSync(join(root, 'static/prompts', item.slug + '.md'),'utf8');
      if (code !== expected) failures.push(`${label}: rendered prompt differs from source`);
      const copy = block.getByRole('button', {name:'Copiar',exact:true});
      const raw = block.getByRole('link', {name:'Ver como texto'});
      await raw.focus(); await page.keyboard.press('Shift+Tab');
      if (!await copy.evaluate(el => el === document.activeElement)) failures.push(`${label}: keyboard order`);
      await page.keyboard.press('Enter');
      await block.getByText('Copiado', {exact:true}).waitFor();
      if (await page.evaluate(() => navigator.clipboard.readText()) !== expected) failures.push(`${label}: clipboard differs from source`);
      const measurements = await block.evaluate(el => {
        const pre = el.querySelector('pre'), button = el.querySelector('button'), link = el.querySelector('a');
        return {pageOverflow: document.documentElement.scrollWidth-innerWidth, codeOverflow: pre.scrollWidth-pre.clientWidth,
          buttonHeight: button.getBoundingClientRect().height, linkHeight: link.getBoundingClientRect().height,
          focusWidth: parseFloat(getComputedStyle(button).outlineWidth)};
      });
      if (measurements.pageOverflow > 1 || measurements.codeOverflow > 1) failures.push(`${label}: horizontal overflow`);
      if (measurements.buttonHeight < 44 || measurements.linkHeight < 44 || measurements.focusWidth < 2) failures.push(`${label}: target/focus`);
      if (evidence) await page.screenshot({path: join(evidence, `${label}.png`)});
      results.push({label,...measurements});
    }
    await context.close();
    console.log(`prompt matrix: ${width}x${height} checked`);
  }
} finally {await browser.close(); await server.close();}
if (evidence) writeFileSync(join(evidence,'measurements.json'), JSON.stringify({origin:server.origin,results,failures},null,2)+'\n');
for (const failure of failures) console.error(failure);
assert.equal(failures.length,0, 'prompt matrix regressions');
console.log(`prompt matrix: ${pages.length} pages × 5 viewports; exact clipboard, keyboard, targets and no overflow`);
