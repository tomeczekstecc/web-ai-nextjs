# Feature Specification: Auth Pages Refactor — shadcn Template Alignment

**Feature Branch**: `017-auth-pages-refactor`
**Created**: 2026-05-21
**Status**: Draft
**Input**: User description: "refactor auth related pages to align our base shadcn template, but drop current design and follow documentation example — configure social login via .env (add to .env - defaults to false)"

## User Scenarios *(mandatory)*

### User Story 1 — Visitor Lands on Sign-In Page (Priority: P1)

A new or returning visitor navigates to the sign-in page. They are greeted by a clean two-column layout: the left column contains the login form and the right column displays a decorative image panel. The form retains full functionality (email/username + password inputs, "forgot password" link, error messaging, redirect-after-login).

**Why this priority**: Sign-in is the primary entry point for all authenticated users. Getting the visual template right here anchors the appearance of every other auth page.

**Independent Validation**: The sign-in page renders the two-column card layout with bg-muted page background and the image panel appears on medium-and-larger screens.

**Acceptance Scenarios**:

1. **Given** I am unauthenticated, **When** I visit `/auth/sign-in`, **Then** I see a centered card with a form on the left and a decorative image panel on the right (desktop), with a `bg-muted` page background.
2. **Given** I am on a mobile device, **When** I visit `/auth/sign-in`, **Then** the image panel is hidden and only the form column is visible.
3. **Given** the form is filled incorrectly, **When** I submit, **Then** validation messages appear as they did before the refactor (no regression in form behaviour).

---

### User Story 2 — Visitor Uses Social Login (Priority: P2)

When the `AUTH_SOCIAL_LOGIN_ENABLED` environment variable is set to `true`, the sign-in form displays a divider ("Or continue with") and social provider buttons (Apple, Google, Meta) below the credential form. When the variable is absent or set to `false`, the section is not rendered.

**Why this priority**: Social login is opt-in infrastructure that operators enable per deployment. The .env flag makes it configurable without code changes.

**Independent Validation**: Setting `AUTH_SOCIAL_LOGIN_ENABLED=true` reveals the social button row; setting it to `false` or omitting it hides it completely.

**Acceptance Scenarios**:

1. **Given** `AUTH_SOCIAL_LOGIN_ENABLED=true`, **When** I view the sign-in page, **Then** a divider and three social buttons (Apple, Google, Meta) are visible below the login form.
2. **Given** `AUTH_SOCIAL_LOGIN_ENABLED=false` (or not set), **When** I view the sign-in page, **Then** no social login section appears — the form ends after the submit button.
3. **Given** social buttons are visible, **When** I click a social button, **Then** the appropriate OAuth flow is initiated (or a placeholder interaction is shown if the provider is not yet wired).

---

### User Story 3 — Visitor Uses Sign-Up, Reset Password, or Other Auth Pages (Priority: P3)

All secondary auth pages (sign-up, reset-password, verify-email, access-denied, unavailable) adopt the same page-level layout — centered card with `bg-muted` background — while keeping a single-column form layout (no image panel, as these are narrower utility flows).

**Why this priority**: Visual consistency across all auth routes is required, but the two-column image panel is appropriate only for the primary sign-in page.

**Independent Validation**: Each secondary auth page renders inside the updated layout with the matching background and card style, with no remnants of the old grid-pattern or custom gradient background.

**Acceptance Scenarios**:

1. **Given** `AUTH_SIGNUP_ENABLED=true`, **When** I visit `/auth/sign-up`, **Then** the page uses the updated card layout consistent with the sign-in design and the form works correctly.
2. **Given** I visit `/auth/reset-password`, **When** the page renders, **Then** it uses the updated layout with no custom gradient or grid-pattern background.
3. **Given** I visit `/auth/access-denied` or `/auth/unavailable`, **When** the page renders, **Then** the layout matches the updated auth page template.

### Edge Cases

