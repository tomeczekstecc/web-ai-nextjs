import type { LaravelAppUser } from "@/lib/api/domains/auth-user/contract";

/**
 * Note: this module is intentionally **isomorphic** — it contains only types
 * and pure functions (role normalization, permission table, `toArray`,
 * `matchesSet`). It is imported by both server gates (`rbac.ts`,
 * `session.ts`) and client gates (`role-gate.tsx`, `principal-provider.tsx`)
 * so the `AppRole` literal union and the `"any" | "all"` semantics cannot
 * drift between layers.
 *
 * The actual server-only surface (Better-Auth session reads, Laravel `/me`,
 * `forbidden()` / `unauthorized()` interrupts) lives in `session.ts` and
 * `rbac.ts`, which carry their own `import "server-only"`.
 */

/**
 * RBAC primitives.
 *
 * `APP_ROLES` is the single source of truth for known roles (both the runtime
 * value list and the `AppRole` type union). `AUTH_MOCK_ROLE` selects which of
 * these the dev-mock principal acts as. Real roles flow in via the Laravel
 * bridge today and via the Better-Auth `organization` plugin once we wire it;
 * neither requires changing `APP_ROLES`.
 */
export const APP_ROLES = ["User", "Oper", "Admin"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

/**
 * Case-insensitive role lookup. The Laravel bridge (and most backends) may
 * return roles in any casing (`"admin"`, `"ADMIN"`, `"Admin"`); the typed
 * union here is the canonical form. Returns `null` for unknown roles so the
 * caller can decide whether to drop or surface them.
 *
 * Centralising this here means `principalFromAppUser` is the only place that
 * needs to deal with casing drift.
 */
const ROLE_BY_LOWER: ReadonlyMap<string, AppRole> = new Map(
  APP_ROLES.map((role) => [role.toLowerCase(), role]),
);

export function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== "string") return null;
  return ROLE_BY_LOWER.get(value.trim().toLowerCase()) ?? null;
}

/**
 * Permission catalog. Keep `domain:action` shape; matches the existing mock
 * in `src/lib/api/domains/auth-user/mock.ts`.
 */
export const ROLE_PERMISSIONS: Record<AppRole, readonly string[]> = {
  User: ["dashboard:read", "applications:read"],
  Oper: [
    "dashboard:read",
    "applications:read",
    "applications:write",
    "tasks:read",
    "tasks:write",
  ],
  Admin: [
    "dashboard:read",
    "applications:read",
    "applications:write",
    "tasks:read",
    "tasks:write",
    "users:read",
    "users:write",
    "admin:access",
  ],
} as const;

export function permissionsFor(roles: readonly AppRole[]): string[] {
  const set = new Set<string>();
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role]) set.add(perm);
  }
  return [...set];
}

/**
 * Narrow `T | readonly T[]` to `readonly T[]`. TypeScript's built-in
 * `Array.isArray` returns `arg is any[]`, which silently widens callers that
 * pass a `readonly` array — and worse, lets `[value as T]` past the type
 * checker when the original was actually an array. Use this everywhere a
 * role/permission gate accepts either shape so the narrowing stays honest.
 */
export function toArray<T>(value: T | readonly T[]): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [value as T];
}

/**
 * Mode used by every role/permission gate. `"any"` (default) requires the
 * principal to have at least one of the inputs; `"all"` requires every one.
 */
export type GateMode = "any" | "all";

export function matchesSet<T>(
  owned: readonly T[],
  required: readonly T[],
  mode: GateMode,
): boolean {
  if (required.length === 0) return true;
  return mode === "all"
    ? required.every((r) => owned.includes(r))
    : required.some((r) => owned.includes(r));
}

export type Principal = {
  userId: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  permissions: string[];
};

/**
 * Build a Principal from the Laravel-backed `LaravelAppUser` already attached
 * to the session by `requireAuthorizedAppSession()`.
 *
 * Strategy:
 * 1. Normalize `appUser.roles` to canonical `AppRole` casing (drop unknowns).
 * 2. Union `appUser.permissions` with the role-derived permission set so the
 *    upstream payload can grant *additional* perms without losing the role
 *    table's defaults.
 */
export function principalFromAppUser(appUser: LaravelAppUser): Principal {
  const roles = appUser.roles
    .map(normalizeRole)
    .filter((role): role is AppRole => role !== null);
  // Dedupe role + explicit perms.
  const permissions = [
    ...new Set([...appUser.permissions, ...permissionsFor(roles)]),
  ];

  return {
    userId: appUser.id,
    email: appUser.email,
    displayName: appUser.displayName,
    roles,
    permissions,
  };
}
