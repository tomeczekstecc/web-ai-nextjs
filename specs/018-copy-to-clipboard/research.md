# Phase 0 Research — Copy to Clipboard Component

**Feature**: 018-copy-to-clipboard
**Date**: 2026-05-22

The `/speckit.specify` + grill cycle resolved every meaningful unknown, so
this document records the decisions and the small amount of technology
validation needed to lock the design. No outstanding `NEEDS CLARIFICATION`
items remain.

---

## Decision 1 — Hook implementation: local, no new dependency

- **Decision**: Implement `useCopyToClipboard` as a local hook at
  `src/hooks/use-copy-to-clipboard.ts`. No new npm package.
- **Rationale**: The Clipboard API surface we need
  (`navigator.clipboard.writeText` + a tri-state status + a reset timer) is
  ~30 LOC. The repo already carries small local hooks (`use-mobile.ts`,
  `use-principal.ts`) and adding a dependency for this would bloat the
  bundle, fix the timer/error semantics to a third party, and violate
  constitution §II (Simplicity First).
- **Alternatives considered**:
  - `usehooks-ts` `useCopyToClipboard` — returns `[copy, copiedValue]`,
    loses the explicit failure state and timer-based reset we need for
    FR-002/FR-003/FR-008. Rejected.
  - `@uidotdev/usehooks` — heavier package surface for one helper.
    Rejected.

## Decision 2 — Hook public signature

- **Decision**:
  ```ts
  type CopyStatus = "idle" | "copied" | "failed";
  type UseCopyToClipboardOptions = { resetAfter?: number };
  type UseCopyToClipboardReturn = {
    copy: (value: string) => Promise<boolean>;
    status: CopyStatus;
    reset: () => void;
  };
  ```
- **Rationale**: Passing the value at call time (not at hook init time)
  keeps the hook usable in dynamic contexts (table rows, menu items,
  toasts) without remounting. A discriminated `status` enum is idiomatic
  for the rest of the codebase (TanStack Query, form state) and forces
  consumers to handle failure explicitly. The `Promise<boolean>` return
  lets callers chain a follow-up (e.g. `toast`) without subscribing to
  the React state. `reset()` is a cheap escape hatch for the rare
  consumer that wants manual control.
- **Alternatives considered**:
  - Bind value at hook call: awkward for dynamic-value contexts. Rejected.
  - Tuple `[copy, copiedValue]`: drops the failure state. Rejected.

## Decision 3 — Confirmation window

- **Decision**: `resetAfter` default = **1500ms**. Both `"copied"` and
  `"failed"` clear back to `"idle"` on the same timer.
- **Rationale**: Comfortably under the SC-002 2s ceiling; matches the
  dominant shadcn / Vercel / GitHub convention. A single knob keeps the
  API small. Auto-resetting failure invites the natural recovery action
  (click again); the live-region announcement already told assistive
  tech about the failure, so pinning it visually forever adds no value.
- **Alternatives considered**:
  - 2000ms (SC-002 ceiling): too lingering when many copy buttons sit in
    a table. Rejected.
  - 1000ms: too snappy; user can blink and miss it. Rejected.
  - Separate `successResetAfter` / `failureResetAfter`: premature
    configuration. Rejected.

## Decision 4 — No legacy clipboard fallback

- **Decision**: Modern API only. When `navigator.clipboard?.writeText` is
  missing or the promise rejects, status → `"failed"`. The hook is
  documented as the single chokepoint where a future fallback could be
  added without changing consumers (FR-008).
- **Rationale**: The spec already pins the assumption — HTTPS + modern
  browsers. `document.execCommand("copy")` is officially deprecated, and
  shipping it as a safety net trades a tiny edge case for explicit
  deprecation debt plus DOM-mutation surprises (focus jumps, iOS scroll
  jumps). The `"failed"` state, the icon swap, the tooltip text change,
  and the `aria-live` announcement together are the graceful degradation
  User Story 3 requires.
- **Alternatives considered**:
  - Ship `document.execCommand("copy")` fallback. Rejected.

## Decision 5 — Component shape and click target

