#!/usr/bin/env node
/**
 * check-public-ui.mjs — production contract for the two public entry points.
 *
 * Docusaurus and Scalar own their runtime markup, so source-only checks can miss
 * a broken canonical, lost search input or changed keyboard control. This guard
 * reads the production build and pins those contracts alongside first-party JS
 * and CSS budgets. Scalar's separately loaded, pinned CDN runtime is outside
 * those first-party budgets; its behavior is reviewed separately. Every asset
 * built by this repo is counted byte for byte.
 */
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {searchLabelFindings} from './search-label.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BUILD = join(ROOT, 'build');
const JS_DIR = join(BUILD, 'assets', 'js');
const CSS_DIR = join(BUILD, 'assets', 'css');
const SNAPSHOT_DIR = join(ROOT, 'tests', 'visual', 'infrastructure-branding');

const BOOT_JS_BUDGET = 180 * 1024;
// The total grows with the page count: every doc is its own lazily-loaded
// chunk, fetched only when visited (the boot budget above is what every page
// pays). Measured 2026-10-01: origin/main 378,806 gzip bytes over 38 docs; the
// per-product reorganisation 416,177 over 50 docs. Raised for that, with room
// for a few more pages, not for a heavier boot.
const TOTAL_JS_BUDGET = 420 * 1024;
const CSS_BUDGET = 25 * 1024;

const SNAPSHOT_REQUIREMENTS = [
  {code: 'SNAPSHOT_DOC_DESKTOP', name: 'docs-desktop-1440.jpg', width: 1440, height: 1100},
  {code: 'SNAPSHOT_DOC_MOBILE', name: 'docs-mobile-390.jpg', width: 390, height: 844},
  {code: 'SNAPSHOT_API_DESKTOP', name: 'api-desktop-1440.jpg', width: 1440, height: 1100},
  {code: 'SNAPSHOT_API_MOBILE', name: 'api-mobile-390.jpg', width: 390, height: 844},
];

/** Read the capture's real container, not its extension. CUA emits JPEG. */
function imageDimensions(bytes) {
  const invalid = {width: 0, height: 0};
  if (bytes.length >= 24 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')) && bytes.subarray(12, 16).toString() === 'IHDR') {
    return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
  }
  if (bytes.length < 4 || bytes.readUInt16BE(0) !== 0xffd8) return invalid;
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return invalid;
    while (bytes[offset + 1] === 0xff) offset++;
    const marker = bytes[offset + 1];
    offset += 2;
    if (offset + 2 > bytes.length || marker === 0xd9 || marker === 0xda) return invalid;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return invalid;
    if (frameMarkers.has(marker)) {
      return length >= 7 ? {width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3)} : invalid;
    }
    offset += length;
  }
  return invalid;
}

function gzipFiles(directory, predicate) {
  return readdirSync(directory)
    .filter(predicate)
    .reduce((total, name) => total + gzipSync(readFileSync(join(directory, name))).length, 0);
}

