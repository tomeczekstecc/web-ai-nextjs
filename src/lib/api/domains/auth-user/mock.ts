import "server-only";

import type {
  AuthIdentity,
  AuthUserAccessResult,
  LaravelAppUser,
} from "@/lib/api/domains/auth-user/contract";

export function isLaravelAuthMockEnabled() {
  return process.env.AUTH_LARAVEL_MOCK_ENABLED === "true";
}

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
