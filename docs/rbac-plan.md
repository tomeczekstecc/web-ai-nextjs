# RBAC Plan — Better-Auth + Next.js `forbidden()` / `unauthorized()`

> **Status: implemented (mock layer).** See §13 for the actual file map that
> shipped. The original plan is preserved below as the design record.
> The real Better-Auth `organization` plugin / Keycloak swap is still pending
> and described in §10 steps 7–8.


---

## 1. Goal

Add a thin, server-first **RBAC layer** on top of the existing Better-Auth setup so that:

1. Pages and route handlers can refuse access using the Next.js 16 special
   files `unauthorized.tsx` (401) and `forbidden.tsx` (403), driven by the
   built-in `unauthorized()` / `forbidden()` calls.
2. Client components can render conditionally with `<RoleGate>` /
   `<PermissionGate>` helpers (LSI-style ergonomics: `mode="any" | "all"`).
3. Roles are configurable for now via `.env`, mocked with the three values
   **`User`, `Oper`, `Admin`**, ready to be wired to Better-Auth
   `organization` (and/or `admin`) plugin or to a Keycloak/OIDC claim later
   without touching call sites.

---

## 2. What already exists in this repo

| Piece                                            | Location                                                  | Notes |
|--------------------------------------------------|-----------------------------------------------------------|-------|
| Better-Auth server                               | `src/lib/auth.ts`                                         | `username()` + `genericOAuth()` (SSO/OIDC) plugins. No `organization`/`admin` plugin yet. |
| Better-Auth client                               | `src/lib/auth-client.ts`                                  | `usernameClient`, `genericOAuthClient`. |
| Server session resolver                          | `src/lib/auth/session.ts`                                 | `requireAuthorizedAppSession()` redirects to `/auth/sign-in` or `/auth/access-denied`. |
| Domain user (the real "principal")               | `src/lib/api/domains/auth-user/contract.ts`               | `LaravelAppUser { roles: string[]; permissions: string[]; ... }` already on the session. |
| Mock principal (already mocks roles+perms)       | `src/lib/api/domains/auth-user/mock.ts`                   | Hardcoded `["local-user"]` + 3 permissions. Good extension point. |
| Routes that need protection                      | `src/app/(app)/...`                                       | Currently only checks authentication via `(app)/layout.tsx` → `AppShell`. |
| Next special-files reference                     | `docs/routing-special-files.md`                           | Already documents `forbidden.{tsx}` / `unauthorized.{tsx}`. |
| `.env` flags                                     | `src/env.ts`                                              | Has `AUTH_SESSION_BYPASS_ENABLED`, `AUTH_LARAVEL_MOCK_ENABLED`. Add role flags here. |

**Takeaway:** the principal already carries `roles` and `permissions`. We are
not introducing a new identity — we are adding a **gate** + a **mock source**
for roles, and wiring two Next special files. This makes the future swap to
real Better-Auth `organization` roles / Keycloak `resource_access.<client>.roles`
a one-file change in the resolver.

---

## 3. Reference 1 — AZ (`nestjs-nextjs16-ba-trpc`)

What AZ does well, and what to adopt as-is:

- **Domain permission map** (typed constants): `lib/permissions.ts` exposes
  `DOMAIN_PERMISSIONS` and a `usePermissions()` hook with
  `hasPermission(perm)`. Permissions are domain-prefixed strings such as
  `komunikacja.read`, `porzadek.update`, `rozstrzygniecia.approve`,
  `admin.access`. Used across `components/communication`, `meetings`,
  `dashboard/sidebar`, etc.
- **Server session helper**: `lib/auth/get-session.ts` — cookie-forwarded
  fetch to `/api/auth/get-session`, `cache()`-wrapped.
