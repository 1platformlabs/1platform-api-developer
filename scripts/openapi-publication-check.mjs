import assert from 'node:assert/strict';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {isDeepStrictEqual} from 'node:util';

const root = new URL('../', import.meta.url);
const servicePaths = JSON.parse(readFileSync(new URL('./fixtures/service-example-paths.json', import.meta.url), 'utf8'));
const SERVICE_MARKER = 'SERVICE_API_KEY_EXAMPLE';
const valueAt = (spec, path) => path.reduce((value, key) => value?.[key], spec);

export function checkServiceExamples(spec) {
  // Sanitized APP markers cannot be classified again. Pin the documented
  // service examples themselves so a stale cache cannot pass an idempotency check.
  assert.equal(servicePaths.length, 12);
  for (const path of servicePaths) {
    assert.ok(valueAt(spec, path)?.includes(SERVICE_MARKER), `Service example marker missing at ${path.join('/')}; values withheld`);
  }
}

export function checkOpenApiPublication() {
  const fixtures = Object.fromEntries(['1platform-api', 'atlas-api'].map((id) => [
    id, JSON.parse(readFileSync(new URL(`static/openapi/${id}.json`, root), 'utf8')),
  ]));
  const core = fixtures['1platform-api'];
  checkServiceExamples(core);
  const stale = structuredClone(core);
  const first = servicePaths[0];
  valueAt(stale, first.slice(0, -1))[first.at(-1)] = 'APP_API_KEY_EXAMPLE';
  assert.throws(() => checkServiceExamples(stale), /Service example marker missing/);

  const source = structuredClone(fixtures);
  for (const path of servicePaths) {
    const parent = valueAt(source['1platform-api'], path.slice(0, -1));
    parent[path.at(-1)] = parent[path.at(-1)].replaceAll(SERVICE_MARKER, 'ak-svc-...');
  }
  const work = mkdtempSync(join(tmpdir(), 'openapi-publication-'));
  try {
    const scripts = join(work, 'scripts');
    mkdirSync(scripts);
    for (const name of ['fetch-openapi.mjs', 'openapi-examples.mjs', 'openapi-auth-descriptions.mjs']) {
      copyFileSync(new URL(name, import.meta.url), join(scripts, name));
    }
    writeFileSync(join(work, 'source.json'), JSON.stringify(source));
    // Exercise the actual fetch → transform → write entrypoint with synthetic
    // responses and no network. There is no preexisting cache to fall back to.
    const loader = join(work, 'fixture-fetch.mjs');
    writeFileSync(loader, `
      import assert from 'node:assert/strict';
      import {readFileSync} from 'node:fs';
      const sources = JSON.parse(readFileSync(new URL('./source.json', import.meta.url), 'utf8'));
      globalThis.fetch = async (url) => {
        const target = new URL(url);
        assert.equal(target.origin, 'https://fixture.invalid');
        const spec = sources[target.pathname.slice(1)];
        assert.ok(spec, 'Unexpected fixture request');
        return new Response(JSON.stringify(spec));
      };
    `);
    const result = spawnSync(process.execPath, ['--import', loader, join(scripts, 'fetch-openapi.mjs')], {
      env: {ONEP_API_OPENAPI_URL: 'https://fixture.invalid/1platform-api', ATLAS_API_OPENAPI_URL: 'https://fixture.invalid/atlas-api'},
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, 'Offline publication process must complete without cache fallback');
    for (const [id, expected] of Object.entries(fixtures)) {
      const actual = JSON.parse(readFileSync(join(work, 'static', 'openapi', `${id}.json`), 'utf8'));
      assert.ok(isDeepStrictEqual(actual, expected), `${id}: fetched fixture and generated cache differ; values withheld`);
    }
  } finally {
    rmSync(work, {recursive: true, force: true});
  }
  console.log('ok   12 service examples and offline fetch → generated-cache consistency');
}
