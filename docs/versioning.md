# Version Bump Guide

How versioning works in this project — tooling, workflow, commit conventions, and recipes for common scenarios.

---

## Overview

This project uses **[release-it](https://github.com/release-it/release-it)** with the **[@release-it/conventional-changelog](https://github.com/release-it/conventional-changelog)** plugin.

On every release it:

1. Reads all commits since the last git tag
2. Determines the correct version bump from commit types
3. Prepends a new section to `CHANGELOG.md`
4. Bumps `"version"` in `package.json`
5. Creates a git commit (`chore(release): vX.Y.Z`)
6. Creates a git tag (`vX.Y.Z`)
7. Pushes the commit and tag to `origin`

Nothing is published to npm (`"private": true`). The tag is the release artifact.

---

## Config files

| File | Purpose |
|---|---|
| `.release-it.json` | release-it configuration |
| `CHANGELOG.md` | auto-maintained changelog (do not edit manually) |

---

## Scripts

```bash
pnpm release          # interactive release
pnpm release:dry      # full dry-run — no files written, no git changes
```

---

## Commit convention → version bump

release-it reads **Conventional Commits** to pick the bump automatically.

| Commit prefix | CHANGELOG section | Version bump |
|---|---|---|
| `feat:` | ✨ Features | **minor** `0.1.0 → 0.2.0` |
| `fix:` | 🐛 Bug Fixes | **patch** `0.1.0 → 0.1.1` |
| `perf:` | ⚡ Performance | **patch** |
| `refactor:` | ♻️ Refactors | **patch** |
| `docs:` | 📝 Documentation | **patch** |
| `chore:` | 🔧 Chores | **patch** |
| `style:` | *(hidden)* | no bump on its own |
| `test:` | *(hidden)* | no bump on its own |
| `BREAKING CHANGE:` footer | top of section | **major** `0.1.0 → 1.0.0` |

> If a push contains both `fix:` and `feat:` commits, the highest rule wins → **minor** bump.

### Breaking change syntax

```bash
git commit -m "feat(auth): replace session tokens

BREAKING CHANGE: cookie name changed from session_id to __session"
```

Or using the `!` shorthand:

```bash
git commit -m "feat(auth)!: replace session tokens"
```

Both trigger a **major** bump.

---

## Standard release workflow

```bash
# 1. Finish your feature work and commit normally
git commit -m "feat(reports): add PDF export"
git commit -m "fix(table): correct sort direction on reload"
git commit -m "chore(deps): bump lucide-react"

# 2. Preview — always do this first
pnpm release:dry

# 3. Run the interactive release
pnpm release
```

release-it will prompt:

```
🚀 Let's release ci-prs-web (currently at 0.1.0)

? Select increment (next version):
  ❯ minor (0.2.0)      ← suggested from feat: commit
    patch (0.1.1)
    major (1.0.0)
    (enter a custom version)

? Commit (chore(release): v0.2.0)?   → Y
? Tag (v0.2.0)?                       → Y
? Push?                               → Y
```

---

## Force a specific increment

Skip the interactive prompt and pass the bump directly:

```bash
pnpm release -- --increment patch
pnpm release -- --increment minor
pnpm release -- --increment major
pnpm release -- --increment 2.0.0    # exact version
```

Dry-run with a forced increment:

```bash
pnpm release:dry -- --increment minor
```

---

## Skip individual steps

```bash
# Bump + changelog only — no git commit, no tag, no push
pnpm release -- --no-git

# Bump + commit + tag — do NOT push
pnpm release -- --no-git.push

# Everything except tagging
pnpm release -- --no-git.tag

# Only write CHANGELOG, nothing else
pnpm release -- --changelog
```

---

## Generated CHANGELOG shape

`CHANGELOG.md` is prepended on every release. A typical entry looks like:

```markdown
## [0.2.0](https://github.com/org/repo/compare/v0.1.0...v0.2.0) — 2026-05-24

### ✨ Features

* **reports:** add PDF export ([a1b2c3d])
* **dashboard:** live KPI tiles ([e4f5a6b])

### 🐛 Bug Fixes

* **table:** correct sort direction on reload ([7c8d9e0])

### 🔧 Chores

* bump lucide-react to 0.511 ([f1a2b3c])
```

Sections with `"hidden": true` in `.release-it.json` (`style:`, `test:`) never appear.

---

## Constraints

| Constraint | Value | Where to change |
|---|---|---|
| Must be on branch | `main` | `"requireBranch"` in `.release-it.json` |
| Clean working tree required | No (relaxed) | `"requireCleanWorkingDir": false` |
| npm publish | Disabled | `"npm": { "publish": false }` |
| GitHub release | Disabled | `"github": { "release": false }` |

To enable GitHub Releases (creates a release on GitHub with the changelog body):

```json
"github": {
  "release": true,
  "releaseName": "v${version}"
}
```

Requires a `GITHUB_TOKEN` environment variable.

---

## Troubleshooting

### "Not on branch main"
You are on a feature branch. Either merge to `main` first, or temporarily remove `"requireBranch"` from `.release-it.json`.

### "No commits since last tag"
There are no new commits after the most recent `vX.Y.Z` tag. Nothing to release.

### Changelog is empty after release
Commits were not written in Conventional Commit format (`type: message`). Plain messages like `"update styles"` are ignored by the parser. Use `feat:`, `fix:`, etc.

### Version bumped but push failed
The commit and tag are local. Run:

```bash
git push && git push --tags
```

### Want to undo a release locally (before push)

```bash
git tag -d vX.Y.Z           # delete the local tag
git reset --soft HEAD~1     # undo the release commit, keep changes staged
```

Then edit `package.json` version back manually if needed.

---

## Quick reference

```bash
pnpm release:dry                        # preview — always run first
pnpm release                            # interactive release
pnpm release -- --increment patch       # force patch
pnpm release -- --increment minor       # force minor
pnpm release -- --increment major       # force major
pnpm release -- --no-git.push           # release without pushing
```
