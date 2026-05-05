# Quickstart: App-First Authentication

## Goal

Stand up the first authentication slice with:
- native app-owned sign-in
- public sign-up enabled by default
- required email verification
- self-service password reset
- Laravel-backed synchronous provisioning and authorization
- protected dashboard access
- optional Keycloak SSO
- immediate revocation hook support

## Environment Setup

Store all Keycloak and authentication-related runtime configuration in the app's `.env` file before implementation verification.

Configure the following values before implementation verification:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `API_URL`
- `LARAVEL_INTERNAL_AUTH_TOKEN`
- `LARAVEL_INTERNAL_AUTH_MAIL_TOKEN`
- `LARAVEL_INTERNAL_AUTH_REVOKE_TOKEN`
- `AUTH_SIGNUP_ENABLED`
- `AUTH_SSO_ENABLED`
- `KEYCLOAK_CLIENT_ID` (optional when SSO is enabled)
- `KEYCLOAK_CLIENT_SECRET` (optional when SSO is enabled)
- `KEYCLOAK_ISSUER` (optional when SSO is enabled)

## Implementation Order

1. Install Better Auth and the chosen database adapter for the auth store.
2. Create `lib/auth.ts`, `lib/auth-client.ts`, and `app/api/auth/[...all]/route.ts`.
3. Configure native auth with email or username sign-in, optional username, required email verification, password reset, session lifetime, and password policy.
4. Create the Better Auth schema or migration required for the isolated auth namespace.
5. Add app-owned routes for sign-in, sign-up, verify-email, reset-password, blocked access, and temporary auth unavailability.
6. Add Laravel current-user and provisioning or upsert integration under `lib/api/domains/auth-user/`.
7. Add internal Laravel mail-delivery handoff for verification and reset emails.
8. Add the internal Laravel-triggered session revocation route.
9. Protect `/dashboard` and nested internal dashboard routes.
10. Replace mock sidebar user data with Laravel-resolved user data.
11. Add optional Keycloak SSO behind explicit configuration.

## Manual Verification

1. Open `/dashboard` while signed out and confirm the app redirects to `/sign-in` before dashboard content appears.
2. Register a new account, confirm the app requires email verification before normal access, and confirm the verification link lands on an app-owned route.
3. Sign in with email, and if a username exists, confirm sign-in also works with username.
4. Confirm the app continues through synchronous Laravel provisioning or access resolution before rendering protected content.
5. Confirm denied users land on `/access-denied` and unavailable backend states land on `/auth-unavailable`.
6. Trigger password reset and confirm other active sessions are revoked after the reset succeeds.
7. Confirm already-authenticated users are redirected away from `/sign-in` and `/sign-up`.
8. If SSO is enabled, use the Keycloak button and confirm the user returns through the same access-provisioning path as native users.
9. Confirm local logout ends app access without forcing global Keycloak logout.
10. Verify all auth screens and outcomes in both light and dark themes on desktop and mobile widths.

## Completion Check

The slice is ready for task breakdown when native auth, verification, reset, Laravel provisioning, blocked-access handling, temporary-unavailable handling, revocation, and optional SSO all behave according to the documented contracts and the final UX remains Polish-language, responsive, and aligned with the existing UI direction.
