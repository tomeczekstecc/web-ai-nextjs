# Feature Specification: Reusable Data Table

**Feature Branch**: `003-reusable-data-table`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "we need fully reusable data-table.tsx component that has external (per usage) configyration with data model (headers, rows, search-comparison configuration, etc), props for dragable, searcheable (global), columns hide/reveal, search configuration saved to localStorage"

## User Scenarios *(mandatory)*

Każda historia użytkownika musi być niezależnie wartościowa i możliwa do
zaprezentowania jako przyrost funkcji.

### User Story 1 - Configure Any Domain Table (Priority: P1)

As a developer adding a table to a domain surface, I want to provide the table's rows, columns, labels, row identity, and optional cell behavior from the usage site so that one shared table can represent different business records without being rewritten for each domain.

**Why this priority**: Reuse is the core value of the feature. A shared table is only useful if each domain can define its own data model and presentation without editing the shared table itself.

**Independent Validation**: Use the shared table for two different record shapes with different columns and labels. Each table renders its own headers, rows, empty state, and row identity correctly from caller-provided configuration.

**Acceptance Scenarios**:

1. **Given** a domain provides rows, column labels, and row identity, **When** the table is displayed, **Then** the table renders the configured headers and values for that domain without relying on sample-only fields.
2. **Given** two domains provide different table configurations, **When** both tables render in the app, **Then** each table shows only its configured columns, labels, rows, and row actions.
3. **Given** a usage does not provide optional table controls, **When** the table renders, **Then** those controls are omitted and the table remains usable.

---

### User Story 2 - Search Across Configured Data (Priority: P2)

As a user working in a table, I want a global search that compares my search text against the fields chosen for that table so that I can quickly narrow large lists without understanding the underlying record shape.

**Why this priority**: Search behavior must be configurable per usage because different domains need different matching fields, labels, and comparison rules.

**Independent Validation**: Configure one table to search name and status, and another table to search title and owner. Confirm that the same global search control filters each table by its own configured comparison rules.

**Acceptance Scenarios**:

1. **Given** global search is enabled for a table, **When** a user enters a search term, **Then** the table shows only rows that match that table's configured searchable fields.
2. **Given** a table has custom comparison rules, **When** a user searches with different casing or partial text, **Then** the results follow the configured matching behavior consistently.
3. **Given** global search is disabled for a table, **When** the table renders, **Then** no global search control is shown.

---

### User Story 3 - Personalize Table View (Priority: P3)

As a user working repeatedly with the same table, I want to hide or reveal columns and keep my search setup on the same device so that the table stays tuned to the way I work.

**Why this priority**: Column visibility and remembered search preferences make reusable tables practical for repeated operational use, but they can be added after core configuration and search work.

**Independent Validation**: Hide a configurable column, change the search value or search-related preference, leave and return to the table in the same browser, and confirm the saved preferences are restored for that table only.

**Acceptance Scenarios**:

1. **Given** column visibility controls are enabled, **When** a user hides a column, **Then** the table removes that column from view while keeping required columns visible.
2. **Given** a user reveals a hidden column, **When** the menu is closed, **Then** the column appears again in the table.
3. **Given** a table has persistence enabled, **When** a user changes search-related preferences and returns later in the same browser, **Then** those preferences are restored for the same table.
4. **Given** two tables use the shared table, **When** a user changes preferences in one table, **Then** the other table's preferences are not changed.

---

### User Story 4 - Reorder Rows When Allowed (Priority: P4)

As a user organizing an ordered list, I want to drag rows into a new order when the table allows it so that I can prioritize or sequence records directly in the table.

**Why this priority**: Reordering is valuable for ordered domains, but not every table should support it. The capability must be opt-in per usage.

**Independent Validation**: Enable row reordering for one table and disable it for another. Confirm that the enabled table supports reordering and reports the new order, while the disabled table has no reorder affordance.

**Acceptance Scenarios**:

1. **Given** row reordering is enabled, **When** a user moves a row, **Then** the visual order changes and the table reports the updated ordered rows to the usage site.
2. **Given** row reordering is disabled, **When** the table renders, **Then** no drag handle or reorder behavior is available.
3. **Given** a table has filtered or paginated rows, **When** a user reorders visible rows, **Then** the resulting order is clear and does not silently reorder hidden rows in a way the user cannot see.
4. **Given** search, filtering, or sorting is active, **When** row reordering would become ambiguous, **Then** the table disables reordering until the visible order is unambiguous again.

### Edge Cases