function audit({docsHtml, quickHtml, apiHtml, css, bootJs, totalJs, totalCss, snapshotDimensions}) {
  const findings = [];
  const requireText = (code, haystack, needle) => {
    if (!haystack.includes(needle)) findings.push(`${code}: missing ${needle}`);
  };

  requireText('DOC_LANG', docsHtml, '<html lang="es"');
  requireText('DOC_CANONICAL', docsHtml, 'rel="canonical" href="https://developer.1platform.pro/docs/saas/1platform-api/getting-started"');
  requireText('DOC_HREFLANG_ES', docsHtml, 'href="https://developer.1platform.pro/docs/saas/1platform-api/getting-started" hreflang="es"');
  requireText('DOC_HREFLANG_DEFAULT', docsHtml, 'href="https://developer.1platform.pro/docs/saas/1platform-api/getting-started" hreflang="x-default"');
  requireText('DOC_JSONLD', docsHtml, 'type="application/ld+json"');
  requireText('SKIP_LINK', docsHtml, 'Saltar al contenido principal');
  requireText('MOBILE_TOGGLE', docsHtml, 'aria-label="Alternar barra lateral" aria-expanded="false"');
  requireText('SEARCH', docsHtml, 'class="navbar__search-input');
  requireText('BRAND_RETURN', docsHtml, 'href="https://1platform.pro/es/" target="_self"');
  requireText('BLOG_LANGUAGE', docsHtml, 'href="https://1platform.pro/es/blog/" target="_self"');
  requireText('NAV_CTA', docsHtml, 'href="https://wa.me/50253946564" target="_self"');
  requireText('DOC_PRIMARY_CTA', docsHtml, 'href="/docs/saas/1platform-api/inicio-rapido"');
  requireText('DOC_API_CTA', docsHtml, 'href="/api-reference/1platform-api"');
  requireText(
    'DOC_CTA_SEMANTICS',
    docsHtml,
    'Referencia de API</a>',
  );
  requireText('DOC_LEAD', docsHtml, 'Todo lo que necesita para integrar 1Platform');
  // The home is a product index; the credentials and the first call live on
  // Inicio rápido, which is where the guide checks below read.
  requireText('DOC_PRODUCTS', docsHtml, 'Productos disponibles');
  requireText('DOC_SECTIONS', docsHtml, 'class="docs-sections-toggle"');

  requireText('API_LANG', apiHtml, '<html lang="es"');
  requireText('API_CANONICAL', apiHtml, 'rel="canonical" href="https://developer.1platform.pro/api-reference/1platform-api"');
  requireText('API_HREFLANG_ES', apiHtml, 'href="https://developer.1platform.pro/api-reference/1platform-api" hreflang="es"');
  requireText('API_HREFLANG_DEFAULT', apiHtml, 'href="https://developer.1platform.pro/api-reference/1platform-api" hreflang="x-default"');
  requireText('API_SHELL', apiHtml, 'plugin-@scalar/docusaurus plugin-id-1platform-api');
  requireText('API_SEARCH', apiHtml, 'class="navbar__search-input');
  requireText('GUIDE_PROFILE', quickHtml, '/api/v1/users/profile');
  requireText('GUIDE_APP_JWT', quickHtml, '<code>Authorization: Bearer $APP_TOKEN</code>');
  requireText('GUIDE_USER_JWT', quickHtml, '<code>x-user-token: $USER_TOKEN</code>');
  for (const [kind, html] of [['DOC', docsHtml], ['API', apiHtml]]) {
    const $ = load(html);
    const labels = $('input.navbar__search-input').toArray().map((input) => $(input).attr('aria-label'));
    for (const finding of searchLabelFindings(labels)) findings.push(`${kind}_SEARCH_LABEL_ES: ${finding}`);
    // This is the SSR host. Scalar later renders the native headings contained
    // in the contract; this assertion does not count or approve runtime headings.
    if (/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) findings.push(`${kind}_INDEXABLE: noindex on public page`);
    if ((html.match(/<h1(?:\s|>)/g) ?? []).length !== 1) findings.push(`${kind}_ONE_H1: expected one primary title`);
  }

  requireText('REDUCED_MOTION', css, '@media (prefers-reduced-motion: reduce)');
  requireText('FOCUS_VISIBLE', css, ':where(a, button, input, summary):focus-visible');
  // Scalar code surfaces get light code text; without their own navy, the API
  // client's response body rendered light-on-white (measured 1.18:1 in the E2E bench).
  requireText('COLLAPSED_SEARCH_QUERY', css, "@media (min-width:997px) { .navbar__search-input:not(:focus) { color:transparent; } .navbar__search:not(:focus-within) [class*='searchClearButton'] { display:none; } }");
  requireText('COLLAPSED_SEARCH_QUERY_MOBILE', css, ".navbar .navbar__search-input:not(:focus) { width:44px; color:transparent; }\n  .navbar__search:not(:focus-within) [class*='searchClearButton'] { display:none; }");
  requireText('SCALAR_CODE_SURFACE', css, '.scalar-reference .scalar-code-block, .scalar-reference .markdown pre {\n  background:var(--navy);');
  requireText('SCALAR_MARKDOWN_CODE', css, '.scalar-reference .markdown pre code { background:transparent; color:inherit; border:0; box-shadow:none; padding:0; }');

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
  for (const input of [
    '<input class="navbar__search-input" aria-label="Search">',
    '<input class="navbar__search-input">',
    '<input class="other" aria-label="Buscar">',
  ]) {
    const $ = load(`<button aria-label="Buscar"></button>${input}`);
    const labels = $('input.navbar__search-input').toArray().map((element) => $(element).attr('aria-label'));
    assert.ok(searchLabelFindings(labels).length, 'An unrelated Spanish button cannot hide a broken input');
  }
  assert.deepEqual(searchLabelFindings(['Buscar']), []);
  assert.ok(searchLabelFindings(['Buscar', 'Search']).length, 'Every rendered search input needs a Spanish name');
  const jpeg = Buffer.from('ffd8ffe000044a46ffc0000b08034c018601011100ffd9', 'hex');
  assert.deepEqual(imageDimensions(jpeg), {width: 390, height: 844});
  const progressive = Buffer.from(jpeg);
  progressive[9] = 0xc2;
  assert.deepEqual(imageDimensions(progressive), {width: 390, height: 844});
  assert.deepEqual(imageDimensions(jpeg.subarray(0, 16)), {width: 0, height: 0});
  assert.deepEqual(imageDimensions(Buffer.from('not an image')), {width: 0, height: 0});
  const png = Buffer.alloc(24);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(png);
  png.write('IHDR', 12);
  png.writeUInt32BE(1440, 16);
  png.writeUInt32BE(1100, 20);
  assert.deepEqual(imageDimensions(png), {width: 1440, height: 1100});
  assert.deepEqual(imageDimensions(png.subarray(0, 20)), {width: 0, height: 0});
  const findings = audit({
    docsHtml: '<meta name="robots" content="noindex">',
    quickHtml: '',
    apiHtml: '<meta name="robots" content="noindex">',
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
    'DOC_LANG', 'DOC_CANONICAL', 'DOC_HREFLANG_ES', 'DOC_HREFLANG_DEFAULT', 'DOC_SEARCH_LABEL_ES', 'API_SEARCH_LABEL_ES',
    'DOC_JSONLD', 'BRAND_RETURN', 'BLOG_LANGUAGE', 'SKIP_LINK', 'MOBILE_TOGGLE', 'SEARCH', 'NAV_CTA',
    'DOC_PRIMARY_CTA', 'DOC_API_CTA', 'DOC_CTA_SEMANTICS', 'DOC_LEAD', 'DOC_PRODUCTS', 'DOC_SECTIONS', 'API_LANG', 'API_CANONICAL',
    'API_HREFLANG_ES', 'API_HREFLANG_DEFAULT', 'API_SHELL', 'API_SEARCH',
    'REDUCED_MOTION', 'FOCUS_VISIBLE', 'COLLAPSED_SEARCH_QUERY', 'COLLAPSED_SEARCH_QUERY_MOBILE', 'SCALAR_CODE_SURFACE', 'SCALAR_MARKDOWN_CODE', 'BOOT_JS_BUDGET', 'TOTAL_JS_BUDGET',
    'CSS_BUDGET', 'GUIDE_PROFILE', 'GUIDE_APP_JWT', 'GUIDE_USER_JWT', 'DOC_ONE_H1', 'API_ONE_H1', 'DOC_INDEXABLE', 'API_INDEXABLE', ...SNAPSHOT_REQUIREMENTS.map(({code}) => code),
  ];
  const silent = expected.filter((code) => !codes.has(code));
  if (silent.length) {
    console.error(`self-test failed: checks went quiet: ${silent.join(', ')}`);
    process.exit(1);
  }
  console.log(`self-test ok: ${expected.length} public UI contracts can report red; 6 capture-format checks`);
  process.exit(0);
}

const requiredFiles = [
  join(BUILD, 'docs', 'saas', '1platform-api', 'getting-started', 'index.html'),
  join(BUILD, 'docs', 'saas', '1platform-api', 'inicio-rapido', 'index.html'),
  join(BUILD, 'api-reference', '1platform-api', 'index.html'),
  JS_DIR,
  CSS_DIR,
  ...SNAPSHOT_REQUIREMENTS.map(({name}) => join(SNAPSHOT_DIR, name)),
];
for (const path of requiredFiles) {
  if (!existsSync(path)) {
    console.error(`preflight failed: ${path} is missing; ${path.startsWith(SNAPSHOT_DIR) ? 'save a current, personally reviewed browser capture; build does not create visual evidence' : 'run pnpm build first'}`);
    process.exit(1);
  }
}

for (const route of ['docs', 'docs/quick-start', 'docs/saas/1platform-api/overview']) {
  const html = readFileSync(join(BUILD, route, 'index.html'), 'utf8');
  if (!html.includes('url=/docs/saas/1platform-api/getting-started')) throw new Error(`Missing guide redirect: ${route}`);
}
const apiAlias = readFileSync(join(BUILD, 'api-docs', 'index.html'), 'utf8');
if (!apiAlias.includes('url=/api-reference/1platform-api')) throw new Error('Missing historical API redirect');
const rootAlias = readFileSync(join(BUILD, 'index.html'), 'utf8');
if (!rootAlias.includes('content="0;url=/docs/saas/1platform-api/getting-started"')) throw new Error('Root requires a no-JavaScript redirect');
if (!rootAlias.includes('window.location.replace("/docs/saas/1platform-api/getting-started"+window.location.search+window.location.hash)')) throw new Error('Root redirect must keep query and fragment');
const serverRules = readFileSync(join(ROOT, 'deploy/cpanel/htaccess/docs.htaccess'), 'utf8');
if (!serverRules.includes('RewriteRule ^$ /docs/saas/1platform-api/getting-started [R=301,L]')) throw new Error('Root HTTP redirect missing from deployment');

const jsFiles = readdirSync(JS_DIR).filter((name) => name.endsWith('.js'));
const bootNames = jsFiles.filter((name) => name.startsWith('main.') || name.startsWith('runtime~main.'));
if (bootNames.length !== 2) {
  console.error(`preflight failed: expected main + runtime boot files, found ${bootNames.join(', ') || 'none'}`);
  process.exit(1);
}

const docsHtml = readFileSync(requiredFiles[0], 'utf8');
const quickHtml = readFileSync(requiredFiles[1], 'utf8');
const apiHtml = readFileSync(requiredFiles[2], 'utf8');
const css = readFileSync(join(ROOT, 'src', 'css', 'custom.css'), 'utf8');
const bootJs = bootNames.reduce(
  (total, name) => total + gzipSync(readFileSync(join(JS_DIR, name))).length,
  0,
);
const totalJs = gzipFiles(JS_DIR, (name) => name.endsWith('.js'));
const totalCss = gzipFiles(CSS_DIR, (name) => name.endsWith('.css'));
const snapshotDimensions = Object.fromEntries(
  SNAPSHOT_REQUIREMENTS.map(({code, name}) => {
    return [code, imageDimensions(readFileSync(join(SNAPSHOT_DIR, name)))];
  }),
);

const findings = audit({docsHtml, quickHtml, apiHtml, css, bootJs, totalJs, totalCss, snapshotDimensions});
if (findings.length) {
  findings.forEach((finding) => console.error(`FAIL ${finding}`));
  process.exit(1);
}

console.log('ok   docs and API reference public contracts');
console.log(`ok   first-party boot JS ${bootJs}/${BOOT_JS_BUDGET} gzip bytes`);
console.log(`ok   total first-party JS ${totalJs}/${TOTAL_JS_BUDGET} gzip bytes`);
console.log(`ok   compiled CSS ${totalCss}/${CSS_BUDGET} gzip bytes`);
console.log(`ok   ${SNAPSHOT_REQUIREMENTS.length} review artifacts at their declared viewports (dimensions only; fidelity is a separate browser review)`);