- **Decision**: Single `<CopyButton>` primitive at
  `src/components/ui/copy-button.tsx`, built on top of the existing
  shadcn `Button`. `children` is optional — when omitted the button is
  icon-only (`size="icon"`); when present, the button renders as
  `[ children  icon ]` (`size="sm"`). The whole button is one click
  target, one focus stop, one accessible name.
- **Rationale**: Matches shadcn-ui conventions in the repo (small,
  single-responsibility primitives). Children-over-`text`-prop matches
  `<Button>Save</Button>` and `<Badge>New</Badge>`. Single click target
  avoids the button-in-span a11y anti-pattern.
- **Alternatives considered**:
  - Text + button as two separate elements: extra focus stop + double
    accessible-name read. Rejected.
  - Headless + styled split (`<CopyTrigger asChild>` + `<CopyButton>`):
    overkill — the hook already serves the non-button reuse case.
    Rejected.

## Decision 6 — Feedback channels

- **Decision**:
  - Visual: Lucide `Copy` icon swaps to `Check` on success, `X` on
    failure, returning to `Copy` after the timer.
  - Tooltip (icon-only mode only): swaps text from `label` →
    `copiedLabel` / `failedLabel`.
  - Assistive tech: `sr-only` `aria-live="polite"` `<span>` inside the
    button announces the same `copiedLabel` / `failedLabel`. The
    button's `aria-label` itself stays equal to `label` (stable —
    mutating it would re-trigger full announcements in some screen
    readers).
  - No built-in `sonner` toast. Consumers wanting toast feedback wire
    `onCopy(value, status)` themselves.
- **Rationale**: Icon + tooltip = sighted feedback; live region = AT
  feedback; both perceivable without moving focus (FR-006). Built-in
  toast would cause noise when several copy buttons sit close (a data
  table column) and would force the primitive to assume a `<Toaster>`
  is mounted.
- **Alternatives considered**:
  - Built-in toast: redundant + dependency on mounted Toaster.
    Rejected.
  - Mutating `aria-label` for state: re-announce noise on some
    screen readers. Rejected.

## Decision 7 — Empty value: hook permissive, component disables

- **Decision**:
  - Hook: `copy("")` writes `""` to the clipboard, returns true, sets
    status `"copied"`. Pure mechanism.
  - Component: `value === ""` → button renders `disabled`. No
    `allowEmpty` escape hatch in this delivery (YAGNI).
- **Rationale**: Hook = mechanism, component = policy. Keeps the hook
  honest for consumers who legitimately want to clear someone's
  clipboard, while satisfying FR-012's "must not announce a false
  success" at the most common surface.
- **Alternatives considered**:
  - Hook also no-ops empty: surprising behavior on a primitive.
    Rejected.
  - `allowEmpty` prop on component: speculative. Rejected.

## Decision 8 — Status label customization

- **Decision**: Three independent props — `label`, `copiedLabel`,
  `failedLabel` — with English defaults (`"Copy"`, `"Copied"`,
  `"Couldn't copy"`). Tooltip and live-region announcement both read
  from the same prop, so they can never drift.
- **Rationale**: No global i18n infrastructure exists today
  (verified — no `next-intl` / `react-i18next` in `package.json`,
  no `locales/` dir). Per-prop overrides cover the realistic case
  (localized surfaces pass their own strings) without inventing a
  `messages` shape we would later refactor when real i18n lands.
- **Alternatives considered**:
  - Hardcoded English: forces a component fork the first time a
    consumer needs Polish. Rejected.
  - `messages={{ copied, failed }}` object prop: cosmetic, no benefit at
    n=2 strings. Rejected.

## Decision 9 — TooltipProvider wiring

- **Decision**: Mount a single `TooltipProvider` at the app root inside
  `src/app/layout.tsx`, via a tiny re-export at
  `src/components/providers/tooltip-provider.tsx` (so the layout import
  list stays uniform with the other providers). Delay = **150ms**
  (snappy without firing on accidental hovers).
- **Rationale**: `TooltipProvider` is defined in
  `src/components/ui/tooltip.tsx` but never imported anywhere in `src/`.
  An icon-only copy button is the textbook case that needs a hover
  label. A single root-level provider is the correct pattern (not a
  per-instance wrap), and benefits every future tooltip-using
  primitive.
