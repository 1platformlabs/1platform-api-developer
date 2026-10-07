#!/usr/bin/env node
/** SRV-07 semantic regressions. This checks known misleading claims and sample
 * values; it does not certify enabled tenants, delivery or a real integration. */
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {markdownProse} from './editorial-prose.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const docsRoot = join(root, 'docs/saas/1platform-api');
const eventNames = new Set(['content_published', 'content_updated', 'comment_received', 'seo_action', 'keyword_research']);
const excluded = ['Contenido', 'SEO', 'Imágenes', 'Ingresos publicitarios', 'Link building'];
const required = ['plataforma/index.mdx', 'plataforma/webhooks.mdx', 'reference/retry-and-delivery.mdx',
  'analitica/index.mdx', 'analitica/google-analytics.mdx', 'analitica/mapas-de-calor.mdx',
  'agentes-de-ia/integrar-en-su-aplicacion.mdx', 'ventas/index.mdx'];
for (const product of ['suscripciones', 'publicidad', 'terminal-de-tarjetas']) {
  required.push(`${product}/index.mdx`, `${product}/_category_.json`);
}

function readDocs(dir = docsRoot, prefix = '') {
  return Object.fromEntries(readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return Object.entries(readDocs(join(dir, entry.name), `${name}/`));
    return /\.(mdx?|json)$/.test(name) ? [[name, readFileSync(join(dir, entry.name), 'utf8')]] : [];
  }));
}

function eventErrors(example) {
  const errors = [];
  if (!eventNames.has(example?.event_name)) errors.push('event_name fuera del catálogo');
  const params = example?.params ?? {};
  if (Object.keys(params).length > 25) errors.push('más de 25 parámetros');
  if (Object.entries(params).some(([key, value]) => !/^[a-z][a-z0-9_]{0,39}$/.test(key) || String(value).length > 100)) {
    errors.push('nombre o valor de parámetro inválido');
  }
  return errors;
}

