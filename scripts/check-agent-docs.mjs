#!/usr/bin/env node
/**
 * Agent docs contract (épica infraestructura-para-agentes-ia, IPA-01).
 *
 * Reads the BUILD, not the plugin: every page `/llms.txt` lists must exist as
 * `<permalink>.md` next to its HTML page (so the path came from the permalink,
 * not from the file name), open with the index line and carry no MDX left
 * over. A second pass reads the MDX SOURCES: a link to a file that is not a
 * route (`/llms.txt`, `*.md`, `/prompts/*`, `/skills/*`, `/mcp/*`) must be
 * written `pathname:///…`, because `onBrokenLinks: 'throw'` only knows routes
 * and would fail the build on a link that works (D-16).
 *
 *   node scripts/check-agent-docs.mjs             # build/ + docs/
 *   node scripts/check-agent-docs.mjs --self-test  # seeded cases, both directions
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://developer.1platform.pro';
const INDEX_LINE = `> Índice completo de la documentación para agentes: ${ORIGIN}/llms.txt`;
const MIN_PAGES = 60;
const NON_ROUTE = /^\/(?:llms(?:-full)?\.txt|prompts\/|skills\/|mcp\/)|\.md(?:#.*)?$/;

function walk(dir, keep) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p, keep) : keep(p) ? [p] : [];
  });
}

/** Lines outside fenced blocks, with inline code blanked. */
function prose(text) {
  const out = [];
  let fence = null;
  text.split('\n').forEach((line, i) => {
    const mark = line.match(/^\s*(`{3,}|~{3,})/);
    if (fence) {
      if (mark && mark[1][0] === fence[0] && mark[1].length >= fence.length && line.trim() === mark[1]) fence = null;
      return;
    }
    if (mark) { fence = mark[1]; return; }
    out.push({n: i + 1, text: line.replace(/(`+)[^`]*?\1/g, '')});
  });
  return out;
}

export function checkMarkdown(file, md) {
  const errors = [];
  if (md.split('\n')[0] !== INDEX_LINE) errors.push(`${file}: first line is not the index line`);
  for (const {n, text} of prose(md)) {
    if (/^\s*import\s.+\sfrom\s/.test(text)) errors.push(`${file}:${n}: import left in the Markdown`);
    for (const m of text.matchAll(/<\/?([A-Za-z][A-Za-z0-9.]*)/g)) {
      if (!['table', 'thead', 'tbody', 'tr', 'th', 'td', 'br'].includes(m[1])) errors.push(`${file}:${n}: tag <${m[1]}> left in the Markdown`);
    }
    if (/className=|\{[^}]*\}/.test(text)) errors.push(`${file}:${n}: JSX expression or attribute left in the Markdown`);
  }
  return errors;
}

export function checkSourceLinks(file, mdx) {
  const errors = [];
  for (const {n, text} of prose(mdx)) {
    for (const m of text.matchAll(/\]\((\/[^)\s]*)\)|\b(?:href|to)=["'](\/[^"']*)["']/g)) {
      const target = m[1] ?? m[2];
      if (NON_ROUTE.test(target)) errors.push(`${file}:${n}: link to the file ${target} must be written pathname://${target}`);
    }
  }
  return errors;
}

function checkBuild(root) {
  const build = path.join(root, 'build');
  const indexFile = path.join(build, 'llms.txt');
  if (!fs.existsSync(indexFile)) return {errors: ['build/llms.txt is missing (run pnpm build)'], count: 0};
  const errors = [];
  const index = fs.readFileSync(indexFile, 'utf8');
  const listed = [...index.matchAll(/\]\((https:\/\/developer\.1platform\.pro(\/docs\/[^)\s]+\.md))\)/g)].map((m) => m[2]);
  const unique = [...new Set(listed)];
  if (unique.length < MIN_PAGES) errors.push(`llms.txt lists ${unique.length} pages, fewer than the floor of ${MIN_PAGES}`);
  const full = fs.existsSync(path.join(build, 'llms-full.txt')) ? fs.readFileSync(path.join(build, 'llms-full.txt'), 'utf8') : '';
  if (!full) errors.push('build/llms-full.txt is missing');
  for (const route of unique) {
    const file = path.join(build, route);
    if (!fs.existsSync(file)) { errors.push(`${route} is listed and missing`); continue; }
    const page = route.replace(/\.md$/, '');
    if (!fs.existsSync(path.join(build, page, 'index.html')) && !fs.existsSync(path.join(build, `${page}.html`))) {
      errors.push(`${route} has no HTML page at its permalink (path came from a file name?)`);
    }
    errors.push(...checkMarkdown(route, fs.readFileSync(file, 'utf8')));
    if (full && !full.includes(`<!-- ${ORIGIN}${route} -->`)) errors.push(`${route} is missing from llms-full.txt`);
  }
  const written = walk(path.join(build, 'docs'), (p) => p.endsWith('.md')).length;
  if (written !== unique.length) errors.push(`build has ${written} .md pages and llms.txt lists ${unique.length}`);
  return {errors, count: unique.length};
}

