import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type {
  AuthIdentity,
  AuthUserAccessResult,
  ProvisionAuthUserDeniedPayload,
  ProvisionAuthUserRequest,
  ProvisionAuthUserSuccessPayload,
} from "@/lib/api/domains/auth-user/contract";
import { mapLaravelAppUser } from "@/lib/api/domains/auth-user/mapper";
import {
  getMockAuthAccess,
  isLaravelAuthMockEnabled,
} from "@/lib/api/domains/auth-user/mock";

const endpoint = "/auth/provision";

function getInternalAuthToken() {
  return process.env.LARAVEL_INTERNAL_AUTH_TOKEN?.trim() ?? "";
}

function mapProvisionBody(identity: AuthIdentity): ProvisionAuthUserRequest {
  return {
    email: identity.email,
    email_verified: identity.emailVerified,
    username: identity.username ?? null,
    display_name: identity.displayName ?? null,
    provider: identity.provider,
    provider_subject: identity.providerSubject ?? null,
    image: identity.image ?? null,
  };
}

export async function provisionAuthUser(
  identity: AuthIdentity,
): Promise<AuthUserAccessResult> {
  if (isLaravelAuthMockEnabled()) {
    return getMockAuthAccess(identity, "created");
  }

  const result = await apiRequest<
    ProvisionAuthUserSuccessPayload | ProvisionAuthUserDeniedPayload,
    ProvisionAuthUserRequest
  >({
    path: endpoint,
    method: "POST",
    headers: {
      "X-Internal-Auth": getInternalAuthToken(),
    },
    body: mapProvisionBody(identity),
  });

  if (result.ok && result.data.status === "authorized") {
    return {
      status: "authorized",
      appUser: mapLaravelAppUser(result.data.app_user),
      createdOrUpdated: result.data.created_or_updated,
    };
  }

  if (!result.ok && result.status === 403) {
    const details =
      result.error.details && typeof result.error.details === "object"
        ? (result.error.details as ProvisionAuthUserDeniedPayload)
        : null;

    return {
      status: "denied",
      reasonCode: details?.reason_code ?? null,
    };
  }

  return {
    status: "unavailable",
    message: result.ok
      ? "Nie udalo sie ustalic dostepu do aplikacji."
      : result.error.message,
  };
}
