import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sanitizeOpenApiExamples} from './openapi-examples.mjs';
import {correctAuthDescriptions} from './openapi-auth-descriptions.mjs';
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
  console.log('ok   example sanitation preserves contract, original input and idempotency');
} else {
  for (const api of ['1platform-api', 'atlas-api']) {
    const path = `static/openapi/${api}.json`;
    const source = JSON.parse(readFileSync(path, 'utf8'));
    const {changed} = sanitizeOpenApiExamples(source);
    assert.equal(changed, 0, `${path}: ${changed} illustrative credential value(s) require sanitation; values withheld`);
    assert.equal(correctAuthDescriptions(source, api).changed, 0, `${path}: JWT descriptions require publication correction`);
  }
  console.log('ok   no credential-shaped example values');
}
