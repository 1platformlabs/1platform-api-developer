#!/usr/bin/env node

// ─── fetch-openapi.mjs ──────────────────────────────────────────────────────
// Downloads the OpenAPI spec(s) for every SaaS product documented in this portal
// and saves each to static/openapi/<id>.json so Scalar can serve them as static
// assets (avoids CORS at runtime).
//
// Multi-spec: one entry per SaaS API (1Platform API + Atlas API). Each entry's
// production URL can be overridden via its env var. A spec that fails to download
// falls back to the cached copy in static/openapi/<id>.json (with a WARN); if no
// cache exists the build aborts with a clear message (no silently-broken Scalar).
//
// Usage:
//   node scripts/fetch-openapi.mjs
//   ONEP_API_OPENAPI_URL=https://... ATLAS_API_OPENAPI_URL=https://... node scripts/fetch-openapi.mjs
//
// Uses only Node.js built-ins (no extra dependencies).
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', 'static', 'openapi');

// One entry per documented SaaS API. `servers` is injected into the spec so
// Scalar shows the correct hosts. For Atlas the endpoint paths already include
// /api/v1, so the server is the bare domain.
const SPECS = [
  {
    id: '1platform-api',
    url: process.env.ONEP_API_OPENAPI_URL || 'https://api.1platform.pro/openapi.json',
    servers: [
      { url: 'https://api.1platform.pro', description: 'Production' },
      { url: 'https://api-qa.1platform.pro', description: 'QA' },
    ],
  },
  {
    id: 'atlas-api',
    // openapi_url="/openapi.json" is served at the app root (main.py:102);
    // endpoint paths inside the spec are under /api/v1.
    url: process.env.ATLAS_API_OPENAPI_URL || 'https://atlas-api.1platform.pro/openapi.json',
    servers: [
      { url: 'https://atlas-api.1platform.pro', description: 'Production' },
      { url: 'https://atlas-api-qa.1platform.pro', description: 'QA' },
    ],
  },
];

async function fetchOne(spec) {
  const outPath = resolve(OUTPUT_DIR, `${spec.id}.json`);
  console.log(`[${spec.id}] fetching ${spec.url}`);
  try {
    const response = await fetch(spec.url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const json = JSON.parse(await response.text());
    json.servers = spec.servers;
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf-8');
    console.log(`[${spec.id}] saved → ${outPath}`);
  } catch (err) {
    if (existsSync(outPath)) {
      console.warn(
        `[${spec.id}] WARN: fetch failed (${err.message}); using cached ${outPath} (may be stale)`,
      );
      return;
    }
    throw new Error(
      `[${spec.id}] fetch failed (${err.message}) and no cached spec at ${outPath}. ` +
        `Set ${spec.id === 'atlas-api' ? 'ATLAS_API_OPENAPI_URL' : 'ONEP_API_OPENAPI_URL'} ` +
        `or commit a cached spec before building.`,
    );
  }
}

async function main() {
  for (const spec of SPECS) {
    await fetchOne(spec);
  }
  console.log(`Done. ${SPECS.length} spec(s) processed.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
