const DEFAULT_RETURN_TO = "/dashboard";
const AUTH_BASE_PATH = "/auth";

export const AUTH_ROUTES = {
  signIn: `${AUTH_BASE_PATH}/sign-in`,
  signUp: `${AUTH_BASE_PATH}/sign-up`,
  verifyEmail: `${AUTH_BASE_PATH}/verify-email`,
  resetPassword: `${AUTH_BASE_PATH}/reset-password`,
  accessDenied: `${AUTH_BASE_PATH}/access-denied`,
  unavailable: `${AUTH_BASE_PATH}/unavailable`,
} as const;

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
    return AUTH_ROUTES.signIn;
  }

  return `${AUTH_ROUTES.signIn}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildSignUpHref(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);

  if (safeReturnTo === DEFAULT_RETURN_TO) {
    return AUTH_ROUTES.signUp;
  }

  return `${AUTH_ROUTES.signUp}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildVerifyEmailCallback(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
  return `${AUTH_ROUTES.verifyEmail}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildResetPasswordCallback(returnTo?: string | null) {
  const safeReturnTo = sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
  return `${AUTH_ROUTES.resetPassword}?returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function buildAuthSuccessHref(returnTo?: string | null) {
  return sanitizeReturnTo(returnTo, DEFAULT_RETURN_TO);
}
