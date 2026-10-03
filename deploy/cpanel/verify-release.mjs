#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

const execute = promisify(execFile);

/** Do not accept a transient swap that the origin can still roll back. */
export async function waitForRelease({probe, want, terminalState, maxWaitMs = 720_000, stableMs = 130_000,
  pollMs = 10_000, now = Date.now, sleep = (ms) => new Promise((done) => setTimeout(done, ms)), report = () => {}}) {
  const deadline = now() + maxWaitMs;
  let matchedSince;
  let sawExpected = false;
  while (now() < deadline) {
    const sample = await probe();
    const terminal = terminalState ? await terminalState() : undefined;
    if (terminal?.failed) throw new Error('El activador puso esta versión en cuarentena');
    const matches = sample.status === 200 && sample.sha === want && sample.fromOrigin;
    if (matches) {
      sawExpected = true;
      matchedSince ??= now();
      if (terminal?.available && terminal.deployed) return terminal;
      if (!terminalState && now() - matchedSince >= stableMs) return;
    } else {
      if (sawExpected && sample.status === 200 && sample.fromOrigin && sample.sha !== want) {
        throw new Error('El origen revirtió a otro checksum después de servir este build; revise el rollback del activador');
      }
      matchedSince = undefined;
    }
    report({matches, status: sample.status, sha: sample.sha});
    await sleep(pollMs);
  }
  throw new Error('El release no confirmó checksum, origen y estado terminal; revise el health/rollback del activador');
}

async function main() {
  const bundle = readFileSync('cpanel-dist/BUNDLE_INFO', 'utf8');
  const want = bundle.match(/^index_sha=([a-f0-9]{64})$/m)?.[1];
  const version = bundle.match(/^version=([A-Za-z0-9._-]+)$/m)?.[1];
  if (!want || !version) throw new Error('Bundle sin index_sha o version válida');
  const url = new URL(process.env.ENTRY_PATH ?? '/index.html', process.env.SITE_URL);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/index.html') {
    throw new Error('El probe requiere el index.html HTTPS público sin credenciales ni query');
  }
  const maxWaitMs = Number(process.env.ACTIVATION_TIMEOUT_SECONDS ?? 720) * 1000;
  if (!Number.isFinite(maxWaitMs) || maxWaitMs < 130_000) throw new Error('Ventana de activación inválida');
  const hasPrivateState = ['CPANEL_FTP_HOST', 'CPANEL_FTP_USER', 'CPANEL_FTP_PASS'].every((key) => Boolean(process.env[key]));
  const terminalState = hasPrivateState ? async () => {
    try {
      const {stdout} = await execute('python3', ['deploy/cpanel/read_activation_state.py', version], {timeout: 60_000});
      const state = JSON.parse(stdout);
      return {available: state.available === true, deployed: state.deployed === true, failed: state.failed === true,
        adapterObserved: state.adapterObserved === true, urlEnvPresent: state.urlEnvPresent === true,
        urlEnvMatchesFile: state.urlEnvMatchesFile === true, markerEnvPresent: state.markerEnvPresent === true,
        markerEnvMatchesFile: state.markerEnvMatchesFile === true};
    } catch {
      return {available: false, deployed: false, failed: false};
    }
  } : undefined;
  console.log(`Esperando index_sha ${want.slice(0, 16)}… y estabilidad posterior al health`);
  const terminal = await waitForRelease({want, maxWaitMs, terminalState, probe: async () => {
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
  if (terminal) console.log('Estado terminal privado (sólo booleans): ' + JSON.stringify(terminal));
  console.log(hasPrivateState
    ? 'El origen cPanel sirve ESTE build: checksum exacto, .deployed_version coincidente y sin cuarentena de esta versión'
    : 'El origen cPanel sirve ESTE build: checksum exacto durante al menos 130 s (sin acceso al estado privado)');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => { console.error(`::error::${error.message}`); process.exitCode = 1; });
}
