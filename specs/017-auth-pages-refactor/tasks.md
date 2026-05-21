# Tasks: Auth Pages Refactor — shadcn Template Alignment

**Input**: Design documents from `specs/017-auth-pages-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: None — constitution forbids automated test tasks.

**Organization**: Tasks grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: User story label — [US1], [US2], [US3]
- Exact file paths included in every implementation task

---

## Phase 1: Setup

**Purpose**: ENV configuration required before any story begins

- [x] T001 Add `AUTH_SOCIAL_LOGIN_ENABLED=false` to `.env`; add `AUTH_SOCIAL_LOGIN_ENABLED=false` with descriptive comment to `.env.example` — follow the style of existing `AUTH_SSO_ENABLED` entry

**Checkpoint**: ENV flag present with correct default — sign-in page can safely read it server-side

---

## Phase 2: User Story 1 — Sign-In Two-Column Layout (Priority: P1)

**Goal**: Replace the sign-in page's `AuthShell` usage with a bespoke page wrapper and give `SignInForm` the shadcn two-column card layout (form left, decorative image panel right). Background becomes `bg-muted`; gradient and grid-pattern are removed.

**Independent Validation**: Navigate to `/auth/sign-in`. On ≥ 768 px: centered card with form on left and image panel on right, `bg-muted` page background, no gradient or grid-pattern. On < 768 px: image panel hidden, form only.

### Implementation

- [x] T002 [P] [US1] Update `src/app/auth/sign-in/page.tsx` — remove `AuthShell` import and wrapper; replace with `<main className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">` + `<div className="w-full max-w-sm md:max-w-4xl">` wrapping `<SignInForm />`; keep existing `ssoEnabled` read and SSO section rendering unchanged; keep `redirectIfAuthenticated()` call
- [x] T003 [P] [US1] Update `src/components/auth/sign-in-form.tsx` — wrap the entire return in `<div className="flex flex-col gap-6">` → `<Card className="overflow-hidden p-0">` → `<CardContent className="grid p-0 md:grid-cols-2">`; left column is `<form className="p-6 md:p-8">` containing existing `FieldGroup` with all current fields unchanged; right column is `<div className="relative hidden bg-muted md:block"><img src="/placeholder.svg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale" /></div>`; add `<FieldDescription className="text-center">` "Nie masz konta?{' '}<Link href={buildSignUpHref(returnTo)}>Utwórz konto</Link>" inside the form after the submit button (replacing the existing `<p>` link); add `<FieldDescription className="px-6 text-center">` TOS notice "Kontynuując, akceptujesz nasze <a href="#">Warunki korzystania</a> i <a href="#">Politykę prywatności</a>." below the `Card` (outside it); add required imports: `Card`, `CardContent` from `@/components/ui/card` and `FieldDescription` from `@/components/ui/field`
- [x] T004 [US1] Visual verification: confirm `bg-muted` page background on `/auth/sign-in` in light and dark mode; confirm two-column layout at ≥ 768 px and single-column (image hidden) at < 768 px; confirm no gradient or grid-pattern CSS classes remain in rendered HTML; confirm existing form validation, error messages, and post-login redirect still work

**Checkpoint**: Sign-in page renders shadcn two-column layout — independently verifiable via browser

---

## Phase 3: User Story 2 — Social Login ENV Toggle (Priority: P2)

**Goal**: When `AUTH_SOCIAL_LOGIN_ENABLED=true`, the sign-in form shows a "Lub kontynuuj przez" divider and Apple / Google / Meta icon buttons. When `false` or absent, the section is invisible. The existing Keycloak SSO section is unaffected.

**Independent Validation**: Toggle `AUTH_SOCIAL_LOGIN_ENABLED` between `true` and `false` and restart dev server. `true` → divider + 3 buttons visible below submit button. `false` → section absent. SSO button (if `AUTH_SSO_ENABLED=true`) renders independently.

### Implementation

- [x] T005 [P] [US2] Update `src/app/auth/sign-in/page.tsx` — read `const socialEnabled = process.env.AUTH_SOCIAL_LOGIN_ENABLED === "true"` (alongside existing `ssoEnabled`); pass `socialEnabled={socialEnabled}` prop to `<SignInForm />`
- [x] T006 [P] [US2] Update `src/components/auth/sign-in-form.tsx` — add `socialEnabled?: boolean` to component props; inside the form `FieldGroup`, after the submit button `Field` and before the "Utwórz konto" `FieldDescription`, add: `{socialEnabled && (<><FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">Lub kontynuuj przez</FieldSeparator><Field className="grid grid-cols-3 gap-4"><Button variant="outline" type="button" onClick={() => void authClient.signIn.social({ provider: "apple", callbackURL: buildAuthSuccessHref(returnTo) })}><svg …Apple SVG…/><span className="sr-only">Zaloguj przez Apple</span></Button><Button variant="outline" type="button" onClick={() => void authClient.signIn.social({ provider: "google", callbackURL: buildAuthSuccessHref(returnTo) })}><svg …Google SVG…/><span className="sr-only">Zaloguj przez Google</span></Button><Button variant="outline" type="button" onClick={() => void authClient.signIn.social({ provider: "meta", callbackURL: buildAuthSuccessHref(returnTo) })}><svg …Meta SVG…/><span className="sr-only">Zaloguj przez Meta</span></Button></Field></>)}` — use the exact SVGs from the shadcn documentation example (Apple, Google, Meta inline paths); import `FieldSeparator` from `@/components/ui/field` (add to existing field import)
- [x] T007 [US2] Verify social login toggle: set `AUTH_SOCIAL_LOGIN_ENABLED=true` in `.env`, restart dev, confirm 3 social buttons visible; set to `false`, restart, confirm section absent; confirm `AUTH_SSO_ENABLED` Keycloak button is unaffected in both states; confirm social button click triggers `authClient.signIn.social()` call (browser network tab or console)

