#!/usr/bin/env node

// ─── fetch-openapi.mjs ──────────────────────────────────────────────────────
// Downloads the OpenAPI spec from OPENAPI_PUBLIC_URL and saves it to
// static/openapi.json so it can be served as a static asset at /openapi.json.
//
// Usage:
//   node scripts/fetch-openapi.mjs              (uses default URL)
//   OPENAPI_URL=https://... node scripts/fetch-openapi.mjs  (override URL)
//
// Called automatically via the "prebuild" npm script.
// Uses only Node.js built-ins (no extra dependencies).
// ─────────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const OPENAPI_URL =
  process.env.OPENAPI_URL ||
  'https://api-qa.1platform.pro/openapi.json';

const OUTPUT_PATH = resolve(__dirname, '..', 'static', 'openapi.json');

async function main() {
  console.log(`Fetching OpenAPI spec from: ${OPENAPI_URL}`);

  const response = await fetch(OPENAPI_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch OpenAPI spec: ${response.status} ${response.statusText}`
    );
  }

  const spec = await response.text();

  // Validate and enrich the spec
  const json = JSON.parse(spec);

  // Inject servers so Scalar shows the correct API hosts
  json.servers = [
    { url: 'https://api.1platform.pro', description: 'Production' },
    { url: 'https://api-qa.1platform.pro', description: 'QA' },
  ];

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(json, null, 2), 'utf-8');

  console.log(`OpenAPI spec saved to: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(`[fetch-openapi] ${err.message}`);
  process.exit(1);
});
