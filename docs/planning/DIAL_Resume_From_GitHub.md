# Resume DIAL Build from GitHub

Short machine-move / cold-start checklist. Live stage pointer: [`DIAL_Build_Workplan_STATE.md`](./DIAL_Build_Workplan_STATE.md). Active ticket: [issue #7](https://github.com/Vanguduza/dial/issues/7) (S21 T2 Catalogue+Search).

## Critical: do not start from `main`

`origin/main` is still the **initial** commit only. Build progress lives on **feature branches** until stacked PRs merge. Resume on the tip that has STATE + portable pack:

| Prefer | Branch | Notes |
| --- | --- | --- |
| **Tip (recommended)** | `chore/cursor-portable-sync` | Latest content: S21 STATE lineage + `tooling/cursor-portable/` |
| S21 work only | `build/t2-catalogue` | T2 thin vertical; open PR when created — still behind portable tip |

Do **not** merge all open stacked PRs into `main` just to resume. Keep working on the feature tip until reviews land.

## One-liner checkout

```powershell
git clone https://github.com/Vanguduza/dial.git DIAL; cd DIAL; git fetch origin; git checkout chore/cursor-portable-sync; git pull
```

Already cloned:

```powershell
cd C:\Users\j\Desktop\DIAL   # or your clone path
git fetch origin
git checkout chore/cursor-portable-sync
git pull
```

## Auth

1. **GitHub** — `gh auth login` (HTTPS) or SSH key with access to private `Vanguduza/dial`. Confirm: `gh repo view Vanguduza/dial`.
2. **Cursor** — sign in on the new machine (`auth.json` is not portable).
3. **Cursor Agent / bridge** — `agent login` or set `CURSOR_API_KEY` for Prime’s local Cursor proxy.
4. **App secrets** — copy `.env*` from a secure store by **name only**; never commit or paste into chat. Refer Pack / Agent Pack for required names (`INTERNAL_API_SECRET`, etc.).

## pnpm / PRIORITY 0

Requires Node ≥ 20 and pnpm 9.x.

```powershell
pnpm install
pnpm typecheck
pnpm test
```

Confirm `origin` → `Vanguduza/dial`, lefthook hooks install, and post-commit auto-push scripts exist (`scripts/git-auto-push.ps1` / `.sh`).

## Prime + Dev Manager (D-61)

```powershell
npm i -g prime-agent cursor-api-proxy
# Cursor Agent CLI logged in (see Auth)
powershell -ExecutionPolicy Bypass -File .\scripts\start-dial-dev-manager-prime.ps1
```

Or expand `/dev-manager` inside an existing Prime session. Paste prompt: [`docs/prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md`](../prompts/DIAL_DEV_MANAGER_CURSOR_PROMPT.md). Defaults: Cursor provider, **`auto`** model — do not manually switch for Dev Manager/subagents.

## Cursor portable UX restore

User settings/skills (not project SoR): follow [`tooling/cursor-portable/RESTORE.md`](../../tooling/cursor-portable/RESTORE.md). Do **not** overwrite repo `.cursor/rules` / `dial-*` skills from the portable pack.

## After resume — pick up Build

1. Read [`DIAL_Build_Workplan_STATE.md`](./DIAL_Build_Workplan_STATE.md) (`current_stage` / `current_issue` / `current_branch`).
2. Continue [issue #7](https://github.com/Vanguduza/dial/issues/7) on `build/t2-catalogue` (or merge-forward from tip if needed).
3. Open PRs stay stacked against `main` until approved — resume on branches, not on unmerged `main`.

## Open stacked PRs (do not bulk-merge)

| PR | Branch |
| --- | --- |
| [#2](https://github.com/Vanguduza/dial/pull/2) | `build/e2a-spare-wa-checkout` |
| [#6](https://github.com/Vanguduza/dial/pull/6) | `build/e1b-daily-zig` |
| [#8](https://github.com/Vanguduza/dial/pull/8) | `build/t1-identity` |
| [#9](https://github.com/Vanguduza/dial/pull/9) | `chore/cursor-portable-sync` |
| [#10](https://github.com/Vanguduza/dial/pull/10) | `build/t2-catalogue` (S21 T2) |

Authority: v4 / Pack / `AGENTS.md`. Idle ban: [`DIAL_Dev_Manager_Autonomous_Runbook.md`](./DIAL_Dev_Manager_Autonomous_Runbook.md).