- If a table receives no rows, it shows the configured empty state and keeps available controls understandable.
- If a table has rows but the active search or filters hide all of them, it shows the configured no-results state instead of the empty dataset state.
- If a row is missing a valid identity, the table must fail clearly during development or reject the row configuration before users see unstable behavior.
- If a column is marked as required, users cannot hide it.
- If all optional columns are hidden, required identity or primary columns remain visible so the table does not become blank.
- If users hide columns and then a later table configuration removes or renames columns, stored visibility preferences are validated against the current columns before use.
- If saved preferences reference a column that no longer exists, the table ignores that stale preference and keeps valid preferences.
- If saved search preferences are malformed or unavailable in the browser, the table falls back to configured defaults without blocking use.
- If a configured search field contains non-text values, the search behavior follows the usage's comparison configuration or a documented default.
- If search returns no matches, the table shows a no-results state that is distinct from a truly empty dataset.
- If row reordering is enabled while search, filtering, sorting, or partial pagination is active, the table must prevent ambiguous reordering unless the usage explicitly opts into page-only reordering.
- If the table is used in a read-only context, controls that change table state are hidden or disabled according to that usage's configuration.
- If a table has many columns, column visibility controls remain reachable without causing layout overflow on smaller screens.
- If table data is loaded or fails outside the table, the table can display loading and error states without owning data fetching.
- If a usage needs shareable route state, the usage controls table state externally rather than relying on the table to update the route.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide one shared data table experience that can be configured independently at each usage site.
- **FR-002**: Each usage MUST be able to provide its own rows, column definitions, display labels, row identity rule, empty state, and optional row-level content or actions.
- **FR-003**: The shared table MUST NOT depend on one sample data model or hard-coded sample field names.
- **FR-003a**: The shared table MUST use caller-provided column definitions as the primary column configuration surface and support project-level column metadata for user-facing labels, search participation, and required visibility.
- **FR-004**: Each usage MUST be able to choose whether global search is enabled.
- **FR-005**: When global search is enabled, each usage MUST define which row values are searchable or accept a documented default search mapping.
- **FR-006**: Search matching MUST support usage-defined comparison behavior, including at least text normalization and partial matching decisions.
- **FR-007**: The shared table MUST show a clear no-results state when search or filters remove all rows.
- **FR-007a**: The shared table MUST support separate caller-configurable empty dataset and no-results states.
- **FR-008**: Each usage MUST be able to choose whether column hide and reveal controls are enabled.
- **FR-009**: Column visibility controls MUST respect required columns that cannot be hidden.
- **FR-010**: Column visibility labels shown to users MUST come from the usage's table configuration rather than internal field names when labels are provided.
- **FR-011**: Each usage MUST be able to provide a stable persistence identity so saved table preferences apply only to the intended table.
- **FR-012**: When persistence is explicitly enabled for search, the system MUST remember search-related preferences for the same table and browser device across page reloads.
- **FR-013**: Saved table preferences MUST be scoped so one table cannot accidentally apply another table's search or column settings.
- **FR-014**: The shared table MUST recover from missing, stale, malformed, or incompatible saved preferences by falling back to valid configured defaults.
- **FR-014a**: Persistence MUST be enabled per preference category rather than inferred from the presence of a persistence identity alone.
- **FR-014b**: The system MUST NOT persist current page index, row selection, table data, or row order by default.
- **FR-015**: Each usage MUST be able to choose whether row reordering is enabled.
- **FR-016**: When row reordering is enabled, the table MUST expose both ordered row identities and ordered rows to the usage site after a completed reorder.
- **FR-017**: When row reordering is disabled, the table MUST not show reorder affordances.
- **FR-018**: The shared table MUST support row selection only when enabled by the usage configuration.
- **FR-018a**: Row selection MUST be local by default, controllable by the usage when needed, and not persisted by default.
- **FR-019**: The shared table MUST support pagination controls by default for standard table usage while allowing usage sites to disable pagination.
- **FR-019a**: Pagination MUST support configurable page size options and controlled state for usages that need server-shaped pagination.
- **FR-020**: The shared table MUST maintain accessible labels for search, column visibility, row selection, pagination, and row reordering controls.
- **FR-021**: The shared table MUST remain usable in light and dark themes and on common desktop and mobile viewport sizes.
- **FR-022**: The shared table MUST allow a usage to render custom cell content without forcing every table to use the same badge, form, drawer, chart, or action pattern.
- **FR-023**: The existing dashboard table behavior MUST be preserved or migrated without losing visible capabilities that users currently rely on.
- **FR-024**: The shared table MUST treat data loading as caller-owned and MUST NOT fetch records itself.
- **FR-025**: The shared table MUST support local table behavior by default and controlled state callbacks for usages that need server-shaped search, sorting, filtering, or pagination.
- **FR-026**: The shared table MUST NOT update route state directly; usages that need shareable route state MUST be able to control table state externally.
- **FR-027**: The shared table MUST provide a default toolbar for enabled table controls and allow usage sites to add domain-specific toolbar content.
- **FR-028**: Domain-specific workflow elements such as tabs, add commands, row drawer details, charts, inline edit forms, and row action labels MUST be owned by the usage rather than hard-coded in the shared table.
- **FR-029**: Sorting MUST be configurable through the usage's column definitions, support local behavior by default, and support controlled behavior for server-shaped usage.
- **FR-030**: Row reordering MUST be disabled when search, filtering, or sorting is active, and when pagination hides part of the order unless the usage explicitly opts into page-only reordering.
- **FR-031**: The shared table MUST support display-only loading and error states without owning retry or fetching behavior.
- **FR-032**: The shared table MUST provide stable responsive layout behavior for wide tables without adding user-resizable columns in the first implementation.

