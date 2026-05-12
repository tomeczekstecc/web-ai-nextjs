# Implementation Plan: JSON-Driven Navigation Menu Generator

**Branch**: `014-json-menu-gen` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/014-json-menu-gen/spec.md`

## Summary

Replace hardcoded navigation data in `app-sidebar.tsx` with a server-driven navigation system. Menu items, sections, sub-items, icons, labels, and permission rules come from a backend API response (`GET /api/config/menu`). The sidebar renders feature navigation and a settings dropdown from JSON, with client-side permission/role filtering and active route highlighting via prefix match.

**Technical Approach**:
- Fetch menu config via TanStack Query from `${apiConfig.baseUrl}/api/config/menu`
- MSW intercepts in development with fixture data
- Static icon map resolves kebab-case icon names to Lucide components
- Pure filter functions apply `display` (role) and `perms` (permission) rules client-side
- Refactor `app-sidebar.tsx`, `nav-main.tsx`, `nav-user.tsx` to consume menu data
- Remove `TeamSwitcher` and `NavProjects` components from sidebar

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, React 19, TanStack Query, shadcn/ui, Lucide React, MSW
**Storage**: TanStack Query cache (staleTime: Infinity, refetchOnWindowFocus: false); no Zustand slice for menu
**Testing**: N/A - constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: Web frontend
**Performance Goals**: Menu fetch completes before sidebar renders; skeleton shown during loading; no perceptible delay after initial load
**Constraints**: Polish UI labels from JSON, theme parity preserved, Laravel-ready integration via API contract, no automated tests
**Scale/Scope**: Sidebar navigation refactor affecting ~5 component files, 1 new API domain, 1 MSW handler

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Is the problem understood before coding begins? **YES** — Interview session resolved 17 design decisions; spec contains 5 user stories with acceptance criteria.
- [x] Is the approach the simplest viable solution? **YES** — TanStack Query only (no Zustand duplication), static icon map (no dynamic imports), uncontrolled collapsible state, props-based user data flow.
- [x] Are the planned edits surgical and limited in scope? **YES** — Changes limited to: 3 existing components (app-sidebar, nav-main, nav-user), 1 new API domain (menu), 1 new lib folder (menu utils), 1 MSW handler. TeamSwitcher and NavProjects removed.
- [x] Are success criteria explicit and verifiable? **YES** — 6 success criteria in spec (SC-001 through SC-006) with measurable outcomes.
- [x] Does the feature preserve TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity? **YES** — TypeScript throughout, no routing changes, shadcn sidebar components preserved, Polish labels from JSON, existing collapse/responsive behavior maintained.
- [x] Does the plan avoid automated tests and unnecessary comments? **YES** — No tests planned; no comments added.
- [x] Does the plan preserve decoupling from Laravel implementation details? **YES** — API contract defined in `contract.ts`; MSW mock enables frontend-first development; backend returns JSON structure, frontend handles all filtering/rendering.

**Gate Status**: PASS

## Key Design Decisions (from Interview)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Menu API endpoint | Direct call to `${apiConfig.baseUrl}/api/config/menu` |
| 2 | Domain placement | Hybrid: API in `src/lib/api/domains/menu/`, UI logic in `src/lib/menu/` |
| 3 | State management | TanStack Query only, no Zustand slice |
| 4 | Icon resolution | Static import map with fallback to `Circle` |
| 5 | Role filtering | ANY match (user has any role in `display` array) |
| 6 | JSON structure | Clean format with explicit `key` fields |
| 7 | Cache invalidation | Rely on page reload, `staleTime: Infinity` |
| 8 | Error state | Empty sidebar body + `console.error` |
| 9 | User data source | Props from page → AppSidebar → NavUser |
| 10 | Collapsible state | Uncontrolled, auto-expand via `defaultOpen` |
| 11 | Collapsed parent indicator | Same active style as sub-item |
| 12 | Icon name format | Kebab-case in JSON, convert to PascalCase |
| 13 | NavLayout wrapper | No wrapper; env check in AppSidebar |
| 14 | Absent display/perms | No restriction (visible to all) |
| 15 | Default perms.mode | `"all"` (stricter) |
| 16 | Invalid feature item | Log warning and skip |
| 17 | Query key | Follow factory pattern: `['menu', 'config']` |

## Project Structure

### Documentation (this feature)

```text
specs/014-json-menu-gen/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── menu-api.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── api/
│   │   └── domains/
│   │       └── menu/           # NEW: API domain
│   │           ├── contract.ts
│   │           ├── queries.ts
│   │           ├── query-keys.ts
│   │           ├── query-options.ts
│   │           └── client.ts
│   └── menu/                   # NEW: UI logic
│       ├── env.ts
│       ├── filter.ts
│       └── icons.ts
├── hooks/
│   └── menu/                   # NEW: hooks
│       ├── useMenuConfig.ts
│       └── useNavLayout.ts
├── mocks/
│   ├── data/
│   │   └── menu.ts             # NEW: fixture
│   └── handlers/
│       └── menu.ts             # NEW: MSW handler
├── components/
│   ├── app-sidebar.tsx         # MODIFY
│   ├── nav-main.tsx            # MODIFY
│   └── nav-user.tsx            # MODIFY
└── (team-switcher.tsx)         # REMOVE from sidebar usage
└── (nav-projects.tsx)          # REMOVE from sidebar usage
```

## Complexity Tracking

> No constitution violations. All decisions favor simplicity.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |

## Constitution Check (Post-Design)

*Re-evaluation after Phase 1 design artifacts are complete.*

- [x] **Think Before Coding** — Satisfied. Design interview resolved 17 decisions. research.md, data-model.md, and contracts/ document all technical choices before implementation.
- [x] **Simplicity First** — Satisfied. TanStack Query only (no Zustand), static icon map, uncontrolled state, no NavLayout wrapper abstraction.
- [x] **Surgical Changes** — Satisfied. Scope limited to 3 component refactors, 1 new API domain, 1 lib folder, 1 MSW handler. No unrelated modifications.
- [x] **Goal-Driven Execution** — Satisfied. 6 success criteria (SC-001 through SC-006) are measurable and verifiable via manual testing.
- [x] **Frontend-First, Backend-Decoupled** — Satisfied. API contract in contracts/menu-api.md. MSW mock enables development without Laravel. Types in contract.ts define the interface.
- [x] **TypeScript, App Router, Design System** — Satisfied. All new code is TypeScript. No routing changes. shadcn sidebar components preserved.
- [x] **Polish UI, Responsiveness, Theme Parity** — Satisfied. Polish labels come from JSON. Existing responsive/collapse behavior maintained. No theme-specific changes.
- [x] **Clean Code, KISS, DRY** — Satisfied. Pure filter functions. Static icon map. No duplication between components.
- [x] **No Tests, Minimal Comments** — Satisfied. No tests planned. No comments in design.

**Post-Design Gate Status**: PASS

## Impact Assessment

| Area | Impact | Notes |
|------|--------|-------|
| UI | Sidebar navigation renders from JSON instead of hardcoded data | Visual appearance unchanged |
| Light/Dark theme | No changes | Existing theme support preserved |
| Responsiveness | No changes | Collapsible sidebar behavior unchanged |
| Laravel integration | New API contract defined | `GET /api/config/menu` |
| Simplicity | Simpler than alternatives | Dropped Zustand, NavLayout wrapper |
| Duplication | Reduced | Removed hardcoded nav data |
| Success criteria | Defined in spec | SC-001 through SC-006 |