- **Edge proxy/middleware role gate**: `proxy.ts`
  - Splits routes into `publicRoutes` and `adminRoutes` arrays.
  - Resolves session via fetch with forwarded cookies.
  - Redirects unauthenticated users to `/login?redirectTo=...&authStatus=awaiting`.
  - Redirects authenticated non-admin away from `/admin*` back to `/`.
  - Distinguishes auth-service **unavailable** (5xx) from **unauthenticated**
    (4xx/null) — only the second redirects to login.

What AZ misses and we will improve:

- **Does not use** `forbidden()` / `unauthorized()` — uses redirects only.
  We will keep the redirect for "not logged in at all" but use
  `unauthorized()` for stale/invalid sessions on protected segments, and
  `forbidden()` for role/permission denial. This is exactly what the Next 16
  special files are for, and it stops 403 pages from getting confused with
  the sign-in flow.
- **Only checks `role === "admin"`** in the proxy. We will key on role *sets*
  resolved from the session payload, not on a single string.

---

## 4. Reference 2 — LSI (`Lsi2021web_win`)

LSI uses Keycloak directly (`@react-keycloak/web`) and reads
`keycloak.tokenParsed.resource_access.LSI2021.roles`.

Components worth adopting (translated to TS + server-aware variants):

- **`HasRole`** (`src/components/common/authirization/HasRole.jsx`)
  Renders children if the user matches `mode = 'any' | 'all' | 'pass'`.
  Renders **nothing** on failure (good for menus/buttons).
- **`AuthorizedView`** — same as above but renders a *"Nie masz dostępu do
  tego zasobu."* fallback instead of nothing. Good for page-region guards.
- **`useRole(requiredArr, scope = 'all' | 'any')`** — hook variant.
- **`AuthorizedApp`** — top-level guard fetching `/uzytkownicy` and dispatching
  to Redux. Equivalent in our app: the `(app)/layout.tsx` server segment
  reading `requireAuthorizedAppSession()`.

What we keep from LSI:

- The three modes `any | all | pass` — they cover almost every menu/route case.
- A "view-level" fallback variant (renders an explanation) **and** a
  "silent" gate variant.
- A hook variant for imperative checks (button enabled-state, table column
  visibility).

What we drop:

- Redux dependency — our session is server-resolved and passed as props.
- Keycloak-specific token parsing — replaced by a single
  `getCurrentPrincipal()` resolver (see §6) so the source can swap from
  Laravel mock → Better-Auth organization → Keycloak claims with no UI churn.

---

## 5. Role model for the mock

`.env` additions (validated in `src/env.ts`):

```dotenv
# Comma-separated catalog of roles known to the app. Mocks for now.
AUTH_ROLES=User,Oper,Admin

# Which role the mock principal acts as in dev (must be a member of AUTH_ROLES).
# Used only when AUTH_SESSION_BYPASS_ENABLED=true or AUTH_LARAVEL_MOCK_ENABLED=true.
AUTH_MOCK_ROLE=Admin
```

Role semantics (initial proposal, refine when domain calls for it):

| Role  | Implicit permissions                                              |
|-------|-------------------------------------------------------------------|
| User  | `dashboard:read`, `applications:read`                             |
| Oper  | User + `applications:write`, `tasks:read`, `tasks:write`          |
| Admin | Oper + `admin:access`, `users:read`, `users:write`                |

A future Better-Auth `organization` setup maps these onto org-roles via the
plugin's Access Control statements:

```ts
// future, do NOT add yet
const ac = createAccessControl({
  applications: ["read", "write"],
  tasks: ["read", "write"],
  users: ["read", "write"],
  admin: ["access"],
});
const User  = ac.newRole({ applications: ["read"] });
const Oper  = ac.newRole({ applications: ["read", "write"], tasks: ["read", "write"] });
const Admin = ac.newRole({ ...Oper.statements, users: ["read", "write"], admin: ["access"] });
```

For Keycloak SSO the same `User/Oper/Admin` strings should live in
`resource_access.<clientId>.roles` so the resolver in §6 stays identical.

---

