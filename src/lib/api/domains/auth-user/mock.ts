import "server-only";

import type {
  AuthIdentity,
  AuthUserAccessResult,
  LaravelAppUser,
} from "@/lib/api/domains/auth-user/contract";
import {
  APP_ROLES,
  isAppRole,
  permissionsFor,
  type AppRole,
} from "@/lib/auth/principal";

/**
 * Dev-only auto-mock: when API_URL is missing/empty AND we're not in
 * production, behave as if both `AUTH_LARAVEL_MOCK_ENABLED` and
 * `AUTH_SESSION_BYPASS_ENABLED` were `"true"`. This lets the app boot and
 * sign-in flow short-circuit to a hardcoded dev principal without having to
 * stand up the Laravel backend or seed a Better-Auth user.
 *
 * Production safety: the same hard guard as the explicit flags below
 * (`NODE_ENV === "production" → false`), plus `src/env.ts` refuses to boot
 * in production when API_URL is missing, so this branch is unreachable
 * outside development/test.
 */
export function isDevAutoMockEnabled() {
  if (process.env.NODE_ENV === "production") return false;
  const apiUrl = process.env.API_URL?.trim();
  return !apiUrl;
}

export function isLaravelAuthMockEnabled() {
  // Hard production guard: the Laravel mock fabricates `LaravelAppUser`
  // payloads (including roles), so leaving it on in prod = silent privilege
  // grant. Always off outside development/test, regardless of env value.
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.AUTH_LARAVEL_MOCK_ENABLED === "true") return true;
  return isDevAutoMockEnabled();
}

export function isSessionBypassEnabled() {
  // Hard production guard: bypass returns a hardcoded `dev@localhost`
  // principal with `AUTH_MOCK_ROLE` (default Admin). Never honor in prod.
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.AUTH_SESSION_BYPASS_ENABLED === "true") return true;
  return isDevAutoMockEnabled();
}

const BYPASS_IDENTITY: AuthIdentity = {
  email: "dev@localhost",
  emailVerified: true,
  provider: "password",
  providerSubject: null,
  username: "dev",
  displayName: "Dev User",
  image: null,
};

function getDisplayName(identity: AuthIdentity) {
  return (
    identity.displayName?.trim() ||
    identity.username?.trim() ||
    identity.email.split("@")[0] ||
    "Local User"
  );
}

function getMockRole(): AppRole {
  const raw = process.env.AUTH_MOCK_ROLE;
  return isAppRole(raw) ? raw : (APP_ROLES[APP_ROLES.length - 1] as AppRole);
}

export function buildMockAuthUser(identity: AuthIdentity): LaravelAppUser {
  const role = getMockRole();
  return {
    id: `mock-${identity.email.toLowerCase()}`,
    email: identity.email,
    displayName: getDisplayName(identity),
    avatarUrl: identity.image ?? null,
    accessState: "active",
    roles: [role],
    permissions: permissionsFor([role]),
    organizationName: "Local Mock",
  };
}

export function getMockAuthAccess(
  identity: AuthIdentity,
  createdOrUpdated?: "created" | "updated" | "confirmed",
): AuthUserAccessResult {
  return {
    status: "authorized",
    appUser: buildMockAuthUser(identity),
    createdOrUpdated,
  };
}

export function getMockBypassSession() {
  return {
    authSession: {} as import("@/lib/auth/session").BetterAuthSession,
    authIdentity: BYPASS_IDENTITY,
    access: {
      status: "authorized" as const,
      appUser: buildMockAuthUser(BYPASS_IDENTITY),
      createdOrUpdated: "confirmed" as const,
    },
  };
}
