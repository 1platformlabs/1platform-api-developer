#!/usr/bin/env node
/**
 * Every `#tag/<slug>` the docs link to must name a tag that exists in the
 * OpenAPI spec the reference renders.
 *
 * Why this exists instead of `onBrokenAnchors: 'throw'`, which is the obvious
 * answer and was tried first: the API reference is a Scalar plugin that renders
 * CLIENT-SIDE from static/openapi/<id>.json, so its `tag/...` ids do not exist
 * in the HTML Docusaurus inspects at build time. Measured on an untouched tree,
 * turning that flag on reported ALL 21 existing anchors as broken — including
 * ones that demonstrably work on the live site. A gate that cannot tell a good
 * anchor from a bad one is worse than no gate: it fails on everything, so
 * somebody turns it off, and then nothing is checked at all.
 *
 * What CAN be checked statically is the half that actually breaks: the slug is
 * derived from the tag NAME, so a typo, or a tag renamed upstream, silently
 * lands the reader at the top of a very long page. That is what this catches.
 *
 * Runtime resolution — that Scalar really emits `id="tag/<slug>"` — is proved
 * by the rows already live on developer.1platform.pro and belongs to an
 * end-to-end pass, not to a build step.
 *
 *   node scripts/check-api-anchors.mjs [--self-test]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** The slug rule, read off a row that is live and working:
 *  "Link Building & Search Console" -> "link-building-search-console". */
export const slugify = (tag) =>
  tag.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const SPECS = {
  '1platform-api': 'static/openapi/1platform-api.json',
  'atlas-api': 'static/openapi/atlas-api.json',
};

/** Tag names come from the top-level `tags` block AND from the operations.
 *  A spec is not required to declare the former — atlas-api.json does not — and
 *  reading only that one made this check throw on a perfectly good file. */
function tagsOf(spec) {
  const out = new Map();
  for (const t of spec.tags ?? []) out.set(slugify(t.name), t.name);
  for (const ops of Object.values(spec.paths ?? {}))
    for (const op of Object.values(ops))
      for (const name of op?.tags ?? []) out.set(slugify(name), name);
  return out;
}

function docFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...docFiles(full));
    else if (/\.mdx?$/.test(name)) out.push(full);
  }
  return out;
}

function run() {
  const known = {};
  for (const [id, path] of Object.entries(SPECS)) {
    known[id] = tagsOf(JSON.parse(readFileSync(path, 'utf8')));
    if (!known[id].size) throw new Error(`${path} declares no tags — the check would pass vacuously`);
  }

  const bad = [];
  let seen = 0;
  for (const file of docFiles('docs')) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\/api-reference\/([a-z0-9-]+)#tag\/([a-z0-9-]+)/g)) {
      const [, api, slug] = m;
      seen++;
      if (!known[api]) { bad.push(`${file}: unknown API reference "${api}"`); continue; }
      if (!known[api].has(slug)) {
        const near = [...known[api].keys()].filter((k) => k.startsWith(slug.slice(0, 6)));
        bad.push(`${file}: #tag/${slug} matches no tag in ${api}` + (near.length ? ` (did you mean ${near.join(', ')}?)` : ''));
      }
    }
  }

  // Floor. A scanner that stops finding anchors reports "0 broken", which is
  // the same output as a healthy tree.
  if (seen < 15) throw new Error(`only ${seen} anchors found — the scanner stopped matching`);

  return { seen, bad };
}

if (process.argv.includes('--self-test')) {
  // The check has to be shown to fail, or "0 broken" means nothing.
  const cases = [
    ['a real tag resolves', 'deliveries', true],
    ['the control row from the live site', 'link-building-search-console', true],
    ['a typo does not', 'deliverys', false],
    ['a plausible rename does not', 'payment-link', false],
  ];
  const slugs = new Set(tagsOf(JSON.parse(readFileSync(SPECS['1platform-api'], 'utf8'))).keys());
  let failed = 0;
  for (const [name, slug, want] of cases) {
    const got = slugs.has(slug);
    const ok = got === want;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}`);
    if (!ok) failed++;
  }
  // And the slug rule itself, against the row it was derived from.
  const derived = slugify('Link Building & Search Console');
  const ok = derived === 'link-building-search-console';
  console.log(`${ok ? 'ok  ' : 'FAIL'}  the slug rule reproduces the live row (${derived})`);
  if (!ok) failed++;
  process.exit(failed ? 1 : 0);
}

const { seen, bad } = run();
if (bad.length) {
  console.error(`Broken API reference anchors (${bad.length} of ${seen}):`);
  for (const b of bad) console.error('  ' + b);
  process.exit(1);
}
console.log(`All ${seen} API reference anchors name a tag that exists in the spec.`);
