# Research: MSW-Backed Data Layer

## Decision: Use MSW v2 browser worker for all client-side mock data

**Rationale**: MSW v2 intercepts browser `fetch` calls via a Service Worker registered in `public/`. All client-side TanStack Query data fetches pass through the browser's native `fetch`, making them transparently interceptable. No production bundle is affected because the worker is only started when `process.env.NODE_ENV === "development"`. The Service Worker file (`mockServiceWorker.js`) is generated once by `npx msw init ./public` and committed to the repository.

**Alternatives considered**:
- `msw/node` for server-side interception: rejected because the cost of intercepting server-only Next.js data fetches (landing-page query) with `msw/node` requires modifying the Next.js instrumentation layer, which violates the Surgical Changes principle for this feature's scope.
- Replacing inline arrays with separate JSON files: rejected because it still scatters mock data and does not enable future swap to real API responses without changing import paths.

## Decision: Register MSW in a dedicated `MSWProvider` client component

**Rationale**: Root `layout.tsx` is a Server Component and cannot call `useEffect`. The `QueryProvider` already exists as a `'use client'` wrapper. A dedicated `src/components/providers/msw-provider.tsx` keeps the worker startup concern isolated. It wraps `QueryProvider` so the worker is guaranteed to start before any TanStack Query `useQuery` fires. The worker is started with dynamic import to prevent the `msw/browser` module from entering any server bundle.

**Pattern**:
```
ThemeProvider
  └── MSWProvider         ← new, 'use client', starts worker async in useEffect
        └── QueryProvider ← existing
              └── children
```

**Alternatives considered**:
- Starting MSW inside `QueryProvider`: rejected because it couples the data-fetching provider with the mock infrastructure concern.
- Using `next/dynamic` with `ssr: false` for a wrapper component: rejected as unnecessarily complex vs. a simple `useEffect` with dynamic import.

## Decision: Create a `src/lib/api/domains/dashboard/` domain following the applications pattern

**Rationale**: The existing `applications` domain (contract → client → query-options → query-keys) is the established pattern. Creating a parallel `dashboard` domain for review-items, chart data, and queue data means `DashboardDataTable` and `ChartAreaInteractive` can drop their hardcoded data and use `useQuery` exactly like `ApplicationsTable`. The API base URL (`NEXT_PUBLIC_API_URL` → `/api`) and `browserFetch` pattern are reused unchanged.

**Endpoints to mock**:
- `GET /api/dashboard/review-items` — replaces `data.json` (68 review item objects)
- `GET /api/dashboard/chart` — replaces inline `chartData` (date + desktop + mobile points)
- `GET /api/dashboard/queue` — replaces inline `reviewRows` (3-item priority queue)

**Alternatives considered**:
- One combined `GET /api/dashboard` endpoint: rejected because the chart and table data are consumed by different components and having separate endpoints keeps each component's dependency minimal.
- Keeping `DashboardDataTable` as a Server Component with prop-passing: rejected because it would require keeping the JSON import on the server and would not use TanStack Query.

## Decision: Centralise mock data payloads in `src/mocks/data/`

**Rationale**: All MSW handler responses reference typed payload constants imported from `src/mocks/data/`. This separates the mock data (what is returned) from the handler routing (which URL triggers it). Developers can update data without touching handler logic.

**Structure**:
```
src/mocks/
├── browser.ts                  ← setupWorker(...handlers)
├── handlers/
│   ├── index.ts                ← [...dashboardHandlers, ...applicationsHandlers]
│   ├── dashboard.ts
│   └── applications.ts
└── data/
    ├── dashboard-review-items.ts
    ├── dashboard-chart.ts
    ├── dashboard-queue.ts
    ├── applications.ts
    └── landing-page.ts         ← server-side fallback payload (not an MSW handler)
```

## Decision: Landing-page fallback payload extracted but not MSW-intercepted

**Rationale**: `landing-page/queries.ts` is marked `server-only` and calls the Laravel backend API via a Node.js server fetch (`apiRequest`). MSW browser worker cannot intercept server-side Node.js fetches. Adding `msw/node` for this one endpoint would require modifying Next.js instrumentation, which is outside feature scope. The correct action is to extract the hardcoded fallback payload from `queries.ts` into `src/mocks/data/landing-page.ts` and import from there, centralising the mock data without needing MSW.

**Alternatives considered**:
- Create a Next.js Route Handler (`/api/public/landing-page`) that returns mock data in development: would work but introduces a new Route Handler whose only purpose is to replace the fallback, adding more moving parts than necessary.
- Leave the landing-page fallback as-is: rejected because the spec requires centralising all mock data.

## Decision: Applications MSW handler added to existing domain

**Rationale**: The `applications` domain already has a working `browserFetch`-based client and TanStack Query options. Adding a corresponding MSW handler in `src/mocks/handlers/applications.ts` that intercepts `GET /api/applications` completes the pattern without touching the domain code.

## Decision: No `onUnhandledRequest: "error"` in development worker startup

**Rationale**: The app may make requests to routes not yet covered (auth endpoints, etc.) in development. Using `"warn"` rather than `"error"` avoids breaking the development experience while still surfacing unhandled routes in the browser console.
