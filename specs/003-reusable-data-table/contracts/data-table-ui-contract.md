# UI Contract: Reusable Data Table

## Component

`DataTable<TData>` is a client-side shared table component. It renders caller-provided rows and columns and manages reusable table interactions without fetching records or writing route state.

## Required Inputs

- `data`: row records for the current view.
- `columns`: caller-provided column definitions.
- `getRowId`: function returning a stable string identity for each row.

## Optional Inputs

- `search`: enables and configures one global search input.
- `visibility`: enables column hide/reveal controls and required-column behavior.
- `selection`: enables row selection.
- `pagination`: configures local pagination, controlled pagination, page sizes, or disables pagination.
- `reorder`: enables row drag reordering and receives reorder results.
- `persistence`: enables specific saved preference slices for a stable table key.
- `toolbar`: adds usage-owned toolbar content around default controls.
- `emptyState`: content for a truly empty dataset.
- `noResultsState`: content for search/filter results with no matches.
- `loadingState`: display-only loading content.
- `errorState`: display-only error content.
- controlled state values and callbacks for search, sorting, pagination, visibility, and selection.

## Column Metadata Contract

Column metadata may define:

- `label`: user-facing label.
- `required`: prevents hiding the column.
- `searchable`: includes the column in default global search.
- `getSearchValue`: extracts a custom searchable value.
- `hideFromVisibilityMenu`: keeps a column out of the column menu.

Column IDs are the stable keys for visibility and preference storage.

## State Ownership Rules

- The table owns local state by default.
- A usage may control individual state slices by passing state and matching callbacks.
- The table does not fetch, retry, mutate remote data, or update URLs.
- Browser persistence initializes and saves only explicitly enabled local preference slices.
- Controlled state has precedence over local persistence.

## Search Behavior

- Search renders only when enabled.
- Search compares the input against configured row values.
- Default matching normalizes text and supports partial matching.
- A usage may provide custom comparison behavior.
- Persisted search text is restored only for the matching persistence key and only when search persistence is enabled.

## Visibility Behavior

- Column controls render only when enabled.
- Required columns cannot be hidden.
- Visibility menu labels use configured labels instead of raw internal IDs when available.
- Stale or malformed persisted visibility values are ignored.

## Pagination Behavior

- Pagination is enabled by default for standard usage.
- Usages may disable pagination for compact surfaces.
- Usages may control pagination externally for server-shaped lists.
- Page size may be persisted only when explicitly enabled.
- Current page index is not persisted by default.

## Selection Behavior

- Row selection renders only when enabled.
- Selection may be local or controlled by the usage.
- Selection is not persisted by default.

## Reorder Behavior

- Reorder renders only when enabled.
- Reorder is disabled when search, filtering, or sorting is active.
- Reorder is disabled when pagination hides part of the order unless the usage opts into page-only reorder.
- On completed reorder, the table reports `orderedIds` and ordered `rows`.
- Persistent or server-owned row order is the usage's responsibility.

## Dashboard Usage Contract

The dashboard usage must provide:

- Dashboard row type and columns.
- Polish labels for visible table controls and columns.
- Row drawer or detail content outside the reusable table.
- Existing tabs and add command outside the reusable table.
- Inline field forms and row actions outside the reusable table.

The shared table must not contain dashboard-specific chart, drawer, tab, inline edit, or action menu content.

## Manual Verification Contract

An implementation is ready when manual verification confirms:

- Two different row shapes render from configuration without shared table edits.
- Required columns remain visible.
- Search finds expected configured fields.
- Empty and no-results states differ.
- Saved search/visibility/page-size preferences restore only when explicitly enabled.
- Reorder reports ordered IDs and rows only when allowed.
- Dashboard visible behavior remains equivalent after migration.
- Light/dark themes and mobile/desktop widths remain usable.
