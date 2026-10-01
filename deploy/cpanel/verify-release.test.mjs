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
    await assert.rejects(simulate(sample), /no confirmó checksum|revirtió a otro checksum/);
  }
}
let clock = 0;
await assert.rejects(waitForRelease({want: 'expected', maxWaitMs: 180_000, pollMs: 10_000,
  now: () => clock, sleep: async (ms) => { clock += ms; },
  probe: async () => clock < 90_000 ? good : {...good, sha: 'late-rollback'},
}), /revirtió/);
assert.equal(clock, 90_000);
clock = 0;
await waitForRelease({want: 'expected', maxWaitMs: 180_000, pollMs: 10_000,
  now: () => clock, sleep: async (ms) => { clock += ms; }, probe: async () => good,
});
assert.equal(clock, 130_000);
for (const state of [{available: true, deployed: false, failed: true}, {available: false, deployed: false, failed: false}]) {
  clock = 0;
  await assert.rejects(waitForRelease({want: 'expected', maxWaitMs: 100, pollMs: 10,
    now: () => clock, sleep: async (ms) => { clock += ms; }, probe: async () => good,
    terminalState: async () => state,
  }), /cuarentena|no confirmó/);
}
await waitForRelease({want: 'expected', probe: async () => good,
  terminalState: async () => ({available: true, deployed: true, failed: false}),
});
console.log('release verification: 12 checksum/origin/late-rollback/terminal-state cases passed; no network');
