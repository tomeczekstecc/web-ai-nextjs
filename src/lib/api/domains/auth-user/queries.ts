import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import { buildBridgeUserHeaders } from "@/lib/api/domains/auth-user/bridge-headers";
import type {
  AuthIdentity,
  AuthUserAccessResult,
  LaravelAppUserPayload,
} from "@/lib/api/domains/auth-user/contract";
import { mapLaravelAppUser } from "@/lib/api/domains/auth-user/mapper";
import {
  getMockAuthAccess,
  isLaravelAuthMockEnabled,
} from "@/lib/api/domains/auth-user/mock";

const endpoint = "/me";

export async function getCurrentAuthUser(
  identity: AuthIdentity,
): Promise<AuthUserAccessResult> {
  if (isLaravelAuthMockEnabled()) {
    return getMockAuthAccess(identity, "confirmed");
  }

  const result = await apiRequest<LaravelAppUserPayload>({
    path: endpoint,
    method: "GET",
    headers: await buildBridgeUserHeaders(identity),
  });

  if (result.ok) {
    return {
      status: "authorized",
      appUser: mapLaravelAppUser(result.data),
    };
  }

  if (result.status === 404) {
    return {
      status: "unlinked",
    };
  }

  if (result.status === 403) {
    return {
      status: "denied",
    };
  }

  return {
    status: "unavailable",
    message: result.error.message,
  };
}
