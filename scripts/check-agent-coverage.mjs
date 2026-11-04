#!/usr/bin/env node
// Coverage is derived from product categories, not a fixed list of today's products.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TOOLS = ['docs_search', 'docs_get_page', 'api_get_operation'];
const read = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

export function checkCoverage(root) {
  const errors = [];
  const productRoot = path.join(root, 'docs/saas/1platform-api');
  let products = 0;
  for (const dir of fs.readdirSync(productRoot, {withFileTypes: true})) {
    if (!dir.isDirectory()) continue;
    const category = read(path.join(productRoot, dir.name, '_category_.json'));
    if (!category || JSON.parse(category).customProps?.kind !== 'product') continue;
    products++;
    const file = `docs/saas/1platform-api/${dir.name}/index.mdx`;
    const source = read(path.join(root, file));
    const blocks = [...source.matchAll(/<PromptParaAgente\b[^>]*\bslug="([a-z0-9-]+)"[^>]*\/>/g)];
    if (blocks.length !== 1) errors.push(`${file}: expected one product prompt, found ${blocks.length}`);
    for (const [, slug] of blocks) {
      if (!read(path.join(root, `static/prompts/${slug}.md`)).trim()) errors.push(`${file}: missing prompt ${slug}`);
    }
  }
  if (!products) errors.push('No product categories found');
  const assets = [];
  const prompts = path.join(root, 'static/prompts');
  for (const file of fs.readdirSync(prompts)) if (file.endsWith('.md')) assets.push(`static/prompts/${file}`);
  const skills = path.join(root, 'static/skills');
  for (const dir of fs.readdirSync(skills, {withFileTypes: true})) {
    if (dir.isDirectory()) assets.push(`static/skills/${dir.name}/SKILL.md`);
  }
  if (!assets.length) errors.push('No agent instructions found');
  for (const file of assets) {
    const text = read(path.join(root, file));
    for (const tool of TOOLS) {
      if (!text.includes(`\`${tool}\``)) errors.push(`${file}: missing MCP instruction ${tool}`);
    }
    // A prompt copied out of the UI must carry a concrete guide, independently
    // of the sidebar and of whether the user already read the master prompt.
    if (!/\/docs\/saas\/1platform-api\/[a-z0-9/-]+/.test(text)) errors.push(`${file}: missing Core documentation path`);
    if (!/MCP/.test(text)) errors.push(`${file}: missing MCP context`);
  }
  return {errors, products, assets: assets.length};
}

function selfTest() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-coverage-'));
  const put = (file, text) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, text); };
  const instructions = 'Use el MCP: `docs_search`, `docs_get_page`, `api_get_operation`. /docs/saas/1platform-api/example';
  const page = 'docs/saas/1platform-api/example/index.mdx';
  const prompt = 'static/prompts/example.md';
  const skill = 'static/skills/example/SKILL.md';
  try {
    put('docs/saas/1platform-api/example/_category_.json', JSON.stringify({customProps: {kind: 'product'}}));
    put(page, '<PromptParaAgente slug="example" />'); put(prompt, instructions); put(skill, instructions);
    assert.deepEqual(checkCoverage(root).errors, []);
    put(page, '# Example'); assert.ok(checkCoverage(root).errors.some(e => e.includes('expected one product prompt')));
    put(page, '<PromptParaAgente slug="missing" />'); assert.ok(checkCoverage(root).errors.some(e => e.includes('missing prompt')));
    put(page, '<PromptParaAgente slug="example" />');
    for (const file of [prompt, skill]) {
      for (const tool of TOOLS) {
        put(file, instructions.replace(`\`${tool}\``, ''));
        assert.ok(checkCoverage(root).errors.some(e => e.includes(file) && e.includes(tool)));
      }
      put(file, instructions.replace('/docs/saas/1platform-api/example', ''));
      assert.ok(checkCoverage(root).errors.some(e => e.includes('missing Core documentation path')));
      put(file, instructions);
    }
    put('docs/saas/1platform-api/new-product/_category_.json', JSON.stringify({customProps: {kind: 'product'}}));
    assert.ok(checkCoverage(root).errors.some(e => e.includes('new-product/index.mdx')));
    console.log('agent-coverage self-test: missing blocks/files, each MCP tool, guide and new products discriminate');
  } finally { fs.rmSync(root, {recursive: true, force: true}); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--self-test')) selfTest();
  else {
    const result = checkCoverage(ROOT);
    if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
    else console.log(`agent-coverage: ${result.products} products and ${result.assets} prompts/skills include MCP instructions`);
  }
}
