# Implementation Plan: Auth Pages Refactor — shadcn Template Alignment

**Branch**: `017-auth-pages-refactor` | **Date**: 2026-05-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/017-auth-pages-refactor/spec.md`

## Summary

Replace the custom gradient + grid-pattern `AuthShell` design with the shadcn documentation template layout (`bg-muted` page background, standard `Card`). The sign-in page gets a bespoke two-column card layout (form + decorative image panel). All other auth pages continue using an updated `AuthShell` that adopts the new background style. A new `AUTH_SOCIAL_LOGIN_ENABLED` env flag (default `false`) controls the rendering of Apple / Google / Meta social login buttons on the sign-in page. All existing form logic, TanStack Form validation, Zod schemas, and redirect behaviour are preserved without regression.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16.2.2 App Router, React 19, shadcn/ui (base-nova), TanStack Form v1.32, Zod v4, better-auth (genericOAuthClient plugin)
**Storage**: N/A — no new storage; one new `.env` flag
**Testing**: N/A — constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers, dark and light themes
**Project Type**: Web frontend
**Performance Goals**: No new client JS weight; social section is conditional, tree-shaken when disabled
**Constraints**: Polish UI text throughout, theme parity (light/dark), no automated tests, no code comments beyond security/TODO exceptions, surgical changes only
**Scale/Scope**: 3 files modified (auth-shell, sign-in page, sign-in form), 2 env files updated

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Think Before Coding | ✅ | research.md resolves all unknowns before any code |
| Simplicity First | ✅ | No new abstractions; `AuthShell` retains its existing API; social section is inline |
| Surgical Changes | ✅ | Only 3 source files + 2 env files touched; 5 consumer pages unchanged |
| Goal-Driven Execution | ✅ | SC-001…SC-005 are explicit and verifiable |
| Frontend-First, Backend-Decoupled | ✅ | Social buttons call `authClient.signIn.social()`; backend provider config is out of scope |
| TypeScript, App Router, Design System | ✅ | Server components for pages, client components for forms, shadcn/ui throughout |
| Polish UI, Responsiveness, Theme Parity | ✅ | All copy in Polish; two-column collapses on mobile; dark mode handled via Tailwind dark variant |
| Clean Code, KISS, DRY | ✅ | No duplication introduced; social section is inline (not extracted prematurely) |
| No Tests, Minimal Comments | ✅ | No test files; no comments planned |

**Post-design re-check**: All gates still pass. File-change map is minimal (see data-model.md). No complexity violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/017-auth-pages-refactor/
├── plan.md          ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
└── checklists/
    └── requirements.md
```

### Source Code (files touched)

```text
src/
  components/
    auth/
      auth-shell.tsx          ← layout update (bg-muted, drop gradient/grid)
      sign-in-form.tsx        ← two-column card, socialEnabled prop, social section
  app/
    auth/
      sign-in/
        page.tsx              ← own wrapper, reads AUTH_SOCIAL_LOGIN_ENABLED
.env                          ← add AUTH_SOCIAL_LOGIN_ENABLED=false
.env.example                  ← add AUTH_SOCIAL_LOGIN_ENABLED=false (with comment)
```

## Implementation Notes

### AuthShell changes

Remove:
- `bg-[radial-gradient(...)]` + `bg-[linear-gradient(...)]` from `<main>`
- Absolute inset grid-pattern `<div>`
- `relative z-10` positioning wrapper
- `backdrop-blur`, `shadow-primary/5` on Card
- `border-primary/20 bg-primary/8` app-name badge

Replace with:
- `<main className="flex min-h-svh flex-col items-center justify-center bg-muted px-4 py-10">`
- `<div className="w-full max-w-md">` content wrapper
- Standard `Card` with `CardHeader` / `CardContent` (retain title, description, children, footer slots)

### Sign-in page changes

- Remove `AuthShell` import and usage
- Add own layout wrapper (`flex min-h-svh items-center justify-center bg-muted p-6 md:p-10`)
- Read `process.env.AUTH_SOCIAL_LOGIN_ENABLED === "true"` → `socialEnabled`
- Retain existing `ssoEnabled` read
- Pass `socialEnabled` prop to `SignInForm`

### SignInForm changes

- Add `socialEnabled?: boolean` prop
- Wrap entire return in `<div className="flex flex-col gap-6">` → `<Card className="overflow-hidden p-0">` → `<CardContent className="grid p-0 md:grid-cols-2">`
- Left col: existing `<form>` (keep all field logic unchanged), wrapped in `<FieldGroup>`
- Right col: `<div className="relative hidden bg-muted md:block">` + `<img>`
- After submit button and before "create account" link: conditionally render `FieldSeparator` + 3 social buttons when `socialEnabled`
- Add `<FieldDescription className="px-6 text-center">` TOS notice below the card (outside `Card`)
- Social button click handlers: `() => authClient.signIn.social({ provider: "apple" | "google" | "meta", callbackURL: buildAuthSuccessHref(returnTo) })`

### ENV additions

`.env`:
```
AUTH_SOCIAL_LOGIN_ENABLED=false
```

`.env.example`:
```
# Enables Apple, Google, and Meta social login buttons on the sign-in page.
# Requires the respective OAuth providers to be configured in better-auth.
AUTH_SOCIAL_LOGIN_ENABLED=false
```

## UI Impact

| Page | Layout before | Layout after |
|------|--------------|--------------|
| `/auth/sign-in` | AuthShell (single-col, gradient bg) | Own wrapper, two-col card, bg-muted |
| `/auth/sign-up` | AuthShell (gradient bg) | AuthShell (bg-muted) |
| `/auth/reset-password` | AuthShell (gradient bg) | AuthShell (bg-muted) |
| `/auth/verify-email` | AuthShell (gradient bg) | AuthShell (bg-muted) |
| `/auth/access-denied` | AuthShell (gradient bg) | AuthShell (bg-muted) |
| `/auth/unavailable` | AuthShell (gradient bg) | AuthShell (bg-muted) |

## Theme Parity

- `bg-muted` resolves correctly in light and dark themes (CSS variable)
- Image panel: `dark:brightness-[0.2] dark:grayscale` (shadcn example)
- Social buttons: `variant="outline"` inherits theme-aware border/text colours
- All Card and FieldGroup colours use theme tokens — no hardcoded colours introduced

## Responsiveness

- Sign-in: `md:grid-cols-2` collapses to single column on mobile; image panel `hidden md:block`
- Page wrapper: `p-6 md:p-10` provides safe breathing room on small screens
- Secondary pages: `max-w-md` single column, unchanged responsive behaviour

## Laravel Integration Impact

None. This is a pure UI refactor. No API calls, data contracts, or backend integration points change.

## Simplicity Assessment

- 3 source files modified, 2 env files updated, 0 new files created
- No new components, hooks, or abstractions introduced
- Social section is inline in `SignInForm` (not extracted) — KISS
- `AuthShell` API is unchanged — all 5 consumers get the new style with zero edits to their files

## Complexity Tracking

*No constitution violations — no entries required.*