export function audit(docs, spec) {
  const bad = [];
  const fail = (rule, path, detail) => bad.push(`${rule} ${path}: ${detail}`);
  for (const path of required) if (!docs[path]) fail('corpus', path, 'documento requerido ausente');
  const prose = path => markdownProse(docs[path] ?? '').replace(/[*_`]/g, '').replace(/\s+/g, ' ');
  const requireClaim = (rule, path, pattern, detail) => {
    if (!pattern.test(prose(path))) fail(rule, path, detail);
  };
  for (const [path, source] of Object.entries(docs)) {
    if (/article_published/.test(source)) fail('DOC-02', path, 'evento obsoleto');
    if (/webhook|retry-and-delivery/.test(path)) {
      for (const sentence of prose(path).split(/(?<=[.!?;])\s+/)) {
        const guarantee = /(?:at.least.once|al menos una vez|at.most.once|exactly.once|exactamente una vez)/i;
        // Explicit denials stay useful; a later positive sentence still fails.
        if (guarantee.test(sentence) && !/\b(?:no (?:hay |existe |se ofrece |se garantiza |garantiza )?|sin )[^.!?;]{0,60}(?:garant|entrega|exactamente|al menos)/i.test(sentence)) {
          fail('DOC-06', path, 'garantía de entrega no acreditada');
        }
      }
    }
    if (/analitica\//.test(path)) {
      for (const sentence of prose(path).split(/(?<=[.!?;])\s+/)) {
        if (/ranking|páginas más/.test(sentence) && /visitas|visitantes/.test(sentence) &&
            !/\bno (?:mide|representa|cuenta|son)\b/.test(sentence)) {
          fail('DOC-07', path, 'ranking de muestras presentado como visitas');
        }
      }
    }
    // Keep historical product docs. Only new-offer claims are forbidden.
    for (const sentence of prose(path).split(/(?<=[.!?;])\s+/)) {
      const offering = /(?:Contenido|SEO|Imágenes|Ingresos publicitarios|Link building|Cloud as a Service)/i.test(sentence);
      const promise = /(?:nueva[s]? oferta[s]?|nuevo[s]? servicio[s]?|ya (?:está|están) disponible|ahora (?:ofrecemos|incluye|puede contratar))/i.test(sentence);
      if (offering && promise && !/\bno (?:se incorpora|se añade|son|es|forma|incluye)/i.test(sentence)) {
        fail('alcance', path, 'oferta excluida incorporada como nueva');
      }
    }
  }
  for (const product of ['suscripciones', 'publicidad', 'terminal-de-tarjetas']) {
    for (const name of ['index.mdx', '_category_.json']) {
      const path = `${product}/${name}`;
      if (!/en preparación/i.test(docs[path] ?? '')) fail('DOC-01', path, 'falta disponibilidad en preparación');
    }
  }
  requireClaim('DOC-01', 'terminal-de-tarjetas/index.mdx', /alta de terminal está disponible/, 'se debe distinguir alta de cobro presencial');
  requireClaim('DOC-06', 'reference/retry-and-delivery.mdx', /eventos no entregados.*[Cc]onciliación/, 'falta límite de entrega y conciliación');
  requireClaim('DOC-07', 'analitica/mapas-de-calor.mdx', /muestras de interacción/, 'falta unidad del mapa');
  requireClaim('DOC-09', 'agentes-de-ia/integrar-en-su-aplicacion.mdx', /no es un requisito universal/, 'sitio no universal para agentes');
  for (const path of ['ventas/index.mdx', 'agentes-de-ia/integrar-en-su-aplicacion.mdx']) {
    requireClaim('DOC-09', path, /WhatsApp.*?en preparación/, 'WhatsApp no acredita mensajería cliente disponible');
    requireClaim('DOC-09', path, /operación interna.*?no (?:es|habilita)/, 'falta frontera entre API interna e integración cliente');
  }
  const scope = prose('plataforma/index.mdx');
  if (!/catálogo previo/.test(scope) || !excluded.every(name => scope.includes(name)) ||
      !/Cloud as a Service.*?fuera.*?otra épica/.test(scope)) {
    fail('alcance', 'plataforma/index.mdx', 'falta catálogo previo o límite de Cloud');
  }
  const analytics = docs['analitica/google-analytics.mdx'] ?? '';
  const sampleEvents = [...analytics.matchAll(/"event_name"\s*:\s*"([^"]+)"/g)].map(match => match[1]);
  if (!sampleEvents.length || sampleEvents.some(name => !eventNames.has(name))) fail('DOC-02', 'analitica/google-analytics.mdx', 'ejemplo no válido');
  if (!['25', '100', '^[a-z][a-z0-9_]{0,39}$', ...eventNames].every(value => analytics.includes(value))) {
    fail('DOC-02', 'analitica/google-analytics.mdx', 'catálogo o límites de parámetros ausentes');
  }
  for (const error of eventErrors(spec.components?.schemas?.MPEventRequest?.example)) fail('DOC-02', 'OpenAPI.MPEventRequest.example', error);
  return bad;
}

const docs = readDocs();
const spec = JSON.parse(readFileSync(join(root, 'static/openapi/1platform-api.json'), 'utf8'));
if (process.argv.includes('--self-test')) {
  // Fixtures change a known claim in the real corpus, not a duplicate checker.
  const fixture = structuredClone(spec);
  fixture.components.schemas.MPEventRequest.example = {event_name: 'content_published', params: {article_id: 'a-123'}};
  assert.deepEqual(audit(docs, fixture), [], 'real prose with valid illustrative API event');
  const negatives = [
    ['DOC-02', 'analitica/google-analytics.mdx', s => s.replaceAll('content_published', 'article_published')],
    ['DOC-01', 'suscripciones/index.mdx', s => s.replaceAll(/en preparación/gi, 'disponible')],
    ['DOC-01', 'publicidad/_category_.json', s => s.replaceAll('en preparación', 'disponible')],
    ['DOC-06', 'plataforma/webhooks.mdx', s => `${s}\nGarantizamos la entrega al menos una vez.`],
    ['DOC-06', 'reference/retry-and-delivery.mdx', s => `${s}\nEntrega exactamente una vez.`],
    ['DOC-07', 'analitica/mapas-de-calor.mdx', s => s.replace('el ranking de páginas no mide visitas ni personas únicas', 'el ranking de páginas mide visitas y personas únicas')],
    ['DOC-09', 'ventas/index.mdx', s => s.replaceAll('en preparación', 'disponible')],
    ['DOC-09', 'agentes-de-ia/integrar-en-su-aplicacion.mdx', s => s.replace('no es un requisito universal', 'es un requisito universal')],
    ['alcance', 'plataforma/index.mdx', s => s.replace('catálogo previo', 'catálogo actual')],
    ['alcance', 'plataforma/index.mdx', s => `${s}\nCloud as a Service ya está disponible.`],
    ...excluded.map(name => ['alcance', 'plataforma/index.mdx', s => `${s}\n${name} es una nueva oferta.`]),
    ['corpus', 'analitica/mapas-de-calor.mdx', () => ''],
  ];
  for (const [rule, path, mutate] of negatives) {
    assert.ok(audit({...docs, [path]: mutate(docs[path])}, fixture).some(error => error.startsWith(rule)), `${rule}: must reject ${path}`);
  }
  for (const example of [
    {event_name: 'article_published'},
    {event_name: 'content_published', params: Object.fromEntries(Array.from({length: 26}, (_, i) => [`key_${i}`, i]))},
    {event_name: 'content_published', params: {'Invalid-Key': 1}},
    {event_name: 'content_published', params: {value: 'a'.repeat(101)}},
  ]) assert.ok(eventErrors(example).length, 'invalid API sample must fail');
  const denied = {...docs, 'plataforma/webhooks.mdx': `${docs['plataforma/webhooks.mdx']}\nNo hay garantía de entrega al menos una vez.`};
  assert.deepEqual(audit(denied, fixture), [], 'explicit denial is valid, historical guides remain valid');
  console.log(`PASS service semantics: ${negatives.length + 4} negative controls and 2 positive corpora`);
} else {
  const errors = audit(docs, spec);
  assert.deepEqual(errors, [], `Service documentation drift:\n${errors.join('\n')}`);
  console.log(`PASS service semantics: ${Object.keys(docs).length} documents/categories, DOC-01/02/06/07/09 and catalog scope`);
}
