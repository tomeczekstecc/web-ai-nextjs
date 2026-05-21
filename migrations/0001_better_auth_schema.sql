-- =====================================================================
-- 0001 — better-auth full schema
-- =====================================================================
--
-- Authoritative DDL for the auth database used by Next.js / Better-Auth.
--
-- This file is the single source of truth for what better-auth expects
-- to find in the database, given the plugin set configured in
-- `src/lib/auth.ts`:
--
--   - core (user, session, account, verification)
--   - username plugin
--   - jwt plugin (jwks table)
--   - organization plugin (organizations, members, invitations)
--
-- NOTE: at the time of writing, the `organization()` plugin is NOT
-- registered in `src/lib/auth.ts` — our RBAC is global, not per-tenant,
-- and role assignments come from Laravel via `GET /me`
-- (see `docs/laravel-start-guide.md` §5). The organization tables and
-- the `auth_sessions.active_organization_id` column are still
-- provisioned here so that turning the plugin on later is a code-only
-- change with no second migration window.
--
-- All identifier casing is snake_case. The Better-Auth field mappings
-- in `src/lib/auth.ts` align every camelCase model field to the column
-- names below. If you add or remove a plugin, update BOTH `auth.ts`
-- AND this file.
--
-- Conventions
-- -----------
-- - Primary keys are text (Better-Auth generates ULIDs).
-- - All timestamps are timestamptz, default `now()` where appropriate.
-- - Foreign keys cascade on user delete (matches Better-Auth semantics
--   for sessions/accounts). Organization membership cascades on org
--   delete; invitations cascade on org delete.
-- - Indexes mirror what the Better-Auth adapter declares via `index: true`
--   in its schema definitions.
--
-- Idempotency
-- -----------
-- Statements use `IF NOT EXISTS` / `IF EXISTS` so re-running this file
-- on an already-provisioned database is a no-op. They are NOT migrations
-- in the up/down sense — if you alter a column, write a follow-up file
-- (`0002_*.sql`, `0003_*.sql`, …).
--
-- Apply
-- -----
--   psql "$DATABASE_URL" -f migrations/0001_better_auth_schema.sql
-- =====================================================================


