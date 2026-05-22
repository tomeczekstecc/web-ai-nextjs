# Feature Specification: Copy to Clipboard Component

**Feature Branch**: `018-copy-to-clipboard`
**Created**: 2026-05-22
**Last Updated**: 2026-05-22 (post-grill)
**Status**: Draft
**Input**: User description: "add copy to clipboard component, including use-copy-to-clipboard external hook in src/hooks/ folder"

## Summary

Introduce a single shared copy-to-clipboard primitive — a reusable copy
button and a reusable hook — that any surface in the product can adopt to
let users place a piece of textual content on their system clipboard with
one interaction, with consistent visual feedback, consistent timing, and
clear behavior when copying is not possible.

The feature ships with one real first consumer: the application error
page, where users can copy the technical diagnostics block to share with
support, and with a dedicated demo surface that showcases every supported
usage permutation for review and accessibility verification.

## User Scenarios *(mandatory)*

### User Story 1 - One-click copy of textual content (Priority: P1)

A user viewing a piece of textual content (such as an identifier, a generated
token, a code snippet, an email address, or a shareable link) activates a
copy control next to it. The content is placed on their system clipboard
immediately and the control confirms success with a short visual signal, so
the user can paste the content elsewhere without manually selecting it.

**Why this priority**: This is the core value of the feature. Without
reliable one-click copying, the primitive has no reason to exist. It also
unblocks every follow-up use case across the app (auth tokens, ids in
tables, share links, error diagnostics).

**Independent Validation**: Render the control with arbitrary text, activate
it, paste into any external text field, and confirm the pasted content
matches the original exactly. The control must visibly transition to a
confirmed state and return to its default state shortly after.

**Acceptance Scenarios**:

1. **Given** the control is rendered with a text value, **When** the user
   activates it, **Then** the clipboard contains exactly that text value
   and the control shows a confirmation state.
2. **Given** the user has just copied a value, **When** a short confirmation
   window elapses, **Then** the control returns to its default state and
   can be used again.
3. **Given** the user activates the control multiple times in succession,
   **When** each activation completes, **Then** the most recent value is
   on the clipboard and the confirmation state restarts each time.
4. **Given** the control is rendered with no text value, **When** the user
   tries to interact with it, **Then** the control is non-interactive and
   does not announce a false success.

---

### User Story 2 - Reusable hook for non-button copy interactions (Priority: P2)

A developer building another feature (for example, copying a row id from a
data-table action menu, or copying a generated URL from a toast) needs the
same copy behavior without rendering the standard copy button. They consume
a reusable copy-to-clipboard hook that exposes a copy action and the current
copy status, so any custom UI element can trigger and reflect the copy
result consistently.

**Why this priority**: Establishes the component and the hook as a single
shared primitive. Without the hook surface, teams will re-implement copy
logic inconsistently, leading to duplicated bugs around success-state
timing and clipboard fallbacks.

**Independent Validation**: Build a control such as a dropdown menu item
that uses the hook, trigger it, and confirm both that the clipboard receives
the value and that the hook's exposed copy status reflects success and
resets after the confirmation window.

**Acceptance Scenarios**:

1. **Given** a custom control wired to the hook, **When** the consumer
   invokes the copy action with a string, **Then** the clipboard contains
   that string and the hook reports a successful copy status.
2. **Given** the hook has reported a successful copy, **When** the
   confirmation window elapses, **Then** the hook resets its status to its
   idle value automatically.

---

### User Story 3 - Graceful behavior when copying is unavailable (Priority: P3)

A user is on a browser context where clipboard access is denied,
unavailable, or fails (insecure context, denied permission, transient
error). The control does not silently appear to succeed; instead it clearly
indicates the copy did not happen, so the user knows they must select and
copy the text manually.

**Why this priority**: Protects users from believing they copied something
they did not, which causes downstream errors (pasting empty or stale
content). It is third priority because it is an edge case relative to the
dominant success path but still required for trust.

**Independent Validation**: Simulate or force a clipboard failure, activate
the control, and confirm the UI surfaces a clear failure indication rather
than the success confirmation. Confirm the hook's reported status reflects
the failure and auto-resets to idle on the same confirmation window so the
user can retry without manual intervention.

**Acceptance Scenarios**:

1. **Given** clipboard access is unavailable or rejected, **When** the user
   activates the control, **Then** the control shows a failure indication
   and does not show the success confirmation.
2. **Given** a failure has occurred, **When** the user activates the control
   again in a supported context, **Then** the copy succeeds normally with
   no leftover failure state.

