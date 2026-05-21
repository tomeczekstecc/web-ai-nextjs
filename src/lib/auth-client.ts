"use client";

import { createAuthClient } from "better-auth/client";
import { usernameClient } from "better-auth/client/plugins";

// Native social providers (Google, Apple, Facebook) are built into
// `authClient.signIn.social({ provider: "google" | "apple" | "facebook" })`
// and need no client plugin. See `socialProviders` in `src/lib/auth.ts`.
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});
