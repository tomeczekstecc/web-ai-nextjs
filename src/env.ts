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
    AUTH_SSO_ENABLED: boolish.default("false"),
    AUTH_SOCIAL_LOGIN_ENABLED: boolish.default("false"),
    AUTH_LARAVEL_MOCK_ENABLED: boolish.default("false"),
    AUTH_SESSION_BYPASS_ENABLED: boolish.default("false"),

    // Optional support contact (shown on auth pages)
    AUTH_SUPPORT_LABEL: optionalString,
    AUTH_SUPPORT_URL: optionalString,

    // Keycloak (required only when AUTH_SSO_ENABLED=true)
    KEYCLOAK_CLIENT_ID: optionalString,
    KEYCLOAK_CLIENT_SECRET: optionalString,
    KEYCLOAK_ISSUER: optionalString,
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

export type Env = typeof env;
