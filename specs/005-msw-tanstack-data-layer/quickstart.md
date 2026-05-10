# Quickstart: MSW-Backed Data Layer

## First-Time Setup

1. Install MSW: `pnpm add msw --save-dev`
2. Generate the service worker file: `npx msw init ./public --save`
3. Commit `public/mockServiceWorker.js`

## Implementation Steps

1. Create `src/mocks/data/` and populate mock data files (one per domain).
2. Create `src/mocks/handlers/dashboard.ts` — HTTP handlers for `/api/dashboard/*`.
3. Create `src/mocks/handlers/applications.ts` — HTTP handler for `/api/applications`.
4. Create `src/mocks/handlers/index.ts` — re-export all handlers as a flat array.
5. Create `src/mocks/browser.ts` — `setupWorker(...handlers)`.
6. Create `src/components/providers/msw-provider.tsx` — `'use client'` component that starts the worker in `useEffect` when `NODE_ENV === "development"`.
7. Wrap `QueryProvider` with `MSWProvider` in `src/app/layout.tsx`.
8. Create `src/lib/api/domains/dashboard/contract.ts` — TypeScript types for all three dashboard endpoints.
9. Create `src/lib/api/domains/dashboard/client.ts` — `browserFetch` functions for review-items, chart, and queue endpoints.
10. Create `src/lib/api/domains/dashboard/query-keys.ts` and `query-options.ts`.
11. Update `src/components/dashboard/dashboard-data-table.tsx` — remove `data` prop, add `useQuery` for review-items and queue.
12. Update `src/components/chart-area-interactive.tsx` — remove inline `chartData`, add `useQuery` for chart endpoint.
13. Update `src/app/dashboard/page.tsx` — remove `data.json` import and the `data` prop on `DashboardDataTable`.
14. Delete `src/app/dashboard/data.json`.
15. Extract landing-page fallback payload to `src/mocks/data/landing-page.ts`; update `src/lib/api/domains/landing-page/queries.ts` to import from there.

## Manual Verification

1. Run `pnpm dev`.
2. Open browser DevTools → Application → Service Workers. Confirm `mockServiceWorker.js` is registered.
3. Open the Network panel. Navigate to the authenticated dashboard. Confirm `/api/dashboard/review-items`, `/api/dashboard/chart`, and `/api/dashboard/queue` appear as intercepted requests (status `200`).
4. Confirm the dashboard review table renders with data (same rows as before).
5. Confirm the area chart renders with time-series data.
6. Navigate to the applications page. Confirm `/api/applications` is intercepted and the table renders.
7. Navigate to the public homepage. Confirm it renders the same content as before (landing-page fallback still works).
8. Disable the service worker in DevTools (unregister). Reload. Confirm a console warning appears for unhandled requests rather than a crash.
9. Run `pnpm build`. Confirm a clean production build. Confirm `mockServiceWorker.js` is not referenced in the production bundle.
10. Run `pnpm lint`.

## Out Of Scope

- `msw/node` server-side interception for landing-page or auth routes.
- Automated tests.
- Production API integration.
- Auth-user server-side mock rework.
