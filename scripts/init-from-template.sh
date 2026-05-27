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
#   scripts/init-from-template.sh --name my-new-project --origin <git-url> --port 3800
#   scripts/init-from-template.sh --name my-new-project --origin <git-url> --dry-run
#
# What it does:
#   1. Verifies a clean git working tree.
#   2. Sets `origin` to the downstream repo URL (if --origin is given).
#   3. Adds the `template` remote pointing at the upstream template.
#   4. Renames the project in package.json (and optionally in README/layout).
#   5. Updates the dev/start port in package.json scripts, .env, and .env.example
#      (PORT=, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL, BETTER_AUTH_URL).
#   6. Runs pnpm install + lint + build as a sanity check (unless --skip-verify).
#
# Environment overrides:
#   TEMPLATE_URL   default: https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git

set -euo pipefail

TEMPLATE_URL="${TEMPLATE_URL:-https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git}"

NAME=""
ORIGIN_URL=""
PORT=""
DRY_RUN=0
SKIP_VERIFY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)        NAME="${2:-}"; shift 2 ;;
    --origin)      ORIGIN_URL="${2:-}"; shift 2 ;;
    --port)        PORT="${2:-}"; shift 2 ;;
    --dry-run)     DRY_RUN=1; shift ;;
    --skip-verify) SKIP_VERIFY=1; shift ;;
    -h|--help)     sed -n '2,26p' "$0"; exit 0 ;;
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

if [[ -n "$PORT" ]]; then
  if [[ ! "$PORT" =~ ^[0-9]+$ ]] || (( PORT < 1 || PORT > 65535 )); then
    echo "error: --port must be a number between 1 and 65535 (got: $PORT)" >&2
    exit 2
  fi
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

# 3.5 bootstrap .env from .env.example if .env does not exist
if [[ -f .env.example ]] && [[ ! -f .env ]]; then
  if [[ "$DRY_RUN" -eq 0 ]]; then
    cp .env.example .env
    echo "+ bootstrapped .env from .env.example"
  else
    echo "+ would bootstrap .env from .env.example"
  fi
fi

# 4. update port in package.json scripts, .env, and .env.example
if [[ -n "$PORT" ]]; then
  if [[ "$DRY_RUN" -eq 0 ]]; then
    # Update --port flag in package.json dev/start scripts
    if [[ -f package.json ]]; then
      node -e '
        const fs = require("fs");
        const port = process.argv[1];
        const p = JSON.parse(fs.readFileSync("package.json", "utf8"));
        for (const key of ["dev", "start"]) {
          if (p.scripts && p.scripts[key]) {
            p.scripts[key] = p.scripts[key].replace(/--port\s+\d+/, "--port " + port);
          }
        }
        fs.writeFileSync("package.json", JSON.stringify(p, null, 2) + "\n");
      ' "$PORT"
      echo "+ updated package.json dev/start --port -> $PORT"
    fi

    # Helper: replace port in a single env file
    replace_port_in_env() {
      local file="$1"
      [[ -f "$file" ]] || return 0
      # PORT=<n>
      sed -i.bak -E "s|^(PORT=)[0-9]+|\1${PORT}|" "$file"
      # http://localhost:<n> (covers NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_API_URL, BETTER_AUTH_URL)
      sed -i.bak -E "s|localhost:[0-9]+|localhost:${PORT}|g" "$file"
      rm -f "${file}.bak"
    }

    replace_port_in_env .env
    replace_port_in_env .env.example
    echo "+ updated port references -> $PORT in .env and .env.example"
  else
    echo "+ would update package.json dev/start --port -> $PORT"
    echo "+ would update port references -> $PORT in .env and .env.example"
  fi
fi

# 5. soft reminder for files this script does NOT touch
cat <<EOF

Manual follow-ups (see docs/template-fork-workflow.md):
  - README.md heading and template-specific copy
  - src/app/layout.tsx metadata.title / metadata.description
  - public/ logo & favicon if branded
  - next.config.ts for any hardcoded paths/domains
  $([ -z "$PORT" ] && echo "- dev port in package.json scripts and .env (pass --port <n> to automate)")

EOF

# 6. verify
if [[ "$SKIP_VERIFY" -eq 0 ]]; then
  run pnpm install
  run pnpm lint || echo "warn: lint failed; review and fix before first commit"
  run pnpm build || echo "warn: build failed; review and fix before first commit"
fi

echo "done. Remotes:"
git remote -v
