# User-level Cursor rules

On the export machine there was **no** `%USERPROFILE%\.cursor\rules\` directory and no AppData User `rules` folder.

DIAL project rules stay in the repository:

- `.cursor/rules/dial-*.mdc` — always-on / scoped project locks (**SoR** with `AGENTS.md`)
- Do not copy or merge those into this portable pack as “user rules”

If you later create personal user rules, place them in `%USERPROFILE%\.cursor\rules\` on the machine and re-export into this folder without overwriting project rules.
