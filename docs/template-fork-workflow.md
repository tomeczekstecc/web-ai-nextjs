# Template Fork Workflow

This repository is a **template**. Downstream projects are created by forking it
on GitLab and then renaming a small set of files. This document is the canonical
"how to bootstrap a new project from this template" guide.

The template lives at:

- GitLab (canonical / upstream): `https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web`

A downstream project is the result of forking the template into a different
GitLab namespace (or copying it to a new repo) and renaming it.

## 1. Create the downstream repo

### Option A — GitLab fork (preferred)

1. On GitLab, navigate to the template project.
2. Use **Fork** and place the fork in your target group/namespace.
3. Clone the fork locally:
   ```bash
   git clone <downstream-fork-url> my-new-project
   cd my-new-project
   ```

### Option B — Manual clone (when GitLab fork is not available)

```bash
git clone https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git my-new-project
cd my-new-project
git remote remove origin
git remote add origin <downstream-repo-url>
git push -u origin master
```

## 2. Configure remotes

A downstream project should keep two remotes:

| Remote | Purpose | URL |
| --- | --- | --- |
| `origin` | The downstream project's own repo | `<your downstream URL>` |
| `template` | The upstream template, used to pull updates | `https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git` |

Set them up:

```bash
git remote set-url origin <downstream-repo-url>
git remote add template https://gitlab-ci-prs.slaskie.pl/ai-tmpl/web.git
git remote -v
```

> Never push to `template` from a downstream project. It is read-only from the
> downstream side. See [`template-sync.md`](./template-sync.md) for how updates
> flow back from the template.

## 3. Rename the project

Update these files so the new project no longer identifies as the template:

- `package.json` — `"name"` field (currently `"ci-prs-web"`).
- `README.md` — replace the heading and any template-specific copy.
- `next.config.ts` — review for any hardcoded paths or domain names.
- `src/app/layout.tsx` — `metadata.title` and `metadata.description`.
- `public/` — replace logo / favicon assets if they are template-branded.
- Environment defaults — see `better-auth.cli.ts` and any `process.env.*` usage.

The dev port is `3600` by default (`pnpm dev`). Change it in `package.json`
scripts if the new project clashes with another local service.

## 4. Reset history (optional)

Most projects keep the template history because it is useful context and makes
[`template-sync.md`](./template-sync.md) work cleanly with `git merge`. Only
squash if the downstream project has a hard "no upstream history" rule —
squashing breaks the cheap merge-based sync path and forces cherry-picking
forever.

If you must squash:

```bash
git checkout --orphan fresh
git add -A
git commit -m "chore: initial commit from template"
git branch -D master
git branch -m master
git push -f origin master
```

## 5. First-run sanity check

```bash
pnpm install
pnpm lint
pnpm build
pnpm dev
```

Open http://localhost:3600 and confirm the app boots.

## 6. Confirm AI agent context

This template ships with three identical root files (`AGENTS.md`,
`CLAUDE.md`, `CURSOR.md`) and skill bundles under `.agents/skills/` and
`.claude/skills/`. They are intentionally checked in. Keep them — they are how
this project teaches new agents and contributors the local conventions. The
`ai-artifacts-sync` skill keeps them aligned.

## 7. What to do next

- Customize the visual theme: [`theme-customization.md`](./theme-customization.md).
- Plan how the downstream project will pull in template updates over time:
  [`template-sync.md`](./template-sync.md).
- Read `context/project-overview.md` and `context/coding-standards.md` before
  the first feature.

## Helper script

Steps 2–3 and 5 above can be automated with `scripts/init-from-template.sh`:

```bash
scripts/init-from-template.sh \
  --name my-new-project \
  --origin <downstream-repo-url>
```

The script sets `origin`, adds the `template` remote, renames `package.json`,
and runs `pnpm install / lint / build`. It still leaves the manual follow-ups
from step 3 to you (README copy, metadata, logo, port). Add `--dry-run` to
preview, `--skip-verify` to skip pnpm steps.

## Out of scope (today)

- Renovate / dependency-bot wiring.
- GitLab CI fork-aware pipeline.
