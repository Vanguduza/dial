# -*- coding: utf-8 -*-
"""Compile DIAL_Complete_Plan_and_Development_Pack.md with full verbatim embeds."""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

ROOT = Path(r"C:\Users\j\Desktop\DIAL")
OUT = ROOT / "DIAL_Complete_Plan_and_Development_Pack.md"
OUT_NAME = OUT.name


def rel(p: Path) -> str:
    return p.relative_to(ROOT).as_posix()


def fence_lang(path: Path) -> str:
    ext = path.suffix.lower()
    return {
        ".md": "markdown",
        ".mdc": "markdown",
        ".json": "json",
        ".yml": "yaml",
        ".yaml": "yaml",
        ".ts": "typescript",
        ".example": "dotenv",
    }.get(ext, "")


def collect() -> list[Path]:
    files: list[Path] = []
    seen: set[str] = set()

    def add(p: Path) -> None:
        if not p.is_file():
            return
        key = rel(p)
        if key in seen:
            return
        if p.name == OUT_NAME:
            return  # never embed the pack into itself
        seen.add(key)
        files.append(p)

    # 1. Root DIAL_*.md (sorted), skip pack itself
    for p in sorted(ROOT.glob("DIAL_*.md")):
        add(p)

    # 2. AGENTS.md
    add(ROOT / "AGENTS.md")

    # 3. docs security / threat-models / agent-audits
    for sub in ("docs/security", "docs/threat-models", "docs/agent-audits"):
        d = ROOT / sub
        if d.is_dir():
            for p in sorted(d.rglob("*.md")):
                add(p)

    # 4. ThreatDragonModels JSON
    td = ROOT / "ThreatDragonModels"
    if td.is_dir():
        for p in sorted(td.rglob("*.json")):
            add(p)

    # 5. Security workflows + renovate + dependabot
    wf = ROOT / ".github" / "workflows"
    for name in ("semgrep.yml", "checkov.yml", "strix-staging.yml"):
        add(wf / name)
    # also pick any other yml mentioning security tools
    if wf.is_dir():
        for p in sorted(wf.glob("*.yml")):
            text = p.read_text(encoding="utf-8", errors="replace").lower()
            if any(k in text for k in ("semgrep", "checkov", "strix")):
                add(p)
    add(ROOT / "renovate.json")
    add(ROOT / ".github" / "dependabot.yml")

    # 6. .cursor/rules
    rules = ROOT / ".cursor" / "rules"
    if rules.is_dir():
        for p in sorted(rules.glob("*.mdc")):
            add(p)
        add(rules / "SOURCES.md")

    # 7. .cursor/skills/**/SKILL.md
    skills = ROOT / ".cursor" / "skills"
    if skills.is_dir():
        for p in sorted(skills.rglob("SKILL.md")):
            add(p)

    # 8. agent config
    add(ROOT / ".cursorignore")
    add(ROOT / ".env.example")

    # 9. promotions package
    promo = ROOT / "packages" / "promotions"
    add(promo / "README.md")
    src = promo / "src"
    if src.is_dir():
        for p in sorted(src.glob("*.ts")):
            add(p)

    return files


def read_body(path: Path) -> str:
    raw = path.read_bytes()
    # strip UTF-8 BOM if present
    if raw.startswith(b"\xef\xbb\xbf"):
        raw = raw[3:]
    text = raw.decode("utf-8")
    # normalize newlines to \n for consistent markdown
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    if not text.endswith("\n"):
        text += "\n"
    return text


def main() -> None:
    files = collect()
    today = date.today().isoformat()

    # Build TOC + sections
    toc_lines: list[str] = []
    sections: list[str] = []

    for i, path in enumerate(files, start=1):
        r = rel(path)
        anchor = f"source-{i}-{r.replace('/', '-').replace('.', '-')}"
        # GitHub-style anchors are messy; use numbered TOC links via explicit HTML anchors
        toc_lines.append(f"{i}. [{r}](#{anchor})")

        lang = fence_lang(path)
        body = read_body(path)
        # For JSON, pretty-validate but keep verbatim content (already UTF-8 text)
        if path.suffix.lower() == ".json":
            try:
                json.loads(body)
            except json.JSONDecodeError as e:
                print(f"WARN: invalid JSON {r}: {e}")

        # Fence everything for consistent verbatim embed (md included as markdown fence)
        # User asked: For JSON/yml/mdc: fence with language tag — fence all for safety
        fence = lang if lang else ""
        section = (
            f'<a id="{anchor}"></a>\n\n'
            f"## Source: `{r}`\n\n"
            f"```{fence}\n"
            f"{body}"
            f"```\n"
        )
        # If body already ends with newline inside fence, closing ``` is fine
        sections.append(section)

    header = f"""# DIAL Complete Plan and Development Pack

**Generated:** {today}  
**Workspace:** `C:\\Users\\j\\Desktop\\DIAL`

## How to use this file

This pack **embeds full verbatim copies** of the listed source files for single-file reading and offline agent context. Content completeness is intentional: each section below is a complete copy of the source at compile time, not a summary or thin snapshot.

**Edit source of record:** Prefer updating the individual source files under the repo, then re-run the compile script to refresh this pack. Do not maintain dual long-lived edits here and in sources — sources remain SoR for day-to-day work; this file is the complete concatenated reading surface.

**Excluded from this pack:** `node_modules`, `.git`, binary images, huge lockfiles, and this pack file itself (to avoid recursive self-embedding).

**Files inlined:** {len(files)}

---

## Table of contents

"""
    toc = "\n".join(toc_lines) + "\n\n---\n\n"
    out_text = header + toc + "\n---\n\n".join(sections)

    OUT.write_text(out_text, encoding="utf-8", newline="\n")
    size = OUT.stat().st_size
    print(f"WROTE: {OUT}")
    print(f"BYTES: {size}")
    print(f"MB: {size / (1024 * 1024):.4f}")
    print(f"FILES: {len(files)}")
    for p in files:
        print(f"  - {rel(p)}")


if __name__ == "__main__":
    main()
