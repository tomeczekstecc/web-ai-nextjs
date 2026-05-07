# Implementation Plan: App-First Authentication

**Branch**: `001-app-auth` | **Date**: 2026-05-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-app-auth/spec.md`

## Summary

Add app-first authentication by introducing Better Auth as the app-facing auth layer with a database-backed auth store, native email/password auth, optional username login for accounts that have one, required email verification, and self-service password reset. Keep Laravel as the source of product authorization, profile ownership, and access policy by resolving access synchronously through a Laravel current-user and provisioning or upsert interface, while exposing Keycloak only as an optional SSO path behind explicit configuration. The first implementation protects `/dashboard` and nested internal dashboard routes, replaces mock sidebar user data with Laravel-resolved user data, and adds dedicated hooks for internal mail delivery and immediate session revocation.

## Technical Context

**Language/Version**: TypeScript 5.8.x, React 19, Next.js 16 App Router  
**Primary Dependencies**: Better Auth, Better Auth Next.js handler, Better Auth username capability, Better Auth Generic OAuth for Keycloak, shadcn/ui, existing `src/lib/api` transport layer, Zod for form and contract shaping if needed  
**Storage**: Better Auth auth database in an isolated auth schema or table namespace, secure HTTP-only cookies for browser sessions, Laravel APIs for current-user, provisioning, authorization, and mail delivery  
**Testing**: N/A - constitution forbids automated tests  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: web frontend  
**Performance Goals**: Preserve dashboard responsiveness, avoid protected-content flashes, complete auth transitions within the spec success criteria, and avoid unnecessary extra Laravel round trips after provisioning  
**Constraints**: Polish UI copy, light/dark theme parity, responsive layout, server-first data loading, no automated tests, generic public auth errors, no Keycloak credential collection in app forms, Laravel remains authorization truth, and auth or Keycloak runtime configuration is sourced from `.env`  
**Scale/Scope**: Native sign-in, sign-up, verification, and reset routes; one protected dashboard surface; synchronous Laravel provisioning and access resolution; optional Keycloak SSO; revocation hook; and foundational data model support for future linking and Better Auth plugins

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Problem understood before coding begins?** Yes. The feature must deliver app-owned auth UX while preserving Laravel as the product authorization authority.
- **Simplest viable solution?** Yes. Start with one native auth flow, add optional username login without making username a product identity key, and use synchronous Laravel provisioning rather than broader workflow tooling.
- **Planned edits surgical and limited in scope?** Yes. The plan stays focused on auth routes, auth UI, dashboard protection, sidebar identity replacement, Laravel integration contracts, and internal auth hooks.
- **Success criteria explicit and verifiable?** Yes. The spec defines measurable redirect, access, verification, and provisioning outcomes.
- **Preserves TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?** Yes. The plan uses the existing stack and requires Polish app-owned auth screens in both themes.
- **Avoids automated tests and unnecessary comments?** Yes. Verification remains manual and documentation-driven per constitution.
- **Preserves decoupling from Laravel implementation details?** Yes. Laravel integration remains behind explicit contracts and domain modules instead of leaking transport concerns into routes and components.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-app-auth/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  |- laravel-current-user.openapi.yaml
|  |- laravel-provisioning.openapi.yaml
|  |- laravel-auth-mail.openapi.yaml
|  |- nextjs-revocation-hook.openapi.yaml
|  `- web-auth-flows.md
`- tasks.md
```

### Source Code (`src/`)

```text
src/app/
|- api/
|  |- auth/[...all]/route.ts
|  `- internal/auth/revoke/route.ts
|- auth/
|  |- sign-in/page.tsx
|  |- sign-up/page.tsx
|  |- verify-email/page.tsx
|  |- reset-password/page.tsx
|  |- access-denied/page.tsx
|  `- unavailable/page.tsx
|- dashboard/
|  `- page.tsx

src/components/
|- auth/
|  |- sign-in-form.tsx
|  |- sign-up-form.tsx
|  |- reset-password-form.tsx
|  |- verify-email-status.tsx
|  `- sso-button.tsx
|- app-sidebar.tsx
`- nav-user.tsx

src/lib/
|- auth.ts
|- auth-client.ts
|- auth/
|  |- session.ts
|  |- email.ts
|  `- redirects.ts
`- api/
   `- domains/
      `- auth-user/
         |- contract.ts
         |- mapper.ts
         |- queries.ts
         `- commands.ts
```

**Structure Decision**: Keep auth-specific routes under `src/app/auth/`, UI under `src/components/auth/`, and helpers under `src/lib/auth/`. Reuse the server-first API domain pattern for Laravel current-user, provisioning, and related auth integration instead of building a parallel transport layer.

## Phase 0: Research Outcomes

