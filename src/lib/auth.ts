import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { toNextJsHandler } from "better-auth/next-js";
import { username } from "better-auth/plugins";
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

const plugins = [username()];

/**
 * Native better-auth social providers. We only register a provider when both
 * its client id and secret are present in the environment. Trying to enable a
 * provider with missing credentials would crash on startup.
 *
 * Supported here: Google, Apple (JWT client secret pre-generated), Facebook.
 * Add more by extending `SocialProvidersConfig` below.
 */
type SocialProvidersConfig = NonNullable<
  Parameters<typeof betterAuth>[0]["socialProviders"]
>;

function buildSocialProviders(): SocialProvidersConfig {
  const providers: SocialProvidersConfig = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      ...(process.env.APPLE_APP_BUNDLE_IDENTIFIER
        ? { appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER }
        : {}),
    };
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    };
  }

  return providers;
}

const socialProviders = buildSocialProviders();

export const enabledSocialProviders = Object.keys(
  socialProviders,
) as readonly (keyof SocialProvidersConfig)[];

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
    // Signed-cookie cache of the session payload so `auth.api.getSession()`
    // skips the DB for up to 5 minutes after a successful read. Combined with
    // `React.cache` in `session.ts` / `rbac.ts`, a typical render does 0 DB
    // hits for auth in the steady state. Sign-out and explicit revocations
    // still invalidate immediately because they clear the cookie.
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
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
      enabled: false,
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
  socialProviders,
});

export const authHandlers = toNextJsHandler(auth);