---

### User Story 4 - Copy error diagnostics for support handoff (Priority: P1)

A user encounters the application error page after something fails in the
product. They open the technical diagnostics block on the error page and
need to share the failure details (message, digest, stack) with support or
a developer. They activate a copy control on the diagnostics block and the
full diagnostics text is placed on their clipboard, ready to paste into a
ticket, email, or chat.

**Why this priority**: This is the first real surface that consumes the new
primitive in this delivery. It validates the primitive against a concrete
production workflow (incident reporting) and gives the feature an
immediately user-visible payoff. Without a real first consumer, the
primitive would ship as dormant infrastructure.

**Independent Validation**: Trigger an error that lands the user on the
application error page, expose the diagnostics block, activate the copy
control on the diagnostics, and paste the result into a plain-text field.
The pasted content must contain the same diagnostics text shown on the
page (message, digest, stack), in the same order, separated as displayed.
The copy control's labels must be presented in the same language as the
surrounding page.

**Acceptance Scenarios**:

1. **Given** the error page is shown with a diagnostics block, **When** the
   user activates the copy control on the diagnostics block, **Then** the
   user's clipboard contains the full diagnostics text exactly as shown on
   the page.
2. **Given** the error page is shown without a diagnostics block (no
   message, no digest, no stack), **When** the page renders, **Then** the
   copy control is not shown.
3. **Given** the copy control is shown on the error page, **When** the user
   reads its labels and confirmations, **Then** they are presented in the
   same language as the rest of the error page.

### Edge Cases

- The value to copy is an empty string: the control is non-interactive and
  must not claim a false success.
- The value to copy is very long (multi-kilobyte text, e.g. a full stack
  trace): the copy must still complete and the confirmation must still
  appear.
- The user activates the control rapidly several times: the latest copy
  wins and the confirmation window restarts cleanly each time.
- The consumer unmounts the control while the confirmation state is still
  active: no errors or warnings should be raised after unmount.
- Keyboard-only users activating the control via Enter or Space: behavior
  must match pointer activation, including confirmation feedback.
- Assistive-technology users: the control must communicate both its purpose
  and the result of the copy action without requiring the user to refocus
  or re-interrogate the control.
- The copy control is placed next to an existing interactive control (for
  example, a collapsible trigger): the two must be sibling interactive
  elements, never nested, so each has its own focus stop and accessible
  name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a reusable copy-to-clipboard UI
  control that, when activated, writes a caller-supplied text value to the
  user's system clipboard.
- **FR-002**: The control MUST display a transient confirmation state when
  a copy succeeds and automatically return to its default state after a
  short, consistent confirmation window.
- **FR-003**: The control MUST display a distinct failure state when a copy
  attempt does not succeed, and MUST also automatically return to its
  default state after the same confirmation window, so users are never
  misled into believing a failed copy succeeded and can retry without
  manual intervention.
- **FR-004**: The system MUST expose a reusable copy-to-clipboard hook that
  any consumer can use to trigger a copy and observe the current copy
  status (idle, copied, failed) without rendering the default control.
- **FR-005**: The control and the hook MUST share the same underlying copy
  behavior, the same status model, and the same confirmation timing, so
  that the experience is consistent wherever copy is used in the product.
- **FR-006**: The control MUST be fully operable with the keyboard and MUST
  expose an accessible name and the result of the copy action to assistive
  technologies in a way that is perceivable without requiring the user to
  move focus away and back.
- **FR-007**: The control MUST accept a configurable accessible label for
  its default state, a configurable confirmation label for its success
  state, and a configurable failure label for its failure state, so each
  consumer can present the control in the language and wording of the
  surrounding surface.
- **FR-008**: The system MUST handle environments where the clipboard is
  unavailable without throwing uncaught errors and without producing a
  false success indication. The hook MUST be the single chokepoint where
  any future fallback behavior can be added without changing consumers.
- **FR-009**: The control MUST visually indicate its three meaningful
  states (default, copied, failed) in a way that is distinguishable
  without relying on color alone.
- **FR-010**: The control MUST be visually consistent with the existing
  product UI primitives so it can be embedded next to text, inside tables,
  inside menus, and inside dialogs without bespoke styling.
- **FR-011**: The control MUST support an optional inline display of the
  text being copied, presented as part of the same single interactive
  element (one click target, one focus stop, one accessible name). When no
  inline text is present, the control MUST present a hover/focus label
  that describes what it does.
