import "server-only";

import type {
  AuthIdentity,
  AuthUserAccessResult,
  LaravelAppUser,
} from "@/lib/api/domains/auth-user/contract";

export function isLaravelAuthMockEnabled() {
  return process.env.AUTH_LARAVEL_MOCK_ENABLED === "true";
}

export function isSessionBypassEnabled() {
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

export function buildMockAuthUser(identity: AuthIdentity): LaravelAppUser {
  return {
    id: `mock-${identity.email.toLowerCase()}`,
    email: identity.email,
    displayName: getDisplayName(identity),
    avatarUrl: identity.image ?? null,
    accessState: "active",
    roles: ["local-user"],
    permissions: ["dashboard:read", "applications:read", "applications:write"],
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
