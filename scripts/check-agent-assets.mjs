#!/usr/bin/env node
/**
 * Truthfulness gate for what agents copy (épica infraestructura-para-agentes-ia,
 * D-5). `check:contract` reads docs/**\/*.mdx only, so nothing else watched
 * `static/prompts/`, `static/skills/` or `static/mcp/` — the files an agent is
 * told to obey literally. This one does:
 *
 *  - every `METHOD /path` cited exists in static/openapi/1platform-api.json with
 *    that method (a path without `/api/v1` is read as relative to it);
 *  - every backticked operationId-looking name (`listBusinessesForUser`) exists;
 *  - no provider name of the ecosystem rule;
 *  - no credential-looking value: keys are written `ak-XXXX…`, never anything a
 *    secret scanner would flag or a reader could mistake for a real key;
 *  - skills: `index.json` lists exactly the folders present, and every SKILL.md
 *    carries `name` (= its folder) and `description` matching the index;
 *  - every /mcp/*.json parses.
 *
 *   node scripts/check-agent-assets.mjs              # the real tree
 *   node scripts/check-agent-assets.mjs --self-test  # seeded cases, both directions
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = path.join(ROOT, 'static/openapi/1platform-api.json');
const SURFACES = ['static/prompts', 'static/skills', 'static/mcp'];
const METHODS = 'GET|POST|PUT|PATCH|DELETE';
const OPERATION_VERBS = /^(get|list|create|cancel|update|delete|generate|retry|refund|dispatch|send|verify|revoke|patch|set|search)[A-Z][A-Za-z0-9]*$/;
// The ecosystem's provider rule (root CLAUDE.md). Bounded so that Spanish words
// that merely contain one ("amigo", "nicho de mercado") are not findings.
const PROVIDERS = /(?<![\w-])(openai|anthropic|migo|tributax|pixabay|pexels|valueserp|publisuites|nicho\.ai|stripe|resend|hetzner|mongodb atlas)(?![\w-])/i;
const KEY_LIKE = /(?<![\w-])(?:ak|sk)-(?!X{2,})[A-Za-z0-9_-]{6,}/;
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{10,}/;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

export function loadContract(specFile) {
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const operations = [];
  const ids = new Set();
  for (const [p, ops] of Object.entries(spec.paths ?? {})) {
    for (const [method, op] of Object.entries(ops)) {
      if (!op || typeof op !== 'object' || !op.operationId) continue;
      operations.push({method: method.toUpperCase(), segments: p.replace(/\/$/, '').split('/')});
      ids.add(op.operationId);
    }
  }
  return {operations, ids};
}

function isPlaceholder(segment) {
  return /^\{[^}]+\}$/.test(segment) || /^\$[A-Z_]+$/.test(segment) || /^<[^>]+>$/.test(segment) || /^:[a-z_]+$/i.test(segment);
}

export function operationExists(contract, method, rawPath) {
  let p = rawPath.split(/[?#]/)[0];
  while (p.length && '.,:;)/'.includes(p.at(-1))) p = p.slice(0, -1);
  if (!p.startsWith('/api/v1/')) p = `/api/v1${p}`;
  const segments = p.split('/');
  return contract.operations.some((op) => op.method === method && op.segments.length === segments.length
    && op.segments.every((s, i) => s === segments[i] || (/^\{[^}]+\}$/.test(s) && (isPlaceholder(segments[i]) || /^[\w-]+$/.test(segments[i])))));
}

export function checkText(file, text, contract) {
  const errors = [];
  text.split('\n').forEach((line, i) => {
    const at = `${file}:${i + 1}`;
    for (const m of line.matchAll(new RegExp(`\\b(${METHODS}) (/[A-Za-z][^\\s\`'"<>]*)`, 'g'))) {
      if (!operationExists(contract, m[1], m[2])) errors.push(`${at}: ${m[1]} ${m[2]} is not in the OpenAPI`);
    }
    for (const m of line.matchAll(/`([A-Za-z][A-Za-z0-9]*)`/g)) {
      if (OPERATION_VERBS.test(m[1]) && !contract.ids.has(m[1])) errors.push(`${at}: operationId ${m[1]} is not in the OpenAPI`);
    }
    const provider = line.match(PROVIDERS);
    if (provider) errors.push(`${at}: provider name "${provider[1]}" (ecosystem rule)`);
    if (KEY_LIKE.test(line)) errors.push(`${at}: credential-looking value; write keys as ak-XXXX…`);
    if (JWT_LIKE.test(line)) errors.push(`${at}: token-looking value`);
  });
  return errors;
}

function frontMatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const out = {};
  for (const line of text.slice(4, end).split('\n')) {
    const kv = line.match(/^([a-z_-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

export function checkSkills(dir) {
  const errors = [];
  if (!fs.existsSync(dir)) return errors;
  const folders = fs.readdirSync(dir, {withFileTypes: true}).filter((e) => e.isDirectory()).map((e) => e.name).sort((a, b) => a.localeCompare(b));
  const indexFile = path.join(dir, 'index.json');
  if (!fs.existsSync(indexFile)) return [`${dir}/index.json is missing`];
  let index;
  try { index = JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch (e) { return [`skills/index.json does not parse: ${e.message}`]; }
  const entries = Array.isArray(index) ? index : index.skills;
  if (!Array.isArray(entries)) return ['skills/index.json has no list of skills'];
  const listed = entries.map((e) => e.name).sort((a, b) => a.localeCompare(b));
  if (JSON.stringify(listed) !== JSON.stringify(folders)) errors.push(`skills/index.json lists [${listed}] and the folders are [${folders}]`);
  for (const name of folders) errors.push(...checkSkill(dir, name, entries.find((e) => e.name === name)));
  return errors;
}

function checkSkill(dir, name, entry) {
  const file = path.join(dir, name, 'SKILL.md');
  if (!fs.existsSync(file)) return [`skills/${name}/SKILL.md is missing`];
  const fm = frontMatter(fs.readFileSync(file, 'utf8'));
  if (!fm?.name || !fm?.description) return [`skills/${name}/SKILL.md needs front matter name and description`];
  const errors = [];
  if (fm.name !== name) errors.push(`skills/${name}/SKILL.md declares name ${fm.name}`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fm.name)) errors.push(`skills/${name}: name must be lowercase-hyphenated`);
  if (entry?.description !== undefined && entry.description !== fm.description) errors.push(`skills/${name}: index.json description differs from SKILL.md`);
  if (entry && entry.path !== `/skills/${name}/SKILL.md`) errors.push(`skills/${name}: index.json path must be /skills/${name}/SKILL.md`);
  return errors;
}

export function checkTree(root, contract) {
  const errors = [];
  let files = 0;
  for (const surface of SURFACES) {
    for (const file of walk(path.join(root, surface))) {
      const rel = path.relative(root, file);
      const text = fs.readFileSync(file, 'utf8');
      files += 1;
      if (file.endsWith('.json')) {
        try { JSON.parse(text); } catch (e) { errors.push(`${rel}: does not parse (${e.message})`); }
      }
      errors.push(...checkText(rel, text, contract));
    }
  }
  errors.push(...checkSkills(path.join(root, 'static/skills')));
  return {errors, files};
}

function selfTest() {
  const contract = loadContract(SPEC);
  const make = (files) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-assets-'));
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), {recursive: true});
      fs.writeFileSync(path.join(dir, rel), text);
    }
    return dir;
  };
  const skill = (name, description = 'Receta de prueba.') => `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`;
  const index = (...names) => JSON.stringify({skills: names.map((n) => ({name: n, description: 'Receta de prueba.', path: `/skills/${n}/SKILL.md`}))});
  const fails = (files, needle) => {
    const dir = make(files);
    const {errors} = checkTree(dir, contract);
    fs.rmSync(dir, {recursive: true, force: true});
    return errors.some((e) => e.includes(needle));
  };
  const passes = (files) => {
    const dir = make(files);
    const {errors} = checkTree(dir, contract);
    fs.rmSync(dir, {recursive: true, force: true});
    if (errors.length) console.error(errors);
    return errors.length === 0;
  };
  const cases = [
    ['invented endpoint in a prompt', () => fails({'static/prompts/x.md': 'Llame a `POST /api/v1/no-existe`.'}, 'POST /api/v1/no-existe')],
    ['invented endpoint in an MCP file', () => fails({'static/mcp/x.json': '{"note": "GET /api/v1/no-existe"}'}, 'GET /api/v1/no-existe')],
    ['right path, wrong method', () => fails({'static/prompts/x.md': '`DELETE /api/v1/auth/token`'}, 'DELETE /api/v1/auth/token')],
    ['invented operationId', () => fails({'static/prompts/x.md': 'Use `listEverything`.'}, 'operationId listEverything')],
    ['provider name', () => fails({'static/prompts/x.md': 'Cobra con Stripe.'}, 'provider name')],
    // Built at runtime so the repository never holds a key-shaped literal.
    ['real-looking key', () => fails({'static/prompts/x.md': `apiKey=${['ak', 'a1b2c3d4e5f6'].join('-')}`}, 'credential-looking')],
    ['token-looking value', () => fails({'static/prompts/x.md': 'eyJhbGciOiJIUzI1NiJ9.x'}, 'token-looking')],
    ['skill folder not in the index', () => fails({'static/skills/index.json': index('a'), 'static/skills/a/SKILL.md': skill('a'), 'static/skills/b/SKILL.md': skill('b')}, 'lists [a]')],
    ['skill without description', () => fails({'static/skills/index.json': index('a'), 'static/skills/a/SKILL.md': '---\nname: a\n---\n'}, 'needs front matter')],
    ['skill name differs from its folder', () => fails({'static/skills/index.json': index('a'), 'static/skills/a/SKILL.md': skill('b')}, 'declares name b')],
    ['index description differs', () => fails({'static/skills/index.json': index('a'), 'static/skills/a/SKILL.md': skill('a', 'Otra.')}, 'description differs')],
    ['MCP file that does not parse', () => fails({'static/mcp/x.json': '{"a": '}, 'does not parse')],
    ['real contract, placeholders and Spanish words pass', () => passes({
      'static/prompts/x.md': 'Canjee con `POST /api/v1/auth/token`, luego `GET /businesses/{businessId}/payment-links/$LINK_ID` y `listBusinessesForUser`. Un amigo en su nicho de mercado. Clave `ak-XXXX…`, `sk-XXXX…`. El `businessId` y `getUserProfile`.',
      'static/skills/index.json': index('a'),
      'static/skills/a/SKILL.md': skill('a'),
      'static/mcp/x.json': '{"mcpServers": {"x": {"env": {"ONEPLATFORM_APP_KEY": "ak-XXXX…"}}}}',
    })],
  ];
  let failed = 0;
  for (const [name, run] of cases) {
    const ok = run();
    if (!ok) failed += 1;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  }
  if (failed) process.exit(1);
  console.log(`check-agent-assets self-test: ${cases.length} cases`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else {
  const {errors, files} = checkTree(ROOT, loadContract(SPEC));
  if (files === 0) {
    console.error('check-agent-assets: scanned zero files — the gate would pass on nothing');
    process.exit(1);
  }
  if (errors.length) {
    for (const e of errors) console.error(e);
    process.exit(1);
  }
  console.log(`check-agent-assets: ${files} files in ${SURFACES.join(', ')} agree with the OpenAPI`);
}
