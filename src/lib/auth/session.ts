import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  getCurrentAuthUser,
} from "@/lib/api/domains/auth-user/queries";
import { provisionAuthUser } from "@/lib/api/domains/auth-user/commands";
import type {
  AuthIdentity,
  AuthProvider,
  AuthUserAccessResult,
} from "@/lib/api/domains/auth-user/contract";
import { auth } from "@/lib/auth";
import { AUTH_ROUTES, buildSignInHref } from "@/lib/auth/redirects";
import {
  getMockBypassSession,
  isSessionBypassEnabled,
} from "@/lib/api/domains/auth-user/mock";

export type BetterAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthorizedAppSession = {
  authSession: BetterAuthSession;
  authIdentity: AuthIdentity;
  access: Extract<AuthUserAccessResult, { status: "authorized" }>;
};

// SSO/Keycloak removed: only first-party password auth + native social
// providers (Google/Apple/Facebook) remain. The Laravel bridge keys identity
// by email, so the provider field is always reported as "password". Native
// social accounts are still stored in `auth_accounts` (better-auth manages
// that table) and linked to the local user by email at sign-in time.
const PASSWORD_PROVIDER = {
  provider: "password" as AuthProvider,
  providerSubject: null as string | null,
};

/**
 * Per-request memoized session resolver. `React.cache` deduplicates calls
 * **within a single render pass**: any number of `requireAuthorizedAppSession`,
 * `getCurrentPrincipal`, layout, and page calls within one request hit the
 * Better-Auth API once. Combined with `session.cookieCache` in `src/lib/auth.ts`,
 * most reads also skip the DB entirely.
 */
export const getBetterAuthSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

/**
 * Per-request memoized full access resolution (session → identity → Laravel
 * `/me`). Same dedup behavior as `getBetterAuthSession`; this is what stops a
 * `(app)/layout` → `(app)/admin/layout` → `(app)/admin/page` stack from
 * calling Laravel three times per navigation.
 */
const getAccessForCurrentRequest = cache(
  async (): Promise<
    (AuthUserAccessResult & { authIdentity: AuthIdentity }) | null
  > => {
    const session = await getBetterAuthSession();
    if (!session) return null;
    return resolveAuthAccessForSession(session);
  },
);

export function getAuthIdentityFromSession(
  session: BetterAuthSession,
): AuthIdentity {
  return {
    email: session.user.email,
    emailVerified: Boolean(session.user.emailVerified),
    provider: PASSWORD_PROVIDER.provider,
    providerSubject: PASSWORD_PROVIDER.providerSubject,
    username:
      "username" in session.user && typeof session.user.username === "string"
        ? session.user.username
        : null,
    displayName: session.user.name ?? null,
    image: session.user.image ?? null,
  };
}

export async function resolveAuthAccessForSession(
  session: BetterAuthSession,
): Promise<AuthUserAccessResult & { authIdentity: AuthIdentity }> {
  const authIdentity = getAuthIdentityFromSession(session);
  const currentUser = await getCurrentAuthUser(authIdentity);

  if (currentUser.status === "authorized") {
    return {
      ...currentUser,
      authIdentity,
    };
  }

  if (currentUser.status === "unlinked") {
    const provisionedUser = await provisionAuthUser(authIdentity);
    return {
      ...provisionedUser,
      authIdentity,
    };
  }

  return {
    ...currentUser,
    authIdentity,
  };
}

export async function requireAuthorizedAppSession(returnTo?: string | null) {
  if (isSessionBypassEnabled()) {
    return getMockBypassSession();
  }

  const session = await getBetterAuthSession();

  if (!session) {
    redirect(buildSignInHref(returnTo));
  }

  // Reuses the per-request memo when `getCurrentPrincipal` (or anything else)
  // already resolved access in this render pass.
  const access = (await getAccessForCurrentRequest())!;

  if (access.status === "authorized") {
    return {
      authSession: session,
      authIdentity: access.authIdentity,
      access,
    } satisfies AuthorizedAppSession;
  }

  if (access.status === "unavailable") {
    redirect(AUTH_ROUTES.unavailable);
  }

  redirect(AUTH_ROUTES.accessDenied);
}

export async function redirectIfAuthenticated() {
  const session = await getBetterAuthSession();

  if (session) {
    redirect("/dashboard");
  }
}

export { getAccessForCurrentRequest };
