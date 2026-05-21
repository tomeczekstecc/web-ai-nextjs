# Roles & Permissions

How role-based access control (RBAC) works in this app, and how to use it
in your own code. Keep this short — for the deeper model (Laravel
contract, role assignment lifecycle, mock mode) see `rbac-plan.md` §15
and `laravel-start-guide.md` §5.

---

## 1. Mental model

There are two kinds of authorization data:

- **Roles** — coarse labels for *what kind of user* this is.
  Closed set, three values: `User`, `Oper`, `Admin`. Defined in
  `src/lib/auth/principal.ts` as `APP_ROLES` (the literal union
  `AppRole` is derived from it).
- **Permissions** — fine-grained `domain:action` strings for
  *what this user is allowed to do*. Examples: `applications:read`,
  `tasks:write`, `admin:access`. The catalog lives in
  `ROLE_PERMISSIONS` in the same file.

**Permissions are derived from roles.** A user has every permission
listed under any role they hold. Granting `Admin` gives all of `User`'s
and `Oper`'s permissions plus the admin-only ones — that union is
computed once by `permissionsFor()` and lives on the `Principal`.

**Rule of thumb:** gate UI and business logic on **permissions**, not
roles. Roles are an internal grouping; permissions are the public
contract. If you ever rename a role, only one file changes.

---

## 2. The `Principal`

Everything in the auth system reduces to one object:

```ts
type Principal = {
  userId: string;
  email: string;
  displayName: string;
  roles: AppRole[];          // e.g. ["Admin"]
  permissions: string[];     // e.g. ["dashboard:read", "applications:read", ...]
};
```

It is built by `principalFromAppUser()` from a `LaravelAppUser` (the
shape Laravel returns from `GET /me`). Roles in the response are
normalized case-insensitively; permissions are computed locally from
the role catalog so an out-of-date Laravel deployment can't accidentally
grant something the frontend doesn't know about.

Once built, the `Principal` is the only object any gate looks at — on
both the server and the client. It is the swap point if we ever change
identity backends.

---

## 3. Using permissions in code

There are four places you check permissions. Pick the smallest one
that fits.

### 3.1 On a page or layout (server)

```tsx
// src/app/(app)/admin/layout.tsx
import { requireRole } from "@/lib/auth/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("Admin");
  return <>{children}</>;
}
```

`requireRole(...)` and `requirePermission(...)` are **hard gates**:

- No session → throws `unauthorized()` → renders `app/unauthorized.tsx`.
- Wrong role/permission → throws `forbidden()` → renders `app/forbidden.tsx`.

Both return the `Principal` when they succeed, so you can use it
immediately without a second lookup.

Multiple values + mode:

```ts
await requireRole(["Oper", "Admin"]);                          // any (default)
await requirePermission(["tasks:write", "admin:access"], "all"); // both required
```

### 3.2 On a server action

A page-level gate only protects **rendering**. The underlying server
action endpoint is reachable by anyone with a valid session cookie
unless the action itself re-checks. Always wrap mutations:

```ts
"use server";
import { withPermission } from "@/lib/auth/rbac";

export const archiveApplication = withPermission(
  "applications:write",
  async (principal, applicationId: string) => {
    // principal is already verified; safe to use principal.userId
    await api.archive(applicationId);
  },
);
```

The wrapper has the same call signature the UI sees
(`archiveApplication(id)`); the `Principal` is injected. **Never wrap
the call site in try/catch** — that swallows the redirect thrown by
`forbidden()` and fails open.

### 3.3 In client UI

To hide a button, region, or menu item from a user who can't act on
it:

```tsx
"use client";
import { PermissionGate } from "@/components/auth/role-gate";

<PermissionGate permissions="applications:write">
  <Button onClick={archive}>Archiwizuj</Button>
</PermissionGate>
```

Three components are available:

- `<PermissionGate permissions="...">` — silent (renders nothing on
  fail). Use for buttons, icons, menu items. **Prefer this.**
- `<RoleGate roles="...">` — same shape, matches roles. Reach for it
  only when there is no sensible permission to express the intent.
- `<AuthorizedView permissions="...">` — visible "no access" block on
  fail. Use for whole page regions.

All three accept a `mode="any" | "all"` prop and a `fallback` override.

### 3.4 When you need a boolean

For conditional className, prop, or if/else JSX:

```tsx
"use client";
import { usePrincipal } from "@/hooks/use-principal";

const { hasPermission, displayName } = usePrincipal();
const canWrite = hasPermission("applications:write");
```

`usePrincipal()` throws if no `<PrincipalProvider>` is mounted
above — that catches "I used this on a public page by mistake" bugs
early. On genuinely public pages (sign-in etc.) use
`useOptionalPrincipal()` instead, which returns `Principal | null`.

---

## 4. Defense in depth

This is the most important page in the doc. The layers stack like
this:

```
UI gate         (PermissionGate / RoleGate / AuthorizedView)
                    ↓ courtesy — hides controls
Page gate       (requireRole / requirePermission)
                    ↓ stops rendering
Action gate     (withRole / withPermission)
                    ↓ stops execution
Backend         (Laravel re-checks the permission on the actual call)
```

