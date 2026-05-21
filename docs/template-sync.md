# Template Sync Workflow

How a downstream project pulls updates from this template after it was forked.

This is the partner doc to [`template-fork-workflow.md`](./template-fork-workflow.md).
Read that one first if the project was just created.

## Mental model

- The **template** owns: `src/components/ui/`, `src/lib/api/` scaffolding,
  `src/hooks/` (generic ones), shared configs (`eslint.config.mjs`,
  `tsconfig.json`, `components.json`, `next.config.ts`), `package.json`
  baseline, AI artifacts (`AGENTS.md`, `CLAUDE.md`, `CURSOR.md`,
  `.agents/skills/`, `.claude/skills/`), and `docs/` + `context/` baselines.
- The **downstream project** owns: everything under `src/app/<domain>/`,
  domain-specific components in `src/components/<domain>/`, domain hooks,
  domain logic in `src/lib/<domain>/` and `src/lib/api/domains/<domain>/`,
  product-specific docs.

Sync = pulling template-owned changes into a downstream project without
disturbing the project-owned areas.

## Prerequisites

The `template` remote must be configured. From the downstream project:

```bash
git remote -v | grep template || \
  git remote add template https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git
git fetch template
```

## Helper script

`scripts/template-sync.sh` wraps the three modes below. Run it from a
downstream project (it refuses to run on the template itself):

```bash
scripts/template-sync.sh                          # full-merge mode (default)
scripts/template-sync.sh --mode pick <sha>...     # cherry-pick mode
scripts/template-sync.sh --mode paths <path>...   # path-scoped checkout
scripts/template-sync.sh --dry-run                # preview
```

The script:

- refuses to run on a dirty working tree,
- adds the `template` remote if missing,
- creates a dated `chore/template-sync-*` (or `-pick-*` / `-paths-*`) branch,
- uses the commit-message convention `chore(template): sync up to <sha>`,
- prints the next manual steps (`pnpm install / lint / build`, `git push`).

The sections below describe the same modes in detail and document the
conflict map you should expect after a merge.

## Sync modes

Pick one based on how diverged the downstream project is.

### Mode 1 — Full merge (preferred while the project is young)

Works when downstream history is still based on template history (no squash).

```bash
git checkout master
git pull origin master
git fetch template
git checkout -b chore/template-sync-$(date +%Y-%m-%d)
git merge template/master
# resolve conflicts (see "Conflict map" below)
pnpm install
pnpm lint
pnpm build
git push -u origin HEAD
# open MR into master
```

Commit message convention for the merge commit (or the squash that lands it):

```
chore(template): sync up to <template-short-sha>
```

### Mode 2 — Cherry-pick (when histories diverged or were squashed)

For targeted updates: a specific component fix, a dependency bump, a doc
update.

```bash
git fetch template
git log --oneline template/master ^master   # candidates
git checkout -b chore/template-pick-<topic>
git cherry-pick <sha> [<sha> ...]
pnpm install   # only if package.json changed
pnpm lint && pnpm build
```

### Mode 3 — Path-scoped sync (surgical)

When you want only one area refreshed (e.g. shadcn primitives):

```bash
git fetch template
git checkout template/master -- src/components/ui/
git checkout template/master -- components.json
git checkout template/master -- src/app/globals.css   # only if intended
git status
# review, then commit
```

Use this carefully — it overwrites local edits in those paths.

## Conflict map

Likely conflict zones, ranked by frequency:

| Path | Why it conflicts | How to resolve |
| --- | --- | --- |
| `src/components/ui/*` | Template owns these; both sides may have edited | Prefer the template version. Move custom behavior into a wrapper under `src/components/<domain>/`. |
| `package.json` / `pnpm-lock.yaml` | Both sides add deps | Manual merge of `dependencies`, then re-run `pnpm install` to regenerate the lockfile. |
| `src/app/globals.css` | Theme variables live here ([`theme-customization.md`](./theme-customization.md)) | Keep the downstream `:root` / `.dark` blocks. Take the template's `@theme inline` block. |
| `components.json` | shadcn config | Keep downstream `style` choice; take template aliases / `iconLibrary` / `tailwind` updates. |
| `tsconfig.json`, `eslint.config.mjs`, `next.config.ts` | Tooling drift | Usually take template, then re-add downstream-specific paths or rules. |
| `AGENTS.md` / `CLAUDE.md` / `CURSOR.md` | Both sides may have appended sections | Take template baseline, re-apply downstream additions (or use the `ai-artifacts-sync` skill afterwards). |
| `.agents/skills/`, `.claude/skills/` | Skills evolve in template | Prefer template for skills not customized downstream. |
| `src/app/<domain>/`, `src/components/<domain>/` | Shouldn't conflict — these are downstream-owned | If the template touches them, that is a template bug; report and revert downstream side. |

## After every sync

1. `pnpm install` — regenerate the lockfile if `package.json` changed.
2. `pnpm lint` — first signal that an import path or rule moved.
3. `pnpm build` — second signal, type checks.
4. `pnpm dev` — smoke test the auth pages, dashboard, and any wizard.
5. Confirm theme is intact in both light and dark mode.
6. Run the `ai-artifacts-sync` skill if any of `AGENTS.md`, `CLAUDE.md`,
   `CURSOR.md`, `.agents/skills/`, or `.claude/skills/` changed.

## Cadence

- **Recommended**: pick up template updates at least once per release cycle,
  or whenever the template tags a new release.
- **Mandatory**: pick up template updates that include security patches in
  `package.json`, or auth (`better-auth`) updates.
- **Discretionary**: theme / docs updates can wait until convenient.

## Tracking what has been merged

Keep one commit per sync on `master`, with a message of the form:

```
chore(template): sync up to <template-short-sha>
```

`git log --grep "chore(template): sync"` then gives a clean history of which
template revisions are present in the downstream project.

## Out of scope (today)

- Automated PRs from a CI bot watching the template.
- A manifest file enumerating template-owned vs. project-owned paths
  (currently encoded only in this doc and the conflict map above).