## 6. Single resolver: `getCurrentPrincipal()`

New file: `src/lib/auth/principal.ts` (server-only).

```ts
export type AppRole = "User" | "Oper" | "Admin";

export type Principal = {
  userId: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  permissions: string[]; // derived from roles, or from Laravel/KC claims
};

export const getCurrentPrincipal: () => Promise<Principal | null>;
```

Resolution order (matches existing patterns):

1. If `AUTH_SESSION_BYPASS_ENABLED=true` → build a mock principal from
   `AUTH_MOCK_ROLE` (extends `getMockBypassSession` in
   `src/lib/api/domains/auth-user/mock.ts`).
2. Else call `requireAuthorizedAppSession()`; lift `roles` /
   `permissions` from `access.appUser` (already populated by the Laravel
   bridge or its mock).
3. Later swap-in: if Better-Auth `organization`/`admin` plugin is enabled,
   read membership roles instead; if SSO, prefer
   `resource_access.<clientId>.roles` from the OAuth account.

All gates below depend **only** on this resolver — no other call site reads
`process.env.AUTH_*` for roles.

---

## 7. Server gates with `unauthorized()` / `forbidden()`

Enable the feature flag in `next.config.ts`:

```ts
experimental: { authInterrupts: true }
```

Add Next special files (root-level so they catch every segment; later move to
subfolders per route group if we want different chrome):

- `src/app/unauthorized.tsx` — 401 page. CTA: "Zaloguj się" linking to
  `/auth/sign-in?redirectTo=<currentPath>`.
- `src/app/forbidden.tsx` — 403 page. CTA: back to `/dashboard`, plus
  support contact (`AUTH_SUPPORT_LABEL`/`AUTH_SUPPORT_URL`).

Server helper: `src/lib/auth/rbac.ts`

```ts
import { forbidden, unauthorized } from "next/navigation";
import { getCurrentPrincipal } from "./principal";

type RoleCheck = { roles: AppRole[]; mode?: "any" | "all" };

export async function requireRole(check: RoleCheck) {
  const p = await getCurrentPrincipal();
  if (!p) unauthorized();
  const ok = (check.mode ?? "any") === "all"
    ? check.roles.every(r => p.roles.includes(r))
    : check.roles.some(r => p.roles.includes(r));
  if (!ok) forbidden();
  return p;
}

export async function requirePermission(perm: string | string[], mode: "any" | "all" = "any") {
  const p = await getCurrentPrincipal();
  if (!p) unauthorized();
  const list = Array.isArray(perm) ? perm : [perm];
  const ok = mode === "all"
    ? list.every(x => p.permissions.includes(x))
    : list.some(x => p.permissions.includes(x));
  if (!ok) forbidden();
  return p;
}
```

Usage in server components / route handlers:

```ts
// src/app/(app)/admin/layout.tsx
import { requireRole } from "@/lib/auth/rbac";
export default async function Layout({ children }: { children: React.ReactNode }) {
  await requireRole({ roles: ["Admin"] });
  return <>{children}</>;
}
```

Route handler example:

```ts
// src/app/api/admin/.../route.ts
import { requirePermission } from "@/lib/auth/rbac";
export async function POST(req: Request) {
  await requirePermission("users:write");
  // ...
}
```

> Behaviour:
> - No session at all → `unauthorized()` → `src/app/unauthorized.tsx` (HTTP 401).
> - Session OK but role/permission missing → `forbidden()` → `src/app/forbidden.tsx` (HTTP 403).
> - Stale/expired session is treated as missing.

Why this is better than AZ's pure-redirect middleware: it preserves the URL
the user landed on, surfaces the right HTTP status (useful for testing and
crawlers), and decouples 401 vs 403 UX.

---

## 8. Client gates (LSI-flavoured)

New files (no business code yet, just the API surface):

