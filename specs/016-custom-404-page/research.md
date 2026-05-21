# Research: Custom App-Scoped 404 Page

**Feature**: 016-custom-404-page
**Date**: 2026-05-21

---

## Next.js `not-found.tsx` — Route Group Behaviour

**Decision**: Place `not-found.tsx` inside `src/app/(app)/` AND at `src/app/`.

**Rationale**:
- In Next.js App Router, `not-found.tsx` is rendered wrapped by its nearest parent layout.
  `src/app/(app)/not-found.tsx` is wrapped by `src/app/(app)/layout.tsx` → `AppShell` renders automatically.
- `AppShell` calls `requireAuthorizedAppSession`, which redirects unauthenticated users to
  sign-in before the 404 UI is ever reached — so the app-scoped 404 is implicitly auth-gated.
- The root `src/app/not-found.tsx` is the global fallback for any URL that falls outside all
  route groups (e.g., truly unmapped public URLs). It is NOT wrapped by AppShell.
- Unauthenticated users hitting `(app)/` routes are redirected by AppShell, never reaching
  the app-scoped 404.

**Alternatives considered**:
- Single root `not-found.tsx` with auth-state detection — rejected: adds coupling to auth
  in an error boundary file; violates Simplicity First.
- Dedicated `/404` route under `(app)/` with redirect — rejected: unnecessary indirection.

---

## `AuthShell` Reuse for Public 404

**Decision**: The root `not-found.tsx` wraps content in `<AuthShell>`.

**Rationale**:
- `AuthShell` is already the visual language for "outside the authenticated app" (sign-in,
  sign-up, access-denied pages).
- CTA on the public 404 is "Zaloguj się" → `/auth/sign-in`, matching the sign-in page context.
- No new component or layout code needed.

**Alternatives considered**:
- Custom full-page centred layout — rejected: duplicates what AuthShell already does.

---

## `notFound()` vs Automatic URL Matching

**Decision**: Rely on Next.js automatic URL-unmatched behaviour; do NOT add `notFound()` calls to existing pages.

**Rationale**:
- Scope is limited to 404 pages only. Existing pages (e.g., `/wizard-demo/[id]`) have their
  own error boundaries for missing records and are out of scope.
- Adding `notFound()` calls to existing pages is a separate, larger task.

---

## HTTP Status

**Decision**: `not-found.tsx` files automatically return HTTP 404 — no manual header needed.

**Rationale**: Next.js sets the 404 status code automatically for `not-found.tsx` renders.

---

## Component Type

**Decision**: Both `not-found.tsx` files are server components (no `'use client'`).

**Rationale**: No interactivity needed. CTAs use `<Link>` (rendered via Button with
`nativeButton={false}`), which requires no client JS. Keeps bundle minimal.
