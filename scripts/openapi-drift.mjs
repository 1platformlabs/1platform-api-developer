#!/usr/bin/env node

// ─── openapi-drift.mjs ──────────────────────────────────────────────────────
// Compara las especificaciones VERSIONADAS (las que el portal sirve, porque
// producción construye desde el árbol de git) contra las recién bajadas del API
// en vivo, y escribe un informe en markdown.
//
//   node scripts/openapi-drift.mjs <dir-versionado> <dir-en-vivo> [informe.md]
//   node scripts/openapi-drift.mjs --self-test
//
// Salida: 0 = sin deriva · 10 = hay deriva (informe escrito) · 1 = error.
// Un archivo que falta o no parsea es ERROR, nunca «sin deriva»: un detector
// que no pudo medir no puede declarar que todo está bien.
//
// Por qué existe: el aviso `repository_dispatch` del Core dependía de un token
// personal que venció en silencio (1platform-api#600) y, aun funcionando, no
// refrescaba nada — el pipeline de PROD sirve la especificación VERSIONADA. Este
// detector corre por `schedule` desde este repo, sin credenciales externas.
//
// Sólo built-ins de Node.
// ─────────────────────────────────────────────────────────────────────────────

import assert from 'node:assert/strict';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

export const SPEC_IDS = ['1platform-api', 'atlas-api'];
const MAX_LISTED = 40;
const METHODS = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace'];

function readSpec(dir, id) {
  const path = join(dir, `${id}.json`);
  if (!existsSync(path)) throw new Error(`falta ${path}`);
  const spec = JSON.parse(readFileSync(path, 'utf-8'));
  if (!spec || typeof spec !== 'object' || !spec.paths || !Object.keys(spec.paths).length) {
    throw new Error(`${path} no es una especificación OpenAPI con rutas`);
  }
  return spec;
}

function operations(spec) {
  const ops = new Map();
  for (const [route, item] of Object.entries(spec.paths)) {
    for (const method of METHODS) {
      if (item && item[method]) ops.set(`${method.toUpperCase()} ${route}`, JSON.stringify(item[method]));
    }
  }
  return ops;
}

// Los nombres de ruta vienen de un documento remoto: se citan sin comillas
// invertidas para que no rompan el bloque de código del informe.
const quote = (text) => '`' + String(text).replaceAll('`', "'") + '`';

const byName = (a, b) => a.localeCompare(b);

export function compareSpec(id, committed, live) {
  const same = JSON.stringify(committed) === JSON.stringify(live);
  const before = operations(committed);
  const after = operations(live);
  const added = [...after.keys()].filter((op) => !before.has(op)).sort(byName);
  const removed = [...before.keys()].filter((op) => !after.has(op)).sort(byName);
  const changed = [...after.keys()].filter((op) => before.has(op) && before.get(op) !== after.get(op)).sort(byName);
  return {
    id,
    drift: !same,
    committedVersion: committed.info?.version ?? '?',
    liveVersion: live.info?.version ?? '?',
    committedOps: before.size,
    liveOps: after.size,
    added,
    removed,
    changed,
    // Cambios fuera de las operaciones (esquemas, info, tags…): `drift` sin
    // altas/bajas/cambios de operación, como el `contentMediaType` de FastAPI
    // 0.133 en los `Body_*` de subida.
    otherOnly: !same && !added.length && !removed.length && !changed.length,
  };
}

function list(title, items) {
  if (!items.length) return [];
  const shown = items.slice(0, MAX_LISTED).map((op) => `- ${quote(op)}`);
  if (items.length > MAX_LISTED) shown.push(`- … y ${items.length - MAX_LISTED} más`);
  return [`**${title} (${items.length})**`, '', ...shown, ''];
}

export function renderReport(results) {
  const lines = [];
  for (const r of results) {
    lines.push(`### ${quote(r.id)} — ${r.drift ? 'atrasada' : 'al día'}`, '');
    lines.push('| | Versionada (la que sirve el portal) | API en vivo |', '|---|---|---|');
    lines.push(`| \`info.version\` | ${quote(r.committedVersion)} | ${quote(r.liveVersion)} |`);
    lines.push(`| Operaciones | ${r.committedOps} | ${r.liveOps} |`, '');
    if (r.drift) {
      lines.push(...list('Operaciones nuevas', r.added));
      lines.push(...list('Operaciones que ya no existen', r.removed));
      lines.push(...list('Operaciones que cambiaron', r.changed));
      if (r.otherOnly) lines.push('Cambian sólo esquemas, metadatos o etiquetas (ninguna operación).', '');
    }
  }
  return lines.join('\n');
}

export function versionsKey(results) {
  return results.map((r) => `${r.id}=${r.liveVersion}`).join(',');
}

function selfTest() {
  const base = {openapi: '3.1.0', info: {version: 'v1'}, paths: {'/a': {get: {operationId: 'a'}}, '/b': {post: {operationId: 'b'}}}};
  const same = compareSpec('x', base, structuredClone(base));
  assert.equal(same.drift, false);
  assert.equal(renderReport([same]).includes('al día'), true);

  const live = structuredClone(base);
  live.info.version = 'v2';
  delete live.paths['/b'];
  live.paths['/c`x'] = {get: {operationId: 'c'}};
  live.paths['/a'].get.summary = 'cambió';
  const r = compareSpec('x', base, live);
  assert.equal(r.drift, true);
  assert.deepEqual(r.added, ['GET /c`x']);
  assert.deepEqual(r.removed, ['POST /b']);
  assert.deepEqual(r.changed, ['GET /a']);
  const md = renderReport([r]);
  assert.match(md, /`GET \/c'x`/, 'una comilla invertida remota no puede cerrar el código del informe');
  assert.equal(versionsKey([r]), 'x=v2');

  // Deriva fuera de las operaciones: el caso real de PRODv5.94.1.
  const schemaOnly = structuredClone(base);
  schemaOnly.components = {schemas: {Body: {contentMediaType: 'application/octet-stream'}}};
  const s = compareSpec('x', base, schemaOnly);
  assert.equal(s.drift, true);
  assert.equal(s.otherOnly, true);

  // Lo que no se pudo medir es error, nunca «sin deriva».
  assert.throws(() => readSpec('/ruta/que/no/existe', 'x'));
  console.log('openapi-drift self-test: OK');
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const [committedDir, liveDir, reportPath] = argv;
  if (!committedDir || !liveDir) {
    console.error('uso: openapi-drift.mjs <dir-versionado> <dir-en-vivo> [informe.md]');
    process.exit(1);
  }
  const results = SPEC_IDS.map((id) => compareSpec(id, readSpec(committedDir, id), readSpec(liveDir, id)));
  const report = renderReport(results);
  if (reportPath) writeFileSync(reportPath, report + '\n', 'utf-8');
  console.log(report);
  const drift = results.some((r) => r.drift);
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `drift=${drift}\nversions=${versionsKey(results)}\n`, {flag: 'a'});
  }
  process.exit(drift ? 10 : 0);
}

try {
  main(process.argv.slice(2));
} catch (err) {
  console.error(`openapi-drift: ${err.message}`);
  process.exit(1);
}
