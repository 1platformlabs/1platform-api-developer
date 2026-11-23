#!/usr/bin/env node
/**
 * Brand-name gate (épica developer-rebranding-one-platform, D-6). The portal's
 * brand is «One Platform» and its product «One Platform API»; the old spelling
 * «1Platform» may only appear as:
 *
 *  - «1Platform Labs», the company's legal name (copyright, credential issuer);
 *  - `X-1Platform-…`, real HTTP headers (also when HTML-escaped in build/).
 *
 * Lower-case identifiers (`1platform-api`, `1platform-hub`, hosts) never match,
 * because the search is case-sensitive.
 *
 * Surfaces:
 *  - sources: docs/, static/prompts/, static/skills/;
 *  - build/ (.html, .md, .txt, .json), except build/openapi/** — the versioned
 *    spec is emitted by the API and stays out of this épica (D-3). What src/ and
 *    plugins/ paint lands in build/ and is measured there; their code comments
 *    are out of scope on purpose. build/assets/js/*.js is left out too: it is
 *    derived from the same sources and would only make the gate brittle.
 *
 * The evaluation is per occurrence, not per line: a line holding «1Platform
 * Labs» and «la 1Platform API» fails. An empty surface is an error.
 *
 *   node scripts/check-brand-name.mjs              # sources + build/ (needs pnpm build)
 *   node scripts/check-brand-name.mjs --sources    # sources only (no build needed)
 *   node scripts/check-brand-name.mjs --report     # list findings, always exit 0
 *   node scripts/check-brand-name.mjs --self-test  # seeded cases, both directions
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_SURFACES = ['docs', 'static/prompts', 'static/skills'];
const BUILD_EXTENSIONS = new Set(['.html', '.md', '.txt', '.json']);
const BUILD_EXCLUDED = ['openapi'];

const OCCURRENCE = /1Platform/g;
// What may follow or precede an occurrence for it to be allowed.
const LEGAL_NAME = /^1Platform(?:\s|&nbsp;|&#160;| )+Labs\b/;
const HEADER_PREFIX = /X-$/;

function walk(dir, keep = () => true) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return keep(p, true) ? walk(p, keep) : [];
    return keep(p, false) ? [p] : [];
  });
}

export function findingsIn(rel, text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(OCCURRENCE)) {
      const before = line.slice(0, m.index);
      const after = line.slice(m.index);
      if (HEADER_PREFIX.test(before) || LEGAL_NAME.test(after)) continue;
      const start = Math.max(0, m.index - 30);
      out.push(`${rel}:${i + 1}: «${line.slice(start, m.index + 40).trim()}»`);
    }
  });
  return out;
}

export function surfaceFiles(root, {build}) {
  const files = SOURCE_SURFACES.flatMap((s) => walk(path.join(root, s)));
  if (build) {
    const buildDir = path.join(root, 'build');
    files.push(...walk(buildDir, (p, isDir) => {
      const rel = path.relative(buildDir, p);
      if (isDir) return !BUILD_EXCLUDED.includes(rel.split(path.sep)[0]);
      return BUILD_EXTENSIONS.has(path.extname(p));
    }));
  }
  return files;
}

export function checkTree(root, {build}) {
  if (build && !fs.existsSync(path.join(root, 'build'))) {
    return {errors: ['build/ is missing: run `pnpm build` first, or pass --sources'], files: 0, missingBuild: true};
  }
  const files = surfaceFiles(root, {build});
  const errors = files.flatMap((f) => findingsIn(path.relative(root, f), fs.readFileSync(f, 'utf8')));
  return {errors, files: files.length};
}

function selfTest() {
  const make = (files) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brand-name-'));
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), {recursive: true});
      fs.writeFileSync(path.join(dir, rel), text);
    }
    return dir;
  };
  const run = (files, opts = {build: false}) => {
    const dir = make(files);
    const result = checkTree(dir, opts);
    fs.rmSync(dir, {recursive: true, force: true});
    return result;
  };
  const fails = (files, needle, opts) => {
    const {errors} = run(files, opts);
    return errors.some((e) => e.includes(needle));
  };
  const passes = (files, opts) => {
    const {errors, files: n} = run(files, opts);
    if (errors.length) console.error(errors);
    return errors.length === 0 && n > 0;
  };
  const cases = [
    ['old product name in a doc', () => fails({'docs/x.mdx': 'Integre la 1Platform API.'}, 'docs/x.mdx:1')],
    ['old brand in a prompt', () => fails({'static/prompts/x.md': 'línea\nEl MCP de 1Platform responde.'}, 'static/prompts/x.md:2')],
    ['old brand in a skill index', () => fails({'static/skills/index.json': '{"d": "con la 1Platform API"}'}, 'static/skills/index.json:1')],
    ['legal name and header pass', () => passes({'docs/x.mdx': '© 1Platform Labs. Use `X-1Platform-Event-Id` y &lt;code&gt;X-1Platform-Signature&lt;/code&gt;.'})],
    ['legal name across a non-breaking space passes', () => passes({'docs/x.mdx': '1Platform&nbsp;Labs y 1Platform Labs'})],
    ['lower-case identifiers pass', () => passes({'docs/x.mdx': '/docs/saas/1platform-api/ y skills/1platform-hub y api.1platform.pro'})],
    ['mixed line fails by occurrence', () => fails({'docs/x.mdx': 'De 1Platform Labs, la 1Platform API.'}, 'docs/x.mdx:1')],
    ['old brand in build html', () => fails({'docs/a.mdx': 'ok', 'build/docs/a/index.html': '<h1>1Platform API</h1>'}, 'build/docs/a/index.html:1', {build: true})],
    ['build/openapi is out of scope', () => passes({'docs/a.mdx': 'ok', 'build/openapi/1platform-api.json': '{"title": "1Platform API"}'}, {build: true})],
    ['build js bundles are out of scope', () => passes({'docs/a.mdx': 'ok', 'build/assets/js/a.js': '"1Platform API"'}, {build: true})],
    ['missing build is an error', () => run({'docs/a.mdx': 'ok'}, {build: true}).missingBuild === true],
    ['empty surface is an error', () => run({}).files === 0],
  ];
  let failed = 0;
  for (const [name, check] of cases) {
    const ok = check();
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  }
  if (failed) process.exit(1);
  console.log(`check-brand-name self-test: ${cases.length} cases`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const build = !process.argv.includes('--sources');
  const report = process.argv.includes('--report');
  const {errors, files} = checkTree(ROOT, {build});
  if (files === 0 && !errors.length) {
    console.error('check-brand-name: scanned zero files — the gate would pass on nothing');
    process.exit(1);
  }
  for (const e of errors) console.error(e);
  const scope = build ? 'sources + build/' : 'sources';
  if (report) {
    console.log(`check-brand-name (report): ${errors.length} findings in ${files} files (${scope})`);
  } else if (errors.length) {
    console.error(`check-brand-name: ${errors.length} occurrences of the old brand name (${scope})`);
    process.exit(1);
  } else {
    console.log(`check-brand-name: ${files} files (${scope}) use «One Platform»`);
  }
}
