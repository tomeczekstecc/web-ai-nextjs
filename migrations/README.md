# Auth-database migrations

SQL files in this folder describe the schema of the **auth database** —
the Postgres instance Better-Auth writes to via `DATABASE_URL` in
`.env`. This is *not* the Laravel domain database; do not run these
against it.

## Convention

- File names: `NNNN_short_description.sql`, four-digit zero-padded.
  `0001` is the baseline; later files are forward-only deltas.
- Every statement is idempotent (`IF NOT EXISTS` / `IF EXISTS`) so the
  baseline can be re-applied to an already-provisioned database without
  side effects.
- Column casing is **snake_case** everywhere. Better-Auth field
  mappings in `src/lib/auth.ts` translate its internal camelCase model
  fields to these column names. If the two ever drift you will see
  runtime "column does not exist" errors on the first read — keep them
  in sync.
- All `id` columns are `text` because Better-Auth issues ULIDs.
- All timestamps are `timestamptz`.

## Files

| File                              | Purpose                                                                |
| --------------------------------- | ---------------------------------------------------------------------- |
| `0001_better_auth_schema.sql`     | Baseline: core (user/session/account/verification) + username plugin + jwt plugin + organization plugin. |

## Applying

Locally:

```bash
psql "$DATABASE_URL" -f migrations/0001_better_auth_schema.sql
```

In CI or a release pipeline, run the same command before starting the
Next.js process. Better-Auth lazy-initialises plugin state (e.g. the
first JWT mint generates and stores a key pair in `jwks`); the tables
must exist before that happens.

## Related docs

- `docs/laravel-start-guide.md` — endpoint contract between Next and
  Laravel; §7.4 describes the two-database layout.
- `docs/rbac-plan.md` — §18 covers the JWT plugin specifically and the
  migration to JWKS-verified bridge auth.

## Adding a new migration

1. Decide whether the change goes in the baseline (`0001_*`) or as a
   delta (`0002_*.sql`, etc.). Baseline is for the initial install;
   anything that changes existing column types, adds non-nullable
   columns, or drops things must be a delta.
2. If the change is triggered by a new Better-Auth plugin, mirror the
   plugin's field-mapping config in `src/lib/auth.ts` so the
   camelCase ↔ snake_case translation stays consistent.
3. Add a row to the **Files** table above.
4. Update the relevant docs cross-reference (`docs/laravel-start-guide.md`
   §7.4 or `docs/rbac-plan.md` §18) if the change is user-visible from
   the Laravel side (e.g. new JWT claim, new session field).
