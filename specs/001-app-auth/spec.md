# Feature Specification: App-First Authentication

**Feature Branch**: `001-app-auth`
**Created**: 2026-05-04
**Status**: Draft
**Input**: User description: "Add app-first authentication with app-owned sign-in, backend-owned user profile and authorization, protected route access control, and optional enterprise SSO."

## Clarifications

### Session 2026-05-04

- Q: Where should Keycloak and auth runtime configuration be hosted? -> A: In the app's `.env` file.
- Q: Where should Better Auth persistence live? -> A: In an isolated auth schema or table namespace within the same managed database environment.
- Q: What native auth shape should the first slice use? -> A: Public self-service email/password sign-up is enabled by default, sign-in accepts email or username for accounts that have one, email verification is required, and self-service password reset is included.
- Q: How should Laravel identity and authorization work? -> A: Verified email is the first-slice linking key, Laravel remains the authorization authority, and roles or permissions stay Laravel-owned and read-only in the frontend.
- Q: How should access creation and denial work? -> A: Verified sign-ups and first-time SSO logins go through a synchronous, idempotent Laravel provisioning or upsert path that returns the resolved application-user payload; policy denials use a generic blocked-access UX.
- Q: How should auth emails work? -> A: Better Auth owns token generation and validation, Next.js generates app-owned callback links, and Laravel delivers branded verification and reset emails through an internal mail API.
- Q: How should sessions behave? -> A: Sessions last about 24 hours with refresh while active, authorization is established at sign-in, and Laravel can revoke active sessions immediately through a dedicated revocation hook.
- Q: How should SSO work? -> A: Keycloak SSO is optional, shown only when explicitly enabled by configuration, uses the same Laravel provisioning path as verified native accounts, and signs out locally without forcing Keycloak global logout.
- Q: What supporting constraints were chosen? -> A: Use generic auth errors, internal-path-only return destinations, 12-character minimum passwords, sign-up consent checkbox, basic auth audit logging, and first-slice rate limiting without CAPTCHA.

## User Scenarios *(mandatory)*

### User Story 1 - Native App Authentication (Priority: P1)

As a visitor, I want to register, verify my identity, sign in, and recover my password from app-owned screens so I can access the product without depending on Keycloak-hosted pages for the normal login journey.

**Why this priority**: This is the core product requirement. Without an app-owned auth journey, the feature does not meet the primary UX goal.

**Independent Validation**: A new user can complete sign-up, verify email, sign in with email or optional username, and use password reset entirely through app-owned routes.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user opens a protected route, **When** the app requires authentication, **Then** the user is redirected to an app-owned sign-in route.
2. **Given** a new user completes sign-up successfully, **When** email verification is still pending, **Then** the user cannot complete normal product access until verification succeeds.
3. **Given** a user successfully signs in through a supported native method, **When** authentication succeeds, **Then** the app starts a session and returns the user only to a validated internal destination.
4. **Given** a user forgets their password, **When** they complete the reset flow, **Then** the password is updated and all other active sessions are revoked.

---

### User Story 2 - Protected Product Access (Priority: P1)

As an authenticated user, I want the app to grant or deny access based on Laravel-owned application authorization so I only see protected content when I am actually allowed to use the product.

**Why this priority**: Authentication alone is not enough. The app must honor Laravel as the source of truth for access decisions.

**Independent Validation**: Verified users who satisfy Laravel policy reach protected routes, while users who fail policy or cannot be resolved do not see protected content.

**Acceptance Scenarios**:

1. **Given** a verified user is authorized by Laravel, **When** session establishment completes, **Then** the user reaches `/dashboard` or the intended protected destination.
2. **Given** a verified user is denied by Laravel policy, **When** provisioning or current-user resolution completes, **Then** the user is shown a generic blocked-access outcome and protected content is not rendered.
3. **Given** Laravel becomes temporarily unavailable during access resolution, **When** the auth session is otherwise valid, **Then** the app fails closed and shows a temporary auth-availability state rather than protected content.
4. **Given** Laravel revokes a user's access after sign-in, **When** Laravel triggers the revocation hook, **Then** the user's active app session is invalidated immediately.

