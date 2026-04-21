---
name: design-pattern-check
description: Use when the user wants an architectural or design-pattern review for frontend code in this repository. Focus on component boundaries, state ownership, reuse decisions, abstraction quality, accidental coupling, and whether the current pattern is simpler than the alternatives.
---

# Design Pattern Check

Use this skill when a change needs an architectural sanity check.

## What To Evaluate

- component and module boundaries
- state ownership and data flow
- reuse versus duplication tradeoffs
- abstraction quality
- accidental coupling to framework or backend details

## Workflow

1. Identify the main responsibility of the touched module or component.
2. Check whether state, rendering, and side effects are mixed too tightly.
3. Look for premature abstractions or duplication that now deserves extraction.
4. Judge the pattern against project principles: simple, surgical, clean, and DRY without over-engineering.

## Rules

- Prefer simpler composition over heavier patterns by default.
- Reject abstractions that hide straightforward logic without real leverage.
- Accept duplication briefly when it keeps the feature clearer than early reuse.
- Call out when Laravel integration concerns are leaking into presentational code too early.
