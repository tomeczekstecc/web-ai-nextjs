# Feature Specification: Custom App-Scoped 404 Page

**Feature Branch**: `016-custom-404-page`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "create custom app scoped 404 page"

## User Scenarios *(mandatory)*

### User Story 1 — Authenticated User Hits a Missing Route (Priority: P1)

A logged-in user navigates to a URL that does not exist within the application (e.g., by following a stale link, mistyping a URL, or bookmarking a deleted resource). Instead of seeing a generic browser or framework error screen, they see a branded 404 page that matches the app's visual design and helps them recover.

**Why this priority**: The most common scenario. Authenticated users navigating inside the app expect continuity of the UI shell and navigation when something goes wrong.

**Independent Validation**: Can be verified by visiting any non-existent route while logged in and confirming the page renders within the app layout with navigation intact.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they visit `/some/route/that/does/not/exist`, **Then** they see a 404 page rendered inside the authenticated app shell (sidebar/top-nav visible) with a clear "page not found" message.
2. **Given** a logged-in user on the 404 page, **When** they click the primary recovery action, **Then** they are taken to the dashboard.
3. **Given** a logged-in user on the 404 page, **When** they use the navigation sidebar or top-nav, **Then** navigation works normally — the user is not stuck.

---

### User Story 2 — Unauthenticated User Hits a Missing Route (Priority: P2)

A visitor who is not logged in navigates to a URL that does not exist. They see a minimal 404 page consistent with the app's public design and are offered a way to reach the login page or home page.

**Why this priority**: Less frequent but important for a complete experience; prevents raw Next.js error screens from leaking to the public.

**Independent Validation**: Can be verified by visiting a non-existent route without an active session and confirming the page renders with appropriate recovery options.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they visit a non-existent route, **Then** they see a styled 404 page without the authenticated navigation shell.
2. **Given** an unauthenticated visitor on the 404 page, **When** they click the recovery action, **Then** they are taken to the home/login page.

---

### User Story 3 — Developer / QA Validates the 404 Experience (Priority: P3)

A developer or QA engineer wants to confirm that the 404 page is reachable, styled correctly, and does not expose technical error details.

**Why this priority**: Quality assurance requirement; ensures the page meets design and security standards before release.

**Independent Validation**: Visiting a known non-existent route returns an HTTP 404 status and the correct branded page.

**Acceptance Scenarios**:

1. **Given** any route that does not exist, **When** the page is loaded, **Then** the HTTP response status is 404.
2. **Given** the 404 page, **When** it is displayed, **Then** no stack traces, file paths, or internal error messages are visible to the user.

### Edge Cases

- What happens when the not-found route is nested deeply under an authenticated layout? → The authenticated shell should still render.
- What happens if the app name or branding changes? → The 404 page uses the app-wide name/config, not a hardcoded string.
- What happens on mobile viewports? → The page must be responsive and usable on small screens.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display a custom 404 page for any route that does not match a defined page within the application.
- **FR-002**: When an authenticated user reaches a 404 page inside the app, the page MUST render within the authenticated layout (preserving sidebar/top-nav).
- **FR-003**: When an unauthenticated visitor reaches a 404 page, the page MUST render without the authenticated navigation shell.
- **FR-004**: The 404 page MUST display a clear, user-friendly "page not found" message in Polish (consistent with the app's language).
- **FR-005**: The 404 page MUST include at least one recovery action (e.g., "Go to dashboard" for authenticated users, "Go to home" for guests).
- **FR-006**: The 404 page MUST use the application name from the central app configuration (not a hardcoded string).
- **FR-007**: The HTTP response for the 404 page MUST carry a 404 status code.
- **FR-008**: The 404 page MUST NOT expose stack traces, internal paths, or framework error details.
- **FR-009**: The 404 page MUST be responsive and usable on mobile viewports.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Any undefined route within the app returns an HTTP 404 status and renders the custom branded page — verified by QA for at least 5 different non-existent paths.
- **SC-002**: Authenticated users can navigate away from the 404 page using existing navigation in under 2 clicks.
- **SC-003**: The 404 page contains no visible technical error information (stack traces, file paths, internal messages) — verified by manual inspection.
- **SC-004**: The page renders correctly on viewport widths from 320px to 1440px without layout breakage.
- **SC-005**: The app name on the 404 page updates automatically when `NEXT_PUBLIC_APP_NAME` is changed — no code changes required.

## Assumptions

- The app uses Next.js App Router; the 404 page is implemented using the `not-found.tsx` convention.
- **Two files are required**: `src/app/(app)/not-found.tsx` (authenticated, app-scoped) and `src/app/not-found.tsx` (public fallback).
- `AppShell` enforces auth via `requireAuthorizedAppSession` — unauthenticated users hitting `(app)/` routes are always redirected to login, never shown the app-scoped 404. User Story 2 is handled entirely by the root-level file.
- **Authenticated 404 layout**: `flex flex-1 items-center justify-center` inside the AppShell content column.
- **Public 404 layout**: reuses the existing `AuthShell` component for visual consistency with the sign-in page.
- **Polish copy**: heading `Nie znaleziono strony`, description `Strona, której szukasz, nie istnieje lub została przeniesiona.`, CTA `Przejdź do pulpitu` (authenticated) / `Zaloguj się` (public).
- Both pages display a large muted `404` number, heading, description, and a single CTA — no illustrations, no decorative backgrounds.
- The existing `appConfig.name` pattern is the correct source for the app name.
- `robots: { index: false }` on both pages.
