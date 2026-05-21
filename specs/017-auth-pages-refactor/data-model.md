# Data Model: Auth Pages Refactor — shadcn Template Alignment

**Feature**: `017-auth-pages-refactor`
**Date**: 2026-05-21

## Environment Variables

### New variable

| Variable | Type | Default | Location | Notes |
|----------|------|---------|----------|-------|
| `AUTH_SOCIAL_LOGIN_ENABLED` | `"true" \| "false"` | `"false"` | `.env`, `.env.example` | Server-side read only; controls social login section on sign-in page |

### Existing variables (unchanged)

| Variable | Current default | Purpose |
|----------|----------------|---------|
| `AUTH_SSO_ENABLED` | `false` | Keycloak SSO button — unaffected by this refactor |
| `AUTH_SIGNUP_ENABLED` | `true` | Sign-up page gate — unaffected by this refactor |

---

## Component Prop Contracts

### `AuthShell` (updated)

```ts
type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;   // kept for backward compat, may become unused
  className?: string;
};
```

**What changes**: Internal layout replaces custom gradient + grid-pattern background with the shadcn-aligned `bg-muted` page wrapper and plain `Card`. All existing consumers (sign-up, reset-password, verify-email, access-denied, unavailable) continue passing the same props.

---

### `SignInPage` (server component)

Reads env vars and derives props:

```ts
const ssoEnabled: boolean         = process.env.AUTH_SSO_ENABLED === "true"
const socialEnabled: boolean      = process.env.AUTH_SOCIAL_LOGIN_ENABLED === "true"
```

Renders sign-in page layout (no longer uses `AuthShell`) and passes `socialEnabled` to `SignInForm`.

---

### `SignInForm` (updated)

```ts
type SignInFormProps = {
  socialEnabled?: boolean;   // NEW — controls social login section visibility
};
```

All existing internal state, form logic, Zod schema, and redirect behaviour are unchanged.

---

### `SocialLoginSection` (new inline section — not extracted as separate file)

Rendered inside `SignInForm` when `socialEnabled === true`:

```ts
// Inline within SignInForm — no separate component file
// Contains:
//   <FieldSeparator>Lub kontynuuj przez</FieldSeparator>
//   <div className="grid grid-cols-3 gap-4">
//     <Button variant="outline" onClick={() => authClient.signIn.social({ provider: "apple", callbackURL })}> ... </Button>
//     <Button variant="outline" onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}> ... </Button>
//     <Button variant="outline" onClick={() => authClient.signIn.social({ provider: "meta", callbackURL })}> ... </Button>
//   </div>
```

---

## File Change Map

| File | Change type | Notes |
|------|------------|-------|
| `src/components/auth/auth-shell.tsx` | Update | Replace gradient/grid-pattern layout with bg-muted shadcn layout |
| `src/app/auth/sign-in/page.tsx` | Update | Drop AuthShell; add own page wrapper; read `AUTH_SOCIAL_LOGIN_ENABLED`; pass `socialEnabled` to SignInForm |
| `src/components/auth/sign-in-form.tsx` | Update | Accept `socialEnabled` prop; add two-column card wrapper; add social section conditional |
| `.env` | Update | Add `AUTH_SOCIAL_LOGIN_ENABLED=false` |
| `.env.example` | Update | Add `AUTH_SOCIAL_LOGIN_ENABLED=false` with comment |
| `src/app/auth/sign-up/page.tsx` | No change | AuthShell consumer — gets updated layout for free |
| `src/app/auth/reset-password/page.tsx` | No change | AuthShell consumer — gets updated layout for free |
| `src/app/auth/verify-email/page.tsx` | No change | AuthShell consumer — gets updated layout for free |
| `src/app/auth/access-denied/page.tsx` | No change | AuthShell consumer — gets updated layout for free |
| `src/app/auth/unavailable/page.tsx` | No change | AuthShell consumer — gets updated layout for free |

---

## UI Layout Model

### Sign-in page (two-column)

```
<main> [flex min-h-svh items-center justify-center bg-muted p-6 md:p-10]
  <div> [w-full max-w-sm md:max-w-4xl]
    <SignInForm socialEnabled={socialEnabled}>
      <Card> [overflow-hidden p-0]
        <CardContent> [grid p-0 md:grid-cols-2]
          <form> [p-6 md:p-8]
            FieldGroup
              heading + description
              Field[email/username]
              Field[password + forgot-password link]
              Field[submit button]
              [if socialEnabled]
                FieldSeparator "Lub kontynuuj przez"
                Field.grid-cols-3 [Apple | Google | Meta]
            FieldDescription "Nie masz konta? Utwórz konto"
          </form>
          <div> [relative hidden bg-muted md:block]
            <img src="/placeholder.svg" aria-hidden>
          </div>
        </CardContent>
      </Card>
      <FieldDescription> [TOS notice below card]
    </SignInForm>
  </div>
</main>
```

### Secondary auth pages (single-column via AuthShell)

```
<main> [flex min-h-svh items-center justify-center bg-muted px-4 py-10]
  <div> [w-full max-w-md]
    <Card> [border shadow]
      <CardHeader> ... title + description
      <CardContent> ... {children}
    </Card>
  </div>
</main>
```
