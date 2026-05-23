# RBAC Pattern

Role-based access control in this app is split across **four independent layers**.
Each layer has a single job; none replaces the others.

> For the full design record and worked end-to-end traces see
> `docs/rbac-plan.md`. For a cheat-sheet of every API see
> `docs/permissions.md`.

---

## 1. The four layers

```
┌─────────────────────────────────────────────────────────────────┐
│  1. SERVER GATE        requireRole / requirePermission          │
│     src/lib/auth/rbac.ts                                        │
│     → throws forbidden() / unauthorized() — cannot be bypassed  │
│     → used in: layout.tsx, page.tsx, route handlers            │
├─────────────────────────────────────────────────────────────────┤
│  2. ACTION GATE        withRole / withPermission                │
│     src/lib/auth/rbac.ts                                        │
│     → wraps every privileged server action                      │
│     → runs before any code in the action body                   │
├─────────────────────────────────────────────────────────────────┤
│  3. MENU FILTER        filterFeatures / filterSettings          │
│     src/lib/menu/filter.ts                                      │
│     → hides nav entries from users who cannot reach them        │
│     → driven by MenuConfig.display + MenuConfig.perms           │
├─────────────────────────────────────────────────────────────────┤
│  4. UI GATE            <RoleGate> / <PermissionGate>            │
│     src/components/auth/role-gate.tsx                           │
│     + <AuthorizedView>  src/components/auth/authorized-view.tsx │
│     → client-only UX: hides buttons, panels, page regions       │
│     → UX only — not a security boundary                         │
└─────────────────────────────────────────────────────────────────┘
```

**If you only add one layer, add the action gate (`withRole` / `withPermission`).**
It is the only layer that stops execution of a privileged operation.

---

## 2. Roles and permissions

```ts
// src/lib/auth/principal.ts — single source of truth
export const APP_ROLES = ["User", "Oper", "Admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const ROLE_PERMISSIONS: Record<AppRole, readonly string[]> = {
  User:  ["dashboard:read", "applications:read"],
  Oper:  ["dashboard:read", "applications:read", "applications:write",
          "tasks:read", "tasks:write"],
  Admin: ["dashboard:read", "applications:read", "applications:write",
          "tasks:read", "tasks:write", "users:read", "users:write",
          "admin:access"],
};
```

**Rule of thumb:** gate code on **permissions** (`domain:action`), not role
names. Roles are a grouping label; permissions are the public contract.
Prefer `requirePermission("users:write")` over `requireRole("Admin")`.

Use roles only when the concept is truly "membership in this group" —
e.g. a page that belongs to administrators conceptually and not just
capability-wise.

---

## 3. Layer 1 — Server gate (page / layout / route handler)

```ts
// src/app/(app)/admin/layout.tsx
import { requireRole } from "@/lib/auth/rbac";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("Admin");              // ← 403 for Oper/User, 401 if no session
  return <>{children}</>;
}
```

```ts
// src/app/(app)/tasks/page.tsx
import { requirePermission } from "@/lib/auth/rbac";

export default async function TasksPage() {
  const principal = await requirePermission("tasks:read");
  // principal is typed as Principal — use it directly
  return <TaskList userId={principal.userId} />;
}
```

Multiple roles or permissions:

```ts
await requireRole(["Oper", "Admin"]);                            // any (default)
await requirePermission(["tasks:write", "admin:access"], "all"); // both required
```

**Never wrap these in try/catch.** They throw a special Next interrupt
(`forbidden()` / `unauthorized()`) that the framework catches. Wrapping it
silently fails open — the user gets access instead of a 403.

---

## 4. Layer 2 — Action gate (server actions)

Page-level `requireRole` only protects rendering. The action endpoint is
reachable by any authenticated user who calls it directly. Always wrap
privileged server actions:

```ts
// src/lib/api/domains/tasks/commands.ts
"use server";
import { withPermission, withRole } from "@/lib/auth/rbac";

// permission-based (preferred)
export const archiveTask = withPermission(
  "tasks:write",
  async (principal, taskId: string) => {
    // principal is verified; principal.userId is safe to trust
    await api.tasks.archive(taskId, principal.userId);
  },
);

// role-based (use only when the concept is truly role-level)
export const deleteUser = withRole(
  "Admin",
  async (principal, userId: string) => {
    await api.users.delete(userId);
  },
);
```

