# Implementation Plan: Reusable Data Table

**Branch**: `003-reusable-data-table` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-reusable-data-table/spec.md`

## Summary

Refactor the existing dashboard-specific `src/components/data-table.tsx` into a reusable, generic table surface that accepts caller-owned data, columns, row identity, optional controls, search configuration, persistence settings, loading/error display, and controlled table state callbacks. The component stays fetch-agnostic and local-first by default, while remaining compatible with domain components that need server-shaped pagination, sorting, search, or route-state synchronization.

Dashboard-specific tabs, drawer content, chart previews, inline edit forms, row actions, and add commands move to the dashboard usage so the shared table owns only table behavior and reusable UI controls. The first implementation preserves the visible dashboard behavior while proving a second row shape can use the same table configuration.

## Technical Context

**Language/Version**: TypeScript 5.8.x, React 19, Next.js 16 App Router  
**Primary Dependencies**: TanStack Table v8, existing dnd-kit packages, shadcn/ui primitives, lucide-react, browser storage APIs, existing dashboard route/components  
**Storage**: Local React state for default table state; optional browser-device table preferences for explicitly enabled search, column visibility, and page size; no table data persistence  
**Testing**: N/A - constitution forbids automated tests  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: web frontend  
**Performance Goals**: Search/filter updates under 1 second for ordinary current in-browser datasets; no avoidable layout overlap on common mobile/desktop widths; no unnecessary server or route coupling  
**Constraints**: Polish UI copy, light/dark theme parity, responsive dashboard layout, no automated tests, no fetch ownership inside the table, no URL mutation inside the table, no user-resizable columns in this phase  
**Scale/Scope**: One shared table component, one dashboard migration usage, one lightweight second usage/demo path or internal example to prove different row shapes, documentation/contracts for future domain usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Problem understood before coding begins?** Yes. The spec and grill decisions define the table boundary: reusable table behavior in `DataTable`, domain/dashboard workflow outside it, local-first state with controlled escape hatches.
- **Simplest viable solution?** Yes. Reuse the existing TanStack Table and dnd-kit foundations instead of introducing a new data grid abstraction or custom table engine.
- **Planned edits surgical and limited in scope?** Yes. Edits stay in `src/components/data-table.tsx`, dashboard-owned table configuration/components as needed, and feature documentation. No backend or route-state system changes are required.
- **Success criteria explicit and verifiable?** Yes. The spec defines two row shapes, required-column visibility, persisted preferences, reorder callbacks, responsive behavior, and dashboard behavior preservation.
- **Preserves TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?** Yes. The table remains a client component using existing UI primitives and must render Polish user-facing labels in project usage.
- **Avoids automated tests and unnecessary comments?** Yes. Verification is manual plus `pnpm lint` and `pnpm build`; implementation should not add automated tests or explanatory comments.
- **Preserves decoupling from Laravel implementation details?** Yes. The table does not fetch data and exposes controlled state so future Laravel-backed domains can own fetching through their domain layer.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/003-reusable-data-table/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  `- data-table-ui-contract.md
`- checklists/
   `- requirements.md
```

### Source Code (`src/`)

```text
src/app/
`- dashboard/
   |- data.json
   `- page.tsx

src/components/
|- data-table.tsx
`- dashboard/
   `- dashboard-data-table.tsx
```

**Structure Decision**: Keep the reusable primitive at `src/components/data-table.tsx` because that is the existing import path and the feature explicitly targets that component. Move dashboard-specific configuration and workflow rendering into a dashboard-owned component if the refactor needs more than inline configuration in `src/app/dashboard/page.tsx`.

## Phase 0: Research Outcomes

1. Use TanStack Table as the headless table state engine and keep caller-provided `ColumnDef<TData>[]` as the primary column configuration.
2. Use TanStack Table controlled-state APIs for optional external control of sorting, pagination, row selection, column visibility, and global search; only control state slices a usage explicitly owns.
3. Use project-level column metadata for labels, required visibility, search participation, and custom searchable value extraction.
4. Keep global search local by default through a custom global filtering function derived from the usage's search configuration; support manual/controlled search for server-shaped usages.
5. Keep dnd-kit row reorder opt-in, vertical-only, and disabled when search, filtering, sorting, or non-page-only pagination would make ordering ambiguous.
6. Persist preferences as validated best-effort browser convenience state, with explicit flags for each persisted slice and no migration system.
7. Keep loading/error states display-only; domain components own data fetching, retries, route state, and server integration.
8. Keep dashboard tabs, drawer/editor/chart content, add actions, and row action copy outside the reusable table.

See [research.md](./research.md) for rationale and alternatives.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) defines the table configuration, column metadata, search configuration, persistence preferences, controlled state, and reorder result entities.
- [contracts/data-table-ui-contract.md](./contracts/data-table-ui-contract.md) defines the intended component contract for `DataTable<TData>`, including props, callbacks, state ownership, persistence behavior, and usage examples.
- [quickstart.md](./quickstart.md) captures implementation steps and manual verification flows.

## Implementation Strategy

### Slice 1 - Reusable Core Contract

- Convert `DataTable` to a generic client component that accepts `data`, `columns`, and `getRowId`.
- Add focused optional props for `search`, `visibility`, `selection`, `pagination`, `reorder`, `persistence`, `toolbar`, `emptyState`, `noResultsState`, `loadingState`, and `errorState`.
- Add project metadata support for user-facing column labels, required visibility, and search behavior.
- Preserve existing table primitives, visual density, and light/dark styling.

### Slice 2 - Local State, Persistence, and Search

- Implement local default state for sorting, pagination, column visibility, row selection, and global search.
- Add controlled state/callback support for usages that own specific state slices.
- Add validated preference loading/saving for explicitly enabled search, column visibility, and page size.
- Add separate empty and no-results states.

### Slice 3 - Optional Controls and Reorder

- Make row selection, column visibility, search, pagination, and row reordering opt-in or configurable according to the spec.
- Keep pagination enabled by default for standard usage with opt-out support.
- Disable reorder when search/filter/sort or ambiguous pagination is active unless page-only reorder is explicitly configured.
- Report `orderedIds` and `rows` after completed reorder.

### Slice 4 - Dashboard Migration and Verification

- Move dashboard-specific columns, tabs, add button, drawer content, chart content, inline inputs, and row actions into dashboard-owned code.
- Reuse the generic `DataTable` from the dashboard configuration while preserving equivalent visible behavior.
- Add a second lightweight usage/configuration path during implementation to prove a different row shape without changing the reusable component.
- Verify manually with dashboard interactions, preference persistence, responsive layout, theme parity, `pnpm lint`, and `pnpm build`.

## Post-Design Constitution Check

- The plan remains simple: one reusable component, one migrated current usage, one proof of second row shape.
- The table is deliberately fetch-agnostic, preserving backend decoupling and avoiding Laravel-specific assumptions.
- The design uses existing TanStack Table and dnd-kit patterns already present in the repository.
- No automated tests are planned under the current constitution; verification remains lint/build/manual.
- UI copy and usage-facing labels must be Polish in implementation, while internal type names may remain English TypeScript identifiers.

**Post-Design Gate Status**: PASS

## Complexity Tracking

No constitution violations require justification.