- `src/components/auth/role-gate.tsx` — silent gate (renders nothing on fail).
- `src/components/auth/authorized-view.tsx` — visible-fallback gate.
- `src/hooks/use-principal.ts` — client hook reading the principal exposed
  via a `PrincipalProvider` set up once in `(app)/layout.tsx`.

```tsx
// silent — for buttons, menu items
<RoleGate roles={["Admin"]}>
  <Button>...</Button>
</RoleGate>

// visible fallback — for page regions
<AuthorizedView roles={["Oper", "Admin"]} mode="any">
  <SectionEditor />
</AuthorizedView>

// permission variants
<PermissionGate permissions={["users:write"]}>
  <DeleteButton />
</PermissionGate>
```

Hook ergonomics (AZ + LSI hybrid):

```ts
const { hasRole, hasAllRoles, hasPermission, principal } = usePrincipal();
const canEdit = hasPermission("applications:write");
```

The provider is fed the principal computed once on the server in
`(app)/layout.tsx`, so no client fetch is required.

---

## 9. Middleware adjustments (optional, AZ-style)

Keep AZ's idea of an edge gate **only** for two things:

1. Redirect unauthenticated users on cold navigation to `/auth/sign-in`
   (faster than going through SSR + `unauthorized()` for the common case).
2. Gracefully handle auth backend **unavailable** (5xx) — show
   `/auth/unavailable` instead of an error boundary.

All actual role checks stay in the segment with `requireRole` /
`requirePermission`. The middleware does **not** know about roles — that
keeps the matcher small and avoids a second source of truth.

---

## 10. Migration sketch (when this plan is approved)

Suggested ordering, each step independently shippable:

1. **Env + types**
   - Add `AUTH_ROLES`, `AUTH_MOCK_ROLE` to `.env`, `src/env.ts`.
   - Define `AppRole` type from the `AUTH_ROLES` literal union.
2. **Principal resolver** (`src/lib/auth/principal.ts`)
   - Extend `mock.ts` to honour `AUTH_MOCK_ROLE` and derive permissions
     from the role table in §5.
3. **`forbidden.tsx` / `unauthorized.tsx`** at `src/app/`, plus
   `experimental.authInterrupts = true` in `next.config.ts`.