-- ---------------------------------------------------------------------
-- Core: auth_users
-- ---------------------------------------------------------------------
-- Better-Auth model: `user` (modelName: "auth_users")
-- `username` / `display_username` are contributed by the username plugin.
CREATE TABLE IF NOT EXISTS auth_users (
  id                text        PRIMARY KEY,
  name              text,
  email             text        NOT NULL,
  email_verified    boolean     NOT NULL DEFAULT false,
  image             text,
  username          text,
  display_username  text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Email must be unique (Better-Auth enforces this in the adapter).
CREATE UNIQUE INDEX IF NOT EXISTS auth_users_email_key
  ON auth_users (lower(email));

-- Username uniqueness, case-insensitive — matches the plugin's normalizer
-- (lowercases on input).
CREATE UNIQUE INDEX IF NOT EXISTS auth_users_username_key
  ON auth_users (username)
  WHERE username IS NOT NULL;


-- ---------------------------------------------------------------------
-- Core: auth_sessions
-- ---------------------------------------------------------------------
-- Better-Auth model: `session` (modelName: "auth_sessions")
-- `active_organization_id` is contributed by the organization plugin.
CREATE TABLE IF NOT EXISTS auth_sessions (
  id                       text        PRIMARY KEY,
  token                    text        NOT NULL UNIQUE,
  user_id                  text        NOT NULL
                                       REFERENCES auth_users (id)
                                       ON DELETE CASCADE,
  expires_at               timestamptz NOT NULL,
  ip_address               text,
  user_agent               text,
  active_organization_id   text,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx
  ON auth_sessions (user_id);

CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
  ON auth_sessions (expires_at);


-- ---------------------------------------------------------------------
-- Core: auth_accounts
-- ---------------------------------------------------------------------
-- Better-Auth model: `account` (modelName: "auth_accounts")
-- One row per external identity link (password = one row, OAuth = one
-- row per provider). `password` stores the hashed credential for the
-- email/password provider.
CREATE TABLE IF NOT EXISTS auth_accounts (
  id                          text        PRIMARY KEY,
  user_id                     text        NOT NULL
                                          REFERENCES auth_users (id)
                                          ON DELETE CASCADE,
  account_id                  text        NOT NULL,
  provider_id                 text        NOT NULL,
  access_token                text,
  refresh_token               text,
  id_token                    text,
  access_token_expires_at     timestamptz,
  refresh_token_expires_at    timestamptz,
  scope                       text,
  password                    text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

-- A user can only link a given provider once.
CREATE UNIQUE INDEX IF NOT EXISTS auth_accounts_provider_account_key
  ON auth_accounts (provider_id, account_id);

CREATE INDEX IF NOT EXISTS auth_accounts_user_id_idx
  ON auth_accounts (user_id);


-- ---------------------------------------------------------------------
-- Core: auth_verifications
-- ---------------------------------------------------------------------
-- Better-Auth model: `verification` (modelName: "auth_verifications")
-- Short-lived tokens for email verification, password reset, etc.
CREATE TABLE IF NOT EXISTS auth_verifications (
  id           text        PRIMARY KEY,
  identifier   text        NOT NULL,
  value        text        NOT NULL,
  expires_at   timestamptz NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_verifications_identifier_idx
  ON auth_verifications (identifier);

CREATE INDEX IF NOT EXISTS auth_verifications_expires_at_idx
  ON auth_verifications (expires_at);


-- ---------------------------------------------------------------------
-- JWT plugin: jwks
-- ---------------------------------------------------------------------
-- Stores the asymmetric key pair the JWT plugin uses to sign tokens.
-- The public half is published at `${BETTER_AUTH_URL}/api/auth/jwks`
-- so Laravel can verify Bearer tokens. See `docs/rbac-plan.md` §18.
CREATE TABLE IF NOT EXISTS jwks (
  id            text        PRIMARY KEY,
  public_key    text        NOT NULL,
  private_key   text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz
);

-- Plugin reads the latest non-expired key on every mint.
CREATE INDEX IF NOT EXISTS jwks_created_at_idx
  ON jwks (created_at DESC);


-- ---------------------------------------------------------------------
-- Organization plugin: organizations
-- ---------------------------------------------------------------------
-- NOTE: the `organization()` plugin is NOT currently registered in
-- `src/lib/auth.ts` — our RBAC is global, not per-tenant (see header).
-- These tables are provisioned in advance so that turning the plugin on
-- later (for RBAC role storage, multi-tenant scoping, etc.) is a
-- code-only change with no second migration window.
--
-- Better-Auth model: `organization` (modelName: "organizations")
-- The tenant root. `metadata` is opaque JSON-as-text (Better-Auth
-- serializes via JSON.parse/stringify).
CREATE TABLE IF NOT EXISTS organizations (
  id           text        PRIMARY KEY,
  name         text        NOT NULL,
  slug         text        NOT NULL UNIQUE,
  logo         text,
  metadata     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx
  ON organizations (slug);


-- ---------------------------------------------------------------------
-- Organization plugin: organization_members
-- ---------------------------------------------------------------------
-- Better-Auth model: `member` (modelName: "organization_members")
-- Join table between users and organizations with a role string. Default
-- roles are `owner`, `admin`, `member`; can be extended via the plugin's
-- access-control config (orthogonal to app-level roles documented in
-- `docs/rbac-plan.md` §15).
CREATE TABLE IF NOT EXISTS organization_members (
  id                text        PRIMARY KEY,
  organization_id   text        NOT NULL
                                REFERENCES organizations (id)
                                ON DELETE CASCADE,
  user_id           text        NOT NULL
                                REFERENCES auth_users (id)
                                ON DELETE CASCADE,
  role              text        NOT NULL DEFAULT 'member',
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_members_unique
  ON organization_members (organization_id, user_id);

CREATE INDEX IF NOT EXISTS organization_members_organization_id_idx
  ON organization_members (organization_id);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
  ON organization_members (user_id);


-- ---------------------------------------------------------------------
-- Organization plugin: organization_invitations
-- ---------------------------------------------------------------------
-- Better-Auth model: `invitation` (modelName: "organization_invitations")
-- Pending invites to join an organization. `status` is one of
-- pending | accepted | rejected | canceled.
CREATE TABLE IF NOT EXISTS organization_invitations (
  id                text        PRIMARY KEY,
  organization_id   text        NOT NULL
                                REFERENCES organizations (id)
                                ON DELETE CASCADE,
  email             text        NOT NULL,
  role              text,
  status            text        NOT NULL DEFAULT 'pending',
  expires_at        timestamptz NOT NULL,
  inviter_id        text        NOT NULL
                                REFERENCES auth_users (id)
                                ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organization_invitations_organization_id_idx
  ON organization_invitations (organization_id);

CREATE INDEX IF NOT EXISTS organization_invitations_email_idx
  ON organization_invitations (email);


-- ---------------------------------------------------------------------
-- (Optional) Organization plugin: teams + team_members
-- ---------------------------------------------------------------------
-- These tables are only required when `organization({ teams: { enabled:
-- true } })` is set in `src/lib/auth.ts`. They are commented out here
-- to keep the schema minimal — uncomment together with the plugin
-- option when team-scoped permissions are needed.
--
-- CREATE TABLE IF NOT EXISTS teams (
--   id                text        PRIMARY KEY,
--   name              text        NOT NULL,
--   organization_id   text        NOT NULL
--                                 REFERENCES organizations (id)
--                                 ON DELETE CASCADE,
--   created_at        timestamptz NOT NULL DEFAULT now(),
--   updated_at        timestamptz
-- );
--
-- CREATE TABLE IF NOT EXISTS team_members (
--   id           text        PRIMARY KEY,
--   team_id      text        NOT NULL REFERENCES teams (id) ON DELETE CASCADE,
--   user_id      text        NOT NULL REFERENCES auth_users (id) ON DELETE CASCADE,
--   created_at   timestamptz NOT NULL DEFAULT now()
-- );


-- ---------------------------------------------------------------------
-- (Optional) Organization plugin: organization_roles
-- ---------------------------------------------------------------------
-- Only required when `organization({ dynamicAccessControl: { enabled:
-- true } })` is set. Lets each organization define its own role/
-- permission catalog at runtime (vs. compile-time roles in code).
--
-- CREATE TABLE IF NOT EXISTS organization_roles (
--   id                text        PRIMARY KEY,
--   organization_id   text        NOT NULL
--                                 REFERENCES organizations (id)
--                                 ON DELETE CASCADE,
--   role              text        NOT NULL,
--   permission        text        NOT NULL,        -- JSON-encoded
--   created_at        timestamptz NOT NULL DEFAULT now(),
--   updated_at        timestamptz
-- );
--
-- CREATE INDEX IF NOT EXISTS organization_roles_organization_id_idx
--   ON organization_roles (organization_id);
-- CREATE INDEX IF NOT EXISTS organization_roles_role_idx
--   ON organization_roles (role);

