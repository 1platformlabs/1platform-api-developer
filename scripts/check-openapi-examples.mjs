import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sanitizeOpenApiExamples} from './openapi-examples.mjs';
import {correctAuthDescriptions} from './openapi-auth-descriptions.mjs';
import {checkOpenApiPublication, checkServiceExamples} from './openapi-publication-check.mjs';

// Independent of the sanitizer's matching rules: a shortened regression must
// not make both the transform and its guard silently ignore the same value.
function illustrativePrefixes(value, illustrative = false) {
  if (typeof value === 'string') {
    return illustrative && /(?:^|[^\p{L}\p{N}_-])(?:ak|sk)-/u.test(value) ? 1 : 0;
  }
  if (Array.isArray(value)) return value.reduce((sum, child) => sum + illustrativePrefixes(child, illustrative), 0);
  if (!value || typeof value !== 'object') return 0;
  return Object.entries(value).reduce((sum, [key, child]) => sum + illustrativePrefixes(child, illustrative || ['example', 'examples', 'default', 'description'].includes(key)), 0);
}

if (process.argv.includes('--self-test')) {
  const key = 'ak-' + 'example'.repeat(5);
  const contract = {openapi: '3.1.0', paths: {'/test': {post: {operationId: 'test', security: [{Bearer: []}], parameters: [{name: 'x-user-token', required: true, schema: {type: 'string'}}], requestBody: {content: {'application/json': {schema: {type: 'object', required: ['apiKey'], properties: {apiKey: {type: 'string', example: key}}}}}}}}}, info: {description: 'API metadata'}};
  const {spec, changed} = sanitizeOpenApiExamples(contract);
  assert.equal(changed, 1);
  assert.equal(contract.paths['/test'].post.requestBody.content['application/json'].schema.properties.apiKey.example, key);
  const expected = structuredClone(contract);
  expected.paths['/test'].post.requestBody.content['application/json'].schema.properties.apiKey.example = 'APP_API_KEY_EXAMPLE';
  assert.deepEqual(spec, expected);
  assert.equal(sanitizeOpenApiExamples(spec).changed, 0);
  assert.equal(sanitizeOpenApiExamples({info: {description: `curl -d '{apiKey: ${key}}'`}}).changed, 1);
  assert.equal(sanitizeOpenApiExamples({example: {token: 'eyJ'+'a'.repeat(20)+'.'+'b'.repeat(20)+'.'+'c'.repeat(20)}}).changed, 1);
  const examples = [
    ['ak-a', 'APP_API_KEY_EXAMPLE'], ['sk-x', 'USER_API_KEY_EXAMPLE'],
    ['sk-user-api-key', 'USER_API_KEY_EXAMPLE'], ['ak-' + 'x'.repeat(15), 'APP_API_KEY_EXAMPLE'],
    ['sk-' + 'x'.repeat(16), 'USER_API_KEY_EXAMPLE'], ['ak-' + 'x'.repeat(40), 'APP_API_KEY_EXAMPLE'],
    ['ak-int-x', 'INTEGRATION_API_KEY_EXAMPLE'], ['ak-int-<prefix><secret>', 'INTEGRATION_API_KEY_EXAMPLE'],
    ['ak-int-…', 'INTEGRATION_API_KEY_EXAMPLE'], ['ak-int-', 'INTEGRATION_API_KEY_EXAMPLE'],
    ['ak-svc-...', 'SERVICE_API_KEY_EXAMPLE'], ['ak-svc-', 'SERVICE_API_KEY_EXAMPLE'],
    ['ak-svc…', 'SERVICE_API_KEY_EXAMPLE'], ['ak-svc-short', 'SERVICE_API_KEY_EXAMPLE'],
    ['ak-...', 'APP_API_KEY_EXAMPLE'], ['sk-…', 'USER_API_KEY_EXAMPLE'],
    ['sk-…abcd', 'USER_API_KEY_EXAMPLE'], ['ak-', 'APP_API_KEY_EXAMPLE'],
  ];
  for (const [value, marker] of examples) {
    for (const field of ['example', 'examples', 'default', 'description']) {
      const source = {paths: {'/sk-route': {operationId: 'ak-operation', required: ['sk-field'], security: [{'ak-scheme': []}], schema: {pattern: '^sk-x$', enum: ['sk-enum'], bearerFormat: 'ak-int-<prefix><secret>', [field]: [{value: `Bearer ${value}`}]} }}};
      const before = structuredClone(source);
      const expected = structuredClone(source);
      expected.paths['/sk-route'].schema[field][0].value = `Bearer ${marker}`;
      const result = sanitizeOpenApiExamples(source);
      assert.deepEqual(result.spec, expected, `${field}: only illustrative values may change`);
      assert.deepEqual(source, before, 'The source contract stays immutable');
      assert.equal(result.changed, 1);
      assert.equal(sanitizeOpenApiExamples(result.spec).changed, 0);
      assert.equal(illustrativePrefixes(result.spec), 0);
      assert.equal(illustrativePrefixes(source), 1, 'The independent guard detects short examples');
    }
  }
  for (const value of ['demo-sk-value', 'task-value', 'mask-example', 'prefix_ak-value', 'ñsk-value', 'APP_API_KEY_EXAMPLE']) {
    assert.deepEqual(sanitizeOpenApiExamples({description: value}), {spec: {description: value}, changed: 0});
    assert.equal(illustrativePrefixes({description: value}), 0);
  }
  for (const value of ['ak-xé', 'ak-x𐐀']) {
    assert.deepEqual(sanitizeOpenApiExamples({description: value}), {spec: {description: value}, changed: 0}, 'Unicode word boundaries cannot truncate a word');
  }
  assert.equal(sanitizeOpenApiExamples({description: 'Use ak-x. Then sk-y, or ak-int-<prefix><secret>.'}).spec.description,
    'Use APP_API_KEY_EXAMPLE. Then USER_API_KEY_EXAMPLE, or INTEGRATION_API_KEY_EXAMPLE.', 'Surrounding punctuation is preserved');
  assert.equal(illustrativePrefixes({description: 'sk-x'}), 1);
  assert.equal(illustrativePrefixes({description: 'ak-'}), 1);
  assert.equal(illustrativePrefixes({bearerFormat: 'ak-int-<prefix><secret>'}), 0, 'Structural format is not prose');
  const authContract = {...contract, components: {securitySchemes: {bearerAuth: {type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Format: ak-...'}, userToken: {type: 'apiKey', in: 'header', name: 'x-user-token', description: 'Format: sk-...'}}}};
  const authBefore = structuredClone(authContract);
  const corrected = correctAuthDescriptions(authContract, '1platform-api');
  assert.equal(corrected.changed, 2);
  for (const name of ['bearerAuth', 'userToken']) {
    assert.match(corrected.spec.components.securitySchemes[name].description, /^JWT/);
    assert.match(corrected.spec.components.securitySchemes[name].description, /no se envía en este header/);
    corrected.spec.components.securitySchemes[name].description = authBefore.components.securitySchemes[name].description;
  }
  assert.deepEqual(corrected.spec, authBefore, 'Only the two descriptions may change');
  assert.deepEqual(authContract, authBefore, 'Publication never mutates input');
  assert.equal(correctAuthDescriptions(correctAuthDescriptions(authContract, '1platform-api').spec, '1platform-api').changed, 0);
  assert.deepEqual(correctAuthDescriptions(authContract, 'atlas-api'), {spec: authContract, changed: 0});
  assert.throws(() => correctAuthDescriptions({components: {}}, '1platform-api'), /metadata changed/);
  checkOpenApiPublication();
  console.log('ok   example sanitation preserves contract, original input and idempotency');
} else {
  for (const api of ['1platform-api', 'atlas-api']) {
    const path = `static/openapi/${api}.json`;
    const source = JSON.parse(readFileSync(path, 'utf8'));
    if (api === '1platform-api') checkServiceExamples(source);
    assert.equal(illustrativePrefixes(source), 0, `${path}: illustrative key prefixes remain; values withheld`);
    const {changed} = sanitizeOpenApiExamples(source);
    assert.equal(changed, 0, `${path}: ${changed} illustrative credential value(s) require sanitation; values withheld`);
    assert.equal(correctAuthDescriptions(source, api).changed, 0, `${path}: JWT descriptions require publication correction`);
  }
  console.log('ok   no credential-shaped example values');
}
