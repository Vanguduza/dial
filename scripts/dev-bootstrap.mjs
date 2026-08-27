import fs from 'node:fs';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const hookTarget = args.find((x) => x.startsWith('--hook='))?.split('=')[1] ?? null;
const checkpoint = args.find((x) => x.startsWith('--checkpoint='))?.split('=')[1] ?? null;
const quiet = args.includes('--quiet') || Boolean(hookTarget);

function resolveRepoRoot() {
  if (process.env.CLAUDE_PROJECT_DIR && fs.existsSync(process.env.CLAUDE_PROJECT_DIR)) {
    return process.env.CLAUDE_PROJECT_DIR;
  }
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
}

const root = resolveRepoRoot();
process.chdir(root);

const required = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/project-truth/CONTEXT_BUNDLE.md',
  'docs/project-truth/project-truth.json',
  'docs/project-truth/feature-registry.json',
  'docs/project-truth/evidence-registry.json',
  'docs/project-truth/ACTIVE_WORK.md',
  'docs/project-truth/SESSION_HANDOFF_TEMPLATE.md',
  'docs/project-truth/AI_TOOLING_PROFILE.md',
  'docs/project-truth/plugin-profile.json',
  'docs/prompts/DIAL_AI_PLUGIN_BOOTSTRAP_PROMPT.md',
  'scripts/check-context-drift.mjs',
  'scripts/build-context-pack.mjs',
];

