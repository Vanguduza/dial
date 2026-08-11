# DIAL agent audit prompts

Audit-**only** prompts for Cursor (Lazy Developer–inspired). Run before fixing authz / money / webhook trains. Prefer matching `.cursor/skills/dial-*` skills.

| File | Use |
| --- | --- |
| `endpoint-audit.md` | Auth gaps on mutating / side-effect routes |
| `idor-audit.md` | Object-level AuthZ |
| `secrets-audit.md` | Env radioactivity + bundle leakage |

Authority: `DIAL_Lazy_Developer_Playbook_Adaptations.md` §5; rules in `.cursor/rules/`.
