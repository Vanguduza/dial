#!/usr/bin/env bash
# Safe post-commit auto-push to origin (Vanguduza/dial).
# Never force-pushes. Exits 0 when there is nothing to push.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT}" ]]; then
  echo "git-auto-push: not a git repository" >&2
  exit 1
fi
cd "${ROOT}"

for arg in "$@"; do
  case "${arg}" in
    -f|--force|--force-with-lease)
      echo "git-auto-push: refusing force push (${arg})" >&2
      exit 1
      ;;
  esac
done

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "git-auto-push: no 'origin' remote — configure https://github.com/Vanguduza/dial.git (or SSH equivalent)" >&2
  exit 1
fi

ORIGIN_URL="$(git remote get-url origin)"
case "${ORIGIN_URL}" in
  *Vanguduza/dial*|*vanguduza/dial*) ;;
  *)
    echo "git-auto-push: warning — origin is not Vanguduza/dial (${ORIGIN_URL})" >&2
    ;;
esac

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "${BRANCH}" == "HEAD" ]]; then
  echo "git-auto-push: detached HEAD — skip push"
  exit 0
fi

if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  AHEAD="$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
  if [[ "${AHEAD}" == "0" ]]; then
    echo "git-auto-push: nothing to push (${BRANCH})"
    exit 0
  fi
  echo "git-auto-push: pushing ${BRANCH} → origin (${AHEAD} commit(s) ahead)"
  if ! git push; then
    echo "git-auto-push: git push failed" >&2
    exit 1
  fi
else
  echo "git-auto-push: no upstream — git push -u origin HEAD (${BRANCH})"
  if ! git push -u origin HEAD; then
    echo "git-auto-push: git push -u failed" >&2
    exit 1
  fi
fi

echo "git-auto-push: ok"
exit 0
