import "server-only";

import { buildApiUrl } from "@/lib/api/core/config";

type AuthMailType = "verify_email" | "reset_password";

type SendAuthMailInput = {
  type: AuthMailType;
  email: string;
  callbackURL: string;
  displayName?: string | null;
};

export async function sendAuthMail({
  type,
  email,
  callbackURL,
  displayName,
}: SendAuthMailInput) {
  const url = buildApiUrl("/auth/mail");
  const internalToken = process.env.LARAVEL_INTERNAL_AUTH_MAIL_TOKEN?.trim();

  if (!url || !internalToken) {
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Internal-Auth-Mail": internalToken,
      },
      body: JSON.stringify({
        type,
        email,
        callback_url: callbackURL,
        display_name: displayName ?? null,
      }),
      cache: "no-store",
    });
  } catch {
    // Mail delivery should not break the auth request lifecycle.
  }
}
