# Research: Client Server-State Integration

## Decision 1: App-wide Query provider with usage discipline

**Decision**: Add a shared app-wide TanStack Query provider, but keep TanStack Query usage limited by policy to dynamic server-state surfaces such as `/applications` and future CRUD domains.

**Rationale**: TanStack Query's provider relies on React context and must live in a client component. The v5 App Router guidance recommends a stable browser QueryClient and fresh server QueryClients for SSR/hydration scenarios. The user accepted global provider scope, while the spec explicitly forbids static public pages, simple auth screens, and simple server-rendered views from using client server-state by default.

**Alternatives considered**:

- Provider only under protected/internal layout: cleaner public surface, but rejected by accepted spec decision.
- Provider only under `/applications`: smallest scope, but would need moving as soon as a second CRUD domain appears.

## Decision 2: Hydrate the first-screen applications list

**Decision**: The protected `/applications` route prefetches the first list query after route access succeeds and passes dehydrated state to the client table.

**Rationale**: TanStack Query v5 supports App Router prefetch with `QueryClient`, `prefetchQuery`, `dehydrate`, and `HydrationBoundary`. This lets the route keep auth and initial shell responsibilities server-owned while avoiding an immediate duplicate list request in the client table.

**Alternatives considered**:

- Client-only first list fetch: simpler, but fails the accepted requirement to prove the server-route/client-query handoff.
- Hydrate every detail view: unnecessary for the table-first pilot; detail data can load on demand unless it becomes the primary route target.

## Decision 3: Browser-safe backend calls by default

**Decision**: Browser fetchers in `src/lib/api/domains/applications/client.ts` call backend endpoints designed for browser access by default. Next.js route handlers remain available for flows that need server-only credentials, internal headers, or extra policy checks.

**Rationale**: The user selected direct backend access, with a current assumption of browser-safe cookie/session authorization and future Keycloak-backed trust details deferred. This keeps the domain browser contract explicit and avoids accidentally importing `server-only` transport code into the browser.

**Alternatives considered**:

- Always call Next.js route handlers: safest with current server-only transport, but rejected by user preference for direct backend/public endpoints.
- Use direct calls only for public data: safest for auth uncertainty, but too narrow for CRUD-heavy protected workflows.

## Decision 4: Progressive domain file model

**Decision**: Keep `contract.ts` and `mapper.ts` as the shared domain boundary. Add `client.ts`, `query-keys.ts`, and `query-options.ts` only when a domain needs client server-state. Query-enabled domains must define stable query keys.

**Rationale**: The repo prefers avoiding placeholder abstractions. Progressive files preserve the current simple API pattern while still enforcing consistency once TanStack Query is introduced.

**Alternatives considered**:

- Required full file set for every CRUD domain: consistent but creates empty files and premature structure.
- Loose convention: faster initially but likely inconsistent across many domains.

## Decision 5: Backend-shaped table state

**Decision**: Applications list queries use backend-shaped pagination, filtering, sorting, and search from the first pilot domain. Page/search/filter/sort live in URL search params; ephemeral UI state remains local.

**Rationale**: The product expects many tables and domains, so client-only table operations would create a migration trap. URL state makes views shareable and refresh-safe, while local state is still appropriate for row selection, column visibility, and open dialogs.

**Alternatives considered**:

- Client-side table operations for the pilot: faster, but trains the wrong abstraction.
- Persist all table state in URL: overexposes ephemeral UI details and makes URLs noisy.

## Decision 6: Balanced freshness with active-list refresh

**Decision**: CRUD lists and details use balanced freshness by default: short-lived freshness, reconnect refetch, targeted post-mutation invalidation, and conservative polling for the active applications list.

**Rationale**: The user wants dynamic changes, but polling every surface would increase backend load. Active-list refresh proves external-change behavior without broad background churn.

**Alternatives considered**:

- Event-only refetch: simpler but weaker for changes made by other actors.
- Aggressive polling everywhere: dynamic but wasteful and risky for many domains.

## Decision 7: Targeted invalidation plus one optimistic mutation

**Decision**: Mutations invalidate affected detail data and relevant list families. One low-risk reversible applications mutation must use optimistic UI with snapshot, rollback or revalidation, and final invalidation.

**Rationale**: Targeted invalidation avoids noisy refreshes as domains grow. Optimistic behavior proves the harder UX path while limiting risk to one reversible action.

**Alternatives considered**:

- Broad domain invalidation: simple but wasteful once filtered lists and detail data exist.
- Manual cache writes only: fast but risky with backend-computed fields and permissions.
- No optimistic update in pilot: easier but fails the accepted spec choice.

## Decision 8: Layered error and retry model

**Decision**: Route shell/access failures stay route-level. Query failures render inline on the affected table/detail surface. Mutation failures show action-local feedback or a clear transient notification. Read queries may retry transient failures; mutations and auth/validation/user-input failures do not auto-retry.

**Rationale**: CRUD routes need recoverable table errors without replacing the whole route. Mutations should not repeat writes implicitly unless a future domain explicitly designs idempotent behavior.

**Alternatives considered**:

- Inline errors only: inconsistent for route shell and access failures.
- Retry everything: dangerous for mutations and validation/auth failures.

## Decision 9: Local/mock endpoints as a contract-compatible fallback

**Decision**: If real backend endpoints are unavailable, the pilot may use local or mock endpoints only when they preserve the same browser-safe API contract, pagination behavior, mutation behavior, and error envelope.

**Rationale**: The frontend architecture should not block on backend availability, but static JSON cannot validate CRUD, mutation failures, polling, or pagination.

**Alternatives considered**:

- Require real backend endpoints: best validation, but can block frontend planning and implementation.
- Static JSON only: too weak for this feature's server-state goals.

## Decision 10: Development-only query inspection

**Decision**: Include TanStack Query Devtools for development-only cache/query inspection.

**Rationale**: Devtools make query keys, cache state, invalidation, and refetch behavior visible during manual verification. The spec requires no production exposure.

**Alternatives considered**:

- No Devtools: less setup but harder to verify the new architecture.
- Production-toggle Devtools: supported by TanStack, but outside this feature's scope and not needed for the pilot.
