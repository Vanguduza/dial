import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const featureId = process.argv[2];

if (!featureId) {
  console.error('Usage: pnpm context:pack -- <FEATURE_ID>');
  process.exit(1);
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
}

function readText(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const truth = readJson('docs/project-truth/project-truth.json');
const features = readJson('docs/project-truth/feature-registry.json');
const evidence = readJson('docs/project-truth/evidence-registry.json');
const bundle = readText('docs/project-truth/CONTEXT_BUNDLE.md');
const active = readText('docs/project-truth/ACTIVE_WORK.md');

const feature = features.features.find((x) => x.id.toLowerCase() === featureId.toLowerCase());
if (!feature) {
  console.error(`Unknown Feature ID: ${featureId}`);
  console.error(`Known IDs: ${features.features.map((x) => x.id).join(', ')}`);
  process.exit(2);
}

const featureEvidence = evidence.records.filter((x) => x.featureId === feature.id || (feature.evidence ?? []).includes(x.id));
const outputDir = path.join(root, '.dial', 'context-packs');
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, `${feature.id}.md`);

const nonNegotiables = truth.nonNegotiables.map((x) => `- **${x.id} — ${x.title}:** ${x.rule}`).join('\n');
const soRs = Object.entries(truth.sourcesOfTruth).map(([k, v]) => `- **${k}:** ${v}`).join('\n');
const evidenceText = featureEvidence.length
  ? featureEvidence.map((ev) => [
      `### ${ev.id}`,
      `- Status: ${ev.status}`,
      `- Executed: ${ev.executedAt}`,
      `- Signed off: ${ev.signedOffBy}`,
      `- Minimum gate: ${ev.minimumGate}`,
      `- Proves: ${(ev.proves ?? []).join('; ')}`,
      `- Known limits: ${(ev.knownLimits ?? []).join('; ')}`,
      `- Evidence refs: ${(ev.evidenceRefs ?? []).join(', ')}`,
    ].join('\n')).join('\n\n')
  : '_No accepted evidence registered. Follow the Thin Slice Required path if applicable._';

const activeLines = active.split('\n').filter((line) => line.includes(`\`${feature.id}\``));
const activeText = activeLines.length ? activeLines.join('\n') : '_No active-work row found._';

const pack = `# DIAL Task Context Pack — ${feature.id}\n\n` +
`Generated from repository Project Truth. Do not treat this file as a new authority; regenerate when registries change.\n\n` +
`## Feature\n\n` +
`- **ID:** ${feature.id}\n- **Name:** ${feature.name}\n- **Current gate:** ${feature.currentGate}\n- **Next work:** ${feature.nextWork}\n- **Evidence IDs:** ${(feature.evidence ?? []).join(', ') || 'none'}\n\n` +
`## Inherited evidence\n\n${evidenceText}\n\n` +
`## Non-negotiables\n\n${nonNegotiables}\n\n` +
`## Sources of truth\n\n${soRs}\n\n` +
`## Active work row\n\n${activeText}\n\n` +
`## Short project context\n\n${bundle}\n\n` +
`## Session contract\n\n` +
`1. Keep work bounded to ${feature.id} unless an explicit dependency is recorded.\n` +
`2. Do not downgrade inherited evidence/gates.\n` +
`3. Update Project Truth only for approved durable decisions.\n` +
`4. Update evidence when new validation is accepted.\n` +
`5. Checkpoint before rate-limit exhaustion or session/harness switching.\n` +
`6. Run pnpm context:check before merge/sign-off.\n`;

fs.writeFileSync(output, pack, 'utf8');
console.log(output);
