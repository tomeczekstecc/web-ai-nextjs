# Tasks: App-First Authentication

**Input**: Design documents from `/specs/001-app-auth/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Do not add automated tests. Constitution forbids test tasks unless the constitution changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Current project: `src/app/`, `src/components/`, `src/lib/`, `public/`
- Adjust paths based on the real structure captured in plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal project preparation required for the feature

- [X] T001 Add Better Auth and required auth dependencies in `package.json` and refresh `pnpm-lock.yaml`
- [X] T002 Add auth, Laravel integration, and Keycloak runtime placeholders to `.env.example`
- [X] T003 [P] Create the auth route, page, component, and domain scaffolding in `src/app/api/auth/[...all]/route.ts`, `src/app/api/internal/auth/revoke/route.ts`, `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-up/page.tsx`, `src/app/auth/verify-email/page.tsx`, `src/app/auth/reset-password/page.tsx`, `src/app/auth/access-denied/page.tsx`, `src/app/auth/unavailable/page.tsx`, `src/components/auth/`, `src/lib/auth/`, and `src/lib/api/domains/auth-user/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core groundwork that MUST be complete before user stories

- [X] T004 Establish the Better Auth server configuration, database-backed auth store, session rules, and plugin setup in `src/lib/auth.ts`
- [X] T005 [P] Build shared auth client, internal-path redirect sanitization, and Laravel mail handoff helpers in `src/lib/auth-client.ts`, `src/lib/auth/redirects.ts`, and `src/lib/auth/email.ts`
- [X] T006 [P] Define Laravel auth-user contracts, mapping, and transport boundaries in `src/lib/api/domains/auth-user/contract.ts`, `src/lib/api/domains/auth-user/mapper.ts`, `src/lib/api/domains/auth-user/queries.ts`, and `src/lib/api/domains/auth-user/mutations.ts`
- [X] T007 Mount the Better Auth catch-all handler and dedicated Laravel revocation endpoint in `src/app/api/auth/[...all]/route.ts` and `src/app/api/internal/auth/revoke/route.ts`
- [X] T008 Add shared session establishment, access snapshot, and protected-route helpers in `src/lib/auth/session.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Native App Authentication (Priority: P1)

**Goal**: Deliver app-owned sign-up, verification, sign-in, and password reset flows for the default auth journey.

**Independent Validation**: A new user can register, verify email, sign in with email or optional username, and complete password reset entirely through app-owned routes.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create the native sign-in form UI with generic public error handling in `src/components/auth/sign-in-form.tsx`
- [X] T010 [P] [US1] Create the native sign-up form UI with optional username and required consent checkbox in `src/components/auth/sign-up-form.tsx`
- [X] T011 [P] [US1] Create the password-reset and verification-status UI components in `src/components/auth/reset-password-form.tsx` and `src/components/auth/verify-email-status.tsx`
- [X] T012 [US1] Implement the app-owned sign-in route behavior and authenticated-user redirect handling in `src/app/auth/sign-in/page.tsx`
- [X] T013 [US1] Implement the app-owned sign-up route behavior and config-gated sign-up visibility in `src/app/auth/sign-up/page.tsx`
- [X] T014 [US1] Implement email-verification completion and resend behavior in `src/app/auth/verify-email/page.tsx`
- [X] T015 [US1] Implement password reset request and completion behavior in `src/app/auth/reset-password/page.tsx`
- [X] T016 [US1] Wire username login, 12-character password policy, required email verification, generic responses, and session revocation after reset in `src/lib/auth.ts` and `src/lib/auth/email.ts`
- [ ] T017 [US1] Verify Polish copy, theme parity, and mobile/desktop behavior across `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-up/page.tsx`, `src/app/auth/verify-email/page.tsx`, and `src/app/auth/reset-password/page.tsx`

**Checkpoint**: User Story 1 should be fully functional and independently verifiable

---

## Phase 4: User Story 2 - Protected Product Access (Priority: P1)

**Goal**: Grant or deny protected dashboard access from Laravel-owned authorization and provisioning decisions.

**Independent Validation**: Verified users who are authorized by Laravel reach `/dashboard`, while denied or unavailable backend states never reveal protected content.

### Implementation for User Story 2

- [X] T018 [P] [US2] Create the generic blocked-access and temporary auth-unavailable outcome pages in `src/app/auth/access-denied/page.tsx` and `src/app/auth/unavailable/page.tsx`
- [X] T019 [P] [US2] Replace mock sidebar identity data with Laravel-resolved application-user data in `src/components/app-sidebar.tsx` and `src/components/nav-user.tsx`
- [X] T020 [US2] Gate `src/app/dashboard/page.tsx` and nested dashboard access with server-side session resolution in `src/app/dashboard/page.tsx` and `src/lib/auth/session.ts`
- [X] T021 [US2] Implement existing-session current-user resolution and first-time provisioning or upsert flow in `src/lib/api/domains/auth-user/queries.ts`, `src/lib/api/domains/auth-user/mutations.ts`, and `src/lib/auth/session.ts`
- [X] T022 [US2] Enforce generic blocked-access handling, validated internal return destinations, and authenticated-route redirects in `src/lib/auth/redirects.ts`, `src/app/auth/sign-in/page.tsx`, and `src/app/auth/sign-up/page.tsx`
- [X] T023 [US2] Finalize immediate revocation handling and temporary backend-unavailable fallbacks in `src/app/api/internal/auth/revoke/route.ts`, `src/lib/auth.ts`, and `src/app/auth/unavailable/page.tsx`
- [ ] T024 [US2] Verify protected-route redirects, denied access, temporary backend failures, and revoked-session behavior in `src/app/dashboard/page.tsx`, `src/app/auth/access-denied/page.tsx`, and `src/app/auth/unavailable/page.tsx`

**Checkpoint**: User Story 2 should be fully functional and independently verifiable

---

## Phase 5: User Story 3 - Optional Enterprise SSO (Priority: P2)

**Goal**: Add a configuration-gated Keycloak SSO path that reuses the same Laravel authorization flow as native accounts.

**Independent Validation**: When SSO is enabled, a user can choose Keycloak on the sign-in screen, complete the provider flow, and return through the same provisioning and access checks as native users.

### Implementation for User Story 3

- [X] T025 [P] [US3] Create the config-gated Keycloak entry control in `src/components/auth/sso-button.tsx`
- [X] T026 [US3] Add Keycloak Generic OAuth configuration, verified-email auto-link rules, and local-only SSO logout behavior in `src/lib/auth.ts`
- [X] T027 [US3] Surface optional SSO on the sign-in route and align logout UI behavior in `src/app/auth/sign-in/page.tsx` and `src/components/nav-user.tsx`
- [X] T028 [US3] Reuse synchronous Laravel provisioning and session establishment for first-time SSO users in `src/lib/auth/session.ts` and `src/lib/api/domains/auth-user/mutations.ts`
- [ ] T029 [US3] Verify enabled and disabled SSO visibility, provider return flow, and local-only logout behavior in `src/components/auth/sso-button.tsx`, `src/app/auth/sign-in/page.tsx`, and `src/lib/auth.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T030 [P] Refine Polish copy and generic messaging consistency across `src/app/auth/sign-in/page.tsx`, `src/app/auth/sign-up/page.tsx`, `src/app/auth/verify-email/page.tsx`, `src/app/auth/reset-password/page.tsx`, `src/app/auth/access-denied/page.tsx`, and `src/app/auth/unavailable/page.tsx`
- [X] T031 Remove duplication and simplify shared auth abstractions in `src/lib/auth.ts`, `src/lib/auth/session.ts`, and `src/components/auth/`
- [X] T032 Review auth comments and keep only TODO or security exceptions in `src/lib/auth.ts`, `src/lib/auth/session.ts`, and `src/app/api/internal/auth/revoke/route.ts`
- [ ] T033 Validate the documented manual verification flow in `specs/001-app-auth/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion and reuses the auth session primitives completed for User Story 1
- **User Story 3 (Phase 5)**: Depends on Foundational completion and reuses the native auth and Laravel access flow from User Stories 1 and 2
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1**: Establishes the default app-owned authentication flow and can be built first as the native auth baseline
- **US2**: Builds on the shared session and Laravel access boundary, then makes the dashboard safely accessible
- **US3**: Extends the established auth and provisioning flow with an optional enterprise provider without replacing the default journey

### Within Each User Story

- Prefer the simplest viable implementation
- Keep edits surgical and scoped to the story goal
- Finish the story's core path before optional refinements
- Validate the story manually against acceptance scenarios and success criteria

### Parallel Opportunities

- **Setup**: `T002` and `T003` can proceed in parallel once the dependency plan for `T001` is clear
- **Foundational**: `T005` and `T006` can run in parallel after `T004`, then feed into `T007` and `T008`
- **US1**: `T009`, `T010`, and `T011` can run in parallel before route integration in `T012` through `T015`
- **US2**: `T018` and `T019` can run in parallel before the access enforcement tasks `T020` through `T023`
- **US3**: `T025` can run in parallel with `T026` before integration tasks `T027` and `T028`

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2 to establish the Better Auth, Laravel, and routing foundation.
2. Deliver Phase 3 to make the app-owned native auth journey functional.
3. Deliver Phase 4 immediately after Phase 3 so the native auth journey becomes product-safe through Laravel-backed authorization.

### Incremental Delivery

1. Add Phase 5 after the native flow and protected dashboard access are stable.
2. Finish with Phase 6 to align copy, polish shared abstractions, and re-run the documented manual verification flow.

### Suggested MVP Scope

- Ship **User Story 1 + User Story 2** together as the first usable slice because app-owned authentication without Laravel-backed protected access would still leave the core product flow incomplete.
- Add **User Story 3** as the first post-MVP enhancement once the native flow is stable.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- Avoid vague tasks, same-file conflicts, unnecessary abstractions, and test tasks

