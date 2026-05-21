# Laravel start guide

This document is the contract between this Next.js app and the Laravel
backend it talks to. Read it first if you are picking up the Laravel
side of the project, or if you need to add a new endpoint that crosses
the boundary.

It covers:

1. [Role of Laravel in the system](#1-role-of-laravel-in-the-system)
2. [Auth trust model](#2-auth-trust-model)
3. [HTTP envelope and error shape](#3-http-envelope-and-error-shape)
4. [Endpoint catalog](#4-endpoint-catalog)
5. [Permission and role contract](#5-permission-and-role-contract)
6. [Reverse calls (Laravel → Next.js)](#6-reverse-calls-laravel--nextjs)
7. [Local development](#7-local-development)
8. [Adding a new endpoint](#8-adding-a-new-endpoint)

Authoritative source for the TypeScript side: `src/lib/api/domains/*`
and `src/lib/auth/*`. Authoritative source for the auth migration plan:
`docs/rbac-plan.md` §18.

---

## 1. Role of Laravel in the system

Laravel is the **domain backend**. It owns:

- The application database (users, organizations, applications, tasks,
  everything domain-specific).
- The **source of truth for roles and permissions**. Next.js does not
  decide who is an Admin; Laravel does, and ships that decision in the
  `/me` response.
- All write-side business logic. Next.js never mutates domain state
  directly; it always goes through a Laravel endpoint.

Next.js (this repo) is the **auth front-door and BFF**. It owns:

- The Better-Auth session store (`auth_users`, `auth_sessions`,
  `auth_accounts`, `auth_verifications`, `jwks`). This is a separate
  Postgres schema/database from Laravel's domain DB.
- Sign-in / sign-up / password reset / verification UX.
- Issuing short-lived JWTs (via the Better-Auth `jwt()` plugin) that
  authenticate every server-to-server call into Laravel.
- RBAC gating in the UI based on roles/permissions returned by
  Laravel's `/me`.

This split means: Laravel never sees a password, and Next.js never
stores domain data. Each side has one job.

---

## 2. Auth trust model

There are **two modes**, switched by the Next.js env var
`AUTH_LARAVEL_BRIDGE_MODE`. Both are documented here because the
migration ships in two phases.

### 2.1 `internal-token` mode (legacy, default today)

Every outbound call from Next.js includes:

| Header             | Required | Description                                    |
| ------------------ | -------- | ---------------------------------------------- |
| `X-Internal-Auth`  | yes      | Shared secret. Must equal Laravel's `LARAVEL_INTERNAL_AUTH_TOKEN`. |
| `X-Auth-Email`     | yes\*    | Email of the user the request is being made on behalf of. |
| `X-Auth-Provider`  | yes\*    | Currently always `"password"`. Forward-compatible for OAuth providers later. |
| `X-Auth-Subject`   | optional | Provider-specific user id, when known.        |

\* On user-scoped endpoints (`/me`, `/auth/provision`). Not required on
service-level endpoints if any are added later.

**Important:** in this mode `X-Auth-Email` is *trusted*. Anyone who
holds `X-Internal-Auth` can impersonate any user by setting the email
header to whatever they want. The shared secret is therefore a
god-mode credential. Treat the Next ↔ Laravel network path as a trust
boundary (private network, mTLS at the edge, etc.).

### 2.2 `jwt` mode (target)

Every outbound call from Next.js includes:

| Header              | Required | Description                                  |
| ------------------- | -------- | -------------------------------------------- |
| `Authorization`     | yes      | `Bearer <JWT>` minted by Better-Auth.        |
| `X-Internal-Auth`   | yes      | Kept transitionally for endpoints that have not migrated yet (auth mail, revoke). Drop when full cut-over. |

The JWT is asymmetrically signed (EdDSA by default). Laravel verifies
it against the JWKS endpoint exposed by Next.js. **The verified `sub`
claim is the only authoritative identity** — `X-Auth-Email` is no
longer sent in this mode.

**JWKS endpoint:** `${BETTER_AUTH_URL}/api/auth/jwks`
Returns `{ keys: [...] }`. Cache for 1 hour in Laravel.

**JWT claims:**

```json
{
  "iss": "https://app.example.com",
  "aud": "https://app.example.com",
  "sub": "better-auth-user-id",
  "iat": 1700000000,
  "exp": 1700000300,
  "id": "better-auth-user-id",
  "email": "user@example.com",
  "emailVerified": true,
  "name": "User Name"
}
```

- `iss` / `aud` are configurable on the Next side via
  `BETTER_AUTH_URL` and `AUTH_LARAVEL_BRIDGE_AUDIENCE`. Pin both in
  Laravel config.
- `exp` is 5 minutes from `iat`. Allow ±60s clock skew (`JWT::$leeway`
  in `firebase/php-jwt`).
- The payload is **identity-only**. No roles, no permissions. Laravel
  is still the source of truth for those, looked up by `sub`.

### 2.3 Reference middleware

A full copy-paste-ready PHP middleware (`VerifyNextAuthJwt`) lives in
`docs/rbac-plan.md` §18.3. Use it as the starting point. The cut-over
checklist (DB migration, JWKS smoke test, staging flip, prod flip) is
§18.4.

---

## 3. HTTP envelope and error shape

### 3.1 Success

For a single resource:

```json
{ "id": "...", "label": "...", "created_at": "...", "updated_at": "..." }
```

For a list (note the envelope — used by `applications` and any future
listing endpoint):

```json
{
  "items": [ /* ... */ ],
  "page": 1,
  "pageSize": 25,
  "totalItems": 137,
  "totalPages": 6
}
```

`page` and `pageSize` echo back the request inputs.

### 3.2 Error

On any non-2xx, the body **must** be JSON with at least:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Human-readable, localized in Polish for the UI.",
  "details": { /* optional, free-form */ }
}
```

The Next-side parser (`src/lib/api/core/http.ts`) reads `message` for
toasts. If `message` is missing, a generic fallback is shown — please
always include one.

Status code conventions:

| Code | When to use                                              |
| ---- | -------------------------------------------------------- |
| 400  | Validation error in the request body / query.            |
| 401  | Auth missing or invalid JWT / shared-secret token.       |
| 403  | Auth valid but the user is denied (use `reason_code` payload — see §4.2). |
| 404  | Resource does not exist.                                 |
| 409  | Conflict (duplicate, state machine violation).           |
| 422  | Acceptable shape, business rule violation.               |
| 500  | Server bug. Should be rare; always include trace id in `details`. |

### 3.3 Date and timestamp shape

All timestamps are ISO 8601 strings in UTC (`2024-05-01T12:34:56.000Z`).
The Next side parses them into `Date` objects in domain mappers. Do not
send Unix epochs.

### 3.4 Field naming

The wire is **`snake_case`**. Next.js domain mappers convert to
`camelCase` for internal use. Examples:

| Wire (Laravel)      | Internal (Next)    |
| ------------------- | ------------------ |
| `created_at`        | `createdAt`        |
| `display_name`      | `displayName`      |
| `access_state`      | `accessState`      |
| `reason_code`       | `reasonCode`       |

Keep that contract: do not send mixed casing.

---

## 4. Endpoint catalog

Base URL on Next side: `API_URL` env var (e.g. `https://api.example.com`).
All paths are relative to that.

### 4.1 `GET /me`

Resolve the current app user, given an authenticated session.

**Called by:** `src/lib/api/domains/auth-user/queries.ts`
on every server render that needs the principal (deduped per request
via `React.cache`).

**Auth:** user-scoped. JWT mode: `Authorization: Bearer <jwt>` with
`sub = better-auth-user-id`. Legacy mode: trusted headers (§2.1).

**Request:** no body.

**Success 200:**

```json
{
  "id": "01H...",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "avatar_url": "https://...",
  "access_state": "active",
  "roles": ["Admin"],
  "permissions": ["dashboard:read", "applications:read", "admin:access"],
  "organization_name": "Acme Sp. z o.o."
}
```

- `id` is **Laravel's** internal user id (string). It is what Next.js
  surfaces as `appUser.id`.
- `display_name` and `email` are always non-null.
- `avatar_url` and `organization_name` are optional (`null` allowed).
- `access_state` is currently the literal string `"active"`. Other
  values are not handled by the Next side yet — if you need
  `"suspended"`, `"pending"`, etc., coordinate the Next change first.
- `roles` and `permissions` see §5.

**Errors:**

| Status | Behavior                                                              |
| ------ | --------------------------------------------------------------------- |
| 401    | Invalid JWT / missing trusted headers. Next-side renders sign-in.    |
| 403    | The Better-Auth user exists but has no Laravel mapping yet. Next-side falls through to `provisionAuthUser` (`POST /auth/provision`). |
| 404    | Treated as 403 by the Next-side mapper today. Prefer 403.            |

### 4.2 `POST /auth/provision`

Idempotently create or refresh the Laravel user record for a freshly
authenticated Better-Auth identity. Called immediately after sign-up,
and as the fallback when `/me` returns 403/404.

**Called by:** `src/lib/api/domains/auth-user/commands.ts`.

**Auth:** same as `/me`.

**Request body:**

```json
{
  "email": "user@example.com",
  "email_verified": true,
  "username": "janedoe",
  "display_name": "Jane Doe",
  "provider": "password",
  "provider_subject": null,
  "image": null
}
```

- `email`, `email_verified`, `provider` are always present.
- `username`, `display_name`, `provider_subject`, `image` may be `null`.
- `provider` is currently always `"password"`. The union is open in the
  Next code (`AuthProvider` in `src/lib/api/domains/auth-user/contract.ts`)
  so when social providers ship, the values will be `"google"`,
  `"apple"`, `"facebook"`.

**Success 200:**

```json
{
  "status": "authorized",
  "app_user": { /* same shape as GET /me response */ },
  "created_or_updated": "created"
}
```

- `created_or_updated` is `"created"` if a new Laravel user was
  inserted, `"updated"` if an existing one was refreshed,
  `"confirmed"` if nothing changed. Optional — Next will treat it as
  `"confirmed"` if missing.

**Denied 403:**

```json
{
  "status": "denied",
  "reason_code": "ORGANIZATION_NOT_FOUND"
}
```

- `reason_code` is optional. Use stable, screaming-snake codes; Next
  may map them to friendlier copy. Known codes today: free-form
  (the Next side just surfaces them in audit logs). Document new ones
  here as they appear.

**Unavailable / 5xx:** Next surfaces a generic "we couldn't establish
access" message and lets the user retry. Do not retry server-side
forever — return 503 fast and let the front-end decide.

### 4.3 `POST /api/applications`

Create an application for the current user.

**Called by:** `src/lib/api/domains/applications/commands.ts`.

**Auth:** user-scoped (same as `/me`).

**Request body:**

```json
{ "label": "My first application" }
```

**Success 201 (or 200):**

```json
{
  "id": "...",
  "label": "My first application",
  "status": "draft",
  "created_at": "2024-05-01T12:34:56.000Z",
  "updated_at": "2024-05-01T12:34:56.000Z"
}
```

`status` ∈ `"draft" | "submitted" | "archived"`.

### 4.4 `POST /api/applications/{id}/submit`

Transition an application to `submitted`.

**Success 200:** the updated application (same shape as 4.3 response).

**Errors:**

- 404 if not found / not owned by the caller.
- 409 if the state machine refuses the transition.

### 4.5 `GET /api/applications`

List the caller's applications, paginated and filtered.

**Query string:**

| Param      | Type     | Default | Notes                                       |
| ---------- | -------- | ------- | ------------------------------------------- |
| `page`     | int      | 1       | 1-based.                                    |
| `pageSize` | int      | 25      | Cap at something reasonable on the server.  |
| `search`   | string   | —       | Free text over `label`.                     |
| `status`   | enum     | —       | One of the `ApplicationStatus` values.      |
| `sort`     | enum     | `createdAt:desc` | `label:asc \| label:desc \| status:asc \| status:desc \| createdAt:asc \| createdAt:desc \| updatedAt:asc \| updatedAt:desc`. |

**Success 200:** list envelope from §3.1.

### 4.6 `GET /api/applications/{id}`

Single application by id.

**Success 200:** single resource shape from §4.3.

### 4.7 `GET /api/public/landing-page`

Public, **unauthenticated**. CMS content for the marketing landing page.
Schema in `src/lib/api/domains/landing-page/contract.ts`. Next has a
hard-coded fallback for when this is down or 5xxs, so it is allowed to
fail loudly — better than serving stale content silently.

---

## 5. Permission and role contract

This section is the heart of the cross-system contract. Get it wrong
and either the UI hides things it shouldn't or shows things the
backend will then 403 on.

> **Frontend developers:** for *how to actually use* roles and
> permissions in Next.js code, read
> [`docs/permissions.md`](./permissions.md). This section describes
> what Laravel must send; that doc describes what Next.js does with
> it.

### 5.1 Roles

Three canonical roles, **case-sensitive**, PascalCase:

```
User | Oper | Admin
```

The string literal union lives in `src/lib/auth/principal.ts` as
`APP_ROLES`. Laravel **must** send these exact strings in the `roles`
array. The Next side has a tolerant `normalizeRole()` that maps
`"admin"` → `"Admin"` for resilience, but please don't rely on that —
treat PascalCase as the contract.

A user may have multiple roles. They are additive: permissions are the
union across all assigned roles.

### 5.2 Permissions

Permission strings have the shape `domain:action`, lowercase.

Today's known catalog (Next-side mirror in
`src/lib/auth/principal.ts`):

| Role  | Permissions                                                                 |
| ----- | --------------------------------------------------------------------------- |
| User  | `dashboard:read`, `applications:read`                                       |
| Oper  | User's, plus `applications:write`, `tasks:read`, `tasks:write`              |
| Admin | Oper's, plus `users:read`, `users:write`, `admin:access`                    |

**Laravel is the source of truth.** Next.js has the table above only as
a fallback for when `/me` doesn't include `permissions` (it always
should — keep it that way). If Laravel and the table disagree,
Laravel wins for the actual session, but the table determines what
the UI is *prepared* to show.

When you add a new permission:

1. Add it to Laravel's role definitions.
2. Add it to `ROLE_PERMISSIONS` in `src/lib/auth/principal.ts` so
   Next's UI gates know about it.
3. If the permission gates a menu item, add it to
   `src/mocks/data/menu.ts` (`perms.list`).

### 5.3 `access_state`

Currently `"active"` is the only value the Next-side handles. If you
need to model suspended/pending users, file a coordination ticket
first — Next has gating UX work to do before that value can be
returned.

---

## 6. Reverse calls (Laravel → Next.js)

A small number of endpoints live on Next.js for Laravel to call back
into. They are auth-data lifecycle hooks that only Next can fulfill
because Better-Auth owns those tables.

### 6.1 `POST /api/internal/auth/revoke`

Invalidate all sessions for a given email. Used by Laravel when a user
is disabled, has their access revoked, or changes critical settings
that should boot them out of all devices.

**Auth header:** `X-Internal-Auth-Revoke: <LARAVEL_INTERNAL_AUTH_REVOKE_TOKEN>`.
This is a **separate** shared secret from `LARAVEL_INTERNAL_AUTH_TOKEN`
(intentionally, to scope blast radius).

**Request body:**

```json
{ "email": "user@example.com", "reason": "optional audit detail" }
```

**Success 200:**

```json
{ "revoked": 3, "reason": "manual_admin_action" }
```

Returns `{ revoked: 0 }` (still 200) if the email is unknown — the
operation is idempotent.

### 6.2 Auth mail bridge

Not implemented yet. If/when Laravel needs to trigger Next-side auth
mail, the env hook is `LARAVEL_INTERNAL_AUTH_MAIL_TOKEN`. File issues
against this repo when the spec firms up.

---

## 7. Local development

### 7.1 Networking

- Next.js dev server: `pnpm dev`, port `3600`.
- Laravel reads `NEXT_AUTH_JWKS_URL`, `NEXT_AUTH_ISSUER`, and
  `NEXT_AUTH_AUDIENCE` from its `.env`.
- Next.js reads `API_URL` (server-side fetch base) from `.env`.
- On a single dev box: point Laravel at `http://localhost:3600` and
  Next at `http://localhost:8000` (or whatever your Laravel port is).
- On Docker Compose: use service names; don't rely on `localhost`.

### 7.2 Running without Laravel

Set in Next's `.env`:

```
AUTH_LARAVEL_MOCK_ENABLED=true
AUTH_MOCK_ROLE=Admin      # or User / Oper
```

The Next side then synthesizes a `LaravelAppUser` from the
Better-Auth identity instead of calling `/me` or `/auth/provision`.
Mock implementation lives in `src/lib/api/domains/auth-user/mock.ts`.

This is **hard-disabled in production** (`NODE_ENV === 'production'`
short-circuits the flag), so it cannot leak.

### 7.3 Smoke test — JWT path

Once Laravel has the JWT middleware deployed:

1. Run the Next migration: `psql $DATABASE_URL -f migrations/0001_better_auth_schema.sql` (see `migrations/README.md` for the full file inventory).
2. Restart Next so the JWT plugin can lazy-init.
3. `curl http://localhost:3600/api/auth/jwks` → expect `{ "keys": [...] }`.
4. Sign in via the Next UI, then in the browser dev tools fetch
   `/api/auth/token` (any authenticated browser session can hit it).
5. `curl http://localhost:8000/me -H "Authorization: Bearer <token>"` →
   expect the `LaravelAppUserPayload` response.
6. Flip Next's `AUTH_LARAVEL_BRIDGE_MODE=jwt` and re-test the full app
   flow.

If any step 401s with `invalid_issuer` / `invalid_audience`, the most
common cause is `NEXT_AUTH_ISSUER` / `NEXT_AUTH_AUDIENCE` in Laravel
not matching `BETTER_AUTH_URL` / `AUTH_LARAVEL_BRIDGE_AUDIENCE` in
Next. They must match character-for-character (no trailing slash
drift).

### 7.4 Database layout

Two distinct Postgres databases:

- **Auth DB** (owned by Next, schema managed by Better-Auth). DDL
  lives in `migrations/0001_better_auth_schema.sql` — see
  `migrations/README.md` for conventions and the file inventory.
  Current tables:
  - Core: `auth_users`, `auth_sessions`, `auth_accounts`,
    `auth_verifications`
  - JWT plugin: `jwks`
  - Organization plugin: `organizations`, `organization_members`,
    `organization_invitations` (schema is provisioned; the plugin is
    registered but no UI consumes it yet)
  - Connection string: Next's `DATABASE_URL`.
- **Domain DB** (owned by Laravel, schema managed by Laravel
  migrations). Everything else.

Do not let Laravel write to the auth DB. If you need to invalidate
sessions, use §6.1. If you need to read auth state, call `/me`. If you
need organization data once that plugin is wired up, expose it through
a Next-side endpoint rather than reaching across the boundary.

---

## 8. Adding a new endpoint

Sequencing matters. Doing this in order saves a deployment dance.

1. **Define the contract** in `src/lib/api/domains/<domain>/contract.ts`.
   Wire shape (`snake_case`) and internal shape (`camelCase`), plus a
   mapper.
2. **Stub it in the mock layer** (`src/mocks/handlers/<domain>.ts`) so
   the front-end can develop against it without Laravel.
3. **Implement on Laravel.** Match the contract exactly. Add the
   `VerifyNextAuthJwt` middleware to the route group. Add Pest tests
   for the JSON shape.
4. **Add the queries/commands** on the Next side. They must go through
   `apiRequest` and `buildBridgeUserHeaders` for any user-scoped call.
   Never inline header building.
5. **Add a domain mapper** to translate the wire shape to the internal
   one. Server components consume the internal shape; the wire shape
   never leaves the domain folder.
6. **Update this guide** in §4 (endpoint catalog). The guide *is* the
   contract; if it isn't in here, it isn't agreed.
7. **Update permissions** if the endpoint introduces a new
   capability — both in Laravel and in `ROLE_PERMISSIONS`
   (`src/lib/auth/principal.ts`).

If you're adding a *reverse* call (Laravel → Next), add it under §6 and
gate it behind its own scoped token (do **not** reuse
`LARAVEL_INTERNAL_AUTH_TOKEN`).

---

## Quick reference

| Need to…                                  | File                                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------- |
| See every endpoint Next calls             | `src/lib/api/domains/*/queries.ts` and `commands.ts`                                    |
| See the auth handshake                    | `src/lib/api/domains/auth-user/bridge-headers.ts`                                       |
| Understand JWT minting                    | `src/lib/auth/backend-token.ts` and `src/lib/auth.ts` (`jwt()` plugin block)            |
| Read the migration plan                   | `docs/rbac-plan.md` §18                                                                  |
| Verify a JWT in Laravel (reference impl)  | `docs/rbac-plan.md` §18.3                                                                |
| Add a new role/permission                 | `src/lib/auth/principal.ts` + Laravel role definitions                                  |
| Apply the auth-DB schema                  | `migrations/0001_better_auth_schema.sql` (see `migrations/README.md`)                   |
| Toggle the bridge auth mode               | `AUTH_LARAVEL_BRIDGE_MODE` in Next's `.env`                                             |
| Revoke sessions from Laravel              | `POST /api/internal/auth/revoke` (see §6.1)                                             |
