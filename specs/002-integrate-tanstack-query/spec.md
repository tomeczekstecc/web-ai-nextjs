# Feature Specification: Client Server-State Integration

**Feature Branch**: `002-integrate-tanstack-query`
**Created**: 2026-05-08
**Status**: Draft
**Input**: User description: "Integrate TanStack Query v5 with the existing src/lib/api pattern for dynamic CRUD domains. Keep server components and route entry responsible for auth checks, initial shell data, redirects, secure server-only calls, and optional prefetch/dehydrate for first-screen queries. Use TanStack Query for CRUD tables, detail panes, filters, sorting, pagination, mutations, optimistic updates, invalidation/refetch after writes, and background sync. Do not replace src/lib/api wholesale; evolve each domain with browser-safe client fetchers, stable query keys, and reusable query options."

## User Scenarios *(mandatory)*

Each user story must be independently valuable and demonstrable as a feature increment.

### User Story 1 - Dynamic CRUD Data Stays Current (Priority: P1)

As an internal user working in an applications table, I want records to refresh predictably after creates, edits, deletes, and status changes so that I can trust the data I see without manually reloading the page.

**Why this priority**: The product is expected to contain many domains with several tables per domain. Reliable server-state updates are foundational for every later CRUD workflow.

**Independent Validation**: The applications domain can demonstrate list loading, detail loading, mutation feedback, and refreshed data after writes without requiring every future domain to exist.

**Acceptance Scenarios**:

1. **Given** an authorized user opens the applications surface, **When** the route loads successfully, **Then** the user sees a table-first CRUD surface for application records.
2. **Given** a user is viewing the applications table and a record is updated, **When** the update completes successfully, **Then** the table shows the latest server-confirmed data.
3. **Given** a user creates a new record from a CRUD surface, **When** the create operation succeeds, **Then** the user receives clear success feedback and the current server-shaped list is refreshed without a full page reload.
4. **Given** a write operation fails, **When** the failure is returned, **Then** the user sees a clear failure state and previously shown confirmed data is not silently corrupted.
5. **Given** a user performs a low-risk reversible application update, **When** the operation is submitted, **Then** the interface reflects the intended change immediately and rolls back or revalidates if the backend rejects it.
6. **Given** another actor changes application data while the user is viewing the applications table, **When** the active list background refresh runs, **Then** the table can show the newer server state without requiring a full page reload.

---

### User Story 2 - Domain Integrations Stay Consistent (Priority: P2)

As a developer adding a new backend-backed domain, I want a repeatable domain integration pattern for server reads, server writes, browser reads, query keys, and reusable query configuration so that each new table does not invent its own data-loading rules.

**Why this priority**: The expected scale is many domains with 1-3 tables each. Consistency reduces maintenance cost and prevents fragmented cache and refresh behavior.

**Independent Validation**: A developer can add or inspect one domain and find clear separation between server-only operations, browser-safe operations, mapping, stable query keys, and reusable query options.

**Acceptance Scenarios**:

1. **Given** a developer adds a CRUD domain, **When** they follow the documented folder pattern, **Then** the domain contains only the files required by its actual capabilities and browser-facing code cannot depend on server-only transport helpers.
2. **Given** multiple screens read the same domain entity, **When** query keys are used, **Then** all screens can address the same list and detail data consistently.
3. **Given** a mutation changes a domain entity, **When** the mutation succeeds, **Then** the affected detail data and relevant list families are refreshed or invalidated without broadly refreshing unrelated domain data.

---

### User Story 3 - First-Screen Data Can Be Fast Without Breaking Server Boundaries (Priority: P3)

As a user opening an important CRUD screen, I want the first visible data to appear quickly while protected route behavior and secure server-only data remain guarded by the server layer.

**Why this priority**: First-screen responsiveness matters, but it should not weaken the existing auth, redirect, and server-first route responsibilities.

**Independent Validation**: One protected CRUD route can load its route shell through server-side checks while making its first interactive dataset immediately available to the client server-state layer.

