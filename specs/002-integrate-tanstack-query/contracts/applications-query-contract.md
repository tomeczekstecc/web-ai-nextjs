# Applications Query Contract

This contract defines frontend server-state behavior for the `/applications` pilot. It complements the browser API contract and should be followed by future Query-enabled domains.

## Query Keys

```ts
applicationsKeys.all
applicationsKeys.lists()
applicationsKeys.list(params)
applicationsKeys.details()
applicationsKeys.detail(applicationId)
```

Rules:

- `applicationsKeys.all` scopes the domain.
- `applicationsKeys.lists()` targets all application list queries.
- `applicationsKeys.list(params)` targets one server-shaped list, including page, page size, search, status filter, and sort.
- `applicationsKeys.details()` targets all application detail queries.
- `applicationsKeys.detail(applicationId)` targets one record.
- Query params must be stable, serializable, and normalized before key creation.

## URL State

The applications table stores these values in route search params:

- `page`
- `pageSize`
- `search`
- `status`
- `sort`

Rules:

- Text search is debounced before it updates the active query.
- Discrete filter, sort, and page changes update immediately.
- Invalid or unsupported route state falls back to defaults or produces a recoverable inline error.
- Ephemeral UI state stays local unless a future domain explicitly needs persistence.

## Query Options

Applications list options must include:

- stable `queryKey`
- browser-safe `queryFn`
- balanced default freshness
- conservative active-list background refresh
- reconnect refetch
- transient-read retry policy

Application detail options must include:

- stable detail key
- browser-safe detail fetcher
- balanced default freshness
- transient-read retry policy

Static pages and simple server-rendered views must not use these options by default.

## Mutations

Create:

- Uses browser-safe create fetcher.
- Shows clear success feedback.
- Invalidates relevant list families.
- Does not force the new record into a current filtered/sorted list if the backend would not include it.

Update:

- Uses browser-safe update fetcher.
- Invalidates the affected detail key and relevant list families.

Delete:

- Uses browser-safe delete fetcher.
- Invalidates relevant list families.
- If the current page becomes empty, moves to the nearest previous valid page when available.

Reversible status change:

- Uses optimistic UI.
- Cancels relevant outgoing queries before the optimistic update.
- Snapshots previous list/detail data.
- Applies optimistic status to visible affected data.
- Rolls back or revalidates if the mutation fails.
- Invalidates affected detail data and relevant list families when settled.

## Error Handling

Route-level errors:

- Route shell failure.
- Authentication or authorization route failure.
- Unrecoverable protected route setup failure.

Inline query errors:

- Applications list fetch failure.
- Application detail fetch failure.
- Recoverable backend unavailable state.

Mutation errors:

- Shown near the action or through a clear transient notification.
- Preserve or restore last confirmed data.
- Validation, authorization, authentication, and user-input failures do not retry automatically.

## Retry and Offline Behavior

- Read queries may retry transient failures.
- Mutations do not retry automatically by default.
- Authentication, authorization, validation, and user-input failures are never retried automatically.
- Active reads refetch after reconnect.
- Offline mutations are not queued or replayed in the applications pilot.

## Development Inspection

- Query inspection tooling is available only in development.
- Production builds must not expose the inspection UI.

## Browser Safety

- Browser fetchers must not import `server-only` modules.
- Browser fetchers must not import `src/lib/api/core/http.ts`.
- Browser requests must not expose private backend headers, internal auth tokens, or server secrets.
- Mock endpoints must preserve the same request, response, pagination, mutation, and error behavior as real backend endpoints.
