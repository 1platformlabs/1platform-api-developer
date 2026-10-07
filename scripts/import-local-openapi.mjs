/** Import an explicit local Core export. Never fetch or fall back to production. */
import {createHash} from 'node:crypto';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {sanitizeOpenApiExamples} from './openapi-examples.mjs';
import {correctAuthDescriptions} from './openapi-auth-descriptions.mjs';

const [inputPath, sourceCommit] = process.argv.slice(2);
if (!inputPath || !/^[a-f0-9]{40}$/.test(sourceCommit ?? '')) {
  throw new Error('Usage: node scripts/import-local-openapi.mjs <local-export.json> <40-character-api-commit>');
}
const raw = readFileSync(resolve(inputPath), 'utf8');
const source = JSON.parse(raw);
if (!source.openapi || !source.paths?.['/api/v1/transactional-email/messages'] ||
    !source.paths?.['/api/v1/webhooks/deliveries']) {
  throw new Error('The local export must include the implemented SRV Core routes');
}
const {spec: safe, changed: sanitizedExamples} = sanitizeOpenApiExamples(source);
const {spec, changed: authDescriptions} = correctAuthDescriptions(safe, '1platform-api');
spec.servers = [
  {url: 'https://api.1platform.pro', description: 'Production'},
  {url: 'https://api-qa.1platform.pro', description: 'QA'},
];
const artifact = JSON.stringify(spec, null, 2);
writeFileSync(new URL('../static/openapi/1platform-api.json', import.meta.url), artifact);
const sha = (value) => createHash('sha256').update(value).digest('hex');
const provenance = {
  sourceRepository: '1platformlabs/1platform-api', sourceCommit,
  sourceBranch: 'feat/dashboard-prototype-product-integration-srv',
  sourceExportSha256: sha(raw), artifactSha256: sha(artifact),
  generatedAt: new Date().toISOString(), sanitizedExamples, authDescriptions,
  mode: 'local-export; no network; not proof of deployment',
};
writeFileSync(new URL('../SRV-OPENAPI-PROVENANCE.json', import.meta.url), JSON.stringify(provenance, null, 2) + '\n');
console.log(`Imported ${Object.keys(spec.paths).length} Core paths from local commit ${sourceCommit}`);