function checkSources(root) {
  const errors = [];
  for (const file of walk(path.join(root, 'docs'), (p) => /\.mdx?$/.test(p))) {
    errors.push(...checkSourceLinks(path.relative(root, file), fs.readFileSync(file, 'utf8')));
  }
  return errors;
}

function selfTest() {
  const cases = [
    ['raw link to llms.txt', () => checkSourceLinks('x.mdx', 'Vea [el índice](/llms.txt).').length === 1],
    ['raw link to a .md page', () => checkSourceLinks('x.mdx', 'En [Markdown](/docs/a/b.md#h).').length === 1],
    ['raw href to /mcp/', () => checkSourceLinks('x.mdx', '<a href="/mcp/cursor.json">x</a>').length === 1],
    ['pathname:/// passes', () => checkSourceLinks('x.mdx', '[x](pathname:///llms.txt) [y](pathname:///mcp/vscode.json)').length === 0],
    ['a route passes', () => checkSourceLinks('x.mdx', '[x](/docs/saas/1platform-api/inicio-rapido)').length === 0],
    ['a fenced example passes', () => checkSourceLinks('x.mdx', '```bash\ncurl [x](/llms.txt)\n```').length === 0],
    ['missing index line', () => checkMarkdown('a.md', '# T\n').length === 1],
    ['JSX left over', () => checkMarkdown('a.md', `${INDEX_LINE}\n\n<Foo />\n`).length === 1],
    ['import left over', () => checkMarkdown('a.md', `${INDEX_LINE}\n\nimport X from 'y';\n`).length === 1],
    ['className left over', () => checkMarkdown('a.md', `${INDEX_LINE}\n\n<table className="x">\n`).length === 1],
    ['clean page passes', () => checkMarkdown('a.md', `${INDEX_LINE}\n\n# T\n\n| a | b<br>c |\n\n\`\`\`jsx\n<Foo />\n\`\`\`\n`).length === 0],
    ['a build page without HTML at its permalink fails', () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-docs-'));
      const pages = Array.from({length: MIN_PAGES}, (_, i) => `/docs/p${i}.md`);
      fs.mkdirSync(path.join(dir, 'build/docs'), {recursive: true});
      fs.writeFileSync(path.join(dir, 'build/llms.txt'), pages.map((p) => `- [x](${ORIGIN}${p})`).join('\n'));
      fs.writeFileSync(path.join(dir, 'build/llms-full.txt'), pages.map((p) => `<!-- ${ORIGIN}${p} -->`).join('\n'));
      for (const p of pages) {
        fs.writeFileSync(path.join(dir, 'build', p), `${INDEX_LINE}\n\n# x\n`);
        if (p !== '/docs/p0.md') fs.mkdirSync(path.join(dir, 'build', p.replace(/\.md$/, '')), {recursive: true}), fs.writeFileSync(path.join(dir, 'build', p.replace(/\.md$/, ''), 'index.html'), '');
      }
      const {errors} = checkBuild(dir);
      fs.rmSync(dir, {recursive: true, force: true});
      return errors.length === 1 && errors[0].includes('/docs/p0.md has no HTML page');
    }],
  ];
  let failed = 0;
  for (const [name, run] of cases) {
    const ok = run();
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  }
  if (failed) process.exit(1);
  console.log(`check-agent-docs self-test: ${cases.length} cases`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const {errors = [], count = 0} = checkBuild(ROOT);
  const all = [...errors, ...checkSources(ROOT)];
  if (all.length) {
    for (const e of all) console.error(e);
    process.exit(1);
  }
  console.log(`check-agent-docs: ${count} Markdown pages, index, full file and MDX links ok`);
}
