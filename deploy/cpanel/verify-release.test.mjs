import assert from 'node:assert/strict';
import {waitForRelease} from './verify-release.mjs';

const good = {status: 200, sha: 'expected', fromOrigin: true};
async function simulate(sample) {
  let time = 0;
  let probes = 0;
  await waitForRelease({want: 'expected', maxWaitMs: 100, stableMs: 45, pollMs: 10,
    now: () => time, sleep: async (ms) => { time += ms; },
    probe: async () => { probes++; return sample(time); }});
  return {time, probes};
}

assert.deepEqual(await simulate(() => good), {time: 50, probes: 6});
assert.deepEqual(await simulate((time) => time < 30 ? {...good, sha: 'previous'} : good), {time: 80, probes: 9});
for (const sample of [
  () => ({...good, sha: 'previous'}),
  () => ({...good, status: 301}),
  () => ({...good, fromOrigin: false}),
  (time) => time < 30 ? good : {...good, sha: 'rolled-back'},
  (time) => time === 30 ? {...good, status: 0} : good,
]) {
  // A mismatch resets the stability interval; a brief success is insufficient.
  if (sample(30).status === 0) {
    assert.deepEqual(await simulate(sample), {time: 90, probes: 10});
  } else {
    await assert.rejects(simulate(sample), /no sostuvo el checksum/);
  }
}
console.log('release verification: 7 stability/checksum/status/origin/rollback cases passed; no network');
