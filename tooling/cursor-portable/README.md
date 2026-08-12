# Cursor portable pack (user UX)

Snapshot of **user-level** Cursor settings, skills, and agent-adjacent config from the Build machine, sanitized for git.

## Relationship to DIAL project `.cursor/`

| Location | Role | SoR? |
| --- | --- | --- |
| Repo [`.cursor/rules/`](../../.cursor/rules/), [`.cursor/skills/dial-*`](../../.cursor/skills/), [`AGENTS.md`](../../AGENTS.md) | DIAL project locks, dial-* skills, agent entrypoint | **Yes** — project instruction SoR |
| This pack `tooling/cursor-portable/` | Personal Cursor UX (settings, user skills, skills-cursor mirrors, optional hooks/MCP templates) | No — restores editor/agent **environment** only |

**Never** overwrite or replace DIAL `.cursor/rules` or `dial-*` skills with this pack. Merge user skills beside project skills; keep project rules untouched.

## Layout

```
tooling/cursor-portable/
  README.md                 # this file
  RESTORE.md                # exact restore steps (new machine)
  INVENTORY.md              # copied vs skipped / redacted
  settings/
    settings.json           # sanitized User settings
    cli-config.json         # sanitized Agent CLI prefs (no auth)
    argv.json               # portable argv (no crash-reporter-id)
    snippets/               # empty on source machine
  skills/                   # %USERPROFILE%\.cursor\skills
  skills-cursor/            # %USERPROFILE%\.cursor\skills-cursor (SKILL trees)
  skills-claude/            # optional %USERPROFILE%\.claude\skills (gepeto, pinokio)
  agents/                   # empty placeholder (.gitkeep)
  rules/                    # no user-level rules on source; see README there
  templates/
    hooks.json.template     # claude-mem hooks with path placeholders
    mcp.json.template       # MCP servers with env placeholders only
```

## Quick restore

See **[RESTORE.md](./RESTORE.md)**. Summary: copy `settings/*` → `%APPDATA%\Cursor\User\` and `%USERPROFILE%\.cursor\`; copy skill trees → `%USERPROFILE%\.cursor\skills` and `skills-cursor`; sign in to Cursor; re-enter API keys in UI (never from git); optionally install hooks/MCP from templates after filling placeholders.
