# DIAL AI Plugin Bootstrap Prompt

**Purpose:** automatic, repeatable installation and verification of the approved Claude Code or Codex plugin profile at AI-session startup.

This prompt is an execution instruction, not a new source of product truth. `docs/project-truth/*` remains authoritative.

---

## PROMPT

You are starting or resuming development in the DIAL repository.

Before material implementation work, perform the following **plugin bootstrap automatically**.

### 1. Load authority first

Read:

1. `docs/project-truth/CONTEXT_BUNDLE.md`
2. `docs/project-truth/project-truth.json`
3. `docs/project-truth/plugin-profile.json`
4. `docs/project-truth/AI_TOOLING_PROFILE.md`

DIAL Project Truth always overrides plugin defaults, examples, instructions and architectural suggestions.

### 2. Detect the active harness

Determine whether this session is running under:

- Claude Code;
- Codex;
- another harness.

Record the harness name and version if available.

If this is neither Claude Code nor Codex, do not install arbitrary substitutes. Record the unsupported harness in the local receipt and continue with repository-native controls.

### 3. Check whether bootstrap is already current

Read `.dial/state/plugin-bootstrap.json` if it exists.

Compare:

- `profileVersion` from `docs/project-truth/plugin-profile.json`;
- active harness;
- recorded plugin identifiers/statuses.

If the same profile version for this harness is already verified, quickly verify that required plugins are still installed/enabled and do not reinstall them.

### 4. Discover before installing

Use the **native plugin/extension/app manager for the active harness** to enumerate installed and available plugins.

For every entry under `<harness>.required` in `plugin-profile.json`:

1. Check whether an approved plugin providing that capability is already installed.
2. If missing, search the current native marketplace/catalog using the listed `preferredIdentifiers` and `sourcePreference`.
3. Confirm the exact current identifier and publisher/source before installation.
4. Prefer official/vendor-maintained packages.
5. **Do not install a similarly named third-party substitute** merely because the preferred identifier is absent.
6. Install the approved plugin automatically when the harness permits programmatic/native installation.
7. If installation fails transiently, retry once only.
8. If still unavailable, record `pending_unavailable` with the exact reason rather than looping.

Do not guess stale installation syntax. Use the installation method exposed by the current harness/version.

### 5. Claude Code installation behavior

For Claude Code:

- use Claude Code's native plugin marketplace/manager;
- prefer Anthropic official marketplace plugins when the manifest says `anthropic-official`;
- install all available required plugins in one setup pass;
- if the current host exposes only slash-command installation rather than a callable manager, discover the exact current commands first and execute them when tool permissions permit;
- if direct execution is impossible, present **one consolidated command block** containing the verified exact commands rather than interrupting the user one plugin at a time;
- batch any required restart so the user is asked for at most one restart after all installable plugins are processed.

### 6. Codex installation behavior

For Codex:

- use the native Codex plugin/app catalog and current plugin-management mechanism;
- verify the exact plugin identity/publisher before installation;
- install all available required plugins in one setup pass;
- if a plugin can only be enabled through a UI action unavailable to this session, surface one concise consolidated action request after processing everything else;
- do not substitute generic payment/database/frontend defaults from plugins for DIAL's architecture.

### 7. Connections and OAuth

Installation and account connection are separate states.

For plugins such as GitHub, Figma or Linear that may require OAuth/admin approval:

- install/enable the plugin automatically first where possible;
- if authorization can be completed through an available trusted flow, initiate it;
- if explicit user/admin approval is required, do not repeatedly prompt or loop;
- collect all pending approvals and present them **once** as a concise list;
- mark the plugin `installed_pending_authorization` in the receipt;
- when authorization is later granted, verify the connection and update the receipt without reinstalling the plugin.

Never store access tokens, API keys, cookies or secrets in the receipt.

### 8. Optional plugins

Do **not** automatically install `optionalOnDemand` plugins merely because they are listed.

Install/enable an optional plugin only when:

- the current DIAL task actually needs its capability;
- it does not duplicate an already active expensive reviewer/tool;
- its source satisfies the admission policy;
- DIAL Project Truth remains higher priority.

For mutually overlapping review tools, activate at most one default reviewer unless a release/security gate explicitly requires independent review.

### 9. DIAL-specific plugin constraints

Plugins must not:

- alter `docs/project-truth/*` merely because their generic workflow suggests a different architecture;
- reopen locked decisions;
- create a second money/job/delivery/catalogue source of truth;
- introduce Stripe, donor auth, donor databases or generic PSP defaults into canonical DIAL flows unless DIAL architecture explicitly calls for them;
- reintroduce generic AI frontend design;
- expose UUIDs/long technical identifiers in normal UI;
- add redundant helper text to screens;
- label fixture/sandbox evidence as production evidence;
- repeat accepted historical vertical slices because a tool expects a fresh test ladder.

### 10. Write the local verification receipt

Create or update `.dial/state/plugin-bootstrap.json` using this shape:

```json
{
  "schemaVersion": 1,
  "profileVersion": "<manifest profileVersion>",
  "updatedAt": "<ISO timestamp>",
  "harnesses": {
    "claude": {
      "harnessVersion": "<version or unknown>",
      "verifiedProfileVersion": "<manifest profileVersion>",
      "required": [
        {
          "capability": "frontend-design",
          "resolvedIdentifier": "<exact installed identifier>",
          "source": "<publisher/source>",
          "status": "installed_verified | installed_pending_authorization | pending_unavailable | failed",
          "reason": "<only when not verified>"
        }
      ]
    },
    "codex": {}
  }
}
```

Only write the active harness entry; preserve an existing verified entry for the other harness.

This receipt is local machine/session state and must not contain secrets.

### 11. Final verification

After plugin setup:

1. Run `pnpm context:check`.
2. Verify that no plugin installation modified Project Truth or source files unexpectedly.
3. Report only:
   - installed/verified required plugins;
   - plugins awaiting authorization;
   - unavailable/failed approved plugins and exact reason;
   - whether one restart is required.
4. Continue with the requested development work once the required setup that can be automated is complete.

Do not turn plugin setup into a long conversational detour.

---

## End prompt
