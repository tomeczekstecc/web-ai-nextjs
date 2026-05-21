import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/**
 * Type-safe, validated environment variables.
 *
 * - Server-only vars are unavailable on the client (throws if accessed).
 * - Client vars must be prefixed with `NEXT_PUBLIC_`.
 * - Validation runs at startup via the import in `next.config.ts`.
 *
 * Boolean-like flags are kept as `"true" | "false"` strings to stay
 * compatible with existing `process.env.X === "true"` call sites.
 */

const boolish = z.enum(["true", "false"]);
const optionalString = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    // Backend API (server-side fetch base URL)
    API_URL: z.url(),

    // better-auth
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.url(),

    // Database
    DATABASE_URL: z.string().min(1),

    // Laravel internal auth bridge tokens
    LARAVEL_INTERNAL_AUTH_TOKEN: z.string().min(1),
    LARAVEL_INTERNAL_AUTH_MAIL_TOKEN: z.string().min(1),
    LARAVEL_INTERNAL_AUTH_REVOKE_TOKEN: z.string().min(1),

    // Auth feature flags
    AUTH_SIGNUP_ENABLED: boolish.default("true"),
    AUTH_SOCIAL_LOGIN_ENABLED: boolish.default("false"),
    AUTH_LARAVEL_MOCK_ENABLED: boolish.default("false"),
    AUTH_SESSION_BYPASS_ENABLED: boolish.default("false"),

    // RBAC — the canonical role catalog is the `AppRole` literal union in
    // `src/lib/auth/principal.ts`. There is no runtime env for it: a string
    // env would not constrain the TS types, and we want the type union to be
    // the single source of truth.
    //
    // `AUTH_MOCK_ROLE` selects which role the dev-mock principal acts as
    // (only honored when bypass or laravel-mock is enabled — both of which
    // are hard-disabled in production by `src/lib/api/domains/auth-user/mock.ts`).
    AUTH_MOCK_ROLE: z.enum(["User", "Oper", "Admin"]).default("Admin"),

    // Optional support contact (shown on auth pages). URL is validated so a
    // typo can't break navigation when rendered into a <Link href>.
    AUTH_SUPPORT_LABEL: optionalString,
    AUTH_SUPPORT_URL: z.url().optional(),

    // Native better-auth social providers. A provider is only registered when
    // BOTH its client id and secret are set. See `src/lib/auth.ts`.
    GOOGLE_CLIENT_ID: optionalString,
    GOOGLE_CLIENT_SECRET: optionalString,
    APPLE_CLIENT_ID: optionalString,
    APPLE_CLIENT_SECRET: optionalString,
    APPLE_APP_BUNDLE_IDENTIFIER: optionalString,
    FACEBOOK_CLIENT_ID: optionalString,
    FACEBOOK_CLIENT_SECRET: optionalString,
  },

  client: {
    NEXT_PUBLIC_APP_NAME: z.string().min(1),
    NEXT_PUBLIC_SITE_URL: z.url(),
    NEXT_PUBLIC_API_URL: z.url(),
    NEXT_PUBLIC_NAV_LAYOUT: z.enum(["sidebar", "top-menu"]).default("sidebar"),
    NEXT_PUBLIC_TOAST_POSITION: z
      .enum([
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ])
      .default("bottom-right"),
  },

  /**
   * Next.js >= 13.4.4: only client variables need manual destructuring,
   * because Edge/Client bundles statically analyze `process.env.NEXT_PUBLIC_*`.
   * Server vars are read directly from `process.env` at runtime.
   */
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_NAV_LAYOUT: process.env.NEXT_PUBLIC_NAV_LAYOUT,
    NEXT_PUBLIC_TOAST_POSITION: process.env.NEXT_PUBLIC_TOAST_POSITION,
  },

  /**
   * Skip validation in specific situations (e.g. lint/build steps where
   * env vars are unavailable). Set `SKIP_ENV_VALIDATION=1` to bypass.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Treat empty strings as "missing" so `FOO=` in `.env` triggers a
   * validation error instead of silently passing as `""`.
   */
  emptyStringAsUndefined: true,
});

/**
 * Hard guard: refuse to boot a production build with development auth
 * shortcuts enabled. `mock.ts` already gates these at runtime, but failing
 * here makes the misconfiguration impossible to ship in the first place.
 *
 * Skipped when `SKIP_ENV_VALIDATION=1` (lint/typegen contexts).
 */
if (
  !process.env.SKIP_ENV_VALIDATION &&
  process.env.NODE_ENV === "production"
) {
  const offenders: string[] = [];
  if (process.env.AUTH_LARAVEL_MOCK_ENABLED === "true")
    offenders.push("AUTH_LARAVEL_MOCK_ENABLED");
  if (process.env.AUTH_SESSION_BYPASS_ENABLED === "true")
    offenders.push("AUTH_SESSION_BYPASS_ENABLED");
  if (offenders.length > 0) {
    throw new Error(
      `Refusing to start: ${offenders.join(", ")} must not be "true" when NODE_ENV=production. ` +
        `These flags exist for local development only and grant unauthenticated Admin access.`,
    );
  }
}

export type Env = typeof env;
