import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/**
 * Mint a Better-Auth-signed JWT representing the current request's session.
 *
 * - Uses `auth.api.getToken`, which is gated by `sessionMiddleware` inside the
 *   JWT plugin. No session = no token (and `getToken` throws), so we cannot
 *   accidentally hand out a token for nobody.
 * - Wrapped in `React.cache`: a single render pass that calls Laravel `/me`,
 *   `/auth/provision`, and any future bridge endpoint reuses one signed
 *   token per request, not three.
 * - Returns `null` if the current request has no session. Callers that
 *   require auth should already have run `requireAuthorizedAppSession`
 *   upstream; this null branch exists for defensive callers and for the
 *   sign-in / provisioning flow that may run before a session is fully
 *   established.
 *
 * Why this lives in its own file: the JWT mint is the new trust anchor for
 * every outbound call to Laravel. Concentrating it here means every backend
 * client funnels through one chokepoint, which is also the place where we
 * would add tracing, rotation hooks, or audience overrides in the future.
 */
export const getBackendTokenForCurrentRequest = cache(
  async (): Promise<string | null> => {
    try {
      const result = await auth.api.getToken({
        headers: await headers(),
      });
      return result?.token ?? null;
    } catch {
      // `getToken` throws (UNAUTHORIZED) when there is no session. That is a
      // normal "no session" signal in our control flow, not an error worth
      // surfacing. Anything else (network, DB) will resurface from the
      // outbound call that the caller is about to make.
      return null;
    }
  },
);