**Acceptance Scenarios**:

1. **Given** a user opens a protected CRUD route, **When** the route is evaluated, **Then** authentication, authorization, redirects, and secure calls are handled before protected content is shown.
2. **Given** the applications list is the first-screen dataset for the pilot route, **When** the route renders, **Then** the interactive table can use preloaded data without issuing a duplicate immediate request.

### Edge Cases

- A browser-side data request must not import or expose server-only secrets, internal auth tokens, or private backend-only headers.
- If a list has filters, sorting, pagination, or search, each distinct view must remain separately addressable and refreshable.
- If a user refreshes or shares a table URL, core table state such as page, search, filters, and sorting should remain recoverable.
- If a list grows beyond a small local dataset, filtering, sorting, pagination, and search must be resolved by the backend rather than by client-only table state.
- If a user types into text search, requests should avoid firing on every keystroke; discrete filters, sorting, and pagination should update promptly.
- If deleting the last item on the current page makes that page empty, the table should move to the nearest previous valid page when available.
- If a mutation optimistically changes the UI and then fails, the previous confirmed state must be restored or re-fetched.
- If two components show the same entity, updating one component must not leave the other permanently stale.
- If the backend is unavailable, CRUD screens must show a recoverable error state instead of pretending stale data is current.
- If real backend endpoints are not available during the pilot, local or mock endpoints may be used only when they preserve the same browser-safe request and response contract expected from the backend.
- If background refresh is enabled, it must focus on active data surfaces and avoid excessive refresh work for hidden or inactive views.
- Bulk actions are outside the first pilot and should not complicate the initial mutation, selection, or invalidation model.
- If a route shell fails for an unrecoverable reason, the route-level error experience should handle it; if an individual table or detail pane fails, the local surface should remain recoverable without replacing the whole route.
- If a failure is caused by validation, authorization, authentication, or user input, it must not be retried automatically.
- If connectivity is lost and later restored, active read surfaces should refresh; failed mutations should require clear manual retry rather than being queued silently.
- If a domain has unusually high-change operational data or mostly static reference data, it must be able to override the default freshness behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST preserve the existing server-first responsibilities for route entry, including auth checks, redirects, secure server-only calls, and initial shell loading.
- **FR-001a**: The system MUST provide a shared app-wide client server-state provider, hydration support, default behavior, and development-only inspection setup required for the applications pilot and future CRUD domains.
- **FR-002**: The system MUST provide a client-side server-state pattern for interactive CRUD surfaces, including list views, detail views, filters, sorting, pagination, mutations, invalidation after writes, and background refresh where appropriate.
- **FR-002a**: CRUD list queries MUST support backend-shaped pagination, filtering, sorting, and search as the default list pattern.
- **FR-002b**: The applications table MUST recover from deletes that empty the current page by navigating to the nearest previous valid page when available.
- **FR-002c**: Text search MUST be debounced before changing the active list query, while discrete filters, sorting, and pagination SHOULD update immediately.
- **FR-003**: The system MUST keep backend payload shapes separate from frontend-facing models for both server-side and browser-side data flows.
- **FR-004**: The system MUST define stable, domain-scoped identifiers for list and detail data so reads and writes can refresh the correct UI surfaces.
- **FR-004a**: The system MUST preserve core table-defining state in shareable route state while keeping ephemeral interface state local to the component.
- **FR-005**: The system MUST support reusable query configuration per domain so future tables can share loading, stale-data, retry, and error behavior without duplicating decisions.
- **FR-005a**: The system MUST use a progressive domain file model where domains add server reads, server writes, browser fetchers, and query options only when needed, while requiring stable query keys for every domain that uses client server-state.
- **FR-006**: The system MUST prevent browser-facing data functions from depending on server-only transport helpers, secrets, or internal-only request headers.
- **FR-007**: The system MUST support targeted mutation success behavior that refreshes or invalidates affected detail data and relevant list families, using broader domain invalidation only when the affected list surfaces cannot be known.
- **FR-007a**: Create operations MUST refresh the current server-shaped list and show clear success feedback without forcing the new record into a filtered or sorted view where the backend would not include it.
- **FR-008**: The system MUST support optimistic UI updates only when rollback or revalidation behavior is defined for failure cases.
- **FR-009**: The system MUST allow important first-screen CRUD data to be preloaded by route entry code when doing so improves perceived speed and does not duplicate immediate browser requests.
- **FR-009a**: The applications pilot MUST preload the first-screen list data into the client server-state layer when route access succeeds; detail data may load on demand unless a direct route requires it first.
- **FR-010**: The system MUST document when a domain should use the client server-state pattern and when simple server-rendered data remains sufficient.
- **FR-010a**: Static public pages, simple auth screens, and simple server-rendered data views MUST NOT use the client server-state layer by default unless they have a specific dynamic server-state need.
- **FR-011**: The system MUST use layered error handling: route-level failures for route shell and unrecoverable access problems, inline recoverable states for list/detail query failures, and action-local feedback for mutation failures.
- **FR-012**: The system MUST provide development-only inspection support for client server-state behavior so developers can verify query keys, cache state, invalidation, and refetch behavior without exposing that tooling in production.
- **FR-013**: The system MUST use a retry policy that allows read queries to retry transient failures while preventing automatic retries for mutations and for authentication, authorization, validation, or user-input failures.
- **FR-013a**: The applications pilot MUST support refetching active reads after reconnect, but MUST NOT queue or replay offline mutations automatically.
- **FR-014**: The applications pilot MUST include conservative background refresh for the active applications list so external changes can appear without a full page reload.
- **FR-015**: The applications pilot MUST be delivered as a dedicated protected `/applications` route or surface rather than replacing the existing dashboard mock table.
- **FR-016**: Create and edit dialogs in the applications pilot MUST use the project's standard form pattern with domain-owned validation and accessible field error behavior.
- **FR-017**: The applications pilot MAY use local or mock endpoints when real backend endpoints are unavailable, but those endpoints MUST preserve the same browser-safe contract, pagination behavior, mutation behavior, and error behavior expected from the backend.

