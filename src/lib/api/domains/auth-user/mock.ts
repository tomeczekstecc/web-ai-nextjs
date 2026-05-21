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

export function isLaravelAuthMockEnabled() {
  // Hard production guard: the Laravel mock fabricates `LaravelAppUser`
  // payloads (including roles), so leaving it on in prod = silent privilege
  // grant. Always off outside development/test, regardless of env value.
  if (process.env.NODE_ENV === "production") return false;
  return process.env.AUTH_LARAVEL_MOCK_ENABLED === "true";
}

export function isSessionBypassEnabled() {
  // Hard production guard: bypass returns a hardcoded `dev@localhost`
  // principal with `AUTH_MOCK_ROLE` (default Admin). Never honor in prod.
  if (process.env.NODE_ENV === "production") return false;
  return process.env.AUTH_SESSION_BYPASS_ENABLED === "true";
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
