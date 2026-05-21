import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { toNextJsHandler } from "better-auth/next-js";
import { jwt, username } from "better-auth/plugins";
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

const plugins = [
  username(),
  /**
   * JWT plugin: lets us mint short-lived, session-bound, asymmetrically
   * signed JWTs that downstream services (currently Laravel `/me` and
   * `/auth/provision`) verify against our JWKS at `/api/auth/jwks`.
   *
   * This is the cryptographic replacement for the legacy
   * `X-Internal-Auth: <god-mode-shared-secret>` + `X-Auth-Email: trusted`
   * header pair. With the JWT in place, Laravel no longer has to trust
   * that Next.js is honest about the user's email — the `sub` claim is
   * authoritative because it is signed.
   *
   * Payload is intentionally minimal: identity only. Roles and permissions
   * stay in Laravel as the source of truth; this token just answers
   * "who is the call being made on behalf of?".
   *
   * The plugin also adds a `jwks` table (see drizzle/better-auth migration).
   */
  jwt({
    // Keep column names snake_case to match the convention used by our
    // other better-auth tables (`auth_users`, `auth_sessions`, etc.).
    schema: {
      jwks: {
        fields: {
          publicKey: "public_key",
          privateKey: "private_key",
          createdAt: "created_at",
          expiresAt: "expires_at",
        },
      },
    },
    jwt: {
      // BASE_URL is used for issuer/audience by default. Audience is
      // explicitly set so Laravel can pin it independently of any future
      // BASE_URL rename.
      issuer: process.env.BETTER_AUTH_URL,
      audience:
        process.env.AUTH_LARAVEL_BRIDGE_AUDIENCE ||
        process.env.BETTER_AUTH_URL,
      // Short TTL: every request mints a fresh token via `auth.api.getToken`,
      // which is itself per-request `React.cache`-deduped in
      // `src/lib/auth/backend-token.ts`. A leaked token has a tiny blast
      // radius.
      expirationTime: "5m",
      definePayload: ({ user }) => ({
        // Standard claim shape so Laravel can use the same code path as any
        // other JWT consumer (mobile, future internal tools).
        id: user.id,
        email: user.email,
        emailVerified: Boolean(user.emailVerified),
        name: user.name ?? null,
      }),
    },
  }),
  // NB: we deliberately do NOT register the better-auth `organization()`
  // plugin. Our RBAC is global, not per-tenant: the role catalog
  // (`User`/`Oper`/`Admin`) lives in `src/lib/auth/principal.ts`, and the
  // authoritative role assignments come from Laravel via `GET /me`
  // (see `docs/laravel-start-guide.md` §5). The org plugin would add a
  // membership model, an invitation flow, and a session field we have no
  // use for. Revisit only if we adopt true multi-tenancy.
];

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
    // Standardise on snake_case across every better-auth table. Without these
    // overrides better-auth would create camelCase columns for the core user
    // table, which would clash with the snake_case mappings we already have
    // on session/account/verification. Authoritative SQL lives in
    // `migrations/0001_better_auth_schema.sql`.
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
      // Added by the `username()` plugin.
      displayUsername: "display_username",
    },
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      userId: "user_id",
      expiresAt: "expires_at",
      ipAddress: "ip_address",
      userAgent: "user_agent",
      createdAt: "created_at",
      updatedAt: "updated_at",
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