### Key Entities *(include if feature involves data)*

- **Domain Data Surface**: A user-facing list, table, detail pane, or editor that reads or changes backend-owned records for a specific business domain.
- **Application Record**: A pilot-domain record with enough identifying, status, and recency information to prove list display, create, update, delete, search, sort, and refresh behavior.
- **Query Key**: A stable domain-scoped identifier for one data surface, including list parameters such as filters, sorting, pagination, and search when relevant.
- **Mutation Operation**: A create, update, delete, submit, revoke, or status-change action that can affect one or more domain data surfaces.
- **Browser-Safe Fetcher**: A client-callable data function that talks only to endpoints safe for browser use and returns mapped frontend models.
- **Server-Only Operation**: A route-entry or secure backend operation that may use private credentials, internal headers, or protected server context and must remain unavailable to browser code.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In the applications pilot CRUD domain, successful create, update, and delete operations are reflected in the relevant list or detail view without a full page reload in 95% of manual verification attempts.
- **SC-002**: A developer can add a second CRUD list using the documented domain pattern with no new ad hoc data-loading architecture.
- **SC-003**: Browser-facing data code for the pilot domain contains zero imports of server-only transport helpers or private server-only modules.
- **SC-004**: At least one mutation demonstrates defined post-write refresh behavior for the applications list surface and any loaded detail data for the affected record.
- **SC-005**: At least one low-risk reversible application mutation demonstrates an optimistic UI update with rollback or revalidation on failure.
- **SC-006**: README and coding standards documentation clearly explain the server route-entry responsibilities and client server-state responsibilities before broader CRUD domain work begins.
- **SC-007**: The applications pilot passes project lint/build verification and manual verification of list loading, search/filter/sort/page behavior, create, update, delete, optimistic rollback or revalidation, reconnect refetch, and recoverable errors.

## Assumptions