---

### User Story 3 - Optional Enterprise SSO (Priority: P2)

As a user whose organization uses Keycloak, I want an optional SSO path that works alongside the native auth journey so I can use enterprise identity without replacing the default app-owned experience for everyone else.

**Why this priority**: Enterprise SSO matters, but it is secondary to establishing the native app-owned auth path.

**Independent Validation**: When SSO is enabled, a user can choose the Keycloak option, complete the provider flow, and continue through the same Laravel access resolution path as native users.

**Acceptance Scenarios**:

1. **Given** SSO is enabled by configuration, **When** a user selects the SSO option, **Then** the app routes them through Keycloak and returns them to the app-owned flow after success.
2. **Given** a first-time SSO user matches an existing account by verified email, **When** SSO succeeds, **Then** the account may be linked under the strict matching rules and access is resolved through Laravel.
3. **Given** an SSO user signs out, **When** logout completes, **Then** the local app session ends without forcing a global Keycloak logout.

### Edge Cases

- What happens when a user signs in successfully but Laravel cannot resolve the user profile or authorization state?
- What happens when Laravel provisioning or current-user resolution is temporarily unavailable?
- What happens when a user tries to sign in before verifying email?
- What happens when sign-up is attempted with an email or username that already belongs to another account?
- What happens when a user starts SSO but cancels the provider flow or the provider returns an error?
- What happens when Laravel disables a user after sign-in and triggers immediate revocation?
- What happens when a user changes their verified email later, given that email is the first-slice Laravel linking key?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide app-owned routes for sign-in, sign-up, email-verification completion, and password reset or recovery.
- **FR-002**: The system MUST support at least one primary native sign-in method that does not rely on enterprise identity-provider-hosted pages.
- **FR-003**: The first-slice native sign-up flow MUST require email and password, MAY accept an optional username, and MUST include a required terms or privacy acceptance checkbox.
- **FR-004**: The native sign-in flow MUST accept email or username, while limiting username sign-in to accounts that have a username.
- **FR-005**: Usernames MUST be case-insensitive for uniqueness and sign-in matching.
- **FR-006**: Email verification MUST be required before a newly registered native account can complete normal product access, and the system MUST provide a resend-verification path.
- **FR-007**: The system MUST support self-service password reset in the first slice.
- **FR-008**: After a successful password reset, the system MUST revoke all other active sessions while allowing the reset-completing flow to finish safely.
- **FR-009**: The system MUST create and maintain an authenticated app session after successful authentication until sign-out, expiry, or revocation.
- **FR-010**: The first-slice session lifetime MUST be approximately 24 hours with refresh while active.
- **FR-011**: The system MUST require a valid authenticated session before rendering `/dashboard` or nested internal dashboard routes.
- **FR-012**: The system MUST establish product access through Laravel-backed authorization during session establishment before granting protected access.
- **FR-013**: Laravel MUST remain the source of truth for application authorization, roles, and permissions.
- **FR-014**: The frontend MUST treat Laravel roles and permissions as read-only data for access gating and display decisions.
- **FR-015**: The system MUST use verified email as the first-slice Laravel identity-link key, even when username login is enabled.
- **FR-016**: The system MUST allow verified sign-ups and first-time SSO logins to pass through an explicit synchronous Laravel provisioning or upsert path before protected access is granted.
- **FR-017**: The Laravel provisioning or upsert path MUST be idempotent and MUST return the resolved application-user access payload directly to the app.
- **FR-018**: Laravel MUST evaluate self-service authorization policy using Laravel-owned rules such as approved domains, invites, or existing business records.
- **FR-019**: If Laravel denies or cannot link product access, the system MUST block protected access and show a generic blocked-access outcome without exposing the specific denial reason to the user.
- **FR-020**: If Laravel is temporarily unavailable during required access resolution, the system MUST fail closed and show a temporary auth-availability outcome instead of protected content.
- **FR-021**: Laravel MUST be able to revoke active app sessions immediately through a dedicated internal revocation hook into the auth layer.
- **FR-022**: The system MUST preserve intended destinations only when they are validated internal paths.
- **FR-023**: The system MUST route already-authenticated users away from sign-in and sign-up pages.
- **FR-024**: The Keycloak SSO option MUST be visible only when explicitly enabled by configuration.
- **FR-025**: The system MUST NOT require users choosing SSO to enter enterprise credentials into app-owned forms.
- **FR-026**: First-time Keycloak SSO users MUST go through the same Laravel provisioning and authorization path as verified native users.
- **FR-027**: SSO account auto-linking MUST require a strict verified-email match in the first slice.
- **FR-028**: Signing out an SSO user in the first slice MUST end only the local app session and MUST NOT force upstream Keycloak global logout.
- **FR-029**: Public auth failures such as unknown account, existing email, existing username, and reset eligibility MUST use generic user-facing responses that do not confirm account existence.
- **FR-030**: The system MUST apply basic rate limiting to sign-in, sign-up, resend-verification, and password-reset flows in the first slice.
- **FR-031**: The system MUST generate app-owned verification and reset links while allowing Laravel to deliver the branded emails through an internal mail-delivery API.
- **FR-032**: The system MUST keep account-linking capability in the data model and contracts for future account-management flows without requiring that user-facing UI in the first slice.
- **FR-033**: The system MUST allow self-service sign-up to be disabled by configuration later, and when disabled it MUST hide sign-up actions and redirect `/auth/sign-up` requests to `/auth/sign-in`.
- **FR-034**: Better Auth secrets, Keycloak settings, database connection settings, internal server-to-server auth secrets, and related auth runtime configuration MUST be provided through the app's `.env` file rather than hard-coded configuration.

