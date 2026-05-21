# Tasks: Custom App-Scoped 404 Page

**Input**: Design documents from `specs/016-custom-404-page/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: None — constitution forbids automated tests.

**Scope**: 2 new files, 0 modified files. No shared infrastructure needed — `appConfig`,
`AuthShell`, `Button`, and `Link` are all already in place.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths in every description

---

## Phase 1: Setup

No setup required. All dependencies (`appConfig`, `AuthShell`, `Button`, `Link`) already exist.
`src/lib/config/app.ts` is already wired. Both target files are new — no conflicts possible.

**Checkpoint**: Skip to Phase 2 immediately.

---

## Phase 2: Foundational

No foundational work required. Both 404 pages are independent static files with no shared
new primitives. Proceed directly to user story implementation.

**Checkpoint**: Ready for user story implementation.

---

## Phase 3: User Story 1 — Authenticated User Hits a Missing Route (Priority: P1)

**Goal**: Logged-in users hitting any unmatched route under `(app)/` see a branded 404 page
inside the AppShell (sidebar / top-nav intact) with a CTA to the dashboard.

**Independent Validation**: Visit `/does/not/exist` while logged in → AppShell renders,
large muted "404" visible, heading "Nie znaleziono strony", button "Przejdź do pulpitu"
navigates to `/dashboard`. DevTools shows HTTP 404 status.

### Implementation

- [x] T001 [US1] Create authenticated 404 page in `src/app/(app)/not-found.tsx`:
  - Server component, no `'use client'`
  - Metadata: `title: "Nie znaleziono strony"`, `robots: { index: false }`
  - Layout: `<div className="flex flex-1 items-center justify-center">`
  - Inner block: `flex flex-col items-center gap-4 text-center px-4`
  - Large muted number: `<p className="text-8xl font-bold text-muted-foreground">404</p>`
  - Heading: `<h1 className="text-2xl font-semibold">Nie znaleziono strony</h1>`
  - Description: `<p className="text-muted-foreground max-w-sm">Strona, której szukasz, nie istnieje lub została przeniesiona.</p>`
  - CTA: `<Button nativeButton={false} render={<Link href="/dashboard" />}>Przejdź do pulpitu</Button>`
  - Import `appConfig` from `@/lib/config/app` — not used in copy but available for future use

- [ ] T002 [US1] Verify US1 manually (manual step):
  - Light mode + dark mode — text and background tokens correct
  - Desktop and mobile (320px) — no overflow, button reachable
  - HTTP status 404 in DevTools Network tab
  - No stack traces or internal paths visible
  - CTA navigates to `/dashboard`

**Checkpoint**: US1 fully functional and independently verifiable.

---

## Phase 4: User Story 2 — Unauthenticated User Hits a Missing Route (Priority: P2)

**Goal**: Visitors without a session hitting any unmatched public URL see a styled AuthShell
404 card with a CTA to the sign-in page — no raw Next.js error screen.

**Independent Validation**: Log out, visit `/does/not/exist` → AuthShell card renders with
"Nie znaleziono strony", button "Zaloguj się" navigates to `/auth/sign-in`. HTTP 404 in
DevTools.

### Implementation

- [x] T003 [P] [US2] Create public fallback 404 page in `src/app/not-found.tsx`:
  - Server component, no `'use client'`
  - Metadata: `title: "Nie znaleziono strony"`, `robots: { index: false }`
  - Wrap in `<AuthShell title="Nie znaleziono strony" description="Strona, której szukasz, nie istnieje lub została przeniesiona.">`
  - Inside AuthShell children: large muted number + CTA button only
  - Large muted number: `<p className="text-8xl font-bold text-muted-foreground mb-2">404</p>`
  - CTA: `<Button className="w-full" nativeButton={false} render={<Link href="/auth/sign-in" />}>Zaloguj się</Button>`

- [ ] T004 [US2] Verify US2 manually (manual step):
  - Light mode + dark mode
  - Mobile (320px) — card fits, no overflow
  - HTTP status 404 in DevTools
  - No stack traces visible
  - CTA navigates to `/auth/sign-in`

**Checkpoint**: US2 fully functional and independently verifiable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across both stories and QA sign-off.

- [ ] T005 End-to-end manual QA per `specs/016-custom-404-page/quickstart.md` (manual step):
  - At least 5 different non-existent paths verified (FR-001, SC-001)
  - Authenticated + unauthenticated flows both confirmed
  - Confirm `NEXT_PUBLIC_APP_NAME` change in `.env` does not require code changes (SC-005)
  - Confirm no hardcoded "CI-PRS" strings in either not-found file

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 & 2**: Skipped — no setup or foundational work needed
- **Phase 3 (US1)**: No dependencies — start immediately
- **Phase 4 (US2)**: No dependency on US1 — can run in parallel after Phase 3 starts
- **Phase 5 (Polish)**: Depends on T001–T004 complete

### User Story Dependencies

- US1 and US2 are fully independent — both touch different files
- US3 (developer/QA validation) is covered by T002, T004, and T005

### Parallel Opportunities

- T001 and T003 are marked [P] — they touch different files and can be implemented simultaneously
- T002 and T004 (verification) can be done in parallel after their respective implementation tasks

---

## Summary

| Phase | Tasks | Story | Parallelizable |
|-------|-------|-------|----------------|
| Phase 3 | T001, T002 | US1 | T001 [P] |
| Phase 4 | T003, T004 | US2 | T003 [P] |
| Phase 5 | T005 | — | — |
| **Total** | **5 tasks** | | |

**MVP scope**: T001 + T002 (US1 only) — delivers the authenticated 404 in under 30 minutes.
**Full scope**: T001–T005 — both pages + QA sign-off.
