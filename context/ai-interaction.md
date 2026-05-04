# CI-PRS Web AI Interaction Guidelines

## Working Style

- Be concise, direct, and practical.
- Explain non-obvious choices briefly.
- Preserve existing patterns unless the task asks for a broader rethink.
- Do not add speculative features or cleanup unrelated areas.

## Preferred Workflow

1. Read the relevant local context files and the current Spec Kit artifacts before substantial work.
2. For feature work, use the active `specs/[feature]/` documents, especially `spec.md`, `plan.md`, and `tasks.md`, as the workflow source of truth.
3. Inspect the live code before proposing architecture changes.
4. Make the smallest coherent implementation that solves the task.
5. Verify with `pnpm lint` and, when appropriate, `pnpm build`.
6. Summarize what changed, what was verified, and any remaining risk.

## Git Expectations

- Do not commit without permission.
- Keep commits focused and use conventional commit messages if a commit is requested.
- If a new branch is needed from Codex, prefer the `codex/` prefix.

## When To Pause

- Pause before large refactors with broad surface area.
- Pause when requirements are ambiguous and the ambiguity changes architecture or user behavior.
- Pause if the live codebase conflicts with written guidance and the right choice is not obvious.

## Tracking

- Do not maintain a repo-local feature status file for normal work.
- Treat Spec Kit artifacts as the canonical planning and execution trail for feature work.

## Review Priorities

When reviewing or self-checking changes, prioritize:
- broken behavior and regressions
- typing and data-shape mismatches
- accessibility and responsive issues
- integration assumptions and fallback behavior
- accidental visual drift from the existing UI direction