Call sites look normal — the wrapper is transparent to the caller:

```ts
await archiveTask(taskId);  // principal injected automatically
```

---

## 5. Layer 3 — Menu filter

Menu entries in `src/mocks/data/menu.ts` (or the real backend) carry:

```ts
{
  key: "admin-tools",
  label: "Narzędzia admina",
  icon: "Settings",
  to: "/admin",
  display: ["Admin"],                                    // role filter (any-of)
  perms: { list: ["admin:access"], mode: "all" },       // permission filter
}
```

Both filters must pass for the entry to appear. They run in
`src/lib/menu/filter.ts` via `filterFeatures()` / `filterSettings()`,
called inside `AppSidebar` and `AppTopNav`.

- **`display`** — coarse audience: who sees this section. Any-of match.
  Type-locked to `readonly AppRole[]` — lowercase `"admin"` fails at `tsc`.
- **`perms`** — capability gate: does the user have the required permission(s)?
  `mode: "all"` (default) requires all; `mode: "any"` requires one.

```ts
// src/lib/menu/filter.ts — what runs under the hood
function checkDisplay(display, userRoles)  // any-of role match
function checkPerms(perms, userPerms)      // all/any permission match

filterFeatures(features, principal.permissions, principal.roles)
filterSettings(settings, principal.permissions, principal.roles)
```

**This is UX only.** The route behind each menu entry guards itself with
`requireRole` / `requirePermission`. A menu filter that is too permissive
means the user bounces to `(app)/forbidden.tsx`; too restrictive means the
link is just hidden but the URL works.

---

## 6. Layer 4 — Client UI gates

### `<RoleGate>` / `<PermissionGate>` — silent (null on failure)

Use for **buttons, icons, menu items, badges** — anything that should
simply not exist for an unauthorized user.

```tsx
// src/components/auth/role-gate.tsx
import { PermissionGate, RoleGate } from "@/components/auth/role-gate";

// preferred — permission-based
<PermissionGate permissions="applications:write">
  <Button onClick={archive}>Archiwizuj</Button>
</PermissionGate>

// role-based (only when concept is truly role-level)
<RoleGate roles="Admin">
  <AdminBadge />
</RoleGate>

// multiple — "any" mode (default)
<PermissionGate permissions={["tasks:write", "applications:write"]}>
  <BulkActionButton />
</PermissionGate>

// multiple — "all" mode
<PermissionGate permissions={["users:read", "users:write"]} mode="all">
  <UserEditor />
</PermissionGate>

// custom fallback
<RoleGate roles="Oper" fallback={<span>Tylko dla operatorów</span>}>
  <OperatorPanel />
</RoleGate>
```

### `<AuthorizedView>` — visible fallback for page regions

Use for **sections, panels, whole blocks of content** where the user
should understand *why* the content is not shown.

```tsx
// src/components/auth/authorized-view.tsx
import { AuthorizedView } from "@/components/auth/authorized-view";

// defaults to: "Nie masz dostępu do tego zasobu." in a dashed box
<AuthorizedView permissions="admin:access">
  <AdminPanel />
</AuthorizedView>

// role-based (panel belongs conceptually to admins)
<AuthorizedView roles="Admin">
  <SystemSettings />
</AuthorizedView>

// custom fallback
<AuthorizedView
  roles={["Oper", "Admin"]}
  fallback={<UpgradeCTA />}
>
  <AdvancedReports />
</AuthorizedView>
```

**Dev-only foot-gun warning:** `<AuthorizedView>` without `roles` or
`permissions` renders its children unconditionally and logs a `console.warn`.

---

## 7. Boolean check in components

When you need a conditional className, disabled prop, or if/else branch:

```tsx
"use client";
import { usePrincipal } from "@/components/auth/principal-provider";

function TaskRow({ task }: { task: Task }) {
  const { hasPermission, hasRole, displayName } = usePrincipal();

  const canEdit    = hasPermission("tasks:write");
  const isAdmin    = hasRole("Admin");

  return (
    <tr>
      <td>{task.name}</td>
      <td>
        {canEdit && <Button onClick={() => edit(task.id)}>Edytuj</Button>}
        {isAdmin && <Button variant="destructive">Usuń</Button>}
      </td>
    </tr>
  );
}
```

