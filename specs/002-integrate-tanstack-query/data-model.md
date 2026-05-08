# Data Model: Client Server-State Integration

## Application Record

Represents the pilot-domain record displayed and mutated by the `/applications` CRUD table.

### Fields

- `id`: Stable record identifier.
- `label`: Human-readable display label for the table.
- `status`: Current lifecycle status.
- `createdAt`: Creation timestamp for recency display and sorting.
- `updatedAt`: Last update timestamp for recency display and sorting.

### Validation Rules

- `id` is required for every server-confirmed record.
- `label` is required for create and edit flows.
- `status` must be one of the statuses accepted by the applications domain.
- Date fields must be parseable timestamps before display.

### State Transitions

- Created records enter the default application status defined by the backend or mock contract.
- Edited records preserve identity and receive updated display/recency data from the server response.
- Deleted records are removed from the current list after server confirmation.
- One low-risk reversible status transition is eligible for optimistic UI, with rollback or revalidation on failure.

## Application List Params

Represents the server-shaped table state for applications list queries.

### Fields

- `page`: 1-based page number.
- `pageSize`: Number of rows requested.
- `search`: Debounced text search value.
- `status`: Optional status filter.
- `sort`: Sort field and direction.

### Validation Rules

- `page` must be at least `1`.
- `pageSize` must be within the supported table sizes.
- `search` is trimmed before it becomes the active list query.
- Unsupported filters or sort fields fall back to defaults or produce a recoverable error.

### Ownership

- `page`, `pageSize`, `search`, filters, and sorting are represented in route search params.
- Row selection, column visibility, open dialogs, pending form state, and transient action state remain local.

## Application List Result

Represents a backend-shaped paginated result.

### Fields

- `items`: Application records for the current query.
- `page`: Current page.
- `pageSize`: Current page size.
- `totalItems`: Total records matching current filters.
- `totalPages`: Total pages matching current filters.

### Validation Rules

- `items` must contain only mapped frontend records.
- `page` and `totalPages` determine whether delete-empty-page recovery should move to the nearest previous valid page.

## Application Mutation Input

Represents create, update, delete, and reversible status actions.

### Fields

- `create`: Display label and any minimal fields required by the applications domain.
- `update`: Record id plus editable fields.
- `delete`: Record id.
- `status`: Record id plus target reversible status.

### Validation Rules

- Create and edit dialogs validate through the project form pattern and domain-owned Zod schemas.
- Delete requires a server-confirmed id and clear user action.
- Reversible optimistic status changes must define rollback or revalidation behavior.

## Query Key

Stable domain-scoped identifiers used to read, hydrate, invalidate, and refresh application data.

### Shapes

- `applications.all`: Root key for the domain.
- `applications.lists`: Root key for all application list queries.
- `applications.list(params)`: Specific page/filter/sort/search list.
- `applications.details`: Root key for all record details.
- `applications.detail(id)`: Specific record detail.

### Validation Rules

- List params included in keys must be stable and serializable.
- Detail keys must use server-confirmed ids.
- Query-enabled domains must define query keys before adding query options or mutations.

## Browser-Safe Fetcher

Client-callable function for browser-safe backend or mock endpoints.

### Fields

- Request path and method.
- Serialized query params or JSON body.
- Mapped response model.
- Normalized recoverable error shape.

### Validation Rules

- Must not import `server-only` modules or server-only transport helpers.
- Must not expose private backend headers, internal auth tokens, or server secrets.
- Must preserve the same contract whether backed by real Laravel endpoints or local/mock endpoints.

## Provider Settings

Shared app-wide TanStack Query behavior.

### Fields

- Default stale window for balanced freshness.
- Read retry policy for transient failures only.
- Mutation retry disabled by default.
- Reconnect refetch for active reads.
- Development-only Devtools availability.

### Validation Rules

- Provider setup is app-wide, but static pages and simple server-rendered views remain server-first by policy.
- Devtools must not be exposed in production.
- Offline mutation queueing is out of scope for the applications pilot.

## Relationships

- Application List Params produce Application List Result.
- Application List Result contains Application Records.
- Query Keys identify Application List Results and Application Records.
- Mutation Inputs affect Application Records and invalidate related Query Keys.
- Browser-Safe Fetchers implement Application List and Mutation operations.
- Provider Settings govern query freshness, retries, reconnect behavior, and developer inspection.