- **Alternatives considered**:
  - Per-button provider wrap: works but normalizes the wrong pattern.
    Rejected.
  - Skip tooltip entirely (rely on `aria-label`): adequate for AT,
    poor UX for sighted hover discovery. Rejected.

## Decision 10 — Icon source

- **Decision**: Lucide icons (`Copy`, `Check`, `X`) — already a project
  dependency (`lucide-react`).
- **Rationale**: Zero new assets, visual consistency with the rest of
  the app (error page already uses Lucide).
- **Alternatives considered**: Heroicons, Tabler, custom SVGs — all add
  weight or visual inconsistency. Rejected.

## Decision 11 — Error-page consumer placement

- **Decision**: On `src/app/error.tsx`, the `CollapsibleTrigger` row
  becomes a flex container with the trigger occupying `flex-1` and the
  new `<CopyButton>` as a *sibling* on the right side of that row (not
  nested inside the trigger). Visible whether the collapsible is open
  or closed. Copies the exact `diagnostics.join("\n\n")` blob that the
  `<pre>` displays. Polish labels: `label="Kopiuj szczegóły błędu"`,
  `copiedLabel="Skopiowano"`, `failedLabel="Nie udało się skopiować"`.
- **Rationale**: Header placement removes the "expand first" friction
  during an incident. Sibling layout is the only correct way to nest
  two interactive controls in the same row (button-in-button is invalid
  HTML and breaks focus / accessible naming). WYSIWYG copy content
  matches Principle of Least Astonishment.
- **Alternatives considered**:
  - Inside collapsible body: requires expansion first. Rejected.
  - Floating absolute button: hover-only reveal punishes keyboard
    users. Rejected.
  - Structured payload (timestamp + URL + diagnostics): scope creep —
    a "Report this error" feature, not a copy primitive. Rejected.

## Decision 12 — Demo route

- **Decision**: New route at `src/app/(app)/copy-demo/page.tsx` (server
  component shell) rendering a client demo component at
  `src/components/copy-demo/copy-demo.tsx`. Five permutations:
  1. Icon-only `CopyButton`
  2. Text + icon `CopyButton`
  3. Disabled (empty value)
  4. `onCopy` wired to a `sonner` toast
  5. Direct hook usage inside a `DropdownMenuItem` (proves User Story 2)
  Plus a "Simulate failure" toggle that wraps `copy()` in a forced
  reject so reviewers can verify the failed state on-demand.
- **Rationale**: Mirrors existing `wizard-demo` precedent. Single venue
  for SC-005 manual a11y review. Keeps the primitive PR scope-pure (no
  decisions about *which* production surface adopts each variant).
- **Alternatives considered**:
  - No demo route: loses documentation + rehearsal venue. Rejected.
  - Pick a real production surface for each variant: scope creep,
    drags in unrelated reviewers. Rejected.

---

## Technology Validation Notes

- **Base UI `Tooltip` provider**: `@base-ui/react/tooltip` exports a
  `Tooltip.Provider` (re-exported from `src/components/ui/tooltip.tsx`
  as `TooltipProvider`) that supports a `delay` prop. A single root
  provider is sufficient — Base UI tooltips look up the nearest
  ancestor provider. Verified by reading
  `src/components/ui/tooltip.tsx`.
- **React 19 timer cleanup**: The hook stores the timeout id in a ref
  and clears it on unmount via the cleanup of a `useEffect` that
  observes `status`. This pattern is safe under React 19 strict-mode
  double-invocation (cleanup runs between invocations). No
  `useSyncExternalStore` needed — clipboard state is owned solely by
  this hook instance.
- **SSR**: The hook is a client-only concern (`navigator` is browser-only).
  Component file carries `"use client"` because it uses `useState` /
  event handlers. Hook file does **not** need `"use client"` itself
  (hooks aren't directives carriers), but is only ever called from
  client components — guarded internally with
  `typeof navigator !== "undefined"`.
- **Tailwind v4**: All styling uses existing utility classes and
  design tokens. No `globals.css` changes required.
