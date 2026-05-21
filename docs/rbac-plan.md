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

## 15. How roles and permissions work together

> For a **task-oriented usage guide** (which API to call where, code
> examples, defense-in-depth checklist), see
> [`docs/permissions.md`](./permissions.md). This section is the
> design rationale and reference model.

Short answer: **roles are bundles of permissions**, and **permissions are
the actual gate keys**. The system is permission-first; roles exist as a
convenient label for a fixed set of permissions, plus an axis the menu
config likes to filter on.

### 15.1 Definitions (`src/lib/auth/principal.ts`)

```ts
APP_ROLES = ["User", "Oper", "Admin"] as const          // type + runtime catalog
type AppRole = "User" | "Oper" | "Admin"

ROLE_PERMISSIONS: Record<AppRole, readonly string[]> = {
  User:  ["dashboard:read", "applications:read"],
  Oper:  ["dashboard:read", "applications:read", "tasks:write"],
  Admin: ["dashboard:read", "applications:read", "tasks:write",
          "users:write", "admin:access"],
}
```

A few things to notice:

- **Role names are opaque labels.** `"Oper"` does nothing by itself; the
  only meaning it carries is the row in `ROLE_PERMISSIONS`.
- **Permissions are flat `domain:action` strings.** No hierarchy, no
  wildcards. The `:` separator is mandatory by convention.
- **The table is not strictly nested.** `Oper` happens to be a superset of
  `User`, and `Admin` a superset of `Oper`, but that's convention, not
  enforcement. A future `Auditor` role could carry just `["reports:read"]`
  without inheriting anything.

### 15.2 How a `Principal` is built

In `principalFromAppUser`:

```ts
const roles = (appUser.roles ?? [])
  .map(normalizeRole)
  .filter((r): r is AppRole => r !== null)        // drop unknown values

const permissions = new Set<string>()
for (const p of appUser.permissions ?? []) permissions.add(p)   // upstream perms
for (const p of permissionsFor(roles))      permissions.add(p)  // role-derived perms

return { ..., roles, permissions: [...permissions] }
```

Key behaviours:

1. **Roles arriving from Laravel are normalized case-insensitively.**
   `"ADMIN"`, `"admin"`, `"Admin"` all map to canonical `"Admin"`. Unknown
   values are dropped silently.
2. **`principal.permissions` is the union of two sources:**
   - Whatever the upstream sent in `appUser.permissions` (explicit, ad-hoc
     grants).
   - Whatever roles imply via `ROLE_PERMISSIONS`.
3. **Union, not "prefer one over the other".** Upstream can *add*
   permissions on top of role defaults; it cannot *revoke* role-derived
   ones at this layer. If you ever need revocation it must live in
   `ROLE_PERMISSIONS` or in a new deny-list column (none exists today).

After this step the principal's role list and permission list are already
consistent: the role list says which buckets the user is in, the permission
list is the expanded, deduped catalog of everything they can do.

### 15.3 Which axis to gate on

Every gate checks **either** roles **or** permissions, never both at once.
Pick the one that fits the question:

| Question                                            | Use         | Example                                |
| --------------------------------------------------- | ----------- | -------------------------------------- |
| "Is this user an admin?" (org / policy concept)     | role        | `requireRole("Admin")`                 |
| "Can this user perform action X?" (capability)      | permission  | `requirePermission("users:write")`     |

The mechanics are identical (`matchesSet(owned, required, mode)`); the
meaning differs:

- **Role checks couple call sites to the role catalog.** Adding or renaming
  a role means updating every call site that named the old role.
- **Permission checks decouple call sites from roles.** A new role just
  needs a new row in `ROLE_PERMISSIONS`. Existing
  `requirePermission("tasks:write")` call sites automatically grant the new
  role too, if its row includes `"tasks:write"`.

**Default to permissions in code.** Use roles only when the concept truly
is "membership in this group" (admin-only sidebar groups, audit trails,
panel-level visibility), not "ability to perform X". Same applies to
client gates: prefer `<PermissionGate>` over `<RoleGate>`.

### 15.4 Why the menu config uses both

