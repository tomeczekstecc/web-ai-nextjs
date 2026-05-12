# Tasks: JSON-Driven Navigation Menu Generator

**Input**: Design documents from `/specs/014-json-menu-gen/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Do not add automated tests. Constitution forbids test tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## User Story Mapping

| Story | Title | Priority | Spec Reference |
|-------|-------|----------|----------------|
| US1 | Server-Driven Sidebar Navigation | P1 | spec.md lines 29-42 |
| US2 | Settings Section Always Anchored | P1 | spec.md lines 45-59 |
| US3 | Active Route Highlighting | P2 | spec.md lines 62-76 |
| US4 | Permission and Role Filtering | P2 | spec.md lines 79-93 |
| US5 | Env-Controlled Layout Mode | P3 | spec.md lines 96-109 |

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the API domain structure and type definitions required by all stories

- [x] T001 [P] Create menu API domain types in `src/lib/api/domains/menu/contract.ts` (MenuConfig, FeatureItem, SubMenuItem, SettingsItem, PermRule, NavLayoutMode)
- [x] T002 [P] Create menu query keys factory in `src/lib/api/domains/menu/query-keys.ts` (menuKeys.all, menuKeys.config)
- [x] T003 [P] Create menu API client fetch function in `src/lib/api/domains/menu/client.ts` (fetchMenuConfig using apiConfig.baseUrl)
- [x] T004 [P] Create menu query options in `src/lib/api/domains/menu/query-options.ts` (menuConfigOptions with staleTime: Infinity, refetchOnWindowFocus: false)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: MSW mock, hooks, and utilities that MUST be complete before user stories

- [x] T005 Rewrite menu fixture with clean JSON structure in `src/mocks/data/menu.ts` (explicit key fields, matching contract types)
- [x] T006 Create MSW handler for menu endpoint in `src/mocks/handlers/menu.ts` (GET */api/config/menu returns fixture)
- [x] T007 Register menu handler in `src/mocks/handlers/index.ts` (add menuHandlers to handlers array)
- [x] T008 [P] Create useMenuConfig hook in `src/hooks/menu/useMenuConfig.ts` (TanStack Query hook using menuConfigOptions)
- [x] T009 [P] Create icon resolver utility in `src/lib/menu/icons.ts` (resolveIcon: kebab-case → PascalCase → Lucide component, fallback to Circle)
- [x] T010 [P] Create env helper in `src/lib/menu/env.ts` (getNavLayout: reads NEXT_PUBLIC_NAV_LAYOUT, defaults to 'sidebar')

**Checkpoint**: Foundation ready - MSW serves menu data, hook fetches it, utilities available

---

## Phase 3: User Story 1 - Server-Driven Sidebar Navigation (Priority: P1)

**Goal**: Sidebar populates from menu API instead of hardcoded data. Changing fixture reflects in UI.

**Independent Validation**: With MSW serving fixture, sidebar renders exactly the features and labels defined. Change fixture, refresh, see updated navigation.

### Implementation for User Story 1

- [x] T011 [US1] Refactor AppSidebar to accept and use user prop in `src/components/app-sidebar.tsx` (fix existing bug where user prop is ignored)
- [x] T012 [US1] Add useMenuConfig hook call in `src/components/app-sidebar.tsx` (fetch menu data, handle loading/error states)
- [x] T013 [US1] Remove hardcoded data object from `src/components/app-sidebar.tsx` (delete const data = {...})
- [x] T014 [US1] Remove TeamSwitcher and NavProjects from `src/components/app-sidebar.tsx` (remove imports and component usage)
- [x] T015 [US1] Refactor NavMain to accept FeatureItem[] props in `src/components/nav-main.tsx` (replace hardcoded items type)
- [x] T016 [US1] Implement feature item rendering in `src/components/nav-main.tsx` (collapsible groups for submenu, direct links for to-only items)
- [x] T017 [US1] Integrate icon resolver in `src/components/nav-main.tsx` (use resolveIcon for item.icon)
- [x] T018 [US1] Add loading skeleton state in `src/components/app-sidebar.tsx` (show SidebarMenuSkeleton during fetch)
- [x] T019 [US1] Add error state handling in `src/components/app-sidebar.tsx` (empty nav body + console.error on fetch failure)
- [x] T020 [US1] Handle invalid feature items in `src/components/nav-main.tsx` (log warning and skip items with neither submenu nor to)
- [x] T021 [US1] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 1 complete - sidebar renders from MSW fixture, visual appearance unchanged

---

## Phase 4: User Story 2 - Settings Section Always Anchored (Priority: P1)

**Goal**: Avatar dropdown items come from settings JSON. Logout action works.

**Independent Validation**: Change settings array in fixture. Refresh. Avatar dropdown reflects change exactly.

### Implementation for User Story 2

- [x] T022 [US2] Refactor NavUser to accept SettingsItem[] and user props in `src/components/nav-user.tsx` (replace hardcoded dropdown items)
- [x] T023 [US2] Implement settings item rendering in `src/components/nav-user.tsx` (map SettingsItem[] to DropdownMenuItem components)
- [x] T024 [US2] Integrate icon resolver in `src/components/nav-user.tsx` (use resolveIcon for item.icon)
- [x] T025 [US2] Implement navigation action for to items in `src/components/nav-user.tsx` (use Next.js router for items with to field)
- [x] T026 [US2] Implement logout action handler in `src/components/nav-user.tsx` (call authClient.signOut for action: "logout", redirect to sign-in)
- [x] T027 [US2] Handle non-interactive settings items in `src/components/nav-user.tsx` (render as disabled label when neither to nor action present)
- [x] T028 [US2] Pass settings and user props from AppSidebar to NavUser in `src/components/app-sidebar.tsx`
- [x] T029 [US2] Verify collapsed sidebar tooltip behavior in `src/components/nav-user.tsx` (user name tooltip on avatar hover)
- [x] T030 [US2] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 2 complete - settings dropdown driven by JSON, logout works

---

## Phase 5: User Story 3 - Active Route Highlighting (Priority: P2)

**Goal**: Current page's menu item is visually highlighted. Updates on route change.

**Independent Validation**: Navigate to /playground/history - History sub-item highlighted. Navigate to /models/genesis - Genesis highlighted.

### Implementation for User Story 3

- [x] T031 [US3] Add usePathname hook in `src/components/nav-main.tsx` (import from next/navigation)
- [x] T032 [US3] Implement active state detection in `src/components/nav-main.tsx` (prefix match: pathname.startsWith(item.to))
- [x] T033 [US3] Apply active styling to sub-items in `src/components/nav-main.tsx` (data-active attribute or isActive prop)
- [x] T034 [US3] Implement parent active indicator in `src/components/nav-main.tsx` (parent gets active style when collapsed and contains active child)
- [x] T035 [US3] Implement auto-expand on initial load in `src/components/nav-main.tsx` (defaultOpen={hasActiveChild} for Collapsible)
- [x] T036 [US3] Verify no false positive active states in `src/components/nav-main.tsx` (no highlight when no item matches current route)
- [x] T037 [US3] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 3 complete - active route highlighting accurate on all navigations

---

## Phase 6: User Story 4 - Permission and Role Filtering (Priority: P2)

**Goal**: Users see only menu items their permissions/roles allow. Hidden items silently omitted.

**Independent Validation**: Simulate limited permission session. Items requiring missing permissions not rendered.

### Implementation for User Story 4

- [x] T038 [P] [US4] Create filter utilities in `src/lib/menu/filter.ts` (filterFeatures, filterSettings pure functions)
- [x] T039 [US4] Implement permission check logic in `src/lib/menu/filter.ts` (mode: all requires every perm, mode: any requires one perm)
- [x] T040 [US4] Implement role check logic in `src/lib/menu/filter.ts` (display array check with ANY match)
- [x] T041 [US4] Implement parent pruning logic in `src/lib/menu/filter.ts` (hide parent when all children filtered out)
- [x] T042 [US4] Implement default behavior for absent fields in `src/lib/menu/filter.ts` (no display/perms = visible to all, default mode = 'all')
- [x] T043 [US4] Integrate filter functions in `src/components/app-sidebar.tsx` (filter features and settings before passing to NavMain/NavUser)
- [x] T044 [US4] Pass user permissions and roles to filter functions in `src/components/app-sidebar.tsx` (extract from user.permissions and user.roles)
- [x] T045 [US4] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 4 complete - permission filtering works correctly

---

## Phase 7: User Story 5 - Env-Controlled Layout Mode (Priority: P3)

**Goal**: NEXT_PUBLIC_NAV_LAYOUT controls layout mode. top-menu shows fallback with warning.

**Independent Validation**: Set env to sidebar - sidebar renders. Set to top-menu - sidebar renders with console warning.

### Implementation for User Story 5

- [x] T046 [P] [US5] Create useNavLayout hook in `src/hooks/menu/useNavLayout.ts` (reads getNavLayout, exports active mode)
- [x] T047 [US5] Add layout mode check in `src/components/app-sidebar.tsx` (use useNavLayout to detect mode)
- [x] T048 [US5] Implement top-menu fallback behavior in `src/components/app-sidebar.tsx` (console.warn when mode is 'top-menu', render sidebar anyway)
- [x] T049 [US5] Implement invalid value fallback in `src/lib/menu/env.ts` (unknown values default to 'sidebar' with console.warn)
- [x] T050 [US5] Verify no crash on invalid env value
- [x] T051 [US5] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 5 complete - env-controlled layout mode with safe fallbacks

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements affecting multiple user stories

- [x] T052 [P] Verify all edge cases from spec (empty features array, icon fallback, API unreachable, feature item with no submenu)
- [x] T053 [P] Review and align Polish labels in fixture with existing UI conventions in `src/mocks/data/menu.ts`
- [x] T054 Remove any remaining hardcoded navigation data from components
- [x] T055 Verify quickstart.md manual verification flow against implemented feature
- [x] T056 Final walkthrough: collapsible sidebar, icon-mode, rail, inset variant all work identically to before

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phases 3-7 (User Stories) → Phase 8 (Polish)
```

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - blocks all user stories
- **User Stories (Phases 3-7)**: Depend on Phase 2 completion
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Independent |
|-------|------------|-------------|
| US1 | Phase 2 only | Yes - core sidebar rendering |
| US2 | US1 (needs AppSidebar refactor) | Mostly - shares AppSidebar |
| US3 | US1 (needs NavMain refactor) | Mostly - adds behavior to US1 |
| US4 | US1, US2 (needs filter integration points) | Mostly - pure filter functions are independent |
| US5 | Phase 2 only | Yes - env helper standalone |

### Within Each User Story

1. Pure utilities and hooks first ([P] tasks)
2. Component refactors in dependency order
3. Integration and wiring
4. Visual verification last

### Parallel Opportunities

**Phase 1** (all parallel):
- T001, T002, T003, T004 - different files, no dependencies

**Phase 2** (mostly parallel):
- T008, T009, T010 - different files after T005-T007 complete

**Across User Stories** (after Phase 2):
- US1 and US5 can run in parallel (different concerns)
- US4 filter utilities (T038) can be built in parallel with US1-US3

---

## Implementation Strategy

### MVP Scope (Recommended)

Complete **User Story 1** first. This delivers the core value: server-driven navigation. All other stories build on this foundation.

### Incremental Delivery Order

1. **Phase 1-2**: Infrastructure (required for all)
2. **US1**: Server-driven sidebar - proves architecture works
3. **US2**: Settings dropdown - completes JSON-driven approach
4. **US3**: Active highlighting - improves UX
5. **US4**: Permission filtering - adds security layer
6. **US5**: Layout mode - future-proofing
7. **Phase 8**: Polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- No test tasks per constitution
- Total: 56 tasks across 8 phases