1. Use Better Auth email/password as the default native auth path because the product requires app-owned auth UX instead of Keycloak-hosted login for normal users.
2. Start with a Better Auth database-backed auth store in an isolated auth schema or table namespace because native auth and future Better Auth plugins require persistent auth state.
3. Support optional username login in the first slice, but keep username local to the auth layer and do not use it as the Laravel identity key.
4. Require email verification before normal access and include self-service password reset because password auth is a first-slice primary method.
5. Resolve first-time product access through a synchronous Laravel provisioning or upsert path that returns the resolved app-user payload directly.
6. Keep Laravel as the sole authorization authority, evaluating policy for self-service access through Laravel-owned rules such as approved domains, invites, or existing business records.
7. Establish authorization at sign-in or provisioning time, then support immediate access revocation through a dedicated Laravel-to-auth revocation hook rather than re-checking Laravel on every protected request.
8. Let Better Auth own token generation and validation for verification and reset flows, while Laravel owns branded email delivery through an internal mail API.
9. Add Keycloak only as an explicit, config-gated SSO option that uses the same provisioning path as verified native users.
10. Use generic auth errors and first-slice rate limiting to reduce account-enumeration and abuse risk without adding CAPTCHA yet.

See [research.md](./research.md) for rationale and alternatives.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) defines Better Auth identities and sessions, Laravel-owned application users, provisioning results, and revocation requests.
- [contracts/laravel-current-user.openapi.yaml](./contracts/laravel-current-user.openapi.yaml) defines the server-to-server current-user resolution path for existing authenticated users.
- [contracts/laravel-provisioning.openapi.yaml](./contracts/laravel-provisioning.openapi.yaml) defines the synchronous provisioning or upsert path used after verified sign-up and first-time SSO.
- [contracts/laravel-auth-mail.openapi.yaml](./contracts/laravel-auth-mail.openapi.yaml) defines the internal Laravel mail-delivery contract for verification and reset emails.
- [contracts/nextjs-revocation-hook.openapi.yaml](./contracts/nextjs-revocation-hook.openapi.yaml) defines the internal Laravel-triggered session revocation path.
- [contracts/web-auth-flows.md](./contracts/web-auth-flows.md) defines the route and redirect behavior for sign-in, sign-up, verification, reset, protected access, blocked access, temporary auth errors, and SSO.
- [quickstart.md](./quickstart.md) captures environment setup and manual verification steps for the first slice.

## Implementation Strategy

### Slice 1 - Better Auth Foundation

- Add Better Auth server and client setup.
- Mount the catch-all auth route.
- Configure explicit base URL, trusted origins, secure cookie behavior, 24-hour rolling session rules, password policy, username capability, and email-verification requirements.
- Prepare the auth database schema or migration workflow in the isolated auth namespace.

### Slice 2 - Native Auth UX

- Add separate Polish-language routes for sign-in, sign-up, email verification status, and password reset.
- Support email or username login, optional username at sign-up, consent checkbox, resend-verification, and generic public auth errors.
- Redirect already-authenticated users away from sign-in and sign-up routes.
- Hide or redirect the sign-up path when config disables self-service sign-up.

### Slice 3 - Laravel Access and Provisioning

- Add `auth-user` domain contracts, queries, and commands for current-user resolution and provisioning or upsert.
- Resolve existing-user access at sign-in and carry the access snapshot in the authenticated session.
- Run verified sign-ups and first-time SSO users through synchronous provisioning that returns the app-user payload directly.
- Replace mock dashboard or sidebar identity data with Laravel-owned user data.

### Slice 4 - Mail Delivery, Reset, and Revocation

- Add an internal mail-delivery handoff from Next.js auth flow to Laravel for verification and password-reset emails.
- Ensure successful password reset revokes other active sessions.
- Add a dedicated internal Laravel-to-Next.js revocation route and separate secret for immediate session invalidation when access is revoked after sign-in.

### Slice 5 - Optional Enterprise SSO and Polish

- Add a configuration-gated Keycloak SSO button on sign-in.
- Reuse the same provisioning and authorization path as verified native users.
- Keep SSO logout local to the app session.
- Add generic blocked-access and temporary auth-unavailable pages that match the existing UI direction, Polish copy, responsiveness, and theme parity.

## Post-Design Constitution Check

- The design remains surgical and centered on auth foundation plus the existing dashboard surface.
- The UI stays Polish-first, responsive, and theme-aware across all auth screens.
- Laravel remains decoupled behind explicit contracts and continues to own product authorization truth.
- No automated tests or unrelated refactors are introduced in the plan.

**Post-Design Gate Status**: PASS

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Additional auth data store | Native auth and future Better Auth plugins require persistent auth state | Stateless auth works better for provider-only flows and would not satisfy the app-owned primary auth requirement |
| Synchronous Laravel provisioning path | Public sign-up and first-time SSO need deterministic access creation before protected content is shown | Lazy creation during later reads would leave half-provisioned auth states and weaker audit boundaries |
| Dedicated revocation hook | Authorization is established at sign-in, but access must still be revocable immediately after sign-in | Re-checking Laravel on every request would add more coupling and latency than the chosen first-slice model |
