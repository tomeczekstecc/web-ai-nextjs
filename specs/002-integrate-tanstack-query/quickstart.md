# Quickstart: Client Server-State Integration

## Prerequisites

- Branch: `002-integrate-tanstack-query`
- Feature spec: `specs/002-integrate-tanstack-query/spec.md`
- Implementation plan: `specs/002-integrate-tanstack-query/plan.md`
- Use `pnpm` scripts already defined by the project.

## Setup

1. Install TanStack Query packages for the implementation slice:

   ```powershell
   pnpm add @tanstack/react-query
   pnpm add -D @tanstack/react-query-devtools
   ```

2. Keep TanStack Form usage aligned with the existing project standard for create/edit dialogs.

3. Use real browser-safe backend endpoints when available. If they are not available, create local or mock endpoints that preserve:

   - the same paths and methods described in `contracts/applications-browser-api.openapi.yaml`
   - server-shaped pagination, filtering, sorting, and search
   - create, update, delete, and reversible status mutation behavior
   - recoverable error envelopes

## Implementation Order

1. Add shared QueryClient setup and app-wide provider.
2. Add development-only query inspection.
3. Extend applications contracts and mappers for the minimal pilot record, list params, and list result.
4. Add browser-safe applications fetchers.
5. Add applications query keys and query options.
6. Add protected `/applications` route and reuse the internal shell/sidebar patterns where practical.
7. Prefetch and hydrate the first applications list.
8. Build the table-first applications UI with URL-owned page/search/filter/sort state.
9. Add create and edit dialogs using the project form pattern.
10. Add create, update, delete, and reversible optimistic status mutation behavior.
11. Add conservative active-list background refresh and reconnect refetch.
12. Update README and `context/coding-standards.md`.

## Manual Verification

Run these commands after implementation:

```powershell
pnpm lint
pnpm build
```

Manually verify:

- `/applications` is protected and uses the internal app shell/sidebar patterns where practical.
- Static public pages and simple auth screens still render without moving their data flow to TanStack Query.
- First applications list renders from hydrated data without an immediate duplicate browser request.
- Page, page size, search, filter, and sort state is represented in URL search params.
- Text search is debounced before list refetch.
- Discrete filter, sort, and page changes update promptly.
- Create shows Polish success feedback and refreshes the current server-shaped list.
- Update refreshes affected list data and any loaded detail data.
- Delete refreshes the list and moves to the nearest previous page if the current page becomes empty.
- One reversible status action updates optimistically and rolls back or revalidates on failure.
- Backend unavailable and validation failures show recoverable UI and preserve confirmed data.
- Active list background refresh can surface external changes.
- Reconnect refetches active read queries.
- Failed mutations are not queued for offline replay.
- Query inspection tooling is available in development only.

## Out of Scope

- Bulk actions.
- Offline mutation queueing.
- Replacing the existing dashboard mock table.
- Full detail pane or detail route in the first increment.
- Automated tests.
- Final Keycloak trust mechanism design beyond the current browser-safe cookie/session assumption.
