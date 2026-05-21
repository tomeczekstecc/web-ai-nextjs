#!/usr/bin/env bash
# scripts/template-sync.sh
#
# Pull updates from the upstream template into a downstream project.
# See docs/template-sync.md for the full workflow and conflict map.
#
# Usage:
#   scripts/template-sync.sh                     # full-merge mode (default)
#   scripts/template-sync.sh --mode merge        # full-merge mode
#   scripts/template-sync.sh --mode pick <sha>...# cherry-pick mode
#   scripts/template-sync.sh --mode paths <p>... # path-scoped checkout
#   scripts/template-sync.sh --dry-run           # show what would happen
#
# Environment overrides:
#   TEMPLATE_REMOTE   default: template
#   TEMPLATE_URL      default: https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git
#   TEMPLATE_BRANCH   default: master
#   BASE_BRANCH       default: master   (the downstream branch to sync into)

set -euo pipefail

TEMPLATE_REMOTE="${TEMPLATE_REMOTE:-template}"
TEMPLATE_URL="${TEMPLATE_URL:-https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git}"
TEMPLATE_BRANCH="${TEMPLATE_BRANCH:-master}"
BASE_BRANCH="${BASE_BRANCH:-master}"

MODE="merge"
DRY_RUN=0
EXTRA_ARGS=()

# ---- arg parsing -------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"; shift 2 ;;
    --dry-run)
      DRY_RUN=1; shift ;;
    -h|--help)
      sed -n '2,20p' "$0"; exit 0 ;;
    --)
      shift; EXTRA_ARGS+=("$@"); break ;;
    *)
      EXTRA_ARGS+=("$1"); shift ;;
  esac
done

case "$MODE" in
  merge|pick|paths) ;;
  *) echo "error: --mode must be one of merge|pick|paths (got: $MODE)" >&2; exit 2 ;;
esac

run() {
  echo "+ $*"
  if [[ "$DRY_RUN" -eq 0 ]]; then
    "$@"
  fi
}

# ---- safety checks -----------------------------------------------------------
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "error: not inside a git repository" >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "error: working tree is dirty. Commit or stash first." >&2
  exit 1
fi

# This script must be run from a downstream project, not the template itself.
ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$ORIGIN_URL" == "$TEMPLATE_URL" ]]; then
  echo "error: 'origin' points at the template ($TEMPLATE_URL)." >&2
  echo "       This script is meant for downstream projects only." >&2
  exit 1
fi

# Ensure the template remote exists and points at the expected URL.
if git remote get-url "$TEMPLATE_REMOTE" >/dev/null 2>&1; then
  CURRENT_URL="$(git remote get-url "$TEMPLATE_REMOTE")"
  if [[ "$CURRENT_URL" != "$TEMPLATE_URL" ]]; then
    echo "warn: remote '$TEMPLATE_REMOTE' points at $CURRENT_URL"
    echo "      expected: $TEMPLATE_URL"
    echo "      (override with TEMPLATE_URL=... if intentional)"
  fi
else
  run git remote add "$TEMPLATE_REMOTE" "$TEMPLATE_URL"
fi

run git fetch "$TEMPLATE_REMOTE" "$TEMPLATE_BRANCH"

TEMPLATE_SHA="$(git rev-parse --short "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH")"
DATE_TAG="$(date +%Y-%m-%d)"

# ---- mode dispatch -----------------------------------------------------------
case "$MODE" in

  merge)
    BRANCH="chore/template-sync-${DATE_TAG}"
    run git checkout "$BASE_BRANCH"
    run git pull --ff-only origin "$BASE_BRANCH" || true
    run git checkout -B "$BRANCH"
    run git merge --no-ff -m "chore(template): sync up to ${TEMPLATE_SHA}" \
        "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH" || {
      echo
      echo "merge produced conflicts. Resolve them, then:"
      echo "  pnpm install && pnpm lint && pnpm build"
      echo "  git commit"
      echo "  git push -u origin $BRANCH"
      exit 1
    }
    echo
    echo "merge clean. Next:"
    echo "  pnpm install && pnpm lint && pnpm build"
    echo "  git push -u origin $BRANCH"
    ;;

  pick)
    if [[ ${#EXTRA_ARGS[@]} -eq 0 ]]; then
      echo "error: --mode pick requires one or more <sha> arguments" >&2
      exit 2
    fi
    BRANCH="chore/template-pick-${DATE_TAG}"
    run git checkout "$BASE_BRANCH"
    run git pull --ff-only origin "$BASE_BRANCH" || true
    run git checkout -B "$BRANCH"
    run git cherry-pick "${EXTRA_ARGS[@]}"
    echo
    echo "cherry-pick complete. Next:"
    echo "  pnpm install && pnpm lint && pnpm build"
    echo "  git push -u origin $BRANCH"
    ;;

  paths)
    if [[ ${#EXTRA_ARGS[@]} -eq 0 ]]; then
      echo "error: --mode paths requires one or more <path> arguments" >&2
      exit 2
    fi
    BRANCH="chore/template-paths-${DATE_TAG}"
    run git checkout "$BASE_BRANCH"
    run git pull --ff-only origin "$BASE_BRANCH" || true
    run git checkout -B "$BRANCH"
    run git checkout "$TEMPLATE_REMOTE/$TEMPLATE_BRANCH" -- "${EXTRA_ARGS[@]}"
    echo
    echo "paths checked out from $TEMPLATE_REMOTE/$TEMPLATE_BRANCH:"
    for p in "${EXTRA_ARGS[@]}"; do echo "  - $p"; done
    echo
    echo "Review with 'git status' / 'git diff --cached', then:"
    echo "  git commit -m 'chore(template): pull <area> from ${TEMPLATE_SHA}'"
    echo "  pnpm install && pnpm lint && pnpm build   # if needed"
    echo "  git push -u origin $BRANCH"
    ;;
esac
