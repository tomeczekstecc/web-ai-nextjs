/**
 * Central app configuration.
 * All values are driven by environment variables so the template
 * can be forked and renamed without touching source files.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "CI-PRS",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3600",
} as const;
