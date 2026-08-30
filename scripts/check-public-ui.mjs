#!/usr/bin/env node
/**
 * check-public-ui.mjs — production contract for the two public entry points.
 *
 * Docusaurus and Scalar own their runtime markup, so source-only checks can miss
 * a broken canonical, lost search input or changed keyboard control. This guard
 * reads the production build and pins those contracts alongside first-party JS
 * and CSS budgets. It intentionally excludes Scalar's existing remote runtime:
 * this change neither adds nor upgrades it, while every asset built by this repo
 * is counted byte for byte.
 */
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BUILD = join(ROOT, 'build');
const JS_DIR = join(BUILD, 'assets', 'js');
const CSS_DIR = join(BUILD, 'assets', 'css');
const SNAPSHOT_DIR = join(ROOT, 'tests', 'visual', 'product-composition');

const BOOT_JS_BUDGET = 180 * 1024;
const TOTAL_JS_BUDGET = 375 * 1024;
const CSS_BUDGET = 25 * 1024;

const SNAPSHOT_REQUIREMENTS = [
  {code: 'SNAPSHOT_DOC_DESKTOP', name: 'docs-desktop-1440.png', width: 1440, height: 1100},
  {code: 'SNAPSHOT_DOC_MOBILE', name: 'docs-mobile-390.png', width: 390, height: 844},
  {code: 'SNAPSHOT_API_DESKTOP', name: 'api-desktop-1440.png', width: 1440, height: 1100},
  {code: 'SNAPSHOT_API_MOBILE', name: 'api-mobile-390.png', width: 390, height: 844},
];

function gzipFiles(directory, predicate) {
  return readdirSync(directory)
    .filter(predicate)
    .reduce((total, name) => total + gzipSync(readFileSync(join(directory, name))).length, 0);
}

function audit({docsHtml, apiHtml, css, bootJs, totalJs, totalCss, snapshotDimensions}) {
  const findings = [];
  const requireText = (code, haystack, needle) => {
    if (!haystack.includes(needle)) findings.push(`${code}: missing ${needle}`);
  };

  requireText('DOC_LANG', docsHtml, '<html lang="es"');
  requireText('DOC_CANONICAL', docsHtml, 'rel="canonical" href="https://developer.1platform.pro/docs/"');
  requireText('DOC_HREFLANG_ES', docsHtml, 'href="https://developer.1platform.pro/docs/" hreflang="es"');
  requireText('DOC_HREFLANG_DEFAULT', docsHtml, 'href="https://developer.1platform.pro/docs/" hreflang="x-default"');
  requireText('DOC_JSONLD', docsHtml, 'type="application/ld+json"');
  requireText('SKIP_LINK', docsHtml, 'Saltar al contenido principal');
  requireText('MOBILE_TOGGLE', docsHtml, 'aria-label="Alternar barra lateral" aria-expanded="false"');
  requireText('SEARCH', docsHtml, 'class="navbar__search-input');
  requireText('NAV_CTA', docsHtml, 'href="https://app.1platform.pro/app/" target="_self"');
  requireText('DOC_PRIMARY_CTA', docsHtml, 'href="/docs/saas/1platform-api/getting-started"');
  requireText('DOC_API_CTA', docsHtml, 'href="/api-reference/1platform-api"');
  requireText(
    'DOC_CTA_SEMANTICS',
    docsHtml,
    'href="/docs/saas/1platform-api/getting-started">Hacer la primera llamada</a>',
  );
  requireText('DOC_LEAD', docsHtml, '<p class="docs-home__lead">Construí sobre las mismas APIs REST');

  requireText('API_LANG', apiHtml, '<html lang="es"');
  requireText('API_CANONICAL', apiHtml, 'rel="canonical" href="https://developer.1platform.pro/api-reference/1platform-api"');
  requireText('API_HREFLANG_ES', apiHtml, 'href="https://developer.1platform.pro/api-reference/1platform-api" hreflang="es"');
  requireText('API_HREFLANG_DEFAULT', apiHtml, 'href="https://developer.1platform.pro/api-reference/1platform-api" hreflang="x-default"');
  requireText('API_SHELL', apiHtml, 'plugin-@scalar/docusaurus plugin-id-1platform-api');
  requireText('API_SEARCH', apiHtml, 'class="navbar__search-input');

  requireText('REDUCED_MOTION', css, '@media (prefers-reduced-motion: reduce)');
  requireText('FOCUS_VISIBLE', css, ':where(a, button, input, summary):focus-visible');

  for (const requirement of SNAPSHOT_REQUIREMENTS) {
    const dimensions = snapshotDimensions[requirement.code];
    if (dimensions?.width !== requirement.width || dimensions?.height !== requirement.height) {
      findings.push(
        `${requirement.code}: expected ${requirement.width}x${requirement.height}, ` +
        `found ${dimensions?.width ?? 0}x${dimensions?.height ?? 0}`,
      );
    }
  }

  if (bootJs > BOOT_JS_BUDGET) {
    findings.push(`BOOT_JS_BUDGET: ${bootJs} > ${BOOT_JS_BUDGET} gzip bytes`);
  }
  if (totalJs > TOTAL_JS_BUDGET) {
    findings.push(`TOTAL_JS_BUDGET: ${totalJs} > ${TOTAL_JS_BUDGET} gzip bytes`);
  }
  if (totalCss > CSS_BUDGET) {
    findings.push(`CSS_BUDGET: ${totalCss} > ${CSS_BUDGET} gzip bytes`);
  }
  return findings;
}

