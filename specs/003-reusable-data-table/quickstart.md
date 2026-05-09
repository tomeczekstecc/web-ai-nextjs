# Quickstart: Reusable Data Table

## Prerequisites

- Use the active branch `003-reusable-data-table`.
- Read [spec.md](./spec.md), [plan.md](./plan.md), and [contracts/data-table-ui-contract.md](./contracts/data-table-ui-contract.md).
- Keep implementation scoped to the reusable table and dashboard migration unless a task explicitly expands scope.

## Implementation Path

1. Refactor `src/components/data-table.tsx` into a generic `DataTable<TData>` component.
2. Add focused props for data, columns, row identity, search, visibility, selection, pagination, reorder, persistence, toolbar slots, empty/no-results, loading, and error display.
3. Add project metadata support on caller-provided columns.
4. Implement local default table state plus controlled state support per slice.
5. Add validated browser preference persistence for explicitly enabled search, column visibility, and page size.
6. Add optional row selection, column visibility, search, pagination, and reorder controls.
7. Move dashboard-specific tabs, drawer/chart content, inline inputs, add command, and row actions into dashboard-owned code.
8. Configure dashboard usage to preserve equivalent visible behavior through the reusable table.
9. Add or expose a second lightweight row-shape usage/configuration during implementation to prove reuse.

## Manual Verification

Run through these checks after implementation:

- Dashboard renders with equivalent visible table behavior.
- A second row shape renders through the same `DataTable` source.
- Global search returns expected results for configured fields.
- Empty dataset and no-results states are distinct.
- Required columns cannot be hidden.
- Optional columns can be hidden and revealed.
- Search preferences restore after reload only when persistence is enabled.
- Column visibility preferences restore after reload only when enabled and do not hide required columns.
- Page size restores after reload only when enabled.
- Row selection appears only when enabled and is not restored after reload by default.
- Row reorder appears only when enabled.
- Row reorder is disabled during active search, filtering, sorting, or ambiguous pagination.
- Reorder callback reports ordered IDs and rows.
- Loading and error states display without table-owned fetching.
- Mobile and desktop layouts avoid toolbar/control overlap.
- Light and dark themes remain readable.

## Verification Commands

```powershell
pnpm lint
pnpm build
```

No automated tests are required under the current project constitution.
