# Web Auth Flow Contract

## Public Routes

- `/auth/sign-in`
  - Always accessible to unauthenticated users.
  - Presents the default native sign-in form.
  - Accepts email or username.
  - May show the Keycloak SSO button only when explicit configuration enables it.

- `/auth/sign-up`
  - Public by default in the first slice.
  - Requires email, password, and consent acceptance.
  - Accepts an optional username.
  - Redirects to `/auth/sign-in` and hides related UI when sign-up is disabled by configuration.

- `/auth/verify-email`
  - App-owned verification completion route reached from Laravel-delivered email links.
  - Completes verification through Better Auth-controlled token validation.
  - Continues directly into Laravel provisioning or access resolution on success.

- `/auth/reset-password`
  - App-owned password reset route reached from Laravel-delivered email links.
  - Completes Better Auth-controlled reset token validation and password update.

## Protected Routes

- `/dashboard`
  - Requires a valid Better Auth session.
  - Requires resolved Laravel access established for the session.

- `/dashboard/*`
  - Any nested internal dashboard route is protected under the same access model.

## Error and Recovery Routes

- `/auth/access-denied`
  - Used for generic denied or unlinked access outcomes.
  - Does not expose the exact backend denial reason.

- `/auth/unavailable`
  - Used when Laravel access resolution or provisioning is temporarily unavailable.
  - Fails closed and offers retry guidance.

## Redirect Rules

- Protected route requests preserve intended destinations only when the target is a validated internal path.
- Successful sign-in, verification, and SSO return to the preserved internal destination when available.
- If no safe destination is present, successful auth returns to `/dashboard`.
- Authenticated users visiting `/auth/sign-in` or `/auth/sign-up` are redirected away from those routes.

## Session Rules

- Sessions last about 24 hours and refresh while active.
- Product authorization is established during sign-in or provisioning, not on every protected request.
- Laravel can revoke active sessions immediately through the internal revocation hook.
- Signing out clears only the local app session in the first slice, including for SSO users.
