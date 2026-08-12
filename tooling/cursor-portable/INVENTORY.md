# Inventory — Cursor portable export

Exported: 2026-08-12 from Windows user `j` → `tooling/cursor-portable/`.

## Copied (sanitized)

| Source | Pack path | Notes |
| --- | --- | --- |
| `%APPDATA%\Cursor\User\settings.json` | `settings/settings.json` | **Redacted** `cursor.anthropicApiKey`; fixed missing comma in source JSON |
| `%USERPROFILE%\.cursor\cli-config.json` | `settings/cli-config.json` | **Removed** `authInfo` (email, userId, authId) |
| `%USERPROFILE%\.cursor\argv.json` | `settings/argv.json` | **Removed** `crash-reporter-id` |
| `%USERPROFILE%\.cursor\skills\` | `skills/` | emil-design-eng, improve-animations, review-animations |
| `%USERPROFILE%\.cursor\skills-cursor\` | `skills-cursor/` | 20 skill trees; omitted `.sync-manifest.json` |
| `%USERPROFILE%\.claude\skills\` | `skills-claude/` | gepeto, pinokio (optional Cursor-visible skills) |
| (derived) | `templates/hooks.json.template` | From `hooks.json` with path placeholders |
| (derived) | `templates/mcp.json.template` | Placeholder only — no real MCP secrets on disk |

## Skipped (with reason)

| Path / item | Reason |
| --- | --- |
| `%APPDATA%\Cursor\User\keybindings.json` | Not present on source |
| `%APPDATA%\Cursor\User\snippets\*` | Directory empty |
| `%USERPROFILE%\.cursor\agents\*` | Empty (0 files) |
| `%USERPROFILE%\.cursor\rules\` | Does not exist (user rules live in project `.cursor/rules` for DIAL) |
| `%USERPROFILE%\.cursor\hooks.json` | Machine-specific Bun/claude-mem absolute paths → template only |
| `%USERPROFILE%\.cursor\mcp.json` | Not present |
| `%APPDATA%\Cursor\auth.json` | Auth secrets |
| `%APPDATA%\Cursor\machineid`, `Local State`, `Preferences` | Machine / session |
| `%APPDATA%\Cursor\User\globalStorage\state.vscdb*` | Large DB + session/secrets risk |
| `%APPDATA%\Cursor\User\History`, `workspaceStorage` | Local history / workspace state |
| `%APPDATA%\Cursor\Cache*`, `CachedData`, `GPUCache`, `Code Cache`, logs | Caches |
| `%USERPROFILE%\.cursor\extensions\` (~5 MB) | Reinstall from marketplace (remote-ssh/wsl/containers) |
| `%USERPROFILE%\.cursor\plugins\` | Empty / not needed |
| `%USERPROFILE%\.cursor\projects\**` | Per-workspace transcripts, MCP descriptors, terminals — not portable UX |
| `%USERPROFILE%\.cursor\chats`, `ai-tracking`, `browser-logs`, `statsig-cache.json`, `ide_state.json`, `agent-cli-state.json` | Runtime / PII / cache |
| DIAL repo `.cursor/rules`, `.cursor/skills/dial-*` | **Already in repo** — project SoR; do not duplicate into this pack |
| Repo / machine `.prime/` | Separate D-61 harness; already partially in repo `.prime/agent/` |

## Redactions applied

1. **API key** removed from User `settings.json` (`cursor.anthropicApiKey`).
2. **authInfo** block removed from `cli-config.json`.
3. **crash-reporter-id** removed from `argv.json`.
4. Hooks absolute paths replaced with `PLACEHOLDER_*` in template.
5. MCP template uses `${EXAMPLE_API_KEY}` only.

## Gaps (expect manual work on new PC)

- Cursor account login + Agent CLI auth
- Re-add any Anthropic/other API keys via UI or env (prefer not settings.json)
- Reinstall remote-* extensions if needed
- Restore claude-mem + Bun if hooks desired
- Configure real MCP servers from template
- Custom keybindings/snippets if created after this snapshot
- Any new custom agents under `~/.cursor/agents`
