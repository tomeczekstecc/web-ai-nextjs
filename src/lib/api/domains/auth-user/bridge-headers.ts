import "server-only";

import { getBackendTokenForCurrentRequest } from "@/lib/auth/backend-token";
import type { AuthIdentity } from "@/lib/api/domains/auth-user/contract";

/**
 * Build the headers used for every outbound call to the Laravel bridge.
 *
 * Two modes are supported during the JWT migration:
 *
 * - `internal-token` (legacy): static shared secret + trusted `X-Auth-Email`.
 *   Laravel matches the email to a user; identity is **trusted**, not
 *   verified. Keep this until Laravel ships the JWKS-verifying middleware.
 *
 * - `jwt` (new): per-request `Authorization: Bearer <jwt>` minted by the
 *   better-auth JWT plugin. Laravel verifies signature via JWKS and reads
 *   `sub` from the verified payload. **No header trust**, no shared secret
 *   in the call.
 *
 * Both modes still send `X-Internal-Auth` because some adjacent Laravel
 * endpoints (mail bridge, session revoke) have not been migrated yet and
 * the same Next.js process talks to all of them. Drop that header once
 * those endpoints flip too.
 *
 * The selection happens **here**, not at the call site, so every consumer
 * (`/me`, `/auth/provision`, future endpoints) goes through the same
 * decision and there is exactly one place to flip when the migration
 * finishes.\n */
export type BridgeAuthMode = "internal-token" | "jwt";

function getBridgeMode(): BridgeAuthMode {
  const raw = process.env.AUTH_LARAVEL_BRIDGE_MODE?.trim();
  return raw === "jwt" ? "jwt" : "internal-token";
}

function getInternalAuthToken(): string {
  return process.env.LARAVEL_INTERNAL_AUTH_TOKEN?.trim() ?? "";
}

/**
 * Headers for endpoints that act on behalf of a specific user (`/me`,
 * `/auth/provision`). In `jwt` mode the identity comes from the verified
 * token claims; the `identity` argument is unused but kept so the
 * call-site signature is stable across modes.
 */
export async function buildBridgeUserHeaders(
  identity: AuthIdentity,
): Promise<HeadersInit> {
  const mode = getBridgeMode();

  if (mode === "jwt") {
    const token = await getBackendTokenForCurrentRequest();
    // Falling back to the legacy headers when there is no session would
    // re-introduce the trusted-email surface we are trying to remove.
    // Throwing forces callers to handle the no-session branch explicitly
    // (which they already do upstream via `requireAuthorizedAppSession`).
    if (!token) {
      throw new Error(
        "Cannot call Laravel bridge in jwt mode without an active session.",
      );
    }
    return {
      Authorization: `Bearer ${token}`,
      // Keep `X-Internal-Auth` during transition so Laravel can require it
      // on adjacent (not-yet-migrated) endpoints. Drop when full cut-over.
      "X-Internal-Auth": getInternalAuthToken(),
    };
  }

  // Legacy mode — identity is asserted, not proven.
  const headers: Record<string, string> = {
    "X-Auth-Email": identity.email,
    "X-Auth-Provider": identity.provider,
    "X-Internal-Auth": getInternalAuthToken(),
  };
  if (identity.providerSubject) {
    headers["X-Auth-Subject"] = identity.providerSubject;
  }
  return headers;
}