### Key Entities *(include if feature involves data)*

- **Table Configuration**: Per-usage definition of rows, columns, row identity, labels, optional controls, search behavior, visibility rules, persistence identity, and callbacks.
- **Column Definition**: A configured table field or display slot with a user-facing label, visibility rules, optional custom rendering, and optional search participation.
- **Row Record**: A single business record displayed by the table, identified by a stable usage-defined identity.
- **Search Configuration**: Per-table rules describing whether global search is enabled, which row values are searched, how comparisons are made, and which preferences are saved.
- **Table Preferences**: User-specific table state saved for the same browser device, including search-related preferences and eligible column visibility settings.
- **Reorder Result**: The ordered row identity list or row list reported after a user completes a permitted row reorder.
- **Controlled Table State**: Caller-owned search, sorting, filtering, pagination, selection, or ordering state passed into the shared table with callbacks so domain surfaces can synchronize table behavior with external data or routes.
- **Toolbar Extension**: Caller-provided content placed near the shared table controls for domain actions, filters, tabs, export actions, or other usage-specific commands.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The shared table can render at least two different row shapes with different headers and searchable fields without changing the shared table source.
- **SC-002**: 100% of required columns remain visible even after users change column visibility settings.
- **SC-003**: Saved search-related preferences are restored for the same table after reload in at least 95% of manual verification attempts where browser storage is available.
- **SC-004**: Saved preferences from one configured table do not affect another configured table in manual verification.
- **SC-005**: A table with global search enabled returns expected matches for configured searchable fields within 1 second for ordinary in-browser datasets used by current product surfaces.
- **SC-006**: A table with row reordering enabled reports the new order after a completed reorder in 100% of manual verification attempts.
- **SC-007**: A table with search, column controls, and optional row reordering remains usable without horizontal control overlap at common mobile and desktop widths.
- **SC-008**: The current dashboard usage keeps equivalent visible table capabilities after migration to the reusable configuration model.
- **SC-009**: A usage can control search, sorting, or pagination externally without the table fetching data or writing route state itself.
- **SC-010**: Dashboard-specific tabs, drawer content, chart content, and inline edit workflows can be rendered from the dashboard usage without changing the shared table source.

## Assumptions

- The first implementation will evolve the existing shared table rather than creating a second competing table surface.
- The table is intended for interactive data already available to the page or provided by a domain-specific data layer; it does not fetch records itself.
- Local table behavior is the default for this feature, while controlled state and callbacks keep the component compatible with server-shaped pagination, filtering, sorting, and search.
- Server-backed pagination, filtering, or sorting can be driven by individual domains through controlled table state, but this feature focuses on the reusable table configuration and local table interactions.
- Usage sites will provide normal column definitions as the primary column configuration, with project metadata used for labels, search, and required visibility rules.
- Search preference persistence is per browser device and does not need account-level synchronization.
- Search uses one global text input in the first implementation. Visible search modes or preset selectors are deferred until a real domain needs them.
- Persistence is opt-in per preference category. Search text, optional search-mode preferences, column visibility, and page size may be persisted when explicitly enabled.
- Current page index, row selection, table data, and row order are not persisted by default.
- Column visibility may be persisted with the same table preference identity when explicitly enabled, even though the primary requested persistence is search configuration.
- Stored table preferences are best-effort convenience state. They are validated against the current table configuration and discarded when stale or malformed; no preference migration system is required for this feature.
- Required columns include at least columns needed for row identity, primary meaning, or row actions when the usage marks them as required.
- Row reordering is opt-in because many data sets are sorted by business rules and should not be manually reordered.
- Row reordering reports ordered row identities as the primary contract and ordered row records as a convenience.
- Row reordering is controlled-first. The table may maintain local display order only for explicitly enabled local reordering, while persistent or server-owned order remains the usage's responsibility.
- Reordering is disabled when search, filtering, or sorting is active. Reordering with pagination is disabled unless a usage explicitly chooses page-only reordering.
- Row selection is opt-in, may be controlled by the usage, and is never persisted by default.
- Pagination is enabled by default for standard table usage and can be disabled for compact or embedded surfaces.
- Sorting is available through column configuration, local by default, controllable for server-shaped usages, and not persisted by default.
- The shared table owns a default toolbar for common controls and exposes toolbar extension areas for domain-specific actions.
- Dashboard-specific behavior such as tabs, add actions, drawers, charts, inline forms, and action menu labels belongs to the dashboard usage rather than the shared table.
- Route or URL synchronization is outside the shared table. Usages that need shareable state can control the table from route state.
- Loading and error states are display-only table states. Retry and data loading behavior remain owned by the usage or domain data layer.
- User-resizable columns are outside the first implementation. Wide tables rely on stable sizing hints, responsive toolbar wrapping, and horizontal overflow behavior.
- The table should preserve existing project visual conventions, theme behavior, and accessible control patterns.
