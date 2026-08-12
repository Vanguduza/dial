# Restore Cursor portable pack on a new machine

Windows paths below. Adjust if using macOS/Linux (`~/Library/Application Support/Cursor/User`, `~/.cursor`).

**Prereq:** Install [Cursor](https://cursor.com), open it once (creates User + `.cursor` dirs), then quit Cursor before copying files.

## 1. Settings (AppData User)

From repo `tooling/cursor-portable/settings/`:

| Source | Destination |
| --- | --- |
| `settings.json` | `%APPDATA%\Cursor\User\settings.json` |
| `snippets\` (if any files) | `%APPDATA%\Cursor\User\snippets\` |

PowerShell (from repo root):

```powershell
$pack = ".\tooling\cursor-portable"
$user = "$env:APPDATA\Cursor\User"
Copy-Item "$pack\settings\settings.json" "$user\settings.json" -Force
# keybindings.json was absent on the source machine — skip unless you add one later
if (Test-Path "$pack\settings\keybindings.json") {
  Copy-Item "$pack\settings\keybindings.json" "$user\keybindings.json" -Force
}
```

Then **re-enter secrets in Cursor Settings UI** (or env vars). Do **not** paste keys into committed files.

Known redaction on export: `cursor.anthropicApiKey` (and any other API keys) were stripped. Prefer Cursor account / env over storing keys in `settings.json`.

## 2. User `.cursor` home

```powershell
$pack = ".\tooling\cursor-portable"
$c = "$env:USERPROFILE\.cursor"
New-Item -ItemType Directory -Force -Path "$c\skills","$c\skills-cursor","$c\agents" | Out-Null

# User skills
Copy-Item "$pack\skills\*" "$c\skills\" -Recurse -Force

# Built-in-style skills-cursor mirror (Cursor may also sync these; safe to seed)
Copy-Item "$pack\skills-cursor\*" "$c\skills-cursor\" -Recurse -Force

# CLI preferences (auth stripped — you must `agent login` / set CURSOR_API_KEY)
Copy-Item "$pack\settings\cli-config.json" "$c\cli-config.json" -Force

# argv — optional; Cursor regenerates crash-reporter-id
Copy-Item "$pack\settings\argv.json" "$c\argv.json" -Force
```

## 3. Optional Claude-adjacent skills (if you use them from Cursor)

Source machine had skills under `%USERPROFILE%\.claude\skills` (gepeto, pinokio):

```powershell
$pack = ".\tooling\cursor-portable"
$claude = "$env:USERPROFILE\.claude\skills"
New-Item -ItemType Directory -Force -Path $claude | Out-Null
Copy-Item "$pack\skills-claude\*" $claude -Recurse -Force
```

## 4. Agents

`%USERPROFILE%\.cursor\agents` was **empty** on the source machine. Nothing to restore. Custom agents created later can live there; DIAL project agents/rules remain under repo `.cursor/` + `AGENTS.md`.

## 5. Hooks (optional — machine paths)

Source used **claude-mem** hooks via Bun. Template: `templates/hooks.json.template`.

1. Install Bun + clone/install [claude-mem](https://github.com/) worker at a stable path (or skip hooks if unused).
2. Copy template → `%USERPROFILE%\.cursor\hooks.json`.
3. Replace:
   - `PLACEHOLDER_BUN_EXE` → e.g. `C:\\Users\\<you>\\.bun\\bin\\bun.exe`
   - `PLACEHOLDER_CLAUDE_MEM_WORKER` → path to `worker-service.cjs`

If claude-mem is not installed, **omit** `hooks.json` (do not leave broken absolute paths).

## 6. MCP (optional)

No committed `mcp.json` with secrets existed at user level. Use `templates/mcp.json.template` as a starting point:

- Cursor project MCP: often under Cursor Settings → MCP, or project `.cursor` / UI config.
- Put secrets only in environment variables referenced as `${VAR_NAME}`.
- Never commit real tokens.

Built-in Cursor MCP servers (app-control, ide-browser) are app-provided — no restore needed after Cursor install.

## 7. DIAL project SoR (do not replace)

After cloning DIAL:

1. Keep repo `.cursor/rules/*.mdc` and `.cursor/skills/dial-*` as-is (git checkout).
2. Read `AGENTS.md` — project instruction SoR.
3. Do **not** copy this pack into `.cursor/rules` or overwrite `dial-*` skills.

Project dial-* skills and user skills coexist: project under repo `.cursor/skills/`, user under `%USERPROFILE%\.cursor\skills\`.

## 8. Extensions / auth / caches (manual)

| Item | Action |
| --- | --- |
| Cursor login | Sign in (Google/etc.) — `auth.json` not portable |
| Agent CLI | `agent login` or set `CURSOR_API_KEY` |
| Extensions | Source had remote-containers / remote-ssh / remote-wsl — reinstall from marketplace if needed |
| `state.vscdb`, History, Cache, workspaceStorage | **Skipped** — too large / session state |
| `%APPDATA%\Cursor\auth.json`, `machineid` | **Skipped** — secrets / machine id |

## 9. Verify

1. Open Cursor → Settings: color scheme + git autofetch present; **no** leaked API keys in JSON.
2. Agent skills list includes user skills (`emil-design-eng`, animation skills) and dial-* when DIAL workspace is open.
3. Open DIAL → confirm `.cursor/rules` dial-* rules still load (`AGENTS.md` reading order).
4. Optional: Prime harness still via repo `.prime/agent/` + `scripts/start-dial-dev-manager-prime.ps1` (separate from this pack).

## 10. Security note

If the old machine stored API keys in `settings.json`, **rotate those keys** after moving. This pack never contains them.
