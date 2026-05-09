# Research: Reusable Data Table

## Decision: Keep the table fetch-agnostic and local-first

**Rationale**: The shared table should render and manage table interaction state, not know where data comes from. This lets dashboard JSON, future TanStack Query surfaces, and server-prefetched data all use the same component. Controlled state callbacks allow server-shaped usage without embedding fetching or route logic.

**Alternatives considered**:
- Fetching inside the table: rejected because it couples the shared UI to domain APIs and future Laravel integration.
- Local-only table: rejected because future `/applications` and other server-backed domains need controlled search, sorting, and pagination.

## Decision: Use TanStack Table column definitions as the primary API

**Rationale**: The project already uses TanStack Table and it provides the needed hooks for row models, sorting, filtering, pagination, selection, and controlled state. Keeping `ColumnDef<TData>[]` avoids a custom column DSL that would need to re-expose most of TanStack Table over time.

**Alternatives considered**:
- Project-specific column schema only: rejected because custom cells, sorting, and actions would quickly require an adapter layer.
- Continue hard-coded dashboard columns: rejected because it prevents reuse across row shapes.

## Decision: Add project metadata on columns for table-specific labels and behavior

**Rationale**: Column IDs are useful stable preference keys, but user-facing labels and search behavior need usage-owned metadata. Metadata can describe labels, required visibility, searchable values, and search inclusion without changing the core column rendering model.

**Alternatives considered**:
- Infer labels from internal column IDs: rejected because it exposes implementation names to users.
- Separate label/search maps: rejected because it splits column behavior across too many places.

## Decision: Support controlled state by slice

**Rationale**: TanStack Table supports hoisting only the state needed by a usage through `state` and `on...Change` callbacks. This lets domain components control search, sorting, pagination, selection, or visibility independently while leaving unrelated state local.

**Alternatives considered**:
- Fully controlled table: rejected because it makes simple local dashboard usage noisy.
- Fully uncontrolled table: rejected because server-shaped usage and URL-state ownership would be awkward.

## Decision: Persist only explicitly enabled preference slices

**Rationale**: Browser storage should remember convenience preferences only when a usage opts in. Search text, optional search mode, column visibility, and page size are useful preferences. Page index, selected rows, data, and row order are volatile or domain-owned and should not be restored by default.

**Alternatives considered**:
- Persist everything when a key exists: rejected because it can surprise users and hide data unexpectedly.
- No persistence: rejected because persisted search configuration was part of the feature request.

## Decision: Validate persisted preferences without migrations

**Rationale**: Preferences are convenience state, not business data. The table can safely ignore unknown columns, required-hidden columns, malformed values, and stale slices. A versioned migration layer would add complexity without current product value.

**Alternatives considered**:
- Versioned preference migrations: rejected as premature.
- Blindly trusting storage: rejected because stale column IDs and malformed storage would create broken UI.

## Decision: Keep global search as one built-in input

**Rationale**: The current requirement is global search with configurable comparison. A single input with usage-defined searchable values and comparator behavior satisfies the need without adding visible search mode complexity.

**Alternatives considered**:
- Multiple visible search presets now: rejected because no current domain requires them.
- Column-only filters instead of global search: rejected because the request explicitly asks for global searchable behavior.

## Decision: Reordering is opt-in and disabled under ambiguous table states

**Rationale**: Reordering a filtered, searched, sorted, or partially paginated list can imply several different outcomes. Disabling reorder unless order is unambiguous avoids hidden data changes and confusing persistence behavior.

**Alternatives considered**:
- Always allow visible-row reorder: rejected because hidden rows make the resulting order unclear.
- Remove reorder from reusable table: rejected because the current table already has row drag behavior and the feature requests draggable support.

## Decision: Move dashboard workflow UI out of the reusable table

**Rationale**: Tabs, charts, drawers, inline forms, and action labels are dashboard workflow concerns. Keeping them outside the shared table prevents the component from becoming a generic table wrapped around one specific dashboard demo.

**Alternatives considered**:
- Make every dashboard feature a table option: rejected because it would inflate the reusable API with non-table concerns.
- Drop dashboard behavior during refactor: rejected because the spec requires preserving equivalent visible capabilities.

## Decision: Loading and error states are display-only

**Rationale**: A fetch-agnostic table still needs to show loading or error content inside the table area. The usage owns retries, fetching, and error recovery because those decisions depend on the domain data source.

**Alternatives considered**:
- No loading/error support: rejected because server-backed usages would duplicate table wrappers.
- Retry/fetch ownership in the table: rejected because it violates the fetch-agnostic boundary.
