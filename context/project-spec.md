# CI-PRS Web Project Spec

## Current Scope

This repository currently covers:
- a marketing landing page backed by a server-side content query with fallback data
- a dashboard route built from reusable sidebar, chart, card, and data table components
- a typed API integration pattern for future backend growth

## Primary Goals

- Keep the frontend production-ready even before the backend is fully available.
- Make backend integration incremental and low-risk.
- Keep design quality high without turning the codebase into a UI experiment.
- Preserve a clear split between transport concerns, mapping, and rendering.

## Existing Feature Areas

### Landing page

The landing page should:
- render meaningful content even when the backend is unavailable
- switch cleanly to API data when `API_URL` is configured and responsive
- communicate integration state without exposing transport details to the page structure
- keep the hero and supporting sections visually strong and easy to scan

### Dashboard

The dashboard area should:
- reuse shared layout primitives
- support growth into real data-driven workflows
- keep sidebar, header, cards, charts, and tables composable

## API Expectations

The current documented public integration is:
- `GET /api/public/landing-page`

The frontend expects:
- backend DTOs defined in a domain contract
- DTO-to-UI mapping in a domain mapper
- fetching through the shared `apiRequest()` helper
- normalized error handling with a safe fallback path where appropriate

## Non-Goals

- Direct `fetch()` calls scattered across pages and components
- Mixing backend snake_case DTOs directly into UI code
- Large refactors unrelated to the task at hand
- Adding new abstractions before a second real use case appears

## Quality Bar

- Ship minimal, coherent changes.
- Keep visual polish consistent with the existing landing page direction.
- Prefer explicit domain boundaries over clever shared helpers.
- Keep accessibility and responsive behavior intact when editing UI.
- Run `pnpm lint` for code changes and `pnpm build` when route behavior, typing, or integration code changes materially.