`src/mocks/data/menu.ts` entries look like:

```ts
{
  key: "competitions",
  display: ["User", "Oper", "Admin"],                       // role gate
  perms:   { list: ["applications:read"], mode: "all" },    // permission gate
  submenu: [...],
}
```

Two filters apply in sequence (`src/lib/menu/filter.ts`):

1. **`display`** — case-sensitive role membership against `AppRole`. *Any*
   role in `display` matches.
2. **`perms`** — permission set with `mode: "all" | "any"` (default
   `"all"`).

Both must pass for the entry to show. They serve different jobs:

- **`display`** is a coarse audience filter ("show this section to
  operators and admins"). Mostly about UI clutter, not security.
- **`perms`** is the actual capability filter ("only show this if the user
  can read applications").

This double-gate is intentional: it lets the menu hide a whole branch from
a role even if upstream grants that role unusual extra permissions. But
**none of it is a security boundary** — the route behind every menu link
must guard itself with `requireRole` / `requirePermission`. Menu and route
gates are independent; either can be more permissive than the other
without leaking access, but both must agree for the UX to make sense.

The contract for menu `display` is typed as `readonly AppRole[]` in
`src/lib/api/domains/menu/contract.ts`, so a fixture that writes lowercase
`"user"` or `"admin"` fails at `tsc` rather than silently emptying the
sidebar. This is what bit us once already; the type lock is now the only
thing standing between us and that bug coming back.

### 15.5 Worked example

A user with upstream role `"oper"` and an ad-hoc grant `"reports:export"`
clicks "Bulk approve" on `/admin/applications`:

```
1. Build phase (server)
   appUser from Laravel: { roles: ["oper"], permissions: ["reports:export"] }
   principalFromAppUser:
     roles       = ["Oper"]                       // normalized
     permissions = {
       "dashboard:read", "applications:read", "tasks:write",   // ROLE_PERMISSIONS["Oper"]
       "reports:export",                                        // upstream
     }

2. Layout-level role gate
   (app)/admin/layout.tsx: await requireRole("Admin")
   → principal.roles=["Oper"], required=["Admin"]
   → matchesSet → false → forbidden() → renders (app)/forbidden.tsx
   Done. Never reaches step 3.

3. Hypothetical: same user on /tasks
   page-level: await requirePermission("tasks:write")
   → principal.permissions includes "tasks:write" → pass.
   Server action body runs.

4. Sidebar (client)
   filterFeatures(menu.features, principal.permissions, principal.roles)
   "Bulk admin tools" with perms.list=["admin:access"]:
     → lacks "admin:access" → hidden.
   "Reports" with perms.list=["reports:export"]:
     → has it (from upstream grant) → visible.
```

Three things this example shows:

- The role check at step 2 fails even though the user *could* hypothetically
  hold `admin:access` via an upstream grant — we asked for the role, not
  the capability. Choose the gate axis carefully.
- The permission check at step 4 succeeds for `"reports:export"` even
  though no `AppRole` row contains it — because the upstream union added
  it.
- The menu at step 4 made the right call without any access to the routes'
  actual gates. The gates remain authoritative.

### 15.6 Rules of thumb

- **Roles are policy. Permissions are capability.** Use the right one for
  the question being asked.
- **Permission strings are the contract.** They are referenced by route
  gates, server actions, route handlers, client gates, and the menu
  fixture. Treat them as a small DSL — pick a domain prefix (`users:*`,
  `tasks:*`, `admin:*`) and stick to it.
- **Never check `principal.roles.includes("Admin")` ad-hoc.** Always use
  `requireRole` / `requirePermission` / `<RoleGate>` / `<PermissionGate>`
  so call sites stay greppable and consistent. The same goes for raw
  `principal.permissions.includes(...)`.
- **A role can exist with zero permissions.** Useful for tagging users in
  a group with no extra capabilities (audit-only memberships, future
  plugin hooks). `permissionsFor([])` returns `[]`.
- **A permission can exist outside any role.** Upstream ad-hoc grants flow
  through as long as `/me` includes them. The principal carries them;
  gates accept them; `<PermissionGate>` shows them.
- **When extending:**
  1. Add the permission string (`"reports:export"`).
  2. Add it to the role row(s) that should have it in `ROLE_PERMISSIONS`.
  3. Write the gate against the permission, not the role.
  4. Add it to the menu fixture's `perms.list` if it has a UI entry.

That is the whole interaction. Roles are sugar over permissions;
permissions are the contract; principals carry both already reconciled;
gates pick the axis that matches the question.


## 16. Config integration

How RBAC plugs into config files (menu, wizard, future surfaces). The
menu is the worked reference; everything else either follows that pattern
or stays deliberately RBAC-neutral.

### 16.1 Menu config — integrated end-to-end

```
src/mocks/data/menu.ts        fixture: display + perms per entry
        │
src/lib/api/domains/menu/contract.ts
        display?: readonly AppRole[]                   ← compile-time lock on role names
        perms?:   { list: string[]; mode?: "all"|"any" }
        │ (TanStack Query)
src/hooks/menu/useMenuConfig.ts → menuConfigOptions()
        │
src/lib/menu/filter.ts
        filterFeatures(features, userPerms, userRoles)
        filterSettings(settings, userPerms, userRoles)
        - checkDisplay: any-of role match
        - checkPerms:   all/any permission match
        │
src/components/app-sidebar.tsx   ← visibleFeatures, visibleSettings
src/components/app-top-nav.tsx   ← same
        ▲
src/components/app-shell.tsx
        passes principal.roles + principal.permissions
        (NOT raw appUser.roles — those are pre-normalization)
```

Behaviour:

- A menu entry with `display: ["Admin"]` is hidden from `Oper` / `User`.
- An entry with `perms: { list: ["users:write"], mode: "all" }` is hidden
  from any principal whose permission set lacks that string.
- The contract is type-locked: a fixture that writes lowercase `"user"`
  fails `tsc` rather than silently emptying the sidebar (the bug that bit
  us once already).
- Submenu items have their own `perms?` and are filtered independently —
  a feature entry whose submenu is entirely filtered out is dropped.

**Caveat — menu filters are UX only.** They live in client components
reading the React context. The routes those entries point to (`/admin/*`,
`/tasks/*`, etc.) must each guard themselves with `requireRole` /
`requirePermission` in their layout or page. If a future menu fixture is
too permissive, the user just bounces to `(app)/forbidden.tsx`; if it's
too restrictive, the link is hidden but the URL still works for anyone
who types it in. The route gate is the source of truth.

### 16.2 Wizard / form config — NOT integrated (yet)

`src/lib/wizard/types.ts` `PageMapping` / `FieldMapping` carry
`display: boolean` and `required: boolean` flags, but no roles or
permissions. Per-field visibility cannot vary by role today.

When this is needed, the natural shape mirrors the menu:

```ts
type FieldMapping = {
  …
  display?: readonly AppRole[]                          // who sees the field at all
  perms?:   { list: string[]; mode?: "all" | "any" }   // who can edit / submit
}
```

…filtered server-side in the page-mapping endpoint, then re-checked in
the `withPermission(...)` wrapper on the save action. Not in scope yet,
but the primitives are ready to copy.

### 16.3 Other config — RBAC-neutral by design

| File                                           | Why no RBAC                                            |
| ---------------------------------------------- | ------------------------------------------------------ |
| `src/lib/config/app.ts`                        | Branding (app name). No access concept.                |
| `src/lib/menu/env.ts`                          | Sidebar vs top-menu — layout preference, not access.   |
| `src/lib/menu/icons.ts`                        | Icon registry. No access semantics.                    |
| `src/mocks/data/dashboard-*.ts`                | Fixture payloads gated by the **route** that serves   |
| `src/mocks/data/applications.ts`               | them (page-level `requirePermission`), not by the     |
| `src/mocks/data/account.ts`                    | fixture itself. Correct separation: data is data;     |
| `src/mocks/data/landing-page.ts`               | access lives one layer up.                            |
| `src/mocks/data/tasks-wizard.ts`               |                                                        |

### 16.4 What "RBAC-integrated" means in this repo

A config counts as RBAC-integrated when **all four** hold:

1. **Typed contract.** Role lists are `readonly AppRole[]` (not
   `string[]`), permission lists are `string[]` of `domain:action` shape.
   Drift fails at `tsc` instead of at runtime.
2. **Shared filter primitives.** The filter accepts `readonly AppRole[]`
   + `readonly string[]` and uses `matchesSet` / `toArray` from
   `principal.ts` for `"any" | "all"` semantics. Never re-implement —
   client and server must share the same logic.
3. **Normalized inputs.** The consumer feeds it `principal.roles` /
   `principal.permissions`, not the raw upstream `appUser.*` fields.
   Upstream values can be lowercase, mixed case, or contain unknown
   strings; the principal is already canonical.
4. **Server-side enforcement behind it.** Whatever the config gates in
   the UI is also gated by `requireRole` / `requirePermission` /
   `withRole` / `withPermission` on the corresponding route, action, or
   handler. The config filter is advisory.

Menu config ticks all four. Adding a new RBAC-integrated config (wizard
fields, dashboard widgets, data-table row actions, feature flags) is
roughly:

1. Add `display?: readonly AppRole[]` and/or `perms?: PermRule` to the
   contract type.
2. Write a tiny filter using `matchesSet` (or call
   `filterFeatures` / `filterSettings` if the shape matches the menu).
3. In the consumer component, pull `principal.roles` /
   `principal.permissions` from `usePrincipal()` (client) or from
   `getCurrentPrincipal()` (server) and pipe them through the filter.
4. Add `requireRole` / `requirePermission` on every server entry point
   the UI calls. This is the actual security boundary; the rest is UX.

Following the same primitives keeps the four layers — server gate,
client gate, menu filter, and any new config filter — interpreting the
exact same `AppRole` literals and `"domain:action"` strings, with no
risk of drift.

## 17. Worked trace — mocked Oper user enters `/admin`

End-to-end trace of the most common "forbidden" path, useful as the
canonical reference when debugging gate behaviour or onboarding a
reviewer. Setup assumed: `AUTH_SESSION_BYPASS_ENABLED=true`,
`AUTH_MOCK_ROLE=Oper`, `NODE_ENV=development`.

### 17.1 Proxy phase

Request hits `src/proxy.ts` (Next 16 successor to `middleware.ts`). The
proxy does exactly one thing:

```ts
requestHeaders.set("x-pathname", "/admin");
requestHeaders.set("x-url", "/admin");
return NextResponse.next({ request: { headers: requestHeaders } });
```

No auth check. The request flows on with two extra headers that
downstream server components read via `headers()`.

### 17.2 Root layout

`src/app/layout.tsx` runs — providers only (TanStack Query, MSW in dev).
Nothing auth-relevant. The `MSWProvider` defers **client** rendering
until the service worker is ready; server rendering is unaffected.

### 17.3 `(app)/layout.tsx` → `AppShell`

`AppShell` (`src/components/app-shell.tsx`) is a server component. It
first computes `returnTo` from the proxy-set headers:

```ts
const h = await headers();
const fromHeader = h.get("x-url") ?? h.get("x-pathname"); // "/admin"
const resolvedReturnTo = sanitizeReturnTo(fromHeader, "/"); // "/admin"
```

Then `requireAuthorizedAppSession("/admin")` runs
(`src/lib/auth/session.ts`). Because bypass is on:

- `isSessionBypassEnabled()` → `true` (dev + flag set).
- `getMockBypassSession()` returns a synthetic `AppSession` whose
  `appUser.roles = ["Oper"]` (from `AUTH_MOCK_ROLE`) and whose
  `appUser.permissions` come from `permissionsFor(["Oper"])` —
  `["dashboard:read", "applications:read", "tasks:write"]`.
- The mock branch **short-circuits**: no Better-Auth `getSession()`, no
  Laravel `/me`. The `React.cache` wrappers memoize this value for the
  rest of the render pass.

Back in `AppShell`:

```ts
const principal = principalFromAppUser(appSession.access.appUser);
// principal.roles       = ["Oper"]                          (normalized)
// principal.permissions = ["dashboard:read",
//                          "applications:read",
//                          "tasks:write"]                   (role-derived ∪ upstream)
```

`AppShell` returns the shell JSX wrapping
`<PrincipalProvider principal={principal}>`. All client descendants now
see the principal via context.

The user object passed into the sidebar deliberately uses
`principal.roles` (post-normalization), **not** `appUser.roles` (raw
upstream casing). This is the wiring that closed the
empty-sidebar-on-lowercase-role bug.

### 17.4 `(app)/admin/layout.tsx` runs — the stop point

```ts
export default async function AdminLayout({ children }) {
  await requireRole("Admin");
  return <>{children}</>;
}
```

Inside `requireRole("Admin")` (`src/lib/auth/rbac.ts`):

```ts
const required  = toArray("Admin");                    // ["Admin"]
const principal = await getCurrentPrincipal();          // React.cache HIT — same Principal as 17.3
if (!principal) unauthorized();                         // skipped — principal exists
if (!matchesSet(principal.roles, required, "any"))      // matchesSet(["Oper"], ["Admin"], "any") → false
  forbidden();
```

`forbidden()` (from `next/navigation`, enabled by
`experimental.authInterrupts` in `next.config.ts`) throws a **special
Next.js error**, not a regular JS exception:

- It **cannot** be caught by `try/catch`. Wrapping `requireRole` in
  try/catch fails open — Next intercepts the unwind regardless.
- It causes Next to walk up the segment tree looking for the nearest
  `forbidden.tsx`.
- The HTTP response becomes **403 Forbidden**.

`(app)/admin/page.tsx` **never runs**. Neither does anything it would
have rendered.

### 17.5 `forbidden.tsx` resolution

Next walks up from `(app)/admin/`:

- `src/app/(app)/admin/forbidden.tsx` — doesn't exist.
- `src/app/(app)/forbidden.tsx` — matches. Stops here.

That file is a server component **inside `(app)/layout.tsx`**, so the
AppShell chrome (sidebar + topnav, already rendered in 17.3) wraps it.
The user sees the in-shell 403 panel with a "Wróć do panelu" link to
`/dashboard` and, if `AUTH_SUPPORT_URL` is set, a support link.

The root-level `src/app/forbidden.tsx` is **not** used here — it's the
fallback for `forbidden()` thrown outside the `(app)` group (auth pages,
public marketing routes, etc.).

### 17.6 Sidebar contents during the same render

`AppSidebar` is a client component, but its props came from the server
render in 17.3 — `user.roles = ["Oper"]`,
`user.permissions = ["dashboard:read", "applications:read",
"tasks:write"]`. It runs `filterFeatures(menu.features, userPerms,
userRoles)`:

- Entries with `display: ["User", "Oper", "Admin"]` pass the role check.
- Entries with `perms.list: ["dashboard:read"]` or `["applications:read"]`
  pass.
- Entries with `perms.list: ["users:write"]` or `["admin:access"]` (the
  admin-only ones) fail and are hidden.

So an admin-only menu link to `/admin` should not be visible to an Oper
user in the first place. The 403 is the safety net for direct URLs,
bookmarks, or external links — i.e. someone bypassing the UI.

### 17.7 Net user-visible result

- HTTP status: **403 Forbidden**.
- Browser URL: unchanged at `/admin` (no redirect).
- Visible page: AppShell chrome (sidebar + topnav, populated for Oper)
  wrapping the in-shell 403 message with a "Wróć do panelu" button.
- DevTools Network: a normal SSR document response; no client `fetch` was
  involved in the gate.
- Console: clean. `forbidden()` is intended control flow, not a logged
  error.

### 17.8 Non-bypass mode diff

If `AUTH_SESSION_BYPASS_ENABLED=false` and the same Oper user came from
the real Laravel bridge:

- 17.3 makes a real `auth.api.getSession()` call (Better-Auth) plus a
  Laravel `/me` fetch instead of the synthetic short-circuit. Both are
  deduped by `React.cache` within the request and cached for 5 min via
  Better-Auth's signed-cookie `session.cookieCache`.
- `principalFromAppUser` normalizes whatever Laravel returns (so
  `"oper"` lowercase still becomes `"Oper"`) and unions upstream-granted
  permissions with role-derived ones.
- 17.4 – 17.7 are **identical**. The gate doesn't care whether the
  principal came from bypass or real auth — it only inspects
  `principal.roles`. That is the entire point of the single-resolver
  design.

### 17.9 Variations worth knowing

| Variation                                  | Result                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Same trace, `AUTH_MOCK_ROLE=Admin`         | 17.4 passes (`matchesSet(["Admin"], ["Admin"], "any") → true`). Page renders normally.       |
| Same trace, no session (bypass off, no Better-Auth session) | `requireAuthorizedAppSession` in 17.3 redirects to `/auth/sign-in?returnTo=/admin`. Layout 17.4 never runs.    |
| `requirePermission("admin:access")` swapped for `requireRole("Admin")` | Oper lacks `"admin:access"` → same 403 outcome via the permission axis. |
| Server action `withRole("Admin", deleteUser)` invoked by Oper | `forbidden()` throws before the action body runs, regardless of which page rendered the button. |
| `<RoleGate roles="Admin">` on a button rendered for Oper | Button is hidden client-side. **But** the server action behind it is still callable directly — the `withRole` wrapper is what actually protects it. |

The pattern holds for every privileged route: one `requireRole` /
`requirePermission` at the highest segment that needs gating, one
`<RoleGate>` / `<PermissionGate>` on the affordance that points to it,
and one `withRole` / `withPermission` on the action it triggers. Three
layers, one source of truth (`AppRole` + `domain:action` strings), zero
catchable interrupts.

## 18. Laravel bridge auth: JWT migration (Option B)

The original bridge to Laravel used a static shared secret
(`LARAVEL_INTERNAL_AUTH_TOKEN`) plus a **trusted** `X-Auth-Email` header.
That is a god-mode credential and a trust boundary by convention rather
than cryptography — see §15 of the deep review for the full risk list.

Phase B1 (Next.js side) introduces a parallel JWT-based path without
breaking the legacy flow. The mode is selected at runtime via
`AUTH_LARAVEL_BRIDGE_MODE` so both halves can ship independently.

### 18.1 What's in place after Phase B1

- `src/lib/auth.ts` registers the better-auth `jwt()` plugin with:
  - `issuer = BETTER_AUTH_URL`
  - `audience = AUTH_LARAVEL_BRIDGE_AUDIENCE || BETTER_AUTH_URL`
  - `expirationTime = "5m"` — every request mints a fresh token; combined
    with `React.cache` dedup, a single render reuses one token.
  - `definePayload = ({ user }) => ({ id, email, emailVerified, name })`
    — identity only. Roles and permissions stay in Laravel as the source
    of truth; the JWT only answers "who is the call on behalf of?".
  - `schema.jwks.fields` overrides keep column names snake_case to match
    the rest of our better-auth tables.
- `src/lib/auth/backend-token.ts` exposes
  `getBackendTokenForCurrentRequest()`: wraps `auth.api.getToken({ headers })`
  in `React.cache`. Returns `null` when there is no session (e.g. during
  sign-up before the session is established and Laravel-provisioning
  hasn't run yet). The JWT plugin's `getToken` endpoint is gated by
  `sessionMiddleware`, so you cannot mint a token for nobody.
- `src/lib/api/domains/auth-user/bridge-headers.ts` is the single
  switchpoint. `buildBridgeUserHeaders(identity)` returns either:
  - **`internal-token` mode** (default): legacy headers
    (`X-Auth-Email`, `X-Auth-Provider`, `X-Auth-Subject`,
    `X-Internal-Auth`).
  - **`jwt` mode**: `Authorization: Bearer <jwt>` plus `X-Internal-Auth`
    (kept transitionally for adjacent endpoints that haven't migrated).
- `src/lib/api/domains/auth-user/queries.ts` (`/me`) and
  `commands.ts` (`/auth/provision`) both call `buildBridgeUserHeaders` —
  one change-site flips the whole bridge.
- `src/env.ts` validates the new flags
  (`AUTH_LARAVEL_BRIDGE_MODE`, `AUTH_LARAVEL_BRIDGE_AUDIENCE?`).
- `.env` declares `AUTH_LARAVEL_BRIDGE_MODE=internal-token` explicitly so
  the active mode is greppable.
- `migrations/0001_better_auth_schema.sql` provisions every table
  Better-Auth needs given the current plugin set (core + username + jwt
  + organization), including the `jwks` table the JWT plugin reads from
  on first mint. See `migrations/README.md` for conventions. Run once
  against the auth database before flipping to `jwt` mode.

### 18.2 What Phase B1 does NOT change

- The legacy headers and `LARAVEL_INTERNAL_AUTH_TOKEN` still work
  unchanged. Today's deployment keeps running in `internal-token` mode.
- Laravel does not know about JWT yet. Phase B2 ships the verifier.
- Adjacent Laravel endpoints (mail bridge, session revoke) are out of
  scope here; they still rely on the legacy static token.
- `LARAVEL_INTERNAL_AUTH_TOKEN` stays a required env var because of
  those adjacent endpoints.

### 18.3 Phase B2 — Laravel side (PHP)

Reference implementation. Adjust namespacing to match the Laravel repo's
conventions.

**1. Install JWKS-aware JWT verifier.**

```bash
composer require firebase/php-jwt guzzlehttp/guzzle
```

**2. Middleware:**
`app/Http/Middleware/VerifyNextAuthJwt.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\Response;

class VerifyNextAuthJwt
{
    private const JWKS_CACHE_KEY = 'next_auth:jwks';
    private const JWKS_TTL_SECONDS = 3600;     // refresh hourly
    private const CLOCK_LEEWAY_SECONDS = 60;   // tolerate ±60s skew

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractBearer($request);
        if (! $token) {
            return response()->json(['error' => 'unauthorized'], 401);
        }

        try {
            JWT::$leeway = self::CLOCK_LEEWAY_SECONDS;
            $jwks = $this->getJwks();
            $payload = JWT::decode($token, JWK::parseKeySet($jwks));
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['error' => 'invalid_token'], 401);
        }

        $expectedIssuer = config('services.next_auth.issuer');
        $expectedAudience = config('services.next_auth.audience');

        if (($payload->iss ?? null) !== $expectedIssuer) {
            return response()->json(['error' => 'invalid_issuer'], 401);
        }
        if (! $this->audienceMatches($payload->aud ?? null, $expectedAudience)) {
            return response()->json(['error' => 'invalid_audience'], 401);
        }

        // Resolve the Laravel user from the verified `sub` claim. `sub` is the
        // better-auth user id; `email` is provided for convenience but is no
        // longer trusted on its own.
        $userId = $payload->sub ?? null;
        $email  = $payload->email ?? null;
        if (! $userId || ! $email) {
            return response()->json(['error' => 'invalid_claims'], 401);
        }

        $request->attributes->set('auth_user_id', $userId);
        $request->attributes->set('auth_user_email', $email);
        $request->attributes->set('auth_jwt_claims', (array) $payload);

        return $next($request);
    }

    private function extractBearer(Request $request): ?string
    {
        $header = $request->header('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return null;
        }
        return substr($header, 7) ?: null;
    }

    private function getJwks(): array
    {
        return Cache::remember(self::JWKS_CACHE_KEY, self::JWKS_TTL_SECONDS, function () {
            $url = config('services.next_auth.jwks_url');
            $response = Http::timeout(5)->get($url);
            if (! $response->successful()) {
                throw new \RuntimeException('Failed to fetch JWKS from ' . $url);
            }
            return $response->json();
        });
    }

    private function audienceMatches(mixed $tokenAudience, string $expected): bool
    {
        if (is_string($tokenAudience)) {
            return $tokenAudience === $expected;
        }
        if (is_array($tokenAudience)) {
            return in_array($expected, $tokenAudience, true);
        }
        return false;
    }
}
```

**3. Laravel config.** Add to `config/services.php`:

```php
'next_auth' => [
    'issuer'   => env('NEXT_AUTH_ISSUER'),    // e.g. https://app.example.com
    'audience' => env('NEXT_AUTH_AUDIENCE'),  // matches AUTH_LARAVEL_BRIDGE_AUDIENCE
    'jwks_url' => env('NEXT_AUTH_JWKS_URL'),  // e.g. https://app.example.com/api/auth/jwks
],
```

**4. Register and apply.** In `app/Http/Kernel.php` register the middleware
alias, then apply it to the `/me` and `/auth/provision` routes (and any
other endpoint that should switch to JWT).

**5. Smoke test.**

```bash
# From the Next.js side, with AUTH_LARAVEL_BRIDGE_MODE=jwt and a real
# session cookie:
curl https://laravel.example.com/me \
  -H "Authorization: Bearer $(jwt minted via /api/auth/token)"
```

Should resolve the user via `sub`, not via the trusted `X-Auth-Email`.

### 18.4 Cut-over checklist

1. **DB**: apply `migrations/0001_better_auth_schema.sql` against the
   auth database (idempotent — safe to re-run). Restart Next.js so the
   JWT plugin can initialise its key pair on first call. (Plugin
   generates the pair lazily on first `/api/auth/jwks` hit and writes
   it to the `jwks` table.)
2. **JWKS reachability**: curl `${BETTER_AUTH_URL}/api/auth/jwks` from
   wherever Laravel runs. Confirm a 200 with a `{ keys: [...] }` body.
   Pin Laravel's `NEXT_AUTH_JWKS_URL` to that URL.
3. **Laravel staging**: deploy the middleware, leave the route group
   off it initially. Manually verify a token decodes (use a fresh
   `/api/auth/token` call). Then enable the middleware on `/me` and
   `/auth/provision`.
4. **Flip mode in Next staging**: `AUTH_LARAVEL_BRIDGE_MODE=jwt`. Verify
   sign-in, session resolution, and provisioning. Watch for
   `invalid_token` / `invalid_issuer` / `invalid_audience` in Laravel
   logs.
5. **Promote to prod**: same flip in prod env vars. Keep the legacy
   token configured for adjacent endpoints.

### 18.5 Future work (Phase B3, deferred)

- Migrate the mail bridge and session-revoke endpoints to JWT auth.
- Drop `LARAVEL_INTERNAL_AUTH_TOKEN` from env entirely.
- Remove `internal-token` mode from `bridge-headers.ts`. The mode enum
  shrinks to a single value at that point — collapse it.
- Consider rotating JWKS keys on a schedule (the plugin supports
  `rotationInterval` + `gracePeriod`). Out of scope today because a 5-min
  TTL already bounds the blast radius.
- Move the legacy auth-tables migration (`auth_users`, etc.) into the
  same `migrations/` folder so the auth DB has a single canonical
  history. **Done in `0001_better_auth_schema.sql`.**

### 18.6 Risk register

| Risk                                                                | Mitigation                                                                                              |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Clock skew between Next host and Laravel host rejects valid tokens | `JWT::$leeway = 60` in middleware; matches the `jose` library default we use elsewhere.                |
| JWKS endpoint unreachable from Laravel network                      | Phase B2 step 2 validates this with curl before flipping the flag. Cache TTL avoids hammering on every request.      |
| Active session count balloons because every render mints a token   | `auth.api.getToken` reads the cached session (cookie cache + `React.cache`); minting is a key-store read, not a DB session insert. |
| Key rotation breaks in-flight tokens                                | 5-min TTL + 60s leeway means a rotation event has at most ~6 min where some clients see `invalid_token`. Add `rotationInterval`/`gracePeriod` if/when rotation is automated. |
| Mode flag set wrong in prod, falling back silently                  | `AUTH_LARAVEL_BRIDGE_MODE` is read in one place (`bridge-headers.ts`). Any unknown value falls back to `internal-token`, which is documented and intentional. Add a startup `console.warn` if you want louder feedback. |
| Trusted `X-Auth-Email` lingers because adjacent endpoints not migrated | Phase B3 explicitly closes this. Until then, `X-Internal-Auth` is still required for those endpoints; treat it as scoped, not god-mode. |
