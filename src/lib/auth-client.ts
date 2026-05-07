"use client";

import { createAuthClient } from "better-auth/client";
import { genericOAuthClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [usernameClient(), genericOAuthClient()],
});
