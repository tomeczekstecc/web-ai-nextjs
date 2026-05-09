# Feature Specification: Light/Dark Theme Toggle

**Feature Branch**: `004-theme-toggle`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "lets add light / dark theme toggle aligned with Konto, Rozliczenia...., only Jasny i Ciemny, no Systemowy Moon, Sun Icons"

## User Scenarios *(mandatory)*

Każda historia użytkownika musi być niezależnie wartościowa i możliwa do
zaprezentowania jako przyrost funkcji.

### User Story 1 - Switch Theme From Account Navigation (Priority: P1)

As a signed-in user, I want a theme control placed alongside the existing account-related navigation items such as Konto and Rozliczenia so that changing the app appearance feels like part of my personal settings area.

**Why this priority**: The requested value is primarily placement and clarity. Users should find the theme choice where they already manage account preferences.

**Independent Validation**: Open the relevant navigation surface and confirm the theme control appears aligned with Konto and Rozliczenia, not as a separate global banner or unrelated toolbar item.

**Acceptance Scenarios**:

1. **Given** the account navigation shows Konto and Rozliczenia, **When** a user views that navigation, **Then** the theme control appears visually aligned with those items.
2. **Given** the theme control is visible, **When** a user scans the account navigation, **Then** the control is discoverable without disrupting the existing navigation order or spacing.

---

### User Story 2 - Switch Only Between Light And Dark (Priority: P2)

As a user changing appearance from the account menu, I want one simple menu row that switches between Jasny and Ciemny so that the setting is quick and does not include an automatic system option.

**Why this priority**: The scope explicitly excludes a system-driven mode. The UI should behave as a direct command between the two valid app-wide theme states.

**Independent Validation**: Open the account dropdown and confirm it shows one theme row that switches to the opposite valid theme state.

**Acceptance Scenarios**:

1. **Given** the app is currently using Jasny, **When** the user opens the account dropdown, **Then** the theme row shows the action Ciemny.
2. **Given** the app is currently using Ciemny, **When** the user opens the account dropdown, **Then** the theme row shows the action Jasny.
3. **Given** the theme row is displayed, **When** a user looks for a system or automatic option, **Then** no Systemowy choice or equivalent system-following option is present.
4. **Given** a user activates the theme row, **When** the command runs, **Then** the application immediately switches to the opposite valid theme state and the dropdown closes normally.

---

### User Story 3 - Recognize Theme Choices By Icon (Priority: P3)

As a user, I want Sun and Moon icons next to the light and dark choices so that I can recognize the meaning of the setting quickly.

**Why this priority**: Icons improve scannability and reinforce the two allowed choices, but the text labels remain the core requirement.

**Independent Validation**: Open the account dropdown in both theme states and confirm the cycle row pairs the next available action with the correct icon.

**Acceptance Scenarios**:

1. **Given** the next action is Jasny, **When** the user reviews the theme row, **Then** it is represented with a Sun icon and the visible label Jasny.
2. **Given** the next action is Ciemny, **When** the user reviews the theme row, **Then** it is represented with a Moon icon and the visible label Ciemny.
3. **Given** the theme row is used with assistive technology, **When** the current app theme is light, **Then** it announces the action as switching to the dark theme.
4. **Given** the theme row is used with assistive technology, **When** the current app theme is dark, **Then** it announces the action as switching to the light theme.

### Edge Cases

- If the current theme preference is missing or invalid, the app defaults to Jasny and still switches only between Jasny and Ciemny.
- If the account navigation wraps or collapses on smaller screens, the theme control remains aligned with the same account navigation group.
- If icon rendering fails, the action labels Jasny and Ciemny remain visible enough to complete the action.
- If a previous version stored a system-based preference, the app silently treats it as Jasny and does not preserve system-following behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a theme row in the same navigation area as Konto, Rozliczenia, and Powiadomienia.
- **FR-002**: The theme control MUST visually align with the account navigation items rather than appearing as unrelated page content.
- **FR-003**: The theme row MUST appear after Powiadomienia within the account navigation group.
- **FR-004**: Users MUST be able to cycle only between two app-wide theme states: Jasny and Ciemny.
- **FR-005**: The system MUST NOT expose or preserve a Systemowy option or any equivalent option that follows the operating system theme.
- **FR-006**: When the current theme is Ciemny, the row MUST show the next action Jasny with a Sun icon.
- **FR-007**: When the current theme is Jasny, the row MUST show the next action Ciemny with a Moon icon.
- **FR-008**: The theme row MUST use visible action-only labels without a current-state hint or checkmark.
- **FR-009**: The text labels Jasny and Ciemny MUST remain visible or otherwise accessible when the icons are present.
- **FR-010**: The selected theme MUST persist for the same user environment across page reloads.
- **FR-011**: Selecting the theme row MUST immediately apply the opposite appearance across the application surfaces affected by the theme system.
- **FR-012**: The theme row MUST remain usable in common desktop and mobile navigation layouts.
- **FR-013**: Any stale, unsupported, missing, or system-based stored theme value MUST be handled by falling back to Jasny.
- **FR-014**: The public homepage MAY keep its existing standalone theme toggle if it remains outside the authenticated account navigation surface.
- **FR-015**: The theme row's accessible action text MUST clearly communicate switching to the opposite theme.

### Key Entities *(include if feature involves data)*

- **Theme Preference**: The user's selected app-wide appearance mode, limited to Jasny or Ciemny.
- **Theme Action Row**: One account dropdown row that shows the opposite available theme action with a Polish label and matching visual icon.
- **Account Navigation Group**: The existing navigation area that includes Konto, Rozliczenia, and Powiadomienia and will also contain the theme row after Powiadomienia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of manual checks show the theme row after Powiadomienia in the same navigation group as Konto and Rozliczenia on desktop and mobile layouts.
- **SC-002**: 100% of theme row views expose exactly one next-action label: Jasny when the app is dark, and Ciemny when the app is light.
- **SC-003**: 0 manual checks expose or preserve Systemowy or an equivalent automatic system option.
- **SC-004**: Activating the theme row visibly changes the application appearance to the opposite theme in 100% of manual verification attempts.
- **SC-005**: The selected theme is restored after reload in at least 95% of manual verification attempts where browser storage or user preference persistence is available.
- **SC-006**: The control remains usable without text overlap or clipped option labels at common mobile and desktop widths.

## Assumptions

- The existing account navigation labels Konto, Rozliczenia, and Powiadomienia identify the correct placement group for this control.
- The feature removes system-following behavior from the app theme configuration, not only from the visible menu.
- Polish UI copy is required for visible labels.
- Persistence is expected for the same browser or user environment, using the application's existing theme preference behavior where available.
- The authenticated account dropdown gets the new cycle row; the public homepage can retain its separate theme toggle.
