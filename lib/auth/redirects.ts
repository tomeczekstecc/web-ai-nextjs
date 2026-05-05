const DEFAULT_RETURN_TO = "/dashboard";

export function isSafeReturnTo(value: string | null | undefined): value is string {
  if (!value || typeof value !== "string") {
    return false;
  }

  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}

export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = DEFAULT_RETURN_TO,
) {
  return isSafeReturnTo(value) ? value : fallback;
}

export function buildSignInHref(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);

  if (safeReturnTo === DEFAULT_RETURN_TO) {
    return "/sign-in";
  }

  return `/sign-in?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildSignUpHref(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);

  if (safeReturnTo === DEFAULT_RETURN_TO) {
    return "/sign-up";
  }

  return `/sign-up?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildVerifyEmailCallback(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
  return `/verify-email?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildResetPasswordCallback(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
  return `/reset-password?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildAuthSuccessHref(returnTo?: string | null) {
  return sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
}
