import assert from 'node:assert/strict';
import {scalarEnvironment} from '../src/config/scalar-environment.ts';

let checks = 0;
const same = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
same(scalarEnvironment('1platform-api', {}), {proxyUrl: 'https://proxy.scalar.com'});
same(scalarEnvironment('atlas-api', {}), {proxyUrl: 'https://proxy.scalar.com'});
same(scalarEnvironment('1platform-api', {SCALAR_PROXY_URL: ''}), {proxyUrl: ''});
same(scalarEnvironment('atlas-api', {SCALAR_PROXY_URL: 'https://proxy.example.test/request'}), {proxyUrl: 'https://proxy.example.test/request'});
for (const origin of ['http://localhost:8001', 'http://api.localhost:8001', 'http://127.0.0.1:8001', 'http://127.1.2.3:8001', 'http://[::1]:8001', 'https://api.example.test']) {
  same(scalarEnvironment('1platform-api', {SCALAR_PROXY_URL: '', ONEP_API_SERVER_URL: origin}), {
    proxyUrl: '', servers: [{url: origin, description: 'Entorno configurado'}],
  });
}
const bank = Object.freeze({SCALAR_PROXY_URL: '', ONEP_API_SERVER_URL: 'http://127.0.0.1:8001', ATLAS_API_SERVER_URL: 'http://localhost:8101'});
same(scalarEnvironment('1platform-api', bank).servers[0].url, bank.ONEP_API_SERVER_URL);
same(scalarEnvironment('atlas-api', bank).servers[0].url, bank.ATLAS_API_SERVER_URL);
same(scalarEnvironment('atlas-api', {ONEP_API_SERVER_URL: bank.ONEP_API_SERVER_URL}), {proxyUrl: 'https://proxy.scalar.com'});
for (const key of ['SCALAR_PROXY_URL', 'ONEP_API_SERVER_URL', 'ATLAS_API_SERVER_URL']) {
  for (const bad of ['http://api.example.test', 'http://localhost.example.test', 'https://user:password@example.test', 'https://example.test?token=private', 'https://example.test#private', 'file:///tmp/api', 'javascript:void(0)', 'not a URL', ' https://example.test']) {
    const api = key === 'ATLAS_API_SERVER_URL' ? 'atlas-api' : '1platform-api';
    assert.throws(() => scalarEnvironment(api, {[key]: bad}), error => error instanceof Error && error.message.includes(key) && !error.message.includes(bad));
    checks++;
  }
}
for (const key of ['ONEP_API_SERVER_URL', 'ATLAS_API_SERVER_URL']) {
  const api = key === 'ATLAS_API_SERVER_URL' ? 'atlas-api' : '1platform-api';
  for (const bad of ['', 'https://api.example.test/api/v1']) {
    assert.throws(() => scalarEnvironment(api, {[key]: bad}));
    checks++;
  }
}
console.log(`ok   Scalar environment: ${checks} checks; defaults, direct loopback, per-API isolation and invalid URLs; no network requests`);
