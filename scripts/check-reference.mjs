import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {operationAliases} from '../src/components/ApiReferencePage/operation-aliases.ts';
const minimal = {paths: {'/v1/example/{id}': {parameters: [], post: {operationId: 'example', tags: ['Example & Work']}}}};
assert.equal(operationAliases(minimal).get('#operation/example'), '#tag/example-work/POST/v1/example/{id}');
assert.equal(operationAliases(minimal).get('#tag/example-work'), undefined);
assert.equal(operationAliases(minimal).get('#tag/example-work/POST/v1/example/{id}'), undefined);
assert.equal(operationAliases({paths: {'/health': {get: {}}}}).size, 0);
for (const api of ['1platform-api', 'atlas-api']) {
  const spec = JSON.parse(readFileSync(`static/openapi/${api}.json`, 'utf8'));
  const aliases = operationAliases(spec);
  const operations = Object.values(spec.paths).flatMap(methods => Object.entries(methods).filter(([method, operation]) => /^(get|post|put|patch|delete|head|options|trace)$/.test(method) && operation.operationId).map(([, operation]) => operation.operationId));
  assert.equal(aliases.size, new Set(operations).size);
  for (const id of operations) assert(aliases.has(`#operation/${id}`));
  console.log(`ok   ${api}: ${aliases.size} operation aliases, native hashes unchanged`);
}