- **FR-012**: The control MUST be non-interactive when no copyable value
  is supplied, and MUST NOT announce a success or failure in that state.
- **FR-013**: The application error page MUST offer a copy control on its
  technical diagnostics block. The control MUST place the full diagnostics
  text (message, digest, stack — as currently shown in the diagnostics
  block) on the user's clipboard, and MUST be reachable without first
  expanding the diagnostics block.
- **FR-014**: The feature MUST ship a dedicated demonstration surface
  (separate from any production consumer) that exercises the control in
  every supported configuration — icon-only, with inline text, in its
  non-interactive empty state, with a side-effect callback wired to a
  toast, and via direct hook usage from a non-button control — so the
  feature can be reviewed end-to-end and accessibility-verified in one
  place.

### Key Entities

- **Copy target value**: The text the consumer wants placed on the
  clipboard. Always a string. May be short (an id) or long (a stack trace).
- **Copy status**: The current state of the most recent copy attempt for a
  given control or hook instance. One of: idle, copied, failed.
- **Copy control labels**: The three user-facing strings associated with a
  control instance — its default accessible label, its success
  confirmation label, and its failure label. Owned by the consumer per
  instance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can copy a displayed value to their clipboard in a
  single interaction (one click or one keyboard activation) without
  selecting text manually.
- **SC-002**: The confirmation state appears within 200 milliseconds of a
  successful copy and clears automatically within 2 seconds, so users get
  immediate feedback without lingering UI noise.
- **SC-003**: In environments where copying is not possible, 100% of
  failed copy attempts surface a visible failure indication rather than a
  false success, and the control returns to its default state within the
  same confirmation window so the user can retry.
- **SC-004**: The copy primitive is adopted by at least one real product
  surface in this delivery (the application error page diagnostics
  block), with no copy-handling logic implemented outside the shared
  primitive.
- **SC-005**: Keyboard-only and assistive-technology users can both
  trigger a copy and perceive its outcome without moving focus, verified
  via manual accessibility review against the demo surface.
- **SC-006**: A user encountering the error page can capture and paste
  the full diagnostics text into an external destination (ticket, email,
  chat) in under 10 seconds, without manually selecting text.

## Dependencies and Affected Surfaces

This feature, in addition to introducing the new primitive, touches the
following existing surfaces. Each is part of the scope of this delivery.

- **Application providers stack**: A shared tooltip-provider context MUST
  be mounted at the application root so the copy control's hover/focus
  label works wherever the control is rendered. This provider is currently
  absent and is added by this feature; it is intentionally generic (not
  copy-specific) so future tooltip-using primitives benefit from the same
  mounting.
- **Application error page**: The diagnostics block layout is adjusted so
  the new copy control is a sibling of the existing expand/collapse
  control rather than nested inside it, preserving correct focus order and
  accessible naming. The page's existing copy, language, and styling are
  preserved.
- **Demo surface**: A new route under the authenticated application area
  is added solely to showcase the primitive (see FR-014). It is not linked
  from production navigation and exists for review, manual QA, and
  accessibility verification.

## Assumptions

- The target users are end users of the existing web application, using
  modern evergreen browsers in secure (HTTPS or localhost) contexts where
  clipboard access is generally available.
- The value being copied is always plain text. Rich content (HTML, images,
  files) is out of scope for this feature.
- Copying is initiated by an explicit user gesture (click or keyboard
  activation). Automatic or background copying is out of scope.
- The default visual style aligns with the existing product UI primitives;
  this feature does not introduce a new design language.
- The confirmation window duration is a small, fixed default chosen to
  balance visibility and unobtrusiveness, is shared by the default control
  and by any consumer using the hook, and is overridable per instance for
  exceptional cases.
- Internationalization is handled per consumer via the control's
  configurable labels (FR-007). The project does not currently carry
  global i18n infrastructure, so the primitive ships with English defaults
  and each consumer supplies localized labels where the surrounding
  surface is localized (the error page consumer in this delivery supplies
  Polish labels to match the existing error page copy).
- Failure handling is limited to surfacing the failed state to the user;
  no automatic retry, no fallback via legacy clipboard mechanisms, and no
  global error reporting are introduced by this feature. The hook is
  structured to be the single chokepoint where such behavior could be
  added later without affecting consumers.
- The error-page consumer copies the diagnostics text exactly as
  displayed; this delivery does not introduce any additional framing
  (timestamps, URLs, ticket templates) around the copied content. Such
  framing, if needed, is a separate feature.
