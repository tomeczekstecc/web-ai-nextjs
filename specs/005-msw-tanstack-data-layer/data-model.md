# Data Model: MSW-Backed Data Layer

## Dashboard Review Item

Represents a single document review entry in the main dashboard data table.

**Fields**:
- `id`: numeric identifier
- `header`: document or task title
- `type`: category label (e.g. "Document", "Review")
- `status`: processing state (e.g. "In Process", "Done")
- `target`: target entity or person name
- `limit`: deadline or limit string
- `reviewer`: assigned reviewer name

**Source**: Currently `src/app/dashboard/data.json` (68 items). Will be served by `GET /api/dashboard/review-items`.

## Dashboard Priority Queue Item

Represents a single item in the review queue panel within the dashboard table component.

**Fields**:
- `id`: string identifier
- `name`: queue item label
- `owner`: responsible person
- `priority`: priority level string (Polish: "Wysoki", "Niski", etc.)

**Source**: Currently inline `reviewRows` constant in `DashboardDataTable`. Will be served by `GET /api/dashboard/queue`.

## Dashboard Chart Point

Represents a single data point in the area chart time series.

**Fields**:
- `date`: ISO date string (YYYY-MM-DD)
- `desktop`: numeric value for the desktop series
- `mobile`: numeric value for the mobile series

**Source**: Currently inline `chartData` constant in `ChartAreaInteractive`. Will be served by `GET /api/dashboard/chart`.

## Application

Represents a submitted application in the applications domain.

**Fields** (existing contract, unchanged):
- `id`: string identifier
- `label`: application title
- `status`: one of `draft | submitted | archived`
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

**Source**: TanStack Query already in use. Will have a corresponding MSW handler added for `GET /api/applications`.

## Landing Page Content

Represents the full content payload for the public homepage.

**Sections**:
- `hero`: eyebrow, title, highlight, description, CTA labels and hrefs, secondary note
- `features`: array of `{ id, title, body }` items (3 items)
- `benefits`: array of benefit strings (4 items)
- `stats`: array of `{ id, value, label }` items (3 items)

**Source**: Currently inline `fallbackPayload` constant in `src/lib/api/domains/landing-page/queries.ts`. Will be extracted to `src/mocks/data/landing-page.ts` and imported by the queries file as the fallback.

## Mock Handler Registry

Represents the centralised registry of all MSW request interceptors.

**Structure**:
- `src/mocks/handlers/dashboard.ts` — handlers for `/api/dashboard/*`
- `src/mocks/handlers/applications.ts` — handler for `/api/applications`
- `src/mocks/handlers/index.ts` — flat export of all handlers

**Lifecycle**:
- Worker starts on client mount in development (`process.env.NODE_ENV === "development"`)
- Worker is never included in server bundles (dynamic import inside `useEffect`)
- Worker stops naturally when the browser tab closes
