#!/usr/bin/env node
/**
 * check-chrome-contrast.mjs — the AA arithmetic behind the shared editorial
 * chrome. Every text/surface pair the floating rail and footer draw must clear
 * WCAG AA, pinned to the exact tokens in src/css/custom.css.
 *
 * Mirrors the site's tests/contrast.spec.ts; this portal has no test runner,
 * so it is a plain Node script wired into CI next to the design guard.
 * Self-test: --self-test proves it goes red on a failing pair.
 */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/css/custom.css', import.meta.url), 'utf8');

function tokenValue(name) {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`token ${name} not found in custom.css`);
  return m[1];
}

function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const PAIRS = [
  ['--ink', '--surface', 4.5, 'navigation text on the floating rail'],
  ['--cobalt', '--surface', 4.5, 'navigation link on the floating rail'],
  ['--surface', '--cobalt', 4.5, 'CTA text on cobalt'],
  ['--ink', '--cobalt-bright', 4.5, 'footer CTA text on bright cobalt'],
  ['--color-footer-muted', '--color-footer', 4.5, 'footer secondary text'],
  ['--color-footer-text', '--color-footer', 4.5, 'footer primary text'],
];

if (process.argv.includes('--self-test')) {
  // The instrument must be able to report red: a pair known to fail AA.
  const bad = ratio(tokenValue('--cobalt-bright'), tokenValue('--surface'));
  if (bad >= 4.5) {
    console.error(`self-test: expected a failing pair, got ${bad.toFixed(2)} — the math went quiet`);
    process.exit(1);
  }
  console.log('self-test ok: the checker can report a failure');
  process.exit(0);
}

let failed = false;
for (const [fg, bg, min, why] of PAIRS) {
  const r = ratio(tokenValue(fg), tokenValue(bg));
  const ok = r >= min;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${fg} on ${bg} = ${r.toFixed(2)} (${why})`);
}
process.exit(failed ? 1 : 0);
