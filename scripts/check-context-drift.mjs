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

function uniqueCapabilities(items, label) {
  const seen = new Set();
  for (const item of items ?? []) {
    if (!item?.capability) {
      fail(`${label} contains an item without capability`);
      continue;
    }
    if (seen.has(item.capability)) fail(`${label} contains duplicate capability ${item.capability}`);
    seen.add(item.capability);
  }
  return seen;
}

const truth = readJson('docs/project-truth/project-truth.json');
const featureRegistry = readJson('docs/project-truth/feature-registry.json');
const evidenceRegistry = readJson('docs/project-truth/evidence-registry.json');
const pluginProfile = readJson('docs/project-truth/plugin-profile.json');
const bundle = readText('docs/project-truth/CONTEXT_BUNDLE.md');
readText('docs/project-truth/SESSION_HANDOFF_TEMPLATE.md');
readText('docs/project-truth/AI_TOOLING_PROFILE.md');
readText('docs/prompts/DIAL_AI_PLUGIN_BOOTSTRAP_PROMPT.md');
readText('.cursor/rules/dial-context-drift.mdc');
readText('.cursor/skills/dial-context-drift-check/SKILL.md');
const gitignore = readText('.gitignore');

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

// Approved AI plugin profile is part of the context-control plane.
if (pluginProfile) {
  if (!pluginProfile.profileVersion || typeof pluginProfile.profileVersion !== 'string') {
    fail('plugin-profile.json must define a string profileVersion');
  }
  const policy = pluginProfile.policy ?? {};
  if (policy.autoInstallRequired !== true) {
    fail('plugin-profile policy must keep autoInstallRequired=true');
  }
  if (policy.autoInstallOptional !== false) {
    fail('plugin-profile policy must keep autoInstallOptional=false; optional plugins are task-gated');
  }
  if (policy.allowUnapprovedSubstitutes !== false) {
    fail('plugin-profile policy must forbid unapproved substitutes');
  }
  if (policy.projectTruthPrecedence !== true) {
    fail('plugin-profile policy must keep projectTruthPrecedence=true');
  }
  if (policy.receiptPath !== '.dial/state/plugin-bootstrap.json') {
    fail('plugin-profile receiptPath must remain .dial/state/plugin-bootstrap.json');
  }

  for (const harnessName of ['claudeCode', 'codex']) {
    const harness = pluginProfile[harnessName];
    if (!harness) {
      fail(`plugin-profile is missing ${harnessName}`);
      continue;
    }
    const requiredCaps = uniqueCapabilities(harness.required, `plugin-profile.${harnessName}.required`);
    const optionalCaps = uniqueCapabilities(harness.optionalOnDemand, `plugin-profile.${harnessName}.optionalOnDemand`);

    for (const item of harness.required ?? []) {
      if (!Array.isArray(item.preferredIdentifiers) || item.preferredIdentifiers.length === 0) {
        fail(`Required plugin capability ${harnessName}.${item.capability} must list preferredIdentifiers`);
      }
      if (!Array.isArray(item.sourcePreference) || item.sourcePreference.length === 0) {
        fail(`Required plugin capability ${harnessName}.${item.capability} must list sourcePreference`);
      }
      if (!item.reason) fail(`Required plugin capability ${harnessName}.${item.capability} must explain its DIAL value`);
    }

    for (const cap of requiredCaps) {
      if (optionalCaps.has(cap)) {
        fail(`Plugin capability ${harnessName}.${cap} cannot be both required and optional`);
      }
    }
  }
}

if (!gitignore.split(/\r?\n/).some((line) => line.trim() === '.dial/')) {
  fail('.gitignore must contain .dial/ so machine-specific plugin/session state cannot be committed');
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
    if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.tmp', '.dial'].includes(entry.name)) continue;
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

console.log(`Context drift check passed: ${decisionIds.size} decisions, ${featureIds.size} features, ${evidenceIds.size} evidence records, plugin profile ${pluginProfile?.profileVersion ?? 'unknown'} validated.`);