if (process.argv.includes('--self-test')) {
  const findings = audit({
    docsHtml: '',
    apiHtml: '',
    css: '',
    bootJs: BOOT_JS_BUDGET + 1,
    totalJs: TOTAL_JS_BUDGET + 1,
    totalCss: CSS_BUDGET + 1,
    snapshotDimensions: Object.fromEntries(
      SNAPSHOT_REQUIREMENTS.map(({code}) => [code, {width: 0, height: 0}]),
    ),
  });
  const codes = new Set(findings.map((finding) => finding.split(':', 1)[0]));
  const expected = [
    'DOC_LANG', 'DOC_CANONICAL', 'DOC_HREFLANG_ES', 'DOC_HREFLANG_DEFAULT',
    'DOC_JSONLD', 'SKIP_LINK', 'MOBILE_TOGGLE', 'SEARCH', 'NAV_CTA',
    'DOC_PRIMARY_CTA', 'DOC_API_CTA', 'DOC_CTA_SEMANTICS', 'DOC_LEAD', 'API_LANG', 'API_CANONICAL',
    'API_HREFLANG_ES', 'API_HREFLANG_DEFAULT', 'API_SHELL', 'API_SEARCH',
    'REDUCED_MOTION', 'FOCUS_VISIBLE', 'BOOT_JS_BUDGET', 'TOTAL_JS_BUDGET',
    'CSS_BUDGET', ...SNAPSHOT_REQUIREMENTS.map(({code}) => code),
  ];
  const silent = expected.filter((code) => !codes.has(code));
  if (silent.length) {
    console.error(`self-test failed: checks went quiet: ${silent.join(', ')}`);
    process.exit(1);
  }
  console.log(`self-test ok: ${expected.length} public UI contracts can report red`);
  process.exit(0);
}

const requiredFiles = [
  join(BUILD, 'docs', 'index.html'),
  join(BUILD, 'api-reference', '1platform-api', 'index.html'),
  JS_DIR,
  CSS_DIR,
  ...SNAPSHOT_REQUIREMENTS.map(({name}) => join(SNAPSHOT_DIR, name)),
];
for (const path of requiredFiles) {
  if (!existsSync(path)) {
    console.error(`preflight failed: ${path} is missing; run pnpm build first`);
    process.exit(1);
  }
}

const jsFiles = readdirSync(JS_DIR).filter((name) => name.endsWith('.js'));
const bootNames = jsFiles.filter((name) => name.startsWith('main.') || name.startsWith('runtime~main.'));
if (bootNames.length !== 2) {
  console.error(`preflight failed: expected main + runtime boot files, found ${bootNames.join(', ') || 'none'}`);
  process.exit(1);
}

const docsHtml = readFileSync(requiredFiles[0], 'utf8');
const apiHtml = readFileSync(requiredFiles[1], 'utf8');
const css = readFileSync(join(ROOT, 'src', 'css', 'custom.css'), 'utf8');
const bootJs = bootNames.reduce(
  (total, name) => total + gzipSync(readFileSync(join(JS_DIR, name))).length,
  0,
);
const totalJs = gzipFiles(JS_DIR, (name) => name.endsWith('.js'));
const totalCss = gzipFiles(CSS_DIR, (name) => name.endsWith('.css'));
const snapshotDimensions = Object.fromEntries(
  SNAPSHOT_REQUIREMENTS.map(({code, name}) => {
    const png = readFileSync(join(SNAPSHOT_DIR, name));
    const validPng = png.length >= 24 && png.subarray(1, 4).toString('ascii') === 'PNG';
    if (!validPng) return [code, {width: 0, height: 0}];
    return [code, {width: png.readUInt32BE(16), height: png.readUInt32BE(20)}];
  }),
);

const findings = audit({docsHtml, apiHtml, css, bootJs, totalJs, totalCss, snapshotDimensions});
if (findings.length) {
  findings.forEach((finding) => console.error(`FAIL ${finding}`));
  process.exit(1);
}

console.log('ok   docs and API reference public contracts');
console.log(`ok   first-party boot JS ${bootJs}/${BOOT_JS_BUDGET} gzip bytes`);
console.log(`ok   total first-party JS ${totalJs}/${TOTAL_JS_BUDGET} gzip bytes`);
console.log(`ok   compiled CSS ${totalCss}/${CSS_BUDGET} gzip bytes`);
console.log(`ok   ${SNAPSHOT_REQUIREMENTS.length} visual snapshots at their review viewports`);
