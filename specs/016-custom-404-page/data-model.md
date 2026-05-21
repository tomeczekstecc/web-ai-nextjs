# Data Model: Custom App-Scoped 404 Page

**Feature**: 016-custom-404-page
**Date**: 2026-05-21

---

## Entities

No new data entities. This feature is purely presentational — two static server-rendered
pages with no data fetching, no state, and no storage.

## Configuration Reference

The only runtime value consumed is `appConfig.name` from `src/lib/config/app.ts`, driven
by `NEXT_PUBLIC_APP_NAME`. No new env vars introduced.

## UI State

None. Both pages are fully static — no loading states, no async data, no client hooks.