- What happens when the image panel source (`/placeholder.svg`) is not available? — The column remains visible with no broken-image indicator; the layout does not collapse.
- What happens when all three social providers are enabled but only one is configured for OAuth? — The unconfigured buttons render but may return an error on click; that is a backend concern outside this refactor scope.
- What happens when `AUTH_SIGNUP_ENABLED=false`? — The sign-up page redirects to sign-in as before; this behaviour is unchanged by the refactor.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `AuthShell` component (or its replacement) MUST adopt the page-level layout from the shadcn documentation example: `flex min-h-svh flex-col items-center justify-center bg-muted` wrapper with centered card content.
- **FR-002**: The sign-in page MUST render a two-column card layout (form column + decorative image column) on medium-and-larger screens; image column MUST be hidden on small screens.
- **FR-003**: All other auth pages (sign-up, reset-password, verify-email, access-denied, unavailable) MUST adopt the updated page background and card style while retaining a single-column layout.
- **FR-004**: A new environment variable `AUTH_SOCIAL_LOGIN_ENABLED` MUST be added to `.env` and `.env.example` with a default value of `false`.
- **FR-005**: The sign-in page MUST read `AUTH_SOCIAL_LOGIN_ENABLED` server-side and conditionally render the social login section (divider + Apple, Google, Meta buttons) only when the value is `"true"`.
- **FR-006**: All existing form logic, TanStack Form validation, Zod schemas, error handling, and redirect behaviour across all auth pages MUST be preserved without regression.
- **FR-007**: The existing `AUTH_SSO_ENABLED` Keycloak SSO button MUST continue to function independently from the new social login section.
- **FR-008**: The TermsOfService/Privacy Policy notice shown below the card in the shadcn example MUST be added to the sign-in page below the card.
- **FR-009**: The custom grid-pattern background and radial-gradient overlay currently in `AuthShell` MUST be removed entirely.
- **FR-010**: All UI text MUST remain in Polish (existing labels, placeholders, and messages are not changed).

### Key Entities

- **AuthShell**: Shared layout component wrapping all auth pages — its internal structure changes from the custom gradient/grid-pattern design to the shadcn-aligned muted-background layout.
- **LoginForm / SignInForm**: The sign-in form component — gains the two-column card wrapper and conditional social login section; internal form logic is unchanged.
- **SocialLoginSection**: New inline section (or extracted sub-component) rendered inside the sign-in form when `AUTH_SOCIAL_LOGIN_ENABLED=true`; contains the `FieldSeparator` divider and provider buttons.
- **AUTH_SOCIAL_LOGIN_ENABLED**: New `.env` flag controlling visibility of the social login section across deployments.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All six auth pages (sign-in, sign-up, reset-password, verify-email, access-denied, unavailable) render the updated layout with no remnants of the old custom background — verifiable by visual review and absence of the `radial-gradient`/grid-pattern CSS classes.
- **SC-002**: The sign-in page two-column layout passes a responsive review: image panel visible on ≥768 px breakpoint, hidden on smaller viewports.
- **SC-003**: Setting `AUTH_SOCIAL_LOGIN_ENABLED=true` causes social buttons to appear; setting it to `false` or omitting it causes them to be absent — verifiable by toggling the flag and checking the rendered DOM.
- **SC-004**: No existing auth form test or manual flow produces a regression — all current form validation, submission, and redirect paths continue to work after the refactor.
- **SC-005**: The `AUTH_SOCIAL_LOGIN_ENABLED` variable is present in `.env` (set to `false`) and in `.env.example` with a descriptive comment.

## Assumptions

- The decorative image panel uses `/placeholder.svg` as an initial placeholder; no real image asset selection is in scope for this feature.
- Social login button clicks wire up to the existing `authClient` OAuth helpers if already configured; this feature does not introduce new OAuth provider integrations — it only exposes the UI.
- The Apple, Google, and Meta SVG icons from the shadcn documentation example are used verbatim; icon library sourcing is not in scope.
- The existing `AUTH_SSO_ENABLED` Keycloak SSO flow and its button remain untouched and coexist with the new social login section.
- The spec covers visual and structural changes only; no changes to authentication logic, session handling, or backend API calls are required.
- All copy (labels, messages, descriptions) stays in Polish; the English shadcn example text ("Welcome back", "Login to your Acme Inc account") is adapted to the project's existing Polish strings.
- The `FieldSeparator` component from shadcn is already available in the project's component library; if not, it must be added as part of this task.
