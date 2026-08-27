import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function readText(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail(`Missing required file: ${rel}`);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

function readJson(rel) {
  const text = readText(rel);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${rel}: ${error.message}`);
    return null;
  }
}

function uniqueIds(items, label) {
  const seen = new Set();
  for (const item of items ?? []) {
    if (!item?.id) {
      fail(`${label} contains an item without id`);
      continue;
    }
    if (seen.has(item.id)) fail(`${label} contains duplicate id ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

const truth = readJson('docs/project-truth/project-truth.json');
const featureRegistry = readJson('docs/project-truth/feature-registry.json');
const evidenceRegistry = readJson('docs/project-truth/evidence-registry.json');
const bundle = readText('docs/project-truth/CONTEXT_BUNDLE.md');
readText('docs/project-truth/SESSION_HANDOFF_TEMPLATE.md');
readText('.cursor/rules/dial-context-drift.mdc');
readText('.cursor/skills/dial-context-drift-check/SKILL.md');

if (truth && truth.authorityVersion !== 'vNext.1') {
  fail(`Expected authorityVersion vNext.1, got ${truth.authorityVersion}`);
}

const decisionIds = uniqueIds(truth?.nonNegotiables, 'project-truth.nonNegotiables');
const featureIds = uniqueIds(featureRegistry?.features, 'feature-registry.features');
const evidenceIds = uniqueIds(evidenceRegistry?.records, 'evidence-registry.records');

const gates = featureRegistry?.gateOrder ?? [];
const gateRank = new Map(gates.map((g, i) => [g, i]));
if (!gateRank.has('THIN_SLICE_REQUIRED') || !gateRank.has('INTEGRATION_GREEN') || !gateRank.has('PRODUCTION_GREEN')) {
  fail('feature-registry.gateOrder is missing required canonical gates');
}

const featureById = new Map((featureRegistry?.features ?? []).map((f) => [f.id, f]));
const evidenceById = new Map((evidenceRegistry?.records ?? []).map((e) => [e.id, e]));

for (const feature of featureRegistry?.features ?? []) {
  if (!gateRank.has(feature.currentGate)) {
    fail(`Feature ${feature.id} has unknown gate ${feature.currentGate}`);
  }
  for (const evId of feature.evidence ?? []) {
    if (!evidenceIds.has(evId)) fail(`Feature ${feature.id} references missing evidence ${evId}`);
  }
  const rank = gateRank.get(feature.currentGate) ?? -1;
  if (rank >= (gateRank.get('THIN_SLICE_GREEN') ?? 2) && (feature.evidence ?? []).length === 0) {
    fail(`Feature ${feature.id} is ${feature.currentGate} but has no registered evidence`);
  }
}

for (const evidence of evidenceRegistry?.records ?? []) {
  const feature = featureById.get(evidence.featureId);
  if (!feature) {
    fail(`Evidence ${evidence.id} references missing feature ${evidence.featureId}`);
    continue;
  }
  if (!gateRank.has(evidence.minimumGate)) {
    fail(`Evidence ${evidence.id} has unknown minimumGate ${evidence.minimumGate}`);
    continue;
  }
  const current = gateRank.get(feature.currentGate);
  const minimum = gateRank.get(evidence.minimumGate);
  if (current < minimum) {
    fail(`Context drift: feature ${feature.id} is ${feature.currentGate}, below inherited evidence minimum ${evidence.minimumGate} (${evidence.id})`);
  }
}

for (const guarded of truth?.guardedFiles ?? []) {
  const text = readText(guarded.path);
  for (const marker of guarded.mustContain ?? []) {
    if (!text.includes(marker)) {
      fail(`Guarded file ${guarded.path} is missing required context marker: ${marker}`);
    }
  }
}

for (const id of decisionIds) {
  if (!bundle.includes(id)) warn(`Context bundle does not explicitly mention decision ${id}; consider adding it if agents need it frequently.`);
}

for (const id of featureIds) {
  const feature = featureById.get(id);
  if (feature?.currentGate !== 'PLANNED' && !bundle.includes(id)) {
    warn(`Context bundle does not mention active feature ${id} (${feature.currentGate}).`);
  }
}

const tripwires = [
  ['DIAL_OWNED runtime path', /offerSource\s*[:=]\s*["']DIAL_OWNED["']/g],
  ['unofficial WhatsApp Baileys dependency', /from\s+["']@whiskeysockets\/baileys["']|require\(["']@whiskeysockets\/baileys["']\)/g],
  ['unofficial whatsapp-web.js dependency', /from\s+["']whatsapp-web\.js["']|require\(["']whatsapp-web\.js["']\)/g]
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.tmp'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs|kt|kts|swift)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const runtimeRoots = ['apps', 'packages', 'adapters'].map((p) => path.join(root, p));
for (const runtimeRoot of runtimeRoots) {
  for (const file of walk(runtimeRoot)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const [label, pattern] of tripwires) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) fail(`Runtime drift tripwire: ${label} found in ${path.relative(root, file)}`);
    }
  }
}

if (warnings.length) {
  console.warn('\nContext drift warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (failures.length) {
  console.error('\nCONTEXT DRIFT CHECK FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Context drift check passed: ${decisionIds.size} decisions, ${featureIds.size} features, ${evidenceIds.size} evidence records validated.`);
