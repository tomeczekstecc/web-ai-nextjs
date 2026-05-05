import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type {
  AuthIdentity,
  AuthUserAccessResult,
  LaravelAppUserPayload,
} from "@/lib/api/domains/auth-user/contract";
import { mapLaravelAppUser } from "@/lib/api/domains/auth-user/mapper";

const endpoint = "/me";

function getInternalAuthToken() {
  return process.env.LARAVEL_INTERNAL_AUTH_TOKEN?.trim() ?? "";
}

function buildCurrentUserHeaders(identity: AuthIdentity): HeadersInit {
  const headers: HeadersInit = {
    "X-Auth-Email": identity.email,
    "X-Auth-Provider": identity.provider,
    "X-Internal-Auth": getInternalAuthToken(),
  };

  if (identity.providerSubject) {
    headers["X-Auth-Subject"] = identity.providerSubject;
  }

  return headers;
}

export async function getCurrentAuthUser(
  identity: AuthIdentity,
): Promise<AuthUserAccessResult> {
  const result = await apiRequest<LaravelAppUserPayload>({
    path: endpoint,
    method: "GET",
    headers: buildCurrentUserHeaders(identity),
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