- **UI gates are not security.** Hiding a button does not prevent the
  server action it points at from being invoked with a forged form
  POST.
- **Page gates protect rendering, not execution.** They are great for
  routing UX but a server action lives at its own URL and is not
  covered by the page that imported it.
- **Action gates are the actual enforcement on this side.** Every
  privileged server action must use `withRole` / `withPermission`.
- **Laravel is the final authority.** Even if all the above are
  somehow bypassed, the backend re-checks the user's permissions on
  every mutation. If you find yourself relying *only* on the Laravel
  check, that's a smell — the Next-side gates exist so unauthorized
  requests never reach the network in the first place.

If you only have time for one layer, keep the **action gate**.

---

## 5. Under the hood

The full data flow from cookie to `Principal`:

```
HTTP request
   │
   ├─→ better-auth session cookie
   │      └─ auth.api.getSession({ headers })   (lib/auth.ts)
   │            └─ Postgres: auth_sessions / auth_users
   │
   ├─→ AuthIdentity { email, emailVerified, provider, ... }
   │      └─ getAuthIdentityFromSession()        (lib/auth/session.ts)
   │
   ├─→ Laravel GET /me  (or POST /auth/provision on first sight)
   │      └─ returns LaravelAppUser { id, email, roles[], orgs[], ... }
   │
   ├─→ Principal { userId, email, roles[], permissions[] }
   │      └─ principalFromAppUser()              (lib/auth/principal.ts)
   │            └─ permissions = union of ROLE_PERMISSIONS[role]
   │
   └─→ getCurrentPrincipal()                     (lib/auth/rbac.ts)
          └─ React.cache → single resolution per render pass
```

Three things to know:

1. **Memoization.** `getCurrentPrincipal()`, `getBetterAuthSession()`,
   and the access resolver are all wrapped with `React.cache`. A layout
   + page + nested layout that all gate against the same principal
   produce **one** session read and **one** Laravel `/me` call per
   request. Don't try to outsmart this with module-level caches.

2. **Permissions are computed locally.** Laravel sends roles;
   permissions are derived on the Next side via `ROLE_PERMISSIONS`.
   That's deliberate — the two sides have to agree on the permission
   catalog, but the *mapping* role→permissions lives in version-
   controlled code, not in a database. Adding a permission is a code
   change on both sides (see §6).

3. **Gates throw, they don't return false.** `requireRole` /
   `requirePermission` call Next's `forbidden()` / `unauthorized()`,
   which throw a special redirect-like value caught by Next's renderer.
   This is why **you must not wrap them in try/catch** — catching the
   throw turns a denied request into a successful one. If you want a
   boolean, use `getCurrentPrincipal()` directly and inspect
   `principal.permissions`.

The mock mode (`AUTH_SESSION_BYPASS=1`) short-circuits the whole flow
and returns a hard-coded `Principal` for the role named in
`AUTH_MOCK_ROLE`. See `laravel-start-guide.md` §7.1.

---

## 6. Adding a new permission

1. Add the string to `ROLE_PERMISSIONS` in
   `src/lib/auth/principal.ts`, under every role that should have it.
2. Mirror it in Laravel — see `laravel-start-guide.md` §5.2. Laravel
   is the source of truth for *who has which role*; the role→permission
   table on this side is the source of truth for *what each role can
   do*. The two together produce the principal's effective permissions.
3. If a menu item should depend on it, add `perms: { list: ["..."] }`
   to the entry in `src/mocks/data/menu.ts`.
4. Apply the new permission at the layers you care about — page gate,
   action gate, UI gate. **Always at least the action gate.**

You do **not** need a database migration. Roles are stored in Laravel,
permissions are derived in code.

---

## 7. Cheat-sheet

```ts
// SERVER — gates that throw
await requireRole("Admin");
await requirePermission("applications:write");
await requireRole(["Oper", "Admin"], "any");
const principal = await getCurrentPrincipal(); // returns Principal | null

// SERVER — wrap a server action
export const myAction = withPermission("tasks:write", async (p, x) => { … });

// CLIENT — wrap UI
<PermissionGate permissions="applications:write">…</PermissionGate>
<AuthorizedView permissions="admin:access">…</AuthorizedView>

// CLIENT — boolean
const { hasPermission, hasRole } = usePrincipal();
```

Files:

- `src/lib/auth/principal.ts` — `AppRole`, `Principal`,
  `ROLE_PERMISSIONS`, helpers (isomorphic)
- `src/lib/auth/rbac.ts` — server gates, `getCurrentPrincipal`
- `src/lib/auth/session.ts` — session/identity/access plumbing
- `src/components/auth/role-gate.tsx` — `<RoleGate>` /
  `<PermissionGate>`
- `src/components/auth/authorized-view.tsx` — `<AuthorizedView>`
- `src/components/auth/principal-provider.tsx` —
  `<PrincipalProvider>`, `usePrincipal`, `useOptionalPrincipal`

Related docs:

- `rbac-plan.md` §15 — role/permission interaction model and
  rollout history
- `laravel-start-guide.md` §5 — Laravel side of the role contract