4. **`src/lib/auth/rbac.ts`** with `requireRole` / `requirePermission`.
5. **Client gates** under `src/components/auth/` + `usePrincipal` hook.
6. **Apply gates** to existing protected segments:
   - `(app)/admin/*` → `requireRole({ roles: ["Admin"] })`
   - Sidebar entries → wrap with `<RoleGate>` (mirrors LSI's `<HasRole>`).
7. **Better-Auth `organization` plugin** (separate spec). Until then,
   `getCurrentPrincipal` keeps reading from `LaravelAppUser`. The swap is
   confined to the resolver and the server `auth.ts` plugin list.
8. **Keycloak swap** (separate spec). `genericOAuth` is already wired;
   the only change is to map `resource_access.<clientId>.roles` →
   `Principal.roles` inside `getCurrentPrincipal`.

---

## 11. Open questions

- Should `User/Oper/Admin` be **org-scoped** (Better-Auth `organization`
  plugin, allows per-org role) or **global** (Better-Auth `admin` plugin)?
  Current Laravel-backed app is effectively single-org per user, so global
  is simpler today; orgs become valuable once multi-tenant is required.
- Permissions naming: AZ uses `domain.action` (dot), the current mock uses
  `domain:action` (colon). Pick one before §4–§5 land. Suggested: keep
  colon — it matches the existing mock and shadcn/ui examples.
- Do we want a `<RoleGate mode="pass">` escape hatch (LSI has it)? Useful
  for storybook/staging toggles but a foot-gun in production.
- For 401, do we prefer `unauthorized()` (renders the special file) or a
  middleware redirect to `/auth/sign-in`? Plan above uses **both**:
  middleware on cold navigation, `unauthorized()` on stale sessions inside
  segments.

---

## 12. File map (planned, not created yet)

```
src/
  env.ts                         # add AUTH_ROLES, AUTH_MOCK_ROLE
  app/
    unauthorized.tsx             # NEW — Next 16 special file (401)
    forbidden.tsx                # NEW — Next 16 special file (403)
  lib/auth/
    principal.ts                 # NEW — getCurrentPrincipal()
    rbac.ts                      # NEW — requireRole / requirePermission
  lib/api/domains/auth-user/
    mock.ts                      # EXTEND — honour AUTH_MOCK_ROLE
  components/auth/
    role-gate.tsx                # NEW — silent gate
    authorized-view.tsx          # NEW — visible-fallback gate
    permission-gate.tsx          # NEW
    principal-provider.tsx       # NEW — SSR-fed context
  hooks/
    use-principal.ts             # NEW — client hook (hasRole/hasPermission)
next.config.ts                   # experimental.authInterrupts = true
.env / .env.example              # AUTH_ROLES, AUTH_MOCK_ROLE
```

No code changes have been made by this document.

---

## 13. What actually shipped

Files added:

```
src/lib/auth/principal.ts                 # AppRole, ROLE_PERMISSIONS, principalFromAppUser
src/lib/auth/rbac.ts                      # getCurrentPrincipal, requireRole, requirePermission
src/components/auth/principal-provider.tsx# PrincipalProvider + usePrincipal/useOptionalPrincipal
src/components/auth/role-gate.tsx         # <RoleGate>, <PermissionGate>  (silent)
src/components/auth/authorized-view.tsx   # <AuthorizedView>              (visible fallback)
src/hooks/use-principal.ts                # re-export of usePrincipal
src/app/unauthorized.tsx                  # Next 16 special file (HTTP 401)
src/app/forbidden.tsx                     # Next 16 special file (HTTP 403)
src/app/(app)/admin/layout.tsx            # requireRole("Admin") example
src/app/(app)/admin/page.tsx              # showcase of the resolved principal
```

Files edited:

```
next.config.ts                            # experimental.authInterrupts = true
src/env.ts                                # AUTH_ROLES, AUTH_MOCK_ROLE
.env                                      # AUTH_ROLES=User,Oper,Admin; AUTH_MOCK_ROLE=Admin
src/lib/api/domains/auth-user/mock.ts     # mock role from AUTH_MOCK_ROLE + derived perms
src/components/app-shell.tsx              # wrap children in <PrincipalProvider>
```

Notes vs. original plan:

- **AC class not pulled in yet** — still mock principal from `LaravelAppUser`.
  See chat thread for the AC adoption path; swap happens entirely inside
  `getCurrentPrincipal()` in `rbac.ts` and the plugin list in `auth.ts`.
- **SSO/Keycloak dropped entirely.** The `genericOAuth` plugin and
  `SSO_PROVIDER_ID` are gone from `src/lib/auth.ts`; `AUTH_SSO_*` env vars and
  `src/components/auth/sso-button.tsx` were removed; `AuthProvider` collapsed
  to `"password"`. Authentication is now Better-Auth only:
  - email + password (`emailAndPassword`)
  - username + password (`username()` plugin)
  - native social providers via Better-Auth's `socialProviders` config
    (Google / Apple / Facebook). A provider is registered only when both its
    `*_CLIENT_ID` and `*_CLIENT_SECRET` are set; the sign-in page reads
    `enabledSocialProviders` (exported from `src/lib/auth.ts`) and only
    renders buttons for those.
  - `AUTH_SOCIAL_LOGIN_ENABLED` remains as the master UI toggle.
  Migration path to org-roles / runtime role provisioning still lives in
  Better-Auth's `organization` plugin (see §10 step 7).
- **Middleware not added.** Cold-nav redirects already happen inside
  `requireAuthorizedAppSession()` (used by `AppShell`); the AZ-style edge
  gate stays out of the tree until there is a real reason to add it.
- **Perf + UX follow-ups (H1, H2, M1) applied:**
  - `getBetterAuthSession` and `getCurrentPrincipal` are now wrapped in
    `React.cache`; a new `getAccessForCurrentRequest` memo dedupes the
    full `session → Laravel /me` resolution so a layout + nested layout +
    page stack triggers one fetch instead of three.
  - `betterAuth({ session.cookieCache: { enabled: true, maxAge: 300 } })`
    skips the DB session read for 5 minutes after the cookie is issued.
    Combined with `React.cache`, steady-state auth cost per render is
    typically zero DB hits.
  - Removed dead `AUTH_ROLES` env var from `src/env.ts` and `.env` — the
    `AppRole` literal union in `principal.ts` is the single source of truth.
  - Added `src/app/(app)/forbidden.tsx`: in-app 403 that keeps the AppShell
    chrome (sidebar/topnav). The root `src/app/forbidden.tsx` still handles
    `forbidden()` thrown outside the app shell. No in-app `unauthorized.tsx`
    is needed: `AppShell`'s `requireAuthorizedAppSession()` redirects to
    sign-in before any `(app)/*` child layout would reach `unauthorized()`.

- **Critical hardening pass (C1–C4) applied:**
  - `isSessionBypassEnabled()` and `isLaravelAuthMockEnabled()` hard-return
    `false` when `NODE_ENV=production`; `src/env.ts` additionally throws at
    boot if either flag is `"true"` in a prod build (`SKIP_ENV_VALIDATION=1`
    still bypasses for lint/typegen).
  - `.env` defaults flipped: `AUTH_LARAVEL_MOCK_ENABLED=false` (was `true`).
    Local dev needs to opt-in per developer.
  - `principalFromAppUser` now normalizes role casing via `normalizeRole`
    (case-insensitive Laravel → canonical `AppRole`) and **unions**
    upstream permissions with role-derived perms instead of preferring one
    over the other.
  - Added `withRole` / `withPermission` server-action wrappers in `rbac.ts`.
    `context/coding-standards.md` now documents that all privileged server
    actions and route handlers must call `requireRole` / `requirePermission`
    or be wrapped by `withRole` / `withPermission`, and never inside a
    `try/catch`.
- **Permission separator:** stayed on `:` (`domain:action`), matching the
  pre-existing mock.
- **Mock smoke test:** set `AUTH_SESSION_BYPASS_ENABLED=true` and toggle
  `AUTH_MOCK_ROLE=User|Oper|Admin` to see `/admin` flip between 403 and
  rendering. With no session, `/admin` renders `src/app/unauthorized.tsx`.

## 14. Known limitations

- **Layouts do not re-run on intra-segment client navigation.** A user with
  `/admin` open who is demoted mid-session can keep navigating between
  `/admin/foo` and `/admin/bar` via `<Link>` until either a server action /
  fetch errors or a hard reload triggers the layout's `requireRole` again.
  Mitigations when this matters:
  - `revalidatePath('/admin', 'layout')` from the action that demotes the
    user (broadcasts to that user's open tabs on next nav).
  - Page-level `requireRole` on the sensitive page in addition to the
    layout, so each navigation re-checks.
  - The 5-minute `session.cookieCache` means a forced logout still takes
    effect within ~5 min worst case.
- **No edge auth gate.** `src/proxy.ts` (Next 16 successor to
  `middleware.ts`, Node.js runtime) only propagates `x-pathname` /
  `x-url`; it does not run a Better-Auth session check. All enforcement is
  per-route via `requireRole` / `requirePermission` / `withRole` /
  `withPermission`. Add an optimistic `getSessionCookie` 401 here only when
  a real `/api/admin/*` surface exists.
- **`forbidden()` / `unauthorized()` rely on `experimental.authInterrupts`.**
  Pin the Next minor in CI; never wrap a gate call in `try/catch` (it would
  swallow the interrupt and fail open).
