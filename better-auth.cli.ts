import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { Pool } from "pg";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  user: {
    modelName: "auth_users",
  },
  session: {
    modelName: "auth_sessions",
    fields: {
      userId: "user_id",
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
    requireEmailVerification: true,
    minPasswordLength: 12,
  },
  plugins: [username()],
});
