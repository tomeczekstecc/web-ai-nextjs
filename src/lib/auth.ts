import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { toNextJsHandler } from "better-auth/next-js";
import { genericOAuth, username } from "better-auth/plugins";
import { Pool } from "pg";

import { logAuthAudit } from "@/lib/auth/audit";
import { sendAuthMail } from "@/lib/auth/email";
import { isRateLimited } from "@/lib/auth/rate-limit";

const globalForAuth = globalThis as typeof globalThis & {
  __authPool?: Pool;
};

const rateLimitPolicies = new Map<string, { limit: number; windowMs: number }>([
  ["/sign-in/email", { limit: 10, windowMs: 5 * 60 * 1000 }],
  ["/sign-in/username", { limit: 10, windowMs: 5 * 60 * 1000 }],
  ["/sign-up/email", { limit: 5, windowMs: 10 * 60 * 1000 }],
  ["/request-password-reset", { limit: 5, windowMs: 10 * 60 * 1000 }],
  ["/send-verification-email", { limit: 5, windowMs: 10 * 60 * 1000 }],
]);

const auditedPaths = new Set([
  "/sign-in/email",
  "/sign-in/username",
  "/sign-up/email",
  "/request-password-reset",
  "/reset-password",
  "/send-verification-email",
  "/verify-email",
]);

function getAuditDetails(body: unknown) {
  if (!body || typeof body !== "object") {
    return {
      email: null,
      provider: null,
      detail: null,
    };
  }

  const source = body as Record<string, unknown>;

  return {
    email: typeof source.email === "string" ? source.email : null,
    provider:
      typeof source.providerId === "string"
        ? source.providerId
        : typeof source.provider === "string"
          ? source.provider
          : null,
    detail:
      typeof source.callbackURL === "string"
        ? source.callbackURL
        : typeof source.redirectTo === "string"
          ? source.redirectTo
          : null,
  };
}

function getRequestIp(ctx: { headers?: Headers; request?: Request }) {
  const headerSource = ctx.headers ?? ctx.request?.headers;

  if (!headerSource) {
    return null;
  }

  const forwardedFor = headerSource.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return headerSource.get("x-real-ip");
}

export const authPool =
  globalForAuth.__authPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForAuth.__authPool = authPool;
}

const ssoEnabled =
  process.env.AUTH_SSO_ENABLED === "true" &&
  Boolean(process.env.AUTH_SSO_CLIENT_ID) &&
  Boolean(process.env.AUTH_SSO_CLIENT_SECRET) &&
  Boolean(process.env.AUTH_SSO_ISSUER);

// Stable, provider-agnostic id used by the frontend SSO button and account
// linking. The actual upstream OIDC provider (Keycloak, Authentik, Auth0, …)
// is configured via AUTH_SSO_* env vars and is opaque to the UI.
export const SSO_PROVIDER_ID = "sso";

const plugins = [
  username(),
  ...(ssoEnabled
    ? [
        genericOAuth({
          config: [
            {
              providerId: SSO_PROVIDER_ID,
              clientId: process.env.AUTH_SSO_CLIENT_ID!,
              clientSecret: process.env.AUTH_SSO_CLIENT_SECRET!,
              discoveryUrl: `${process.env.AUTH_SSO_ISSUER!.replace(/\/$/, "")}/.well-known/openid-configuration`,
              scopes: ["openid", "profile", "email"],
              pkce: true,
            },
          ],
        }),
      ]
    : []),
];

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : undefined,
  database: authPool,
  user: {
    modelName: "auth_users",
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      userId: "user_id",
    },
    expiresIn: 60 * 60 * 24,
    updateAge: 60 * 60 * 4,
  },
  account: {
    modelName: "auth_accounts",
    fields: {
      userId: "user_id",
      accountId: "account_id",
      providerId: "provider_id",
      accessToken: "access_token",
      refreshToken: "refresh_token",
      idToken: "id_token",
      accessTokenExpiresAt: "access_token_expires_at",
      refreshTokenExpiresAt: "refresh_token_expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    storeAccountCookie: true,
    accountLinking: {
      enabled: true,
      trustedProviders: [SSO_PROVIDER_ID],
      allowDifferentEmails: false,
    },
  },
  verification: {
    modelName: "auth_verifications",
    fields: {
      expiresAt: "expires_at",
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_SIGNUP_ENABLED === "false",
    requireEmailVerification: true,
    minPasswordLength: 12,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await sendAuthMail({
        type: "reset_password",
        email: user.email,
        callbackURL: url,
        displayName: user.name,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: false,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await sendAuthMail({
        type: "verify_email",
        email: user.email,
        callbackURL: url,
        displayName: user.name,
      });
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const policy = rateLimitPolicies.get(ctx.path);

      if (!policy) {
        return;
      }

      const ip = getRequestIp(ctx) ?? "unknown";

      if (isRateLimited(`${ctx.path}:${ip}`, policy)) {
        const details = getAuditDetails(ctx.body);
        logAuthAudit({
          event: "rate_limited",
          path: ctx.path,
          email: details.email,
          provider: details.provider,
          ip,
          detail: details.detail,
        });

        throw new APIError("TOO_MANY_REQUESTS", {
          message: "Zbyt wiele prob. Sprobuj ponownie za chwile.",
        });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      if (!auditedPaths.has(ctx.path)) {
        return;
      }

      const details = getAuditDetails(ctx.body);
      const returned = ctx.context.returned;
      const status =
        returned instanceof Response
          ? returned.status
          : returned && typeof returned === "object" && "status" in returned
            ? String((returned as { status?: unknown }).status ?? "ok")
            : "ok";

      logAuthAudit({
        event: "auth_request",
        path: ctx.path,
        status,
        email: details.email,
        provider: details.provider,
        ip: getRequestIp(ctx) ?? "unknown",
        detail: details.detail,
      });
    }),
  },
  plugins,
});

export const authHandlers = toNextJsHandler(auth);
