---

description: "Task list for the copy-to-clipboard component feature"
---

# Tasks: Copy to Clipboard Component

**Input**: Design documents from `/specs/018-copy-to-clipboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated tests. Constitution §IX forbids them.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently. The hook and the app-level `TooltipProvider` are foundational because they unblock more than one story; the `CopyButton` component itself is part of User Story 1 because that is the story that defines its primary contract.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories in spec.md (US1, US2, US3, US4)
- Each task includes the exact file path it touches

## Path Conventions

This project uses the Next.js App Router layout under `src/`:

- Hooks: `src/hooks/`
- shadcn-style primitives: `src/components/ui/`
- Cross-cutting providers: `src/components/providers/`
- Feature components: `src/components/<feature>/`
- Routes: `src/app/(app)/<feature>/page.tsx`
- Root layout: `src/app/layout.tsx`
- Error page: `src/app/error.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature has the surface area it expects in the repo. No new dependencies needed (no `pnpm add` required — Lucide, Base UI, shadcn `Button`, and `sonner` are already installed; see `plan.md` Technical Context).

- [X] T001 Verify `src/hooks/`, `src/components/ui/copy-button.tsx` (absent — to be created), `src/components/providers/`, and `src/app/(app)/copy-demo/` (absent — to be created) match the structure in `specs/018-copy-to-clipboard/plan.md` § Project Structure. No code changes; this is a checklist gate before Phase 2 starts.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ship the hook and mount the app-level `TooltipProvider`. The hook is consumed by every user story; the provider is required for icon-only tooltips in US1, US3, and US4. The `CopyButton` component itself is implemented in Phase 3 (US1) because its primary contract belongs to that story.

- [X] T002 [P] Create `src/hooks/use-copy-to-clipboard.ts` implementing the hook exactly per `specs/018-copy-to-clipboard/contracts/use-copy-to-clipboard.md`: signature `useCopyToClipboard({ resetAfter? = 1500 })` returning `{ copy, status, reset }`; `copy(value)` calls `navigator.clipboard.writeText`, returns `Promise<boolean>`, sets status to `"copied"` / `"failed"`; auto-reset timer stored in a ref, cleared on unmount and on every new `copy()` call; SSR-safe guard `typeof navigator === "undefined"`; no inline comments except a single TODO marker recording the deliberate no-fallback decision (FR-008).
- [X] T003 [P] Create `src/components/providers/tooltip-provider.tsx` — a thin client wrapper around `TooltipProvider` from `src/components/ui/tooltip.tsx`, default `delay={150}`, re-exported as `AppTooltipProvider`. Match the existing style of `src/components/providers/query-provider.tsx` (`"use client"` directive, single named export).
- [X] T004 Wire `AppTooltipProvider` into `src/app/layout.tsx` so it wraps `{children}` inside `QueryProvider` (i.e. innermost provider before page content). Do not touch ThemeProvider, MSWProvider, or Toaster ordering.

**Checkpoint**: Hook is available; tooltips can render anywhere in the app. User stories can now begin.

---

## Phase 3: User Story 1 — One-click copy of textual content (Priority: P1)

**Goal**: Ship the `CopyButton` primitive so any surface can drop a one-click copy affordance next to a value, with an accessible icon-only mode, an optional inline-text mode, an automatic disabled state on empty value, and immediate success feedback that auto-clears.

**Independent Validation**: From the demo route, click each of the US1 permutations (icon-only, text+icon, disabled empty), paste into a separate text field, and confirm the pasted content matches and the icon swap + tooltip-text swap occur within the confirmation window.

### Implementation for User Story 1

- [X] T005 [US1] Create `src/components/ui/copy-button.tsx` implementing the component exactly per `specs/018-copy-to-clipboard/contracts/copy-button.md`: `"use client"`; props `{ value, label = "Copy", copiedLabel = "Copied", failedLabel = "Couldn't copy", children?, resetAfter?, onCopy?, disabled?, ...buttonProps }`; default `variant="ghost"`; default `size = children ? "sm" : "icon"`; Lucide `Copy` / `Check` / `X` icons swapped on `status`, all `aria-hidden`; stable `aria-label={label}`; `sr-only` `aria-live="polite"` span containing the current status label (empty when idle); tooltip wrap rendered **only** when `children` is omitted; `data-state` attribute reflecting `status`; `disabled` resolves to `disabled || value === ""`; onClick wired to `copy(value)` and fires `onCopy(value, status)` exactly once per attempt after the promise resolves.
- [X] T006 [P] [US1] Create `src/app/(app)/copy-demo/page.tsx` as a minimal server component shell that renders `<CopyDemo />` from `src/components/copy-demo/copy-demo.tsx`. Include `export const metadata = { title: "Copy demo" }`. No data fetching, no providers — relies on the existing `(app)` layout.
- [X] T007 [US1] Create `src/components/copy-demo/copy-demo.tsx` (`"use client"`) with the US1 sections rendered side-by-side: (a) icon-only `<CopyButton value="user_abc123" label="Copy user id" />`, (b) text+icon `<CopyButton value="user_abc123" label="Copy user id">user_abc123</CopyButton>`, (c) disabled-empty `<CopyButton value="" label="Copy id" />`, (d) `onCopy`-to-`sonner` example showing the callback. Each section labeled in Polish (h2 + short description) so it acts as in-app documentation. Leave a clearly marked region in the file for US2 and US3 additions (a comment with `TODO:` is the only allowed inline comment).
- [ ] T008 [US1] Manual verification against `specs/018-copy-to-clipboard/quickstart.md` SC-001, SC-002, and US1 acceptance scenarios 1–4: confirm the icon swaps, tooltip text changes, live-region announcement fires without focus movement, disabled-empty button does not activate, and consecutive clicks restart the timer cleanly. Verify both light and dark themes and both desktop and mobile viewports on `/copy-demo`.

