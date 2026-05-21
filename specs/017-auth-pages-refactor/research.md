# Research: Auth Pages Refactor — shadcn Template Alignment

**Feature**: `017-auth-pages-refactor`
**Date**: 2026-05-21

## Decisions

### 1. AuthShell Layout Strategy

**Decision**: Keep `AuthShell` for the 5 secondary pages (sign-up, reset-password, verify-email, access-denied, unavailable) and refactor only its internal styling. The sign-in page gets its own page-level wrapper + a two-column `SignInForm` card layout — consistent with how the shadcn example structures things and avoiding a prop-variant proliferation on `AuthShell`.

**Rationale**: Sign-in is structurally different (two-column grid, image panel, wider max-width, social section). Forcing a `twoColumn` prop onto `AuthShell` would make it do two very different things. Separate wrapper is simpler and more readable.

**Alternatives considered**: Adding `variant="wide"` prop to `AuthShell` — rejected because it adds conditional branching inside the shell for a single consumer.

---

### 2. Social Login Wiring

**Decision**: Social buttons call `authClient.signIn.social({ provider: "apple" | "google" | "meta", callbackURL })` inline in a client handler. No new form POST route needed.

**Rationale**: `genericOAuthClient()` is already registered on the auth client. The call is identical to the existing Keycloak SSO pattern but uses the `signIn.social()` API instead of a form POST (better-auth recommends `signIn.social` for generic OAuth).

**Alternatives considered**: Form POST to `/api/auth/sign-in/social` — rejected because `genericOAuthClient` exposes `signIn.social()` directly, matching the project's existing auth-client pattern.

---

### 3. ENV Variable Pattern

**Decision**: Single flag `AUTH_SOCIAL_LOGIN_ENABLED=false` added to `.env` and `.env.example`. Read server-side in `sign-in/page.tsx` and passed as `socialEnabled: boolean` prop into `SignInForm`.

**Rationale**: Follows the existing pattern (`AUTH_SSO_ENABLED`, `AUTH_SIGNUP_ENABLED`) exactly. One flag per feature gate, server-read, prop-drilled into the client component.

**Alternatives considered**: Per-provider flags (`AUTH_SOCIAL_GOOGLE_ENABLED` etc.) — rejected as premature. No providers are configured in the backend yet; a master toggle suffices for this refactor.

---

### 4. Image Panel

**Decision**: Use `<img src="/placeholder.svg" alt="" aria-hidden="true">` in the decorative panel. No `next/image` migration.

**Rationale**: Panel is purely decorative. `/placeholder.svg` is the Next.js default public asset. `next/image` optimization is not warranted for a placeholder with no real performance concern.

**Alternatives considered**: `next/image` with `fill` — overkill for a placeholder; deferred to a future asset-selection task.

---

### 5. Polish Copy for Social Buttons

**Decision**: Screen-reader labels use Polish: `"Zaloguj przez Apple"`, `"Zaloguj przez Google"`, `"Zaloguj przez Meta"`. The terms-of-service notice uses Polish text matching existing auth copy style.

**Rationale**: Constitution VII mandates Polish UI text without exception unless a feature requirement states otherwise.

---

### 6. `FieldSeparator` / `FieldDescription` Availability

**Decision**: Both components are already exported from `src/components/ui/field.tsx`. No new shadcn component installation required.

**Rationale**: Confirmed via `grep` — `FieldSeparator` at line 146, `FieldDescription` at line 131.

---

## Summary Table

| Unknown | Resolution |
|---------|------------|
| AuthShell layout strategy | Separate sign-in wrapper; update AuthShell styling only for secondary pages |
| Social login API | `authClient.signIn.social()` via `genericOAuthClient` |
| ENV var pattern | Single `AUTH_SOCIAL_LOGIN_ENABLED` flag, server-read, prop-drilled |
| Image panel | `<img>` with `/placeholder.svg`, `aria-hidden` |
| Polish copy | All SR labels and notices in Polish |
| FieldSeparator/FieldDescription | Already present, no install needed |
