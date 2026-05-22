# Implementation Plan: Copy to Clipboard Component

**Branch**: `018-copy-to-clipboard` | **Date**: 2026-05-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-copy-to-clipboard/spec.md`

## Summary

Deliver a single shared copy-to-clipboard primitive in two pieces — a local
React hook `useCopyToClipboard` at `src/hooks/use-copy-to-clipboard.ts` and a
shadcn-style UI primitive `CopyButton` at `src/components/ui/copy-button.tsx`
— and adopt it on the application error page so the technical diagnostics
block is one click away from the clipboard. The hook is the single chokepoint
for the Clipboard API; the component is a thin, accessible wrapper around it
on top of the existing `Button` and `Tooltip` primitives. A new
`TooltipProvider` is mounted once at the app root (it is currently absent),
and a small demo route exercises every supported permutation for review and
manual accessibility verification.

Approach in one paragraph: a 3-state status machine
(`"idle" | "copied" | "failed"`) lives in the hook; `copy(value)` calls
`navigator.clipboard.writeText` (modern API only, no legacy fallback),
returns a `Promise<boolean>`, and sets `status` with an auto-reset timer
(default 1500ms, overridable). The component renders a `Button`, swaps the
Lucide icon (`Copy` → `Check` / `X`) on status change, swaps tooltip text in
icon-only mode, and announces the outcome via an `sr-only`
`aria-live="polite"` span — the `aria-label` itself stays stable. Children
are optional; when present, the whole button is one click target. Empty
`value` makes the button non-interactive (`disabled`). The error page wraps
the existing collapsible-trigger row in a flex container so the new copy
button is a *sibling* of the trigger, not nested inside it.

## Technical Context

**Language/Version**: TypeScript 5.8.x (project default)
**Primary Dependencies**: Next.js 16 App Router, React 19, shadcn/ui
(base-nova), Base UI (`@base-ui/react` — provides `Tooltip`), Tailwind CSS
v4, `lucide-react` (icons), `sonner` (only used by the demo's `onCopy`
example)
**Storage**: N/A — ephemeral UI state in component; clipboard is the browser
API
**Testing**: N/A — constitution §IX forbids automated tests
**Target Platform**: Modern evergreen browsers (Chromium, Firefox, Safari)
in secure contexts (HTTPS or `localhost`)
**Project Type**: Web frontend (Next.js App Router monorepo-style `src/`
layout)
**Performance Goals**: Confirmation visible within 200ms of a successful
copy (SC-002); zero perceptible jank when a copy button is embedded in a
data table row
**Constraints**:
- Polish UI on the error-page consumer; English defaults inside the primitive
- Both light and dark theme parity (use existing design tokens, no custom
  colors)
- Desktop + mobile/touch responsiveness — `CopyButton` must be hit-target
  friendly (`size="icon"` already meets the 44px guideline via `Button`
  primitive)
- Constitution §III: surgical edits — touch only `src/hooks/`,
  `src/components/ui/`, `src/components/providers/`, `src/app/error.tsx`,
  and the new demo route
- Constitution §IX: no test files, no inline comments except security/TODO
- Decoupled from Laravel — feature is pure UI, no API surface change
**Scale/Scope**: 1 hook, 1 component, 1 new provider file, 1 modified root
layout, 1 modified error page, 1 new demo route. Expected delta: ~6 files
created, ~3 files edited, < ~400 LOC total.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Verdict | Notes |
|-----------|---------|-------|
| I. Think Before Coding | ✅ | Spec + grill resolved all branches; this plan codifies the outcome. |
| II. Simplicity First | ✅ | Local hook (no new dep), one component file, no legacy clipboard fallback, no `messages` object wrapper, no headless/`asChild` second export. |
| III. Surgical Changes | ✅ | Edits confined to the files listed in *Scale/Scope*. No refactor of unrelated providers or components. |
| IV. Goal-Driven Execution | ✅ | Six measurable success criteria (SC-001..SC-006) ratified in the spec. |
| V. Frontend-First, Backend-Decoupled | ✅ | Zero backend coupling. No DTO, no fetch, no query. |
| VI. TypeScript, App Router, Design System | ✅ | TS-first; built on existing shadcn/ui `Button` + Base UI `Tooltip`; demo route under `src/app/(app)/`. |
| VII. Polish UI, Responsiveness, Theme Parity | ✅ | Error-page consumer ships Polish labels; demo route uses Polish where it surfaces user-facing copy. Component uses theme tokens only — no hardcoded colors. Icon-only `size="icon"` and `size="sm"` work on touch. |
| VIII. Clean Code, KISS, DRY | ✅ | Single source of truth (hook) for status + timer; component delegates wholly. |
| IX. No Tests, Minimal Comments | ✅ | No test files; no inline comments planned beyond a single TODO-marker in the hook file documenting the deliberate no-fallback decision per FR-008. |

Affected-surface checklist required by §Development Workflow:
- **Wpływ na UI**: New primitive in `src/components/ui/`; error page gains an icon button next to the existing trigger; new demo route.
- **Wpływ na tryb jasny i ciemny**: Component uses `Button` variant tokens (`ghost`, `outline`) and `text-muted-foreground` / status colors via existing design tokens — verified in both themes during manual QA against the demo.
- **Wpływ na responsywność**: Icon-only mode is 36–40px square via `Button size="icon"` (meets tap target); text+icon mode uses `size="sm"` and inherits standard horizontal padding; no fixed widths.
- **Wpływ na integrację z Laravel**: None.
- **Ocena prostoty**: Hook is ~30 LOC; component ~80 LOC. No abstractions beyond the existing `Button` and `Tooltip` wrappers.
- **Kontrola duplikacji**: Eliminates ad-hoc `navigator.clipboard.writeText` calls anywhere they may be introduced later; the error page's would-be inline implementation is replaced by the primitive on first use.
- **Mierzalne kryterium sukcesu**: SC-001..SC-006 from spec.

**Gate result**: PASS. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/018-copy-to-clipboard/
├── plan.md                # this file
├── spec.md                # post-grill
├── research.md            # Phase 0
├── data-model.md          # Phase 1
├── quickstart.md          # Phase 1
├── contracts/
│   ├── use-copy-to-clipboard.md   # hook contract
│   └── copy-button.md             # component contract
└── checklists/
    └── requirements.md    # from /speckit.specify
```

