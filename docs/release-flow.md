# Release Flow

Step-by-step guide for the branching and release workflow used in this project.
For release-it configuration, commit types, and version-bump rules see [versioning.md](versioning.md).

---

## Overview

```
feature branch  →  commit  →  merge to master (--no-ff)  →  release-it --ci
```

Every feature or fix lives on its own branch. When done it is merged to `master` with a
merge commit, then `release-it` reads the commits since the last tag, bumps the version,
writes `CHANGELOG.md`, creates a git tag, and pushes everything to all remotes.

---

## 1. Create a feature branch

Always branch off `master`:

```bash
git checkout master
git checkout -b <branch-name>
```

Branch naming convention (no strict rule, but keep it readable):

```
feat_<short_description>          # new feature
fix_<short_description>           # bug fix
chore_<short_description>         # tooling / config
docs_<short_description>          # documentation only
```

Examples from this project:

```
init_script_portr_configuration
skill_git_mantis_push_add_checkout_dev
skil_specify_enhancmet
```

---

## 2. Work and commit

Use **Conventional Commits** — the prefix drives the version bump:

```bash
git add <files>
git commit -m "feat(scripts): add --port argument to init-from-template.sh"
git commit -m "fix(env): add mock placeholders to .env.example"
git commit -m "chore(env): add NODE_ENV=development"
git commit -m "refactor(skills): move mantis/date to front of branch name"
```

Push the feature branch to all remotes at any point:

```bash
for remote in $(git remote); do git push $remote HEAD; done
```

---

## 3. Merge to master

```bash
git checkout master
git merge --no-ff <branch-name> -m "chore: merge <branch-name>"
```

Always use `--no-ff` so the feature boundary is visible in history.

---

## 4. Release

### Non-interactive (CI / scripted)

```bash
node_modules/.bin/release-it --ci
```

> **⚠️ Do not use `pnpm release -- --ci`** — pnpm passes the literal `--` as an
> argument to release-it, which causes it to fail. Call the binary directly instead.

`--ci` mode:
- Skips all interactive prompts
- Uses the conventional-changelog recommended bump automatically
- Commits, tags, and pushes in one step

### Interactive (when you want to review / override)

```bash
pnpm release:dry    # preview changelog and bump — no files written
pnpm release        # interactive: confirm version, commit, tag, push
```

### Force a specific bump

```bash
node_modules/.bin/release-it --ci --increment patch
node_modules/.bin/release-it --ci --increment minor
node_modules/.bin/release-it --ci --increment major
```

---

## 5. Push all remotes (if release-it only pushed origin)

release-it pushes to the remote configured in `.release-it.json` (`origin`).
To push the release commit and tag to additional remotes:

```bash
for remote in $(git remote); do git push $remote HEAD; done
for remote in $(git remote); do git push $remote --tags; done
```

---

## Full example

```bash
# 1. Branch
git checkout master
git checkout -b fix_env_placeholders

# 2. Work
# ... edit files ...
git add .env.example
git commit -m "chore(env): add mock placeholder values to .env.example"

# 3. Push feature branch
for remote in $(git remote); do git push $remote HEAD; done

# 4. Merge
git checkout master
git merge --no-ff fix_env_placeholders -m "chore: merge fix_env_placeholders"

# 5. Release
node_modules/.bin/release-it --ci
```

---

## Constraints

| Constraint | Value | File |
|---|---|---|
| Release must run on branch | `master` | `.release-it.json` → `"requireBranch"` |
| Clean working tree required | No (relaxed) | `.release-it.json` → `"requireCleanWorkingDir": false` |
| npm publish | Disabled | `.release-it.json` → `"npm": { "publish": false }` |
| GitHub release | Disabled | `.release-it.json` → `"github": { "release": false }` |

> **Note:** `.release-it.json` originally had `"requireBranch": "main"` but this repo
> uses `master`. It was corrected to `"master"` — if you see a "not on branch" error,
> verify this value matches your default branch name.

---

## CHANGELOG gotcha — first release

If the repo has **no prior git tags**, `conventional-changelog` collects the entire
commit history into the first release entry. This produces a very long `0.X.0` section
that repeats on every subsequent release until you manually clean it up.

**Prevention:** tag an initial `v0.1.0` (or any version) early, before the first real
feature release:

```bash
git tag v0.1.0
git push origin v0.1.0
```

**Fix (if it already happened):** manually rewrite `CHANGELOG.md` so each release
section contains only the commits from that release window. The `0.4.0` → `0.5.0`
compare links in the file will still be correct.

---

## Quick reference

```bash
# Branch
git checkout -b <name>

# Commit (conventional)
git commit -m "feat(scope): description"

# Push feature branch to all remotes
for remote in $(git remote); do git push $remote HEAD; done

# Merge to master
git checkout master
git merge --no-ff <name> -m "chore: merge <name>"

# Release (non-interactive)
node_modules/.bin/release-it --ci

# Preview only
pnpm release:dry
```
