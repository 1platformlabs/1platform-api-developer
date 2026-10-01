#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

/** Do not accept a transient swap that the origin can still roll back. */
export async function waitForRelease({probe, want, maxWaitMs = 720_000, stableMs = 45_000,
  pollMs = 10_000, now = Date.now, sleep = (ms) => new Promise((done) => setTimeout(done, ms)), report = () => {}}) {
  const deadline = now() + maxWaitMs;
  let matchedSince;
  let sawExpected = false;
  while (now() < deadline) {
    const sample = await probe();
    const matches = sample.status === 200 && sample.sha === want && sample.fromOrigin;
    if (matches) {
      sawExpected = true;
      matchedSince ??= now();
      if (now() - matchedSince >= stableMs) return;
    } else {
      if (sawExpected && sample.status === 200 && sample.fromOrigin && sample.sha !== want) {
        throw new Error('El origen revirtió a otro checksum después de servir este build; revise el rollback del activador');
      }
      matchedSince = undefined;
    }
    report({matches, status: sample.status, sha: sample.sha});
    await sleep(pollMs);
  }
  throw new Error('El release no sostuvo el checksum y origen esperados durante 45 s; revise el health/rollback del activador');
}

async function main() {
  const want = readFileSync('cpanel-dist/BUNDLE_INFO', 'utf8').match(/^index_sha=([a-f0-9]{64})$/m)?.[1];
  if (!want) throw new Error('Bundle sin index_sha válido');
  const url = new URL(process.env.ENTRY_PATH ?? '/index.html', process.env.SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/index.html') {
    throw new Error('El probe requiere el index.html HTTPS público sin credenciales ni query');
  }
  const maxWaitMs = Number(process.env.ACTIVATION_TIMEOUT_SECONDS ?? 720) * 1000;
  if (!Number.isFinite(maxWaitMs) || maxWaitMs < 45_000) throw new Error('Ventana de activación inválida');
  console.log(`Esperando index_sha ${want.slice(0, 16)}… y estabilidad posterior al health`);
  await waitForRelease({want, maxWaitMs, probe: async () => {
    try {
      const response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(20_000)});
      const sha = createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
      return {status: response.status, sha, fromOrigin: /litespeed/i.test(response.headers.get('x-turbo-charged-by') ?? '')};
    } catch {
      return {status: 0, sha: '', fromOrigin: false};
    }
  }, report: ({matches, status, sha}) => {
    console.log(`  ${matches ? 'Checksum correcto; confirmando estabilidad' : 'Todavía no coincide'} (HTTP ${status}, sha ${sha.slice(0, 16) || 'ausente'})`);
  }});
  console.log('El origen cPanel sirve ESTE build de forma estable (checksum exacto durante al menos 45 s)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`::error::${error.message}`); process.exitCode = 1; });
}
