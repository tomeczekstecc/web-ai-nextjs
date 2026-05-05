# Data Model: App-First Authentication

## 1. Better Auth Account

**Purpose**: Represents the app-facing auth identity managed by Better Auth.

**Fields**:
- `id`: Internal auth identifier.
- `email`: Unique normalized email used for verification and Laravel identity linkage.
- `emailVerified`: Verification status that gates normal product access.
- `username`: Optional unique login identifier, case-insensitive for uniqueness and sign-in.
- `displayName`: Optional auth-layer display hint.
- `image`: Optional auth-layer avatar hint.
- `createdAt`: Creation timestamp.
- `updatedAt`: Last update timestamp.

**Validation Rules**:
- Email must be unique and normalized.
- Username is optional, but if present it must be unique after normalization.
- Password policy requires at least 12 characters.
- Email changes require re-verification before the new address becomes the Laravel linkage identity.

**Relationships**:
- One Better Auth Account has many Sessions.
- One Better Auth Account can have multiple provider connections over time.
- One Better Auth Account can map to zero or one active Laravel Application User in the first slice.

## 2. Auth Session

**Purpose**: Represents the browser session used for native or SSO-authenticated product access.

**Fields**:
- `id`: Session identifier.
- `accountId`: Foreign key to Better Auth Account.
- `expiresAt`: Session expiry timestamp.
- `createdAt`: Session creation timestamp.
- `updatedAt`: Last refresh timestamp.
- `returnTo`: Validated internal destination carried through auth transitions.
- `accessSnapshot`: Last resolved Laravel application-user access payload captured for the session.
- `revocationState`: `active`, `revoked`, or `expired`.

**State Transitions**:
- `pending` -> `active` after successful auth and Laravel access resolution.
- `active` -> `revoked` through sign-out, password reset for other sessions, or Laravel revocation hook.
- `active` -> `expired` when the session lifetime is reached.

## 3. Laravel Application User

**Purpose**: Represents the backend-owned product user and authorization record.

**Fields**:
- `appUserId`: Laravel-side user identifier.
- `email`: Canonical verified email linkage key.
- `displayName`: Product-facing display name owned by Laravel.
- `avatarUrl`: Optional product avatar.
- `roles`: Laravel-owned role list.
- `permissions`: Laravel-owned permission list.
- `accessState`: `active`, `blocked`, `denied`, or `unavailable` from the app's perspective.
- `organizationName`: Optional organization context.

**Rules**:
- Laravel remains the owner of canonical product profile and authorization data.
- Better Auth may send profile hints, but Laravel decides what to persist.
- Username is not used as the first-slice Laravel identity key.

## 4. Provisioning Result

**Purpose**: Represents the synchronous Laravel outcome after verified sign-up or first-time SSO.

**Fields**:
- `status`: `authorized`, `denied`, `blocked`, or `unavailable`.
- `appUser`: Optional Laravel Application User payload.
- `reasonCode`: Internal denial or failure reason for logs and operator context.
- `createdOrUpdated`: Whether provisioning created, updated, or confirmed an existing record.

**Rules**:
- The provisioning endpoint must be idempotent.
- The provisioning result is used directly by the app without requiring an immediate second access lookup.
- User-facing UX remains generic even when `reasonCode` is specific.

## 5. Sign-In Method

**Purpose**: Describes how the account authenticated into the app.

**Fields**:
- `id`: Stable identifier such as `password` or `keycloak`.
- `type`: `native` or `sso`.
- `enabled`: Whether the method is currently available.
- `providerSubject`: Optional upstream subject value for federated logins.
- `linked`: Whether the method is already linked to an existing account.

**Rules**:
- Native methods are available by default.
- SSO methods are enabled only through explicit configuration.
- Account-linking UI is deferred, but the model preserves future support.

## 6. Revocation Request

**Purpose**: Represents the internal Laravel-to-auth command to invalidate active sessions after access is revoked.

**Fields**:
- `email`: Verified email or other recognized identity reference.
- `reason`: Internal revocation reason.
- `requestedAt`: Request timestamp.
- `scope`: Session-revocation scope for the matched account.

**Rules**:
- Requests are authenticated with a dedicated internal secret separate from the Laravel current-user lookup secret.
- Revocation is immediate and fails closed if the request is valid.