`usePrincipal()` throws if no `<PrincipalProvider>` is mounted above —
it catches "used on a public page" bugs early. On genuinely public pages
use `useOptionalPrincipal()` which returns `Principal | null`.

---

## 8. Decision table — which gate to use

| Scenario | Layer | API |
|---|---|---|
| Layout or page blocked for a role | Server gate | `requireRole("Admin")` |
| Page blocked for a permission | Server gate | `requirePermission("tasks:read")` |
| Server action blocked | Action gate | `withPermission("tasks:write", async (p, …) => …)` |
| Menu entry hidden | Menu filter | `display: ["Admin"]` or `perms: { list: ["admin:access"] }` |
| Button hidden | UI gate (silent) | `<PermissionGate permissions="tasks:write">` |
| Section hidden with message | UI gate (visible) | `<AuthorizedView permissions="admin:access">` |
| Conditional prop / className | Hook | `usePrincipal().hasPermission("tasks:write")` |

---

## 9. PrincipalProvider wiring

The client gates and `usePrincipal()` all read from `<PrincipalProvider>`.
It is mounted once in `src/components/app-shell.tsx` and fed the
server-resolved `Principal`. No client fetch is required.

```tsx
// src/components/app-shell.tsx (server component)
import { PrincipalProvider } from "@/components/auth/principal-provider";
import { principalFromAppUser } from "@/lib/auth/principal";

const principal = principalFromAppUser(appSession.access.appUser);

return (
  <PrincipalProvider principal={principal}>
    {children}
  </PrincipalProvider>
);
```

All `(app)/*` pages and components are inside `AppShell` and therefore
inside `<PrincipalProvider>`. Public pages (auth, landing) are not —
use `useOptionalPrincipal()` there.

---

## 10. Adding a new permission

1. Add the string to `ROLE_PERMISSIONS` in `src/lib/auth/principal.ts`
   under every role that should have it.
2. Mirror it in Laravel (see `docs/laravel-start-guide.md` §5.2).
3. If a menu entry depends on it, add `perms: { list: ["…"] }` in the
   menu fixture.
4. Apply server gate + action gate + UI gate at the right layers.

No database migration needed. Roles live in Laravel; permissions are
derived locally from `ROLE_PERMISSIONS`.

---

## 11. Critical rules

- **Never `try/catch` around `requireRole` / `requirePermission` / `withRole` /
  `withPermission`.** Catching the interrupt silently grants access.
- **Client gates are UX only.** Always pair with a server or action gate
  on the privileged endpoint.
- **`<PrincipalProvider>` must be mounted.** `<RoleGate>` / `<PermissionGate>` /
  `<AuthorizedView>` log a dev warning and always render `fallback` when
  no provider is found above them.
- **Feed `principal.roles` / `principal.permissions` to menu filters.**
  Never use raw `appUser.roles` — those are pre-normalization and may be
  lowercase, causing the sidebar to appear empty.
- **`AUTH_SESSION_BYPASS_ENABLED` and `AUTH_LARAVEL_MOCK_ENABLED` are
  hard-disabled in production.** Do not weaken these guards.

---

## 12. Key files

| File | Purpose |
|---|---|
| `src/lib/auth/principal.ts` | `AppRole`, `ROLE_PERMISSIONS`, `Principal`, helpers — isomorphic |
| `src/lib/auth/rbac.ts` | `requireRole`, `requirePermission`, `withRole`, `withPermission`, `getCurrentPrincipal` |
| `src/lib/auth/session.ts` | Session / identity / access plumbing (server-only) |
| `src/components/auth/principal-provider.tsx` | `<PrincipalProvider>`, `usePrincipal`, `useOptionalPrincipal` |
| `src/components/auth/role-gate.tsx` | `<RoleGate>`, `<PermissionGate>` (silent) |
| `src/components/auth/authorized-view.tsx` | `<AuthorizedView>` (visible fallback) |
| `src/lib/menu/filter.ts` | `filterFeatures`, `filterSettings` |
| `src/lib/api/domains/menu/contract.ts` | `MenuConfig`, `FeatureItem.display`, `PermRule` |
| `src/app/(app)/forbidden.tsx` | In-shell 403 page (keeps AppShell chrome) |
| `src/app/forbidden.tsx` | Root 403 page (outside AppShell) |
| `src/app/unauthorized.tsx` | Root 401 page |
