#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {load} from 'cheerio';
import {informalForms, markdownProse} from './editorial-prose.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
function files(path, accept) {
  return readdirSync(path, {withFileTypes: true}).flatMap((entry) => {
    const next = join(path, entry.name);
    if (entry.isDirectory()) return files(next, accept);
    return accept(next) ? [next] : [];
  });
}

if (process.argv.includes('--self-test')) {
  for (const text of ['Tu backend te llama a vos', 'Registrás y podés continuar', 'Necesitas tu clave', 'Tienes acceso', 'Crea su sitio y haz la prueba']) {
    assert.ok(informalForms(markdownProse(text)).length, 'Informal editorial text must fail');
  }
  const technical = 'Use `tu_variable` y `sk-user-api-key`.\n```js\nconst texto = "tu backend te llama";\n```\n~~~bash\necho "necesitas tus claves"\n~~~\nConsulte [sus datos](/docs/tu/ruta) {#tu-ancla}';
  assert.deepEqual(informalForms(markdownProse(technical)), []);
  assert.deepEqual(informalForms('La API registra consultas, pruebas, descargas, recargas y escapes. Las muestras se agregan. Su API registra las muestras.'), []);
  assert.ok(informalForms('Muestras su clave').length, 'The telemetry noun exception cannot allow informal verbs');
  assert.deepEqual(informalForms(markdownProse('<p className="lead">Use su clave</p>')), []);
  assert.ok(informalForms(markdownProse('<p>Use tus claves</p>')).length, 'JSX content is editorial');
  assert.ok(informalForms(markdownProse('````js\n```\ntu clave\n````\nTus datos')).length, 'Long fences preserve following prose');
  assert.deepEqual(informalForms(markdownProse('<script>const copy = "tu clave"</script><style>.tu {}</style><p>Use su clave</p>')), []);
  assert.ok(informalForms(markdownProse('<p title="a > b">Tus datos</p>')).length, 'A > in an attribute cannot hide editorial text');
  assert.ok(informalForms(markdownProse('<p><em>Tus datos</p>')).length, 'Malformed nested markup still exposes rendered prose');
  assert.ok(informalForms(markdownProse('`unclosed Tus datos')).length, 'An unmatched inline delimiter cannot hide prose');
  assert.deepEqual(informalForms(markdownProse('``const sample = `tu clave` `` Use su clave')), []);
  assert.deepEqual(informalForms('tu_variable pre-tu-variable añotuyo'), [], 'Technical compound words are not pronouns');
  console.log('ok   editorial tone positive/negative controls, code fences, inline literals, links and noun context');
} else {
  const sources = files(join(root, 'docs'), (path) => /\.(?:mdx?|json)$/.test(path));
  assert.ok(sources.length, 'No docs discovered: tone guard cannot run on an empty corpus');
  const failures = [];
  for (const path of sources) {
    const source = readFileSync(path, 'utf8');
    const text = path.endsWith('.json') ? JSON.stringify(JSON.parse(source)) : markdownProse(source);
    const matches = informalForms(text);
    if (matches.length) failures.push(`${relative(root, path)}: ${[...new Set(matches)].join(', ')}`);
  }
  if (process.argv.includes('--build')) {
    const pages = files(join(root, 'build/docs'), (path) => path.endsWith('.html'));
    assert.ok(pages.length, 'No built docs discovered');
    for (const path of pages) {
      const $ = load(readFileSync(path, 'utf8'));
      $('pre, code, script, style').remove();
      const matches = informalForms($('main').text());
      if (matches.length) failures.push(`${relative(root, path)}: ${[...new Set(matches)].join(', ')}`);
    }
    console.log(`checked ${pages.length} built doc pages, excluding code/pre literals`);
  }
  assert.equal(failures.length, 0, `Editorial tone must use usted:\n${failures.join('\n')}`);
  console.log(`ok   formal tone in ${sources.length} discovered source documents/categories`);
}
