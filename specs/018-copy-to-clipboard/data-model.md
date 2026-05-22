# Data Model — Copy to Clipboard Component

**Feature**: 018-copy-to-clipboard
**Date**: 2026-05-22

No persisted data. All entities below are **runtime types** local to the
feature.

---

## `CopyTargetValue`

The text the consumer wants placed on the clipboard.

| Field | Type | Notes |
|-------|------|-------|
| value | `string` | Always plain text. May be empty. May be multi-kilobyte (a stack trace). |

**Validation rules**:
- Plain text only — rich content (HTML, images, files) is out of scope.
- `""` is structurally valid at the hook layer; the `CopyButton` component
  treats it as "no copyable value present" and disables itself (FR-012).
- Whitespace-only strings are *not* treated specially — consumers who want
  to forbid them must pre-process the value.

---

## `CopyStatus`

The state of the most recent copy attempt for a given hook/component
instance.

```ts
type CopyStatus = "idle" | "copied" | "failed";
```

**State transitions**:

```
        copy() success                copy() failure
idle ──────────────────▶ copied   idle ──────────────────▶ failed
  ▲                       │         ▲                       │
  │   resetAfter ms       │         │   resetAfter ms       │
  └───────────────────────┘         └───────────────────────┘

copied ──── copy() again ──▶ copied  (timer restarts)
copied ──── reset() ────────▶ idle
failed ──── copy() succeeds ▶ copied  (timer restarts)
failed ──── reset() ────────▶ idle
```

**Invariants**:
- Exactly one of the three states at any time per hook instance.
- A successful `copy()` always overrides a prior `failed` state without an
  intermediate `idle`.
- On unmount, the pending reset timer is cleared (no setState after
  unmount).

---

## `CopyControlLabels`

The three user-facing strings on a `<CopyButton>` instance. Conceptual
grouping — they are exposed as three separate props on the component, not
as a single object (see Decision 8 in `research.md`).

| Slot | Default | Role | Surfaces |
|------|---------|------|----------|
| `label` | `"Copy"` | Default accessible name + tooltip text in icon-only mode. Stays stable across state transitions. | `aria-label` on the button; `TooltipContent` text when `status === "idle"`. |
| `copiedLabel` | `"Copied"` | Success confirmation. | `TooltipContent` text + `sr-only aria-live` announcement when `status === "copied"`. |
| `failedLabel` | `"Couldn't copy"` | Failure indication. | `TooltipContent` text + `sr-only aria-live` announcement when `status === "failed"`. |

**Validation rules**:
- All three are plain strings (no rich nodes) — they must be readable by
  screen readers and renderable inside a tooltip.
- Owned per-instance by the consumer; localized at the call site (e.g. the
  error-page consumer passes Polish; the demo page passes English).
- The single source of truth for each slot means the tooltip text and the
  live-region announcement cannot drift apart.