**Checkpoint**: User Story 1 is fully functional and independently verifiable on `/copy-demo`.

---

## Phase 4: User Story 2 — Reusable hook for non-button copy interactions (Priority: P2)

**Goal**: Demonstrate that `useCopyToClipboard` is consumable from non-button surfaces (a dropdown menu item) without rendering the standard `CopyButton`, proving the hook is the shared reuse path for any custom copy affordance.

**Independent Validation**: On `/copy-demo`, open the dropdown demonstration menu, click the "Copy" menu item, paste into a separate text field, and confirm the value matches and the menu item's label briefly switches to its "copied" form.

### Implementation for User Story 2

- [X] T009 [US2] In `src/components/copy-demo/copy-demo.tsx`, add a new demo section that renders a shadcn `DropdownMenu` containing a `DropdownMenuItem` whose `onSelect` handler calls `copy(value)` from `useCopyToClipboard`. The menu-item label reads `"Kopiuj ID"` when idle and `"Skopiowano"` when status is `"copied"`. No new component file — this is a section of the existing demo client component.
- [ ] T010 [US2] Manual verification against US2 acceptance scenarios 1–2: copy from the menu item, paste, confirm match; wait for the confirmation window and confirm the menu-item label returns to its idle text without re-opening the menu.

**Checkpoint**: User Story 2 verifiable on `/copy-demo`.

---

## Phase 5: User Story 3 — Graceful behavior when copying is unavailable (Priority: P3)

**Goal**: Prove the failure path of `CopyButton` (and by extension the hook) surfaces a distinct failure indication, never a false success, and auto-resets so the user can retry without intervention. No new component code — the failed state is already in `CopyButton` from T005 — only a demo affordance to exercise it on-demand.

**Independent Validation**: On `/copy-demo`, enable the "Simulate failure" toggle, click any copy button in the demo, and confirm the `X` icon, the failure tooltip/label, and the live-region announcement fire; then disable the toggle and confirm a fresh copy succeeds normally.

### Implementation for User Story 3

