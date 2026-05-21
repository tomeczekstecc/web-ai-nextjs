# Quickstart: Auth Pages Refactor — shadcn Template Alignment

**Feature**: `017-auth-pages-refactor`

## How to verify the refactor locally

### 1. Start dev server

```bash
pnpm dev
```

### 2. Verify sign-in layout

Navigate to `http://localhost:3600/auth/sign-in`.

Expected:
- Page background is `bg-muted` (no gradient, no grid pattern)
- Centered card with form on left, decorative image panel on right (≥768 px)
- On mobile (< 768 px): only the form column is visible, no image panel
- Form behaves identically to before (validation, error messages, redirect after login)

### 3. Toggle social login

In `.env`, set:

```env
AUTH_SOCIAL_LOGIN_ENABLED=true
```

Restart the dev server (env vars are server-read at build/request time in Next.js server components):

```bash
pnpm dev
```

Navigate to `/auth/sign-in`. Expected:
- "Lub kontynuuj przez" divider appears below the submit button
- Three icon buttons (Apple, Google, Meta) render in a 3-column row
- Clicking a button initiates the OAuth flow (or returns a backend error if the provider is not configured — expected)

Set back to `false` and restart. Expected: social section disappears entirely.

### 4. Verify secondary auth pages

Check each page still renders correctly:

| URL | Expected |
|-----|---------|
| `/auth/sign-up` | Updated single-column card, bg-muted background |
| `/auth/reset-password` | Updated single-column card, bg-muted background |
| `/auth/verify-email` | Updated single-column card, bg-muted background |
| `/auth/access-denied` | Updated single-column card, bg-muted background |
| `/auth/unavailable` | Updated single-column card, bg-muted background |

None of these pages should show the gradient or grid-pattern background after the refactor.

### 5. Verify dark mode parity

Toggle dark mode (theme switcher or browser devtools). Expected:
- Sign-in image panel: `dark:brightness-[0.2] dark:grayscale` applies (as per shadcn example)
- All pages retain readable contrast in dark mode
- `bg-muted` resolves correctly in both themes

### 6. Verify SSO button is unaffected

With `AUTH_SSO_ENABLED=true`, navigate to `/auth/sign-in`. Expected:
- Keycloak SSO section still renders below the sign-in form
- SSO button is independent from the new social login section (they can coexist)

## Key files modified

```text
src/components/auth/auth-shell.tsx        ← new bg-muted layout
src/app/auth/sign-in/page.tsx             ← own wrapper, reads AUTH_SOCIAL_LOGIN_ENABLED
src/components/auth/sign-in-form.tsx      ← two-column card, socialEnabled prop
.env                                      ← AUTH_SOCIAL_LOGIN_ENABLED=false
.env.example                              ← AUTH_SOCIAL_LOGIN_ENABLED=false (with comment)
```
