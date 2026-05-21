import "server-only";

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
import { auth, authPool, SSO_PROVIDER_ID } from "@/lib/auth";
import { AUTH_ROUTES, buildSignInHref } from "@/lib/auth/redirects";
import {
  getMockBypassSession,
  isSessionBypassEnabled,
} from "@/lib/api/domains/auth-user/mock";

type AuthAccountRow = {
  provider_id: string;
  account_id: string | null;
};

export type BetterAuthSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export type AuthorizedAppSession = {
  authSession: BetterAuthSession;
  authIdentity: AuthIdentity;
  access: Extract<AuthUserAccessResult, { status: "authorized" }>;
};

async function getAuthAccountRows(userId: string) {
  const result = await authPool.query<AuthAccountRow>(
    "select provider_id, account_id from auth_accounts where user_id = $1",
    [userId],
  );

  return result.rows;
}

function mapProvider(rows: AuthAccountRow[]): {
  provider: AuthProvider;
  providerSubject: string | null;
} {
  const ssoAccount = rows.find((row) => row.provider_id === SSO_PROVIDER_ID);

  if (ssoAccount) {
    return {
      provider: "sso",
      providerSubject: ssoAccount.account_id,
    };
  }

  return {
    provider: "password",
    providerSubject: null,
  };
}

export async function getBetterAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function getAuthIdentityFromSession(
  session: BetterAuthSession,
): Promise<AuthIdentity> {
  const rows = await getAuthAccountRows(session.user.id);
  const { provider, providerSubject } = mapProvider(rows);

  return {
    email: session.user.email,
    emailVerified: Boolean(session.user.emailVerified),
    provider,
    providerSubject,
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
  const authIdentity = await getAuthIdentityFromSession(session);
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

  const access = await resolveAuthAccessForSession(session);

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
