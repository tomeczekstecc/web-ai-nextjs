---
description: "Task list for Light/Dark Theme Toggle implementation"
---

# Tasks: Light/Dark Theme Toggle

**Input**: Design documents from `/specs/004-theme-toggle/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/theme-toggle-ui-contract.md ✓, quickstart.md ✓

**Tests**: No automated tests (constitution forbids them for this project).

**Organization**: Tasks grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Confirm existing file locations and no new files need creating.

- [x] T001 Read and confirm current ThemeProvider usage in `src/app/layout.tsx` and `src/components/theme-provider.tsx` before editing
- [x] T002 Read and confirm current `src/components/nav-user.tsx` to locate Powiadomienia row position before editing

**Checkpoint**: File locations confirmed — foundational edits can begin

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Remove system-following theme mode app-wide so all user story work builds on a valid two-state policy.

- [x] T003 Update ThemeProvider props in `src/app/layout.tsx` to set `enableSystem={false}`, `defaultTheme="light"`, and `themes={["light", "dark"]}` to remove the hidden system state

**Checkpoint**: App-wide theme policy is now light/dark only — user story implementation can begin

---

## Phase 3: User Story 1 — Switch Theme From Account Navigation (Priority: P1)

**Goal**: Place a theme action row in the authenticated account dropdown visually aligned with Konto, Rozliczenia, and Powiadomienia.

**Independent Validation**: Open the authenticated sidebar user dropdown on desktop and mobile — confirm a theme row appears after Powiadomienia in the same group as Konto, Rozliczenia, and Powiadomienia, and before the separator and Wyloguj.

### Implementation for User Story 1

- [x] T004 [US1] Insert a placeholder `DropdownMenuItem` after the Powiadomienia row in `src/components/nav-user.tsx`, inside the same account group, before the sign-out separator

**Checkpoint**: User Story 1 is independently verifiable — open dropdown and confirm theme row placement

---

## Phase 4: User Story 2 — Switch Only Between Light And Dark (Priority: P2)

**Goal**: Wire the theme row to cycle exclusively between Jasny and Ciemny using the resolved theme, with a mounted guard to avoid hydration mismatch, and no Systemowy option.

**Independent Validation**: Open account dropdown — confirm exactly one row that switches to the opposite theme on activation, confirm no Systemowy is present, confirm the app visually changes on click.

### Implementation for User Story 2

- [x] T005 [US2] Add `useTheme` import and a `mounted` guard (via `useEffect`/`useState`) to `src/components/nav-user.tsx` so theme-dependent rendering is safe from hydration mismatch
- [x] T006 [US2] Derive next action from resolved theme in `src/components/nav-user.tsx`: when theme is `light` show label `Ciemny`; when theme is `dark` or resolved default show label `Jasny`; add `onClick` handler calling `setTheme` with the opposite value
- [x] T007 [US2] Ensure stale or missing resolved theme falls back to the `light`-action branch in `src/components/nav-user.tsx` (never exposes Systemowy label)

**Checkpoint**: User Story 2 is independently verifiable — cycle row toggles the theme and no Systemowy is present

---

## Phase 5: User Story 3 — Recognize Theme Choices By Icon (Priority: P3)

**Goal**: Pair each next-action label with the correct lucide icon (Moon for Ciemny, Sun for Jasny) and provide accessible Polish action text.

**Independent Validation**: Open dropdown in both theme states — confirm Moon+Ciemny when light and Sun+Jasny when dark; confirm accessible action text describes switching to the opposite theme.

### Implementation for User Story 3

- [x] T008 [US3] Import `Moon` and `Sun` from `lucide-react` in `src/components/nav-user.tsx`; render `Moon` icon for the Ciemny action and `Sun` icon for the Jasny action inside the theme row
- [x] T009 [US3] Add `aria-label` to the theme row in `src/components/nav-user.tsx`: `Przełącz na ciemny motyw` when current theme is light; `Przełącz na jasny motyw` when current theme is dark
- [x] T010 [P] [US3] Inspect `src/components/theme-toggle.tsx` (public homepage toggle) and update if it exposes `Systemowy` or uses `enableSystem`; ensure it cycles only between light and dark under the app-wide policy

**Checkpoint**: User Story 3 is independently verifiable — icons match next action and accessible text is correct in both theme states

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Manual verification and build validation across all stories.

- [ ] T011 Run `pnpm dev` and perform full manual verification per `specs/004-theme-toggle/quickstart.md`: check dropdown order, light→dark and dark→light cycling, reload persistence, stale-system fallback, mobile layout, and absence of Systemowy
- [x] T012 Run `pnpm lint` and resolve any lint errors in changed files
- [x] T013 Run `pnpm build` and confirm a clean production build with no type errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 reads — blocks user story phases
- **User Story phases (3–5)**: Depend on Phase 2 (ThemeProvider policy set); each story extends the previous nav-user.tsx changes sequentially
- **Polish (Phase 6)**: Depends on all user story phases being complete

### User Story Dependencies

- US1 must complete before US2 (US2 wires logic into the row US1 inserts)
- US2 must complete before US3 (US3 adds icons and a11y to the row US2 wired)
- T010 [US3] is independent of T008/T009 — it touches a different file and can run in parallel

### Parallel Opportunities

| Parallel Group | Tasks | Condition |
|---|---|---|
| Phase 5 US3 | T010 alongside T008–T009 | Different files: `theme-toggle.tsx` vs `nav-user.tsx` |

---

## Implementation Strategy

**MVP scope**: Complete Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 6 (T011–T013). This delivers the working two-state cycle row in the account dropdown.

**Full delivery**: Add Phase 5 (icons + accessible text + public toggle check) before the final polish pass.

**Total tasks**: 13
- Phase 1 (Setup): 2
- Phase 2 (Foundational): 1
- Phase 3 (US1): 1
- Phase 4 (US2): 3
- Phase 5 (US3): 3
- Phase 6 (Polish): 3

**Parallel opportunities**: 1 (T010 alongside T008–T009 in Phase 5)
