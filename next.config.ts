import type { NextConfig } from "next";

// Validate environment variables at startup.
// Importing for side effects — `createEnv` parses on first import and
// throws a readable error if anything is missing or malformed.
import "./src/env";

const nextConfig: NextConfig = {
  // Required for the multi-stage Docker production build (Dockerfile.prod).
  // Copies only the files needed to run the app into .next/standalone.
  output: "standalone",
  experimental: {
    // Enables `unauthorized()` / `forbidden()` from `next/navigation` and the
    // matching `unauthorized.tsx` / `forbidden.tsx` special files.
    // See src/app/unauthorized.tsx, src/app/forbidden.tsx, src/lib/auth/rbac.ts.
    authInterrupts: true,
  },
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/auth/sign-in",
        permanent: false,
      },
      {
        source: "/sign-up",
        destination: "/auth/sign-up",
        permanent: false,
      },
      {
        source: "/verify-email",
        destination: "/auth/verify-email",
        permanent: false,
      },
      {
        source: "/reset-password",
        destination: "/auth/reset-password",
        permanent: false,
      },
      {
        source: "/access-denied",
        destination: "/auth/access-denied",
        permanent: false,
      },
      {
        source: "/auth-unavailable",
        destination: "/auth/unavailable",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
