#!/usr/bin/env python3
"""Git-native fallback for Vanguduza Project Truth.

Used when GitHub Actions is unavailable (for example private-repository Actions
billing/quota). The pre-commit hook records the exact staged diff inside the
same commit. The pre-push hook verifies every commit made after this guard was
installed. This makes project-change evidence independent of chat memory and
independent of GitHub Actions availability.
"""
from __future__ import annotations
import argparse, datetime as dt, hashlib, json, os, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
LEDGER = ROOT / "docs/project-state/CHANGE_LEDGER.jsonl"
CURRENT = ROOT / "docs/project-state/CURRENT_STATE.json"
EXCLUDES = [":(exclude)docs/project-state/CHANGE_LEDGER.jsonl", ":(exclude)docs/project-state/CURRENT_STATE.json"]


def git(*args: str, check: bool=True, binary: bool=False):
    return subprocess.run(["git", *args], cwd=ROOT, check=check, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=not binary)

def out(*args: str) -> str:
    return git(*args).stdout.strip()

def branch() -> str:
    return out("rev-parse", "--abbrev-ref", "HEAD")

def head() -> str:
    return out("rev-parse", "HEAD")

def staged_files() -> list[str]:
    cp=git("diff","--cached","--name-only","--no-renames","--",".",*EXCLUDES)
    return [x for x in cp.stdout.splitlines() if x.strip()]

def staged_digest() -> str:
    cp=git("diff","--cached","--binary","--no-ext-diff","--no-renames","--",".",*EXCLUDES,binary=True)
    return hashlib.sha256(cp.stdout).hexdigest()

def commit_parent(sha: str) -> str|None:
    cp=git("rev-parse",sha+"^1",check=False)
    return cp.stdout.strip() if cp.returncode==0 else None

def commit_files(sha: str) -> list[str]:
    parent=commit_parent(sha)
    args=("diff","--name-only","--no-renames",parent,sha,"--",".",*EXCLUDES) if parent else ("show","--pretty=","--name-only",sha,"--",".",*EXCLUDES)
    cp=git(*args)
    return [x for x in cp.stdout.splitlines() if x.strip()]

def commit_digest(sha: str) -> str:
    parent=commit_parent(sha)
    args=("diff","--binary","--no-ext-diff","--no-renames",parent,sha,"--",".",*EXCLUDES) if parent else ("show","--binary","--format=","--no-ext-diff",sha,"--",".",*EXCLUDES)
    cp=git(*args,binary=True)
    return hashlib.sha256(cp.stdout).hexdigest()

def ledger_lines_from_worktree() -> list[str]:
    return LEDGER.read_text(encoding="utf-8").splitlines() if LEDGER.exists() else []

def ledger_at(sha: str) -> list[dict]:
    cp=git("show",f"{sha}:docs/project-state/CHANGE_LEDGER.jsonl",check=False)
    if cp.returncode!=0: return []
    rows=[]
    for line in cp.stdout.splitlines():
        if line.strip():
            try: rows.append(json.loads(line))
            except Exception: pass
    return rows

def record() -> int:
    files=staged_files()
    if not files:
        return 0
    digest=staged_digest(); parent=head(); rows=[]
    for line in ledger_lines_from_worktree():
        if line.strip():
            try: rows.append(json.loads(line))
            except Exception: pass
    if rows and rows[-1].get("source_parent")==parent and rows[-1].get("diff_sha256")==digest:
        subprocess.run(["git","add","docs/project-state/CHANGE_LEDGER.jsonl","docs/project-state/CURRENT_STATE.json"],cwd=ROOT,check=False)
        return 0
    entry={
        "schema_version":1,"kind":"precommit-staged-diff","recorded_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "branch":branch(),"source_parent":parent,"changed_files":files,"diff_sha256":digest,
        "actor":os.getenv("GTR_CHANGE_ACTOR") or os.getenv("USER") or os.getenv("USERNAME") or "unknown"
    }
    LEDGER.parent.mkdir(parents=True,exist_ok=True)
    with LEDGER.open("a",encoding="utf-8",newline="\n") as f: f.write(json.dumps(entry,sort_keys=True,separators=(",",":"))+"\n")
    CURRENT.write_text(json.dumps({"schema_version":1,"state":"PENDING_COMMIT","branch":branch(),"source_parent":parent,"diff_sha256":digest,"changed_files":files,"observed_at_utc":entry["recorded_at_utc"]},indent=2,sort_keys=True)+"\n",encoding="utf-8")
    subprocess.run(["git","add","docs/project-state/CHANGE_LEDGER.jsonl","docs/project-state/CURRENT_STATE.json"],cwd=ROOT,check=True)
    print(f"project-truth: recorded staged change {digest[:16]} ({len(files)} files)")
    return 0

def install_commit() -> str|None:
    cp=git("log","--reverse","--format=%H","--diff-filter=A","--","scripts/project_truth_local.py",check=False)
    lines=[x for x in cp.stdout.splitlines() if x.strip()]
    return lines[0] if lines else None

def verify_commit(sha: str) -> list[str]:
    files=commit_files(sha)
    if not files: return []
    parent=commit_parent(sha); digest=commit_digest(sha); rows=ledger_at(sha)
    ok=any(r.get("source_parent")==parent and r.get("diff_sha256")==digest and sorted(r.get("changed_files",[]))==sorted(files) for r in rows)
    return [] if ok else [f"{sha}: no matching staged-diff ledger entry"]

def verify_push() -> int:
    baseline=install_commit()
    if not baseline:
        print("BLOCKED: local project-truth guard installation commit cannot be found",file=sys.stderr); return 40
    commits=[x for x in out("rev-list","--reverse",f"{baseline}..HEAD").splitlines() if x]
    failures=[]
    for sha in commits: failures.extend(verify_commit(sha))
    if failures:
        print("BLOCKED: project-truth verification failed:",file=sys.stderr)
        for f in failures: print(" - "+f,file=sys.stderr)
        return 41
    print(f"project-truth: verified {len(commits)} post-guard commit(s)")
    return 0

def main() -> int:
    p=argparse.ArgumentParser(); p.add_argument("command",choices=["record","verify-push"]); a=p.parse_args()
    return record() if a.command=="record" else verify_push()
if __name__=="__main__": raise SystemExit(main())