**Checkpoint**: Social login section toggled purely by ENV flag — independently verifiable

---

## Phase 4: User Story 3 — AuthShell Layout Update (Priority: P3)

**Goal**: All secondary auth pages (sign-up, reset-password, verify-email, access-denied, unavailable) drop the custom gradient + grid-pattern background and adopt the `bg-muted` layout. Zero changes to the page files themselves — only `AuthShell` is edited.

**Independent Validation**: Visit each of the 5 secondary auth pages. All show `bg-muted` background. No radial-gradient, no grid-pattern CSS, no `backdrop-blur` on the card. All form functionality unchanged.

**Note**: This phase is independent of Phases 2–3 and can be worked in parallel with them after Phase 1.

### Implementation

- [x] T008 [US3] Update `src/components/auth/auth-shell.tsx` — replace `<main>` className: remove `bg-[radial-gradient(...)]`, `bg-[linear-gradient(...)]`, `overflow-hidden`; set `className="flex min-h-svh flex-col items-center justify-center bg-muted px-4 py-10"`; remove the absolute inset grid-pattern `<div>` element entirely; remove `relative z-10` from the content wrapper `<div>`; set content wrapper to `<div className="w-full max-w-md">`; on `Card`: remove `backdrop-blur`, `shadow-primary/5`, `bg-background/95`; set `className="border border-border/60 shadow"`; on `CardHeader`: remove `border-b border-border/60 pb-5`; remove the app-name badge `<div>` (the `inline-flex ... text-primary uppercase` element); keep `CardTitle`, `CardDescription`, `CardContent`, and footer slot structure intact; keep all existing props (`title`, `description`, `children`, `footer`, `className`) with unchanged signatures
- [x] T009 [US3] Visual verification: visit `/auth/sign-up`, `/auth/reset-password`, `/auth/verify-email`, `/auth/access-denied`, `/auth/unavailable`; confirm `bg-muted` background in light and dark mode on each; confirm no gradient, grid-pattern, or backdrop-blur; confirm all form interactions and navigation links work as before; confirm page files themselves have not been edited

**Checkpoint**: All 5 secondary auth pages show updated layout — each independently verifiable

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Build validation, copy consistency, and final quality check across all modified files

- [x] T010 [P] Run `pnpm build` from repo root; resolve any TypeScript type errors introduced in `sign-in/page.tsx` or `sign-in-form.tsx` (e.g., `socialEnabled` prop type mismatch, missing imports, unused variables)
- [x] T011 [P] Run `pnpm lint` from repo root; fix any ESLint warnings in modified files (`auth-shell.tsx`, `sign-in/page.tsx`, `sign-in-form.tsx`)
- [x] T012 Review Polish copy across all modified areas: confirm TOS notice text ("Kontynuując, akceptujesz…") is natural Polish; confirm separator text ("Lub kontynuuj przez") reads naturally; confirm social button SR labels ("Zaloguj przez Apple/Google/Meta") are correct; confirm no English strings introduced anywhere in the auth layer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on Phase 1 (ENV in place before reading it)
- **Phase 3 (US2)**: Depends on Phase 2 (social section is inside the sign-in form two-column card)
- **Phase 4 (US3)**: Depends only on Phase 1 — **can run in parallel with Phases 2 and 3**
- **Phase 5 (Polish)**: Depends on all implementation phases completing

### User Story Dependencies

| Story | Depends on | Rationale |
|-------|-----------|-----------|
| US1 (sign-in layout) | Phase 1 | ENV vars in place |
| US2 (social login) | US1 | Social section lives inside the two-column form built in US1 |
| US3 (AuthShell) | Phase 1 | Fully independent of sign-in changes |

### Parallel Opportunities

**Within Phase 2**: T002 (`sign-in/page.tsx`) and T003 (`sign-in-form.tsx`) touch different files — run in parallel.

**Within Phase 3**: T005 (`sign-in/page.tsx`) and T006 (`sign-in-form.tsx`) touch different files — run in parallel.

**Across phases**: Phase 4 (US3 / AuthShell) can be started immediately after Phase 1 completes, while Phase 2 is still in progress.

**Within Phase 5**: T010 (`pnpm build`) and T011 (`pnpm lint`) are independent commands — run in parallel.

### Suggested MVP Scope

**Phase 1 + Phase 2 only** delivers a visually complete, fully functional sign-in page aligned with the shadcn template — the highest-value observable change. Phases 3 and 4 can follow incrementally.

---

## Notes

- T008 (AuthShell) is the highest-leverage task by file impact: one edit refreshes 5 pages simultaneously
- Social SVG icons must be copied verbatim from the shadcn documentation example — no icon library substitution
- `authClient.signIn.social()` may return a backend error if providers are not configured; this is expected and out of scope
- The existing `SsoButton` component and its `<form method="POST">` pattern are intentionally left unchanged
- All copy is Polish; the shadcn example's English strings ("Welcome back", "Or continue with") are adapted