### Key Entities *(include if feature involves data)*

- **Authenticated Session**: Represents the user's active signed-in state, including session lifetime, safe return target, and the resolved product-access state established for that session.
- **Better Auth Account**: Represents the native or SSO-capable auth identity, including verified email, optional username, sign-in methods, and future linking capability.
- **Application User Record**: Represents the Laravel-owned product user profile, authorization state, roles, permissions, and any business data required for protected access.
- **Provisioning Result**: Represents the synchronous backend outcome of creating, confirming, or denying product access during first-time native or SSO entry.
- **Revocation Request**: Represents the internal Laravel-to-auth signal that invalidates active sessions when access is revoked after sign-in.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New or returning users can complete the primary native sign-in flow and reach their intended protected destination in 2 minutes or less on the first attempt in at least 90% of observed tests.
- **SC-002**: 100% of unauthenticated attempts to access protected routes are redirected to app-owned auth or access-control experiences before protected content is revealed.
- **SC-003**: 100% of verified users who satisfy Laravel authorization policy either receive protected access or a temporary backend-unavailable outcome before protected content is rendered.
- **SC-004**: 100% of denied users are prevented from reaching protected content and receive a blocked-access outcome.
- **SC-005**: The default non-SSO auth journey is completed entirely within app-owned pages for 100% of tested native sign-in, sign-up, verification, and password-reset scenarios.
- **SC-006**: 100% of first-time self-service sign-ups and first-time SSO logins complete synchronous Laravel provisioning or fail closed without exposing protected content.

## Assumptions

- The first release covers one native auth method plus optional enterprise SSO, rather than the full future set of Better Auth plugins and account-management screens.
- The Laravel backend can expose synchronous current-user and provisioning interfaces plus an internal revocation interface needed by the auth flow.
- Protected access in the first slice applies to `/dashboard` and nested internal dashboard routes while the landing page remains public.
- Enterprise SSO is optional and may be enabled only for users or organizations that need it, without changing the default native sign-in path for everyone else.
- Keycloak credentials, Better Auth secrets, database connection settings, mail-delivery integration values, and related auth runtime configuration are provided through the app's `.env` file rather than hard-coded configuration.
