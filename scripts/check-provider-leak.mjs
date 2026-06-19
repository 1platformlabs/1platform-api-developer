#!/usr/bin/env node

// ─── check-provider-leak.mjs ────────────────────────────────────────────────
// Compliance gate (DDR / G7): per-tenant product docs (client-facing, Group A)
// must NEVER name an external provider. Scans docs/products/** and its Spanish
// translations and fails the build if a banned vendor token appears.
//
// SaaS docs (docs/saas/**) are intentionally NOT scanned: provider names may
// appear there where technically necessary (e.g. TribuTax in invoicing).
//
// Usage: node scripts/check-provider-leak.mjs   (exit 1 on any leak)
// ─────────────────────────────────────────────────────────────────────────────

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '..', '..');

// Directories that are client-facing (Group A — per tenant).
const SCAN_DIRS = [
  'docs/products',
  'i18n/es/docusaurus-plugin-content-docs/current/products',
];

// Banned vendor tokens. Word-boundary, case-insensitive. "App Store" / "Google
// Play" are public store names and allowed, so "google" alone is NOT banned here
// (it would over-match "Google Play"); analytics vendor leakage is covered by the
// abstract-capability wording rule, checked in review.
const VENDORS = [
  'openai', 'anthropic', 'migo', 'tributax', 'pixabay', 'pexels',
  'valueserp', 'publisuites', 'nicho\\.ai', 'stripe', 'resend',
  'hetzner', 'mongodb', 'bowerbird', 'valkey',
];
const RE = new RegExp(`\\b(${VENDORS.join('|')})\\b`, 'i');

function walk(dir, acc) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(mdx?|json)$/.test(name)) acc.push(p);
  }
  return acc;
}

const leaks = [];
for (const d of SCAN_DIRS) {
  for (const file of walk(resolve(root, d), [])) {
    const lines = readFileSync(file, 'utf-8').split('\n');
    lines.forEach((line, i) => {
      const m = line.match(RE);
      if (m) leaks.push(`${relative(root, file)}:${i + 1}  →  "${m[1]}"`);
    });
  }
}

if (leaks.length) {
  console.error(`✗ provider-leak: ${leaks.length} client-facing vendor mention(s):`);
  leaks.forEach((l) => console.error('  ' + l));
  console.error('\nGroup A (per-tenant) docs must present capabilities as native features. Remove the vendor name.');
  process.exit(1);
}
console.log('✓ provider-leak: no client-facing vendor mentions in Group A docs.');
