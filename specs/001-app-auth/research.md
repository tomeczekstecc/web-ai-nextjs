# Research: App-First Authentication

## Decision 1: Use Better Auth email/password as the default native auth path

**Rationale**: The feature requires a default sign-in journey that stays inside the app instead of redirecting users to Keycloak-hosted pages. Better Auth email/password provides the simplest app-owned auth flow and leaves space to add future Better Auth-native methods later.

**Alternatives considered**:
- **Generic OAuth with Keycloak only**: Rejected because it would still force normal users through Keycloak-hosted pages.
- **Magic link or email OTP first**: Rejected because they add email-delivery and product-onboarding complexity before the core auth flow is proven.
- **Passkey-first login**: Rejected because it adds more device and account-management complexity than the first slice needs.

## Decision 2: Start with a Better Auth database-backed auth store in an isolated auth namespace

**Rationale**: Native auth, verification, reset, and future Better Auth plugins all need persistent auth state. Keeping auth tables isolated within the same managed database environment balances clear ownership with operational simplicity.

**Alternatives considered**:
- **Stateless Better Auth only**: Rejected because stateless mode fits provider-only auth more cleanly than native app-owned auth.
- **A completely separate standalone auth database**: Rejected for the first slice because it adds operational complexity without improving the product behavior materially.

## Decision 3: Support optional username login, but keep Laravel identity linkage on verified email

**Rationale**: Username login is desirable in the auth UX, but email remains the safest shared identity key for Laravel in the first slice. This avoids turning username into a second authorization identifier before Laravel and account-linking flows are ready.

**Alternatives considered**:
- **Email-only sign-in**: Rejected because optional username login is part of the chosen first-slice UX.
- **Laravel linkage by username or email**: Rejected because it would create a weaker and more drift-prone identity boundary.

## Decision 4: Require email verification and include self-service password reset in the first slice

**Rationale**: Verified email is the first-slice Laravel linkage key, so email verification is a core trust requirement rather than an optional hardening layer. Password reset is required because email/password is the primary native auth method.

**Alternatives considered**:
- **Allow sign-in before verification**: Rejected because it complicates authorization state and weakens the trust model.
- **Defer password reset**: Rejected because it would leave the primary auth flow incomplete.

## Decision 5: Provision or upsert Laravel access synchronously after verified sign-up and first-time SSO

**Rationale**: Public sign-up and first-time SSO both need deterministic product access creation or denial before protected content is shown. A synchronous provisioning or upsert step provides a clear audit point and avoids half-finished access states.

**Alternatives considered**:
- **Lazy Laravel user creation during later `/me` reads**: Rejected because it obscures the access-creation boundary.
- **Background provisioning**: Rejected because it would introduce pending states and delayed access behavior the first slice does not need.

## Decision 6: Keep Laravel as the authorization authority and let Laravel evaluate self-service access policy

**Rationale**: The app's access rules belong to Laravel, not Better Auth or Next.js environment flags. Laravel should decide whether verified sign-ups and first-time SSO users qualify through configurable policy such as approved domains, invites, or existing business records.

**Alternatives considered**:
- **Evaluate access policy in Next.js `.env`**: Rejected because it would split authorization logic across two systems.
- **Auto-authorize every verified sign-up**: Rejected because it would make public sign-up too permissive for the product's ownership model.

## Decision 7: Establish authorization at session creation and support immediate revocation through a dedicated hook

**Rationale**: Resolving Laravel authorization at sign-in keeps protected route requests fast and predictable. A dedicated Laravel-to-auth revocation hook preserves immediate disablement without re-checking Laravel on every protected request.

**Alternatives considered**:
- **Call Laravel on every protected request**: Rejected because it adds more latency and coupling than needed for the first slice.
- **Accept delayed revocation until session expiry**: Rejected because immediate disablement was chosen as a product requirement.

## Decision 8: Use generic public auth errors and first-slice rate limiting

**Rationale**: Public auth entry points benefit from a non-enumerating error posture. Basic rate limiting adds a security floor without expanding the first slice into a CAPTCHA rollout.

**Alternatives considered**:
- **Specific auth errors**: Rejected because they increase account-enumeration risk.
- **No abuse protection**: Rejected because the public sign-up and reset surfaces would be unnecessarily exposed.
- **Full CAPTCHA from day one**: Rejected because it is heavier than the first slice needs.

## Decision 9: Let Better Auth own token generation, while Laravel owns branded email delivery

**Rationale**: Better Auth is already the app-facing auth system, so token generation and validation belong there. Laravel can still own brand-consistent email delivery by receiving prebuilt links from Next.js or Better Auth through an internal mail API.

**Alternatives considered**:
- **Better Auth sends emails directly**: Rejected because email delivery ownership was assigned to Laravel.
- **Laravel generates token links itself**: Rejected because it would split token authority across systems.

## Decision 10: Add Keycloak only as an explicit optional SSO path

**Rationale**: Keycloak is needed for enterprise identity, but the product explicitly wants to avoid depending on Keycloak-hosted pages for normal users. SSO should therefore be config-gated, separate in the UI, and reuse the same Laravel provisioning and authorization path as native users.

**Alternatives considered**:
- **Keycloak as the only sign-in path**: Rejected because it conflicts with the app-first UX requirement.
- **Hide SSO entirely from the first slice**: Rejected because optional enterprise SSO is part of the agreed scope.
