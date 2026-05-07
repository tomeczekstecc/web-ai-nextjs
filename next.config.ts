import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
