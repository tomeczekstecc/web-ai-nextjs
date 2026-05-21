#!/usr/bin/env bash
# scripts/init-from-template.sh
#
# One-shot initializer for a newly cloned downstream project.
# See docs/template-fork-workflow.md for the full guide.
#
# This script is idempotent — running it twice on a clean working tree is safe.
#
# Usage:
#   scripts/init-from-template.sh --name my-new-project --origin <git-url>
#   scripts/init-from-template.sh --name my-new-project --origin <git-url> --dry-run
#
# What it does:
#   1. Verifies a clean git working tree.
#   2. Sets `origin` to the downstream repo URL (if --origin is given).
#   3. Adds the `template` remote pointing at the upstream template.
#   4. Renames the project in package.json (and optionally in README/layout).
#   5. Runs pnpm install + lint + build as a sanity check (unless --skip-verify).
#
# Environment overrides:
#   TEMPLATE_URL   default: https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git

set -euo pipefail

TEMPLATE_URL="${TEMPLATE_URL:-https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git}"

NAME=""
ORIGIN_URL=""
DRY_RUN=0
SKIP_VERIFY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)        NAME="${2:-}"; shift 2 ;;
    --origin)      ORIGIN_URL="${2:-}"; shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --skip-verify) SKIP_VERIFY=1; shift ;;
    -h|--help)     sed -n '2,22p' "$0"; exit 0 ;;
    *) echo "error: unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ -z "$NAME" ]]; then
  echo "error: --name <project-name> is required" >&2
  exit 2
fi

# package.json npm-name validation: lowercase letters, digits, dashes, underscores, dots
if [[ ! "$NAME" =~ ^[a-z0-9._-]+$ ]]; then
  echo "error: --name must match ^[a-z0-9._-]+\$ (got: $NAME)" >&2
  exit 2
fi

run() {
  echo "+ $*"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    "$@"
  fi
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not inside a git repository" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is dirty. Commit or stash first." >&2
  exit 1
fi

# 1. origin
if [[ -n "$ORIGIN_URL" ]]; then
  if git remote get-url origin >/dev/null 2>&1; then
    run git remote set-url origin "$ORIGIN_URL"
  else
    run git remote add origin "$ORIGIN_URL"
  fi
fi

# 2. template remote
if git remote get-url template >/dev/null 2>&1; then
  CURRENT="$(git remote get-url template)"
  if [[ "$CURRENT" != "$TEMPLATE_URL" ]]; then
    echo "warn: remote 'template' is $CURRENT (expected $TEMPLATE_URL)"
  fi
else
  run git remote add template "$TEMPLATE_URL"
fi

# 3. rename in package.json
if [[ -f package.json ]]; then
  if [[ "$DRY_RUN" -eq 0 ]]; then
    node -e '
      const fs = require("fs");
      const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
      p.name = process.argv[1];
      fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
    ' "$NAME"
    echo "+ updated package.json name -> $NAME"
  else
    echo "+ would update package.json name -> $NAME"
  fi
fi

# 4. soft reminder for files this script does NOT touch
cat <<EOF

Manual follow-ups (see docs/template-fork-workflow.md):
  - README.md heading and template-specific copy
  - src/app/layout.tsx metadata.title / metadata.description
  - public/ logo & favicon if branded
  - next.config.ts for any hardcoded paths/domains
  - dev port in package.json scripts (default 3600)

EOF

# 5. verify
if [[ "$SKIP_VERIFY" -eq 0 ]]; then
  run pnpm install
  run pnpm lint || echo "warn: lint failed; review and fix before first commit"
  run pnpm build || echo "warn: build failed; review and fix before first commit"
fi

echo "done. Remotes:"
git remote -v
