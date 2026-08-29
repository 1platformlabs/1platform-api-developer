#!/usr/bin/env node
/**
 * check-chrome-contrast.mjs — the AA arithmetic behind the ported chrome
 * (site epic home-landing-redesign, LMW-12 CA-7): every text/surface pair the
 * navbar, the panel and the footer draw with the `--ref-*` tokens must clear
 * WCAG AA, pinned to the exact hexes in src/css/custom.css.
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
  ['--ref-white', '--ref-orange-cta', 4.5, 'CTA text on the AA orange'],
  ['--ref-ink', '--ref-yellow', 4.5, 'ink on the yellow sign-in'],
  ['--ref-white', '--ref-pill', 4.5, 'brand and toggle on the pill'],
  ['--ref-fg-dim', '--ref-pill', 4.5, 'dim items in the panel'],
  ['--ref-fg-dim', '--ref-card-dark', 4.5, 'footer links on the card'],
  ['--ref-white', '--ref-dark', 4.5, 'light text on the footer band'],
];

if (process.argv.includes('--self-test')) {
  // The instrument must be able to report red: a pair known to fail AA.
  const bad = ratio(tokenValue('--ref-fg-dim'), tokenValue('--ref-white'));
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