const failures = [];
const notes = [];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing required project-memory asset: ${rel}`);
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 20) failures.push(`Node >=20 required; found ${process.versions.node}`);

const dialDir = path.join(root, '.dial');
const stateDir = path.join(dialDir, 'state');
const contextDir = path.join(dialDir, 'context-packs');
fs.mkdirSync(stateDir, { recursive: true });
fs.mkdirSync(contextDir, { recursive: true });

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch {
    return null;
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    return '';
  }
}

function gitValue(gitArgs, fallback = 'unknown') {
  try {
    return execFileSync('git', gitArgs, { cwd: root, encoding: 'utf8' }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function runNode(script, scriptArgs = [], { required: isRequired = true } = {}) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...scriptArgs], {
    cwd: root,
    encoding: 'utf8',
    stdio: quiet ? 'pipe' : 'inherit',
  });
  if (result.status !== 0 && isRequired) {
    failures.push(`${script} failed with exit ${result.status ?? 'unknown'}${result.stderr ? `: ${result.stderr.trim()}` : ''}`);
  }
  return result;
}

// Development-only local secrets are generated exactly once and preserved on later runs.
// Real PSP/Meta/ZIMRA/provider keys are never invented here.
if (!fs.existsSync(path.join(root, '.env.local')) && fs.existsSync(path.join(root, 'scripts/gen-local-secrets.mjs'))) {
  const r = runNode('scripts/gen-local-secrets.mjs');
  if (r.status === 0) notes.push('created .env.local with development-only local stack credentials');
}

// Deterministic drift gate is cheap enough to run on every development/session start.
if (fs.existsSync(path.join(root, 'scripts/check-context-drift.mjs'))) {
  const r = runNode('scripts/check-context-drift.mjs');
  if (r.status === 0) notes.push('context drift check green');
}

// Install project git hooks when dependencies are already present. Never install packages from a session hook.
const lefthookCandidates = process.platform === 'win32'
  ? ['node_modules/.bin/lefthook.cmd', 'node_modules/.bin/lefthook.exe', 'node_modules/.bin/lefthook']
  : ['node_modules/.bin/lefthook'];
const lefthook = lefthookCandidates.map((p) => path.join(root, p)).find(fs.existsSync);
if (lefthook && fs.existsSync(path.join(root, '.git'))) {
  const r = spawnSync(lefthook, ['install'], { cwd: root, encoding: 'utf8', stdio: quiet ? 'pipe' : 'ignore' });
  if (r.status === 0) notes.push('lefthook installed/verified');
}

const truth = readJson('docs/project-truth/project-truth.json');
const features = readJson('docs/project-truth/feature-registry.json');
const evidence = readJson('docs/project-truth/evidence-registry.json');
const pluginProfile = readJson('docs/project-truth/plugin-profile.json');
const pluginReceipt = readJson('.dial/state/plugin-bootstrap.json');
const contextBundle = readText('docs/project-truth/CONTEXT_BUNDLE.md');
const activeWork = readText('docs/project-truth/ACTIVE_WORK.md');

const branch = gitValue(['branch', '--show-current']);
const commit = gitValue(['rev-parse', '--short', 'HEAD']);
const authorityVersion = truth?.authorityVersion ?? 'unknown';
const pluginProfileVersion = pluginProfile?.profileVersion ?? 'unknown';
const activeFeatureRows = activeWork.split(/\r?\n/).filter((line) => /^\|/.test(line) && /`[A-Za-z0-9-]+`/.test(line));

const normalizedHarness = hookTarget === 'claude'
  ? 'claude'
  : hookTarget === 'codex'
    ? 'codex'
    : null;
const harnessReceipt = normalizedHarness ? pluginReceipt?.harnesses?.[normalizedHarness] : null;
const pluginBootstrapRequired = Boolean(
  normalizedHarness &&
  pluginProfileVersion !== 'unknown' &&
  harnessReceipt?.verifiedProfileVersion !== pluginProfileVersion,
);

if (pluginBootstrapRequired) {
  notes.push(`AI plugin bootstrap required for ${normalizedHarness} profile ${pluginProfileVersion}`);
} else if (normalizedHarness && pluginProfileVersion !== 'unknown') {
  notes.push(`AI plugin profile ${pluginProfileVersion} already verified for ${normalizedHarness}`);
}

const pluginContext = normalizedHarness
  ? [
      '## AI plugin bootstrap',
      '',
      `- Harness: ${normalizedHarness}`,
      `- Approved profile version: ${pluginProfileVersion}`,
      `- Status: ${pluginBootstrapRequired ? 'PLUGIN_BOOTSTRAP_REQUIRED' : 'PLUGIN_PROFILE_VERIFIED'}`,
      '',
      ...(pluginBootstrapRequired
        ? [
            '**Before material work**, execute `docs/prompts/DIAL_AI_PLUGIN_BOOTSTRAP_PROMPT.md` for this harness.',
            'Automatically install/verify all available `required` entries from `docs/project-truth/plugin-profile.json` using the current harness native plugin manager.',
            'Do not install unapproved substitutes. Batch OAuth/admin approvals into one concise user request. Write the local receipt to `.dial/state/plugin-bootstrap.json`.',
          ]
        : [
            'Required plugins were previously verified for this profile. Do a lightweight presence check; do not reinstall without cause.',
          ]),
      '',
    ].join('\n')
  : [
      '## AI plugin bootstrap',
      '',
      `- Approved profile version: ${pluginProfileVersion}`,
      '- Plugin installation is performed by Claude Code/Codex SessionStart, not by ordinary application runtime startup.',
      '',
    ].join('\n');

const sessionContext = [
  '# DIAL Automatic Session Context',
  '',
  `- Authority: ${authorityVersion}`,
  `- Branch: ${branch}`,
  `- Commit: ${commit}`,
  `- Registered features: ${features?.features?.length ?? 0}`,
  `- Accepted evidence records: ${evidence?.records?.length ?? 0}`,
  `- Approved plugin profile: ${pluginProfileVersion}`,
  '',
  pluginContext,
  '## Active work',
  '',
  activeFeatureRows.length ? activeFeatureRows.join('\n') : '_No active feature rows detected._',
  '',
  '## Mandatory project context',
  '',
  contextBundle,
  '',
  '## Session rule',
  '',
  'Before material work, identify the affected Feature ID and use `pnpm context:pack -- <FEATURE_ID>` for complex work. Do not reconstruct current truth from conversation history.',
].join('\n');

fs.writeFileSync(path.join(dialDir, 'ACTIVE_SESSION_CONTEXT.md'), `${sessionContext}\n`, 'utf8');

const state = {
  schemaVersion: 1,
  bootstrappedAt: new Date().toISOString(),
  authorityVersion,
  branch,
  commit,
  node: process.versions.node,
  hookTarget,
  checkpoint,
  pluginProfileVersion,
  pluginBootstrapRequired,
  failures,
  notes,
};
fs.writeFileSync(path.join(stateDir, 'bootstrap.json'), `${JSON.stringify(state, null, 2)}\n`, 'utf8');

if (checkpoint) {
  fs.writeFileSync(path.join(stateDir, `checkpoint-${checkpoint}.json`), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

if (hookTarget) {
  const hookEventName = checkpoint === 'session-end' ? 'SessionEnd' : 'SessionStart';
  const payload = {
    continue: failures.length === 0,
    stopReason: failures.length ? `DIAL bootstrap failed: ${failures.join('; ')}` : undefined,
    hookSpecificOutput: hookEventName === 'SessionStart'
      ? { hookEventName: 'SessionStart', additionalContext: sessionContext }
      : { hookEventName: 'SessionEnd' },
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
} else {
  if (failures.length) {
    console.error('\nDIAL development bootstrap FAILED');
    for (const failure of failures) console.error(`- ${failure}`);
  } else if (!quiet) {
    console.log(`\nDIAL development bootstrap green (${authorityVersion}, ${branch}@${commit})`);
    for (const note of notes) console.log(`- ${note}`);
    console.log('- active session context: .dial/ACTIVE_SESSION_CONTEXT.md');
    console.log(`- approved AI plugin profile: ${pluginProfileVersion} (verified at Claude/Codex SessionStart)`);
  }
}

process.exit(failures.length ? 1 : 0);
