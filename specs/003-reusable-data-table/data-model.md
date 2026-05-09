# Data Model: Reusable Data Table

## Table Configuration

Represents the caller-owned setup for one table usage.

**Fields**
- `data`: Current row records to render.
- `columns`: Caller-provided column definitions.
- `getRowId`: Stable row identity function.
- `search`: Optional global search configuration.
- `visibility`: Optional column hide/reveal configuration.
- `selection`: Optional row selection configuration.
- `pagination`: Optional pagination configuration or opt-out.
- `reorder`: Optional row reordering configuration.
- `persistence`: Optional browser preference configuration.
- `toolbar`: Optional domain content around the default toolbar.
- `emptyState`: Optional empty dataset content.
- `noResultsState`: Optional no-results content.
- `loadingState`: Optional loading display content.
- `errorState`: Optional error display content.

**Validation rules**
- `data`, `columns`, and `getRowId` are required.
- Every row identity must be stable and unique within the current table data.
- Optional controls are rendered only when enabled by their configuration.
- Caller-provided labels should be Polish in product-facing app usage.

## Column Definition Metadata

Project-specific metadata attached to caller-provided column definitions.

**Fields**
- `label`: User-facing label for visibility menus and accessible control text.
- `required`: Whether the column must remain visible.
- `searchable`: Whether the column participates in default global search.
- `getSearchValue`: Optional function that returns the value used by global search.
- `hideFromVisibilityMenu`: Whether the column is omitted from hide/reveal controls.

**Validation rules**
- Required columns cannot be hidden by user preference.
- Columns without a user-facing label may fall back to a safe configured header label.
- Stale persisted visibility entries for missing columns are ignored.

## Search Configuration

Describes global search behavior for one table usage.

**Fields**
- `enabled`: Whether the global search input is visible.
- `placeholder`: Optional input placeholder.
- `value`: Optional externally controlled search value.
- `defaultValue`: Optional initial local search value.
- `onChange`: Optional callback for controlled or observed search changes.
- `getSearchValues`: Optional row-level value extractor.
- `compare`: Optional custom comparison function.

**Validation rules**
- Disabled search renders no global search input.
- Search compares against configured values or the documented default searchable columns.
- Non-text values are normalized through the configured comparison behavior or default normalization.
- Search text is persisted only when enabled in persistence configuration.

## Table Preferences

Best-effort browser-device preferences for one table identity.

**Fields**
- `key`: Stable persistence identity for one table usage.
- `search`: Whether search text or search-related preferences are saved.
- `columnVisibility`: Whether eligible column visibility is saved.
- `pageSize`: Whether page size is saved.

**Validation rules**
- A persistence key alone does not save any preference slice.
- Page index, row selection, table data, and row order are not saved by default.
- Malformed stored values are discarded.
- Hidden required columns are forced visible.
- Unknown column IDs are ignored.

## Controlled Table State

Caller-owned state slices passed into the table.

**Fields**
- `sorting`: Optional caller-owned sorting state.
- `pagination`: Optional caller-owned pagination state.
- `columnVisibility`: Optional caller-owned visibility state.
- `rowSelection`: Optional caller-owned row selection state.
- `globalFilter`: Optional caller-owned search state.
- `on...Change`: Matching callbacks for each controlled slice.

**Validation rules**
- A state slice is controlled only when the usage provides both the state value and callback needed to own it.
- Controlled state should not be overwritten by local persistence unless the usage explicitly maps persisted values into that state.
- Route synchronization is owned by the usage, not by the table.

## Reorder Configuration

Describes optional drag reordering behavior.

**Fields**
- `enabled`: Whether drag reordering is available.
- `onReorder`: Callback receiving ordered row identities and ordered rows.
- `mode`: Optional behavior for full-list or page-only reorder.

**Validation rules**
- Reorder affordances are hidden when disabled.
- Reorder is disabled while search, filtering, or sorting is active.
- Reorder is disabled under partial pagination unless page-only reorder is explicitly enabled.
- Reorder result includes ordered identities as the primary contract and ordered rows as convenience data.

## Toolbar Extension

Caller-owned content placed around default table controls.

**Fields**
- `left`: Optional content before or near table controls.
- `right`: Optional content after default controls.
- `selectionContent`: Optional content shown when rows are selected.

**Validation rules**
- Toolbar content must not replace required accessible labels for built-in controls.
- Toolbar layout must wrap or stack on mobile without overlapping table controls.

## State Relationships

- `Table Configuration` owns the table setup and references all optional feature configurations.
- `Column Definition Metadata` influences search, visibility labels, and required visibility behavior.
- `Table Preferences` may initialize local `Search Configuration`, column visibility, and page size when explicitly enabled.
- `Controlled Table State` overrides local state for the slices the usage owns.
- `Reorder Configuration` depends on current search/filter/sort/pagination state to decide whether reordering is allowed.