### Source Code (repository root) — files touched by this feature

```text
src/
├── app/
│   ├── (app)/
│   │   └── copy-demo/
│   │       └── page.tsx                  # NEW — demo route shell (server component)
│   ├── error.tsx                         # MODIFIED — adds CopyButton sibling to trigger
│   └── layout.tsx                        # MODIFIED — wires TooltipProvider into stack
├── components/
│   ├── copy-demo/
│   │   └── copy-demo.tsx                 # NEW — client component, all permutations
│   ├── providers/
│   │   └── tooltip-provider.tsx          # NEW — thin re-export wrapping <TooltipProvider delay=150>
│   └── ui/
│       └── copy-button.tsx               # NEW — the primitive
└── hooks/
    └── use-copy-to-clipboard.ts          # NEW — the hook
```

**Structure Decision**: Follow the existing repo layout conventions exactly:
- Hooks shared across features live at `src/hooks/` (peers of `use-mobile.ts`,
  `use-principal.ts`).
- shadcn-style UI primitives live at `src/components/ui/` (peers of
  `button.tsx`, `tooltip.tsx`).
- Demo / showcase pages live under `src/app/(app)/<feature>-demo/` (peer of
  the existing `wizard-demo`).
- Cross-cutting providers live under `src/components/providers/` (peers of
  `msw-provider.tsx`, `query-provider.tsx`). The new tooltip-provider file
  wraps Base UI's `TooltipProvider` once so the layout import stays clean and
  future tweaks (delay, group behavior) have a single home.

## Complexity Tracking

> No constitution violations; no entries required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

---

## Phase 0: Outline & Research

There are **no unresolved `NEEDS CLARIFICATION`** in Technical Context — the
grill resolved all of them. Phase 0 therefore consolidates the *already
decided* choices and the small amount of technology validation needed (Base
UI `Tooltip` provider behavior, React 19 ref/cleanup semantics for the timer)
into `research.md`. See `./research.md`.

## Phase 1: Design & Contracts

### 1. Entities → `data-model.md`

The feature has no persisted data, but three runtime entities matter for
contract clarity:
- `CopyTargetValue` (string)
- `CopyStatus` (discriminated union: `"idle" | "copied" | "failed"`)
- `CopyControlLabels` (the three i18n string slots)

Documented in `./data-model.md`.

### 2. Interface Contracts → `contracts/`

The feature exposes **two internal interfaces** to the rest of the codebase:
- The `useCopyToClipboard` hook — see `./contracts/use-copy-to-clipboard.md`
- The `<CopyButton>` component — see `./contracts/copy-button.md`

No HTTP, RPC, or external system contracts are introduced (per §V — frontend-only).

### 3. Agent Context Update

The `<!-- SPECKIT START -->` block in `AGENTS.md` will be updated to point
its "Current active implementation plan" line at
`specs/018-copy-to-clipboard/plan.md`.

### 4. Quickstart

See `./quickstart.md` — covers: how to use `CopyButton`, how to use the
hook directly, how to wire localized labels, and how to manually verify the
feature against SC-001..SC-006.

### Constitution Re-Check (post-design)

All gates remain PASS. No new abstractions, no new dependencies, no new
backend coupling were introduced during Phase 1. The contracts confirm that
the hook is the single chokepoint for the Clipboard API (FR-008), and the
component contract shows it exposes only the props necessary to satisfy
FR-007 and FR-011 — no prop bloat.

---

## Artifacts Generated

- `specs/018-copy-to-clipboard/plan.md` (this file)
- `specs/018-copy-to-clipboard/research.md`
- `specs/018-copy-to-clipboard/data-model.md`
- `specs/018-copy-to-clipboard/contracts/use-copy-to-clipboard.md`
- `specs/018-copy-to-clipboard/contracts/copy-button.md`
- `specs/018-copy-to-clipboard/quickstart.md`
- `AGENTS.md` (active-plan pointer updated)

Ready for `/speckit.tasks`.