- [X] T011 [US3] In `src/components/copy-demo/copy-demo.tsx`, add a "Symulacja błędu kopiowania" section with a shadcn `Switch` controlling a local `simulateFailure` state. While the switch is on, a `useEffect` keyed on `simulateFailure` replaces `navigator.clipboard.writeText` with `() => Promise.reject(new Error("Simulated clipboard failure"))` and restores the original binding via the effect cleanup (also runs on component unmount). The original binding is captured in a ref before override. The section renders a `<CopyButton>` with Polish failure labels so reviewers can click it while the switch is on to see the `X` icon, the failure tooltip, and the live-region announcement. The production primitive is untouched — the demo manipulates only the global `navigator.clipboard.writeText` for the lifetime of the toggle. Per grill Q1 = (A).
- [ ] T012 [US3] Manual verification against SC-003 and US3 acceptance scenarios 1–2: with simulation on, confirm icon = `X`, tooltip = `"Nie udało się skopiować"` (or English default in the demo's English sections), live region announces the failure, and the button returns to idle within the same confirmation window. Toggle simulation off, click again, and confirm normal success path. Verify in both themes.

**Checkpoint**: User Story 3 verifiable on `/copy-demo`.

---

## Phase 6: User Story 4 — Copy error diagnostics for support handoff (Priority: P1)

**Goal**: Adopt the primitive on the application error page so users can copy the full technical diagnostics block to their clipboard in a single click, with Polish labels matching the rest of the page.

**Independent Validation**: Trigger a runtime error that renders `src/app/error.tsx`, click the copy button on the diagnostics block (without expanding it first), paste into a separate text field, and confirm the full `Komunikat / Digest / Stack` text matches the page exactly.

### Implementation for User Story 4

- [X] T013 [US4] Edit `src/app/error.tsx`: refactor the `CollapsibleTrigger` row so the trigger and a new sibling `<CopyButton>` live inside one flex container — the trigger takes `flex-1` and keeps its current text + chevron, the `<CopyButton>` sits on the right with `value={diagnostics.join("\n\n")}`, `label="Kopiuj szczegóły błędu"`, `copiedLabel="Skopiowano"`, `failedLabel="Nie udało się skopiować"`, and `variant="ghost" size="icon"`. The copy button is rendered as a **sibling** (not nested inside `CollapsibleTrigger`); use `onClick={(e) => e.stopPropagation()}` on the copy button so clicking it does not toggle the collapsible. Render the copy button only when `diagnostics.length > 0` (FR-013 acceptance scenario 2 — no diagnostics ⇒ no button).
- [ ] T014 [US4] Manual verification against SC-004, SC-006, and US4 acceptance scenarios 1–3: trigger an error, confirm the copy button is visible *before* expanding the collapsible, click it, paste into a separate text field, confirm content matches exactly; confirm the button is absent when no diagnostics are present; confirm all labels are Polish; confirm clicking the copy button does not expand/collapse the section; confirm both light and dark theme and mobile/desktop layouts hold.

**Checkpoint**: User Story 4 verifiable in production-shaped surface.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final pass on simplicity, theme/responsive parity, accessibility, and quickstart accuracy. No new behavior.

- [X] T015 [P] Review every file touched by this feature for inline comments. Remove any comment that is not a security note or a documented `TODO:` (per Constitution §IX). The only allowed TODO is the no-fallback marker in `src/hooks/use-copy-to-clipboard.ts`.
- [X] T016 [P] Review the demo component for duplicated section markup; if three or more sections share identical scaffolding, extract a tiny local `<DemoSection title>` helper inside `src/components/copy-demo/copy-demo.tsx`. Do not create a new file for it.
- [ ] T017 Manual accessibility review on `/copy-demo` against SC-005 using a screen reader (VoiceOver or NVDA): focus each copy button, click via Enter, confirm the live-region announcement fires without moving focus, confirm tooltips do not interfere with the announcement, confirm the disabled-empty button is announced as disabled and is unreachable by activation.
- [ ] T018 Re-run the verification recipe in `specs/018-copy-to-clipboard/quickstart.md` end-to-end to confirm SC-001 through SC-006 all pass.
- [X] T019 Run `pnpm lint` and resolve any reported issues in files touched by this feature. Do not run a project-wide formatter or lint autofix outside the feature's files (Constitution §III).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1. T002 (hook), T003 (provider file), and T004 (layout wiring) — T002 and T003 are parallel; T004 depends on T003.
- **Phase 3 (US1)**: Depends on Phase 2 (hook + provider). T005 depends on T002. T006 and T007 depend on T005. T008 depends on T005–T007.
- **Phase 4 (US2)**: Depends on Phase 3 (uses the demo component file). T009 depends on T007. T010 depends on T009.
- **Phase 5 (US3)**: Depends on Phase 3 (extends the demo component file). T011 depends on T007. T012 depends on T011.
- **Phase 6 (US4)**: Depends on Phase 3 (consumes `CopyButton`). T013 depends on T005 + T004. T014 depends on T013.
- **Phase 7 (Polish)**: Depends on completion of every desired user story.

### User Story Dependencies

- **US1, US2, US3, US4** all share the demo component file (`copy-demo.tsx`), so their tasks against that file are sequential rather than parallel. US4 does not touch the demo file, so it can proceed in parallel with US2 / US3 after US1 (T005) lands.
- Otherwise each story is independently verifiable.

### Within Each User Story

- Land the production primitive code first, the demo section second, the manual verification last.
- Keep edits surgical: a new file is preferred over expanding an existing unrelated file, and a flex-container wrapping diff is preferred over re-architecting `error.tsx`.

### Parallel Opportunities

- **In Phase 2**: T002 and T003 run in parallel (different files, no dependency between them).
- **In Phase 3**: T006 can run in parallel with the bulk of T007 (different files), once T005 is in place.
- **After T005 lands**: US4 (T013) can be developed in parallel with US2 (T009) and US3 (T011), since US4 does not touch `copy-demo.tsx`.
- **In Phase 7**: T015 and T016 run in parallel (different files).

---

## Suggested MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 6 (US4).**

This delivers:
- The hook, the component, the tooltip provider, the demo surface for US1, and the production error-page consumer.
- Both P1 user stories end-to-end.
- All FR / SC items except the hook-only and failure-simulation demos (US2 and US3 are P2 and P3 — they enrich the demo surface but do not add production code).

Stopping at MVP is acceptable; US2 and US3 are demo-only enhancements that improve reviewability and a11y rehearsal but ship no new product behavior.

---

## Notes

- [P] tasks = different files, no dependency on incomplete tasks.
- Every user story phase task is tagged `[US1] / [US2] / [US3] / [US4]` for traceability against `spec.md`.
- No automated test tasks (Constitution §IX). Verification is manual against `quickstart.md` and the spec's acceptance scenarios.
- The hook's deliberate no-fallback decision (FR-008) is the only allowed inline comment in the feature's source files (as a `TODO:` marker per Constitution §IX).