- The first implementation will use the applications domain as the pilot CRUD domain before broad rollout to all domains.
- The existing domain contract and mapper pattern remains the source of truth for backend-to-frontend data shape conversion.
- Domain files are added progressively. Query-enabled domains must define stable query keys, but domains should not create empty placeholder files for capabilities they do not use.
- Some routes will continue to use server-rendered data only when they do not need dynamic CRUD behavior.
- Browser-safe data functions will call backend endpoints designed for browser access by default; application route handlers remain available for flows that require server-only credentials, internal headers, or extra server-side policy checks.
- Protected browser CRUD calls are assumed to use a browser-safe cookie or session-based authorization path understood by the backend. The exact Keycloak-backed trust mechanism is intentionally deferred to planning because the final auth integration details are not known yet.
- Real backend endpoints are preferred for the applications pilot. If they are unavailable, local or mock endpoints may be used as a temporary substitute only if they preserve the intended browser-safe API contract and do not introduce mock-only architecture shortcuts.
- Protected route access, authorization resolution, and private backend credentials remain server-owned.
- The applications pilot includes at least one low-risk reversible mutation suitable for optimistic UI behavior.
- The applications pilot includes a safe delete operation suitable for manual verification of full create, update, and delete behavior.
- The applications pilot can use a minimal record shape such as identifier, display label, status, and created or updated timestamp; richer business fields are not required for the first integration proof.
- CRUD lists and details use a balanced freshness policy by default: short-lived freshness, refetch on reconnect, and targeted post-mutation invalidation of affected detail data and relevant list families. High-change operational views may use more aggressive refresh behavior, while reference data may use longer freshness windows.
- The active applications list uses conservative background refresh to surface external changes. Local writes still rely on targeted invalidation and optimistic update behavior rather than waiting for polling.
- CRUD tables use a hybrid state model: page, search, filters, and sorting are represented in route state so views are shareable and refresh-safe; ephemeral UI state such as row selection, column visibility, and open panels remains local unless a domain explicitly needs persistence.
- CRUD list data is assumed to be shaped by backend pagination, filtering, sorting, and search from the first pilot domain onward.
- CRUD error handling follows a layered model: route shell and access failures are handled at route level, list/detail query failures are handled inline on the affected surface, and mutation failures are shown near the action or through a clear transient notification while preserving confirmed data.
- The applications pilot preloads the first-screen list after successful route access. Detail views load on demand unless opened as the primary route target.
- Shared client server-state provider setup wraps the app globally, but first usage remains focused on the `/applications` pilot and future dynamic server-state surfaces rather than static pages by default.
- Static public pages, simple auth screens, and simple server-rendered views remain server-first by default even though the provider is available app-wide.
- README and coding standards documentation are both updated so future work inherits the server-first and client server-state split.
- Verification for this feature uses project lint/build checks plus manual pilot-flow verification; no automated test suite is required unless project policy changes.
- The applications pilot UI is table-first with inline actions. A side pane or separate detail route is not required for the first increment, but the query key and invalidation pattern must still support record-level detail data when introduced.
- Create and edit flows in the applications pilot use dialogs so users stay in table context. Delete and low-risk status actions may be row-level actions.
- Create and edit dialog forms follow the project's standard form approach and keep validation rules owned by the applications domain.
- Bulk actions are excluded from the applications pilot. Row selection remains local and non-mutating if present.
- The applications pilot is delivered as a dedicated protected `/applications` route or surface and does not replace the existing dashboard mock table in the first increment.
- The `/applications` route uses the existing internal app shell and sidebar patterns where practical so the top-level route still feels consistent with protected dashboard workflows.
- Client server-state inspection tooling is available only in development builds and must not be exposed in production.
- Read queries may retry transient failures. Mutations do not retry automatically by default, and authentication, authorization, validation, or user-input failures are never retried automatically.
- Offline behavior is limited to reconnect refetch for active reads in the applications pilot. Failed mutations require clear user-visible failure and manual retry.
