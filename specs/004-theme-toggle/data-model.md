# Data Model: Light/Dark Theme Toggle

## Theme Preference

Represents the persisted app-wide appearance choice.

**Fields**:
- `value`: one of `Jasny` or `Ciemny` in user-facing terms, corresponding to the app's explicit light or dark theme state.
- `source`: browser/user environment persistence managed by the app's theme system.

**Validation rules**:
- Only light and dark are valid app states.
- Missing values fall back to `Jasny`.
- Unsupported values fall back to `Jasny`.
- Stale system-based values fall back to `Jasny`.

**State transitions**:
- `Jasny` -> activating the row sets `Ciemny`.
- `Ciemny` -> activating the row sets `Jasny`.
- Missing/unsupported/system -> first valid app state is `Jasny`.

## Theme Action Row

Represents the single account dropdown command that changes the theme.

**Fields**:
- `position`: after `Powiadomienia` in the account navigation group.
- `visibleLabel`: `Ciemny` when the current app theme is light; `Jasny` when the current app theme is dark.
- `icon`: Moon for `Ciemny`; Sun for `Jasny`.
- `accessibleAction`: action text that describes switching to the opposite theme.

**Validation rules**:
- Must show exactly one action label at a time.
- Must not show a current-state hint, checkmark, or `Systemowy`.
- Must remain aligned with existing account dropdown items.
- Must close the dropdown naturally after activation.

## Account Navigation Group

Represents the existing authenticated dropdown section containing account-related user actions.

**Fields**:
- `items`: `Konto`, `Rozliczenia`, `Powiadomienia`, theme action row.
- `themeRowPlacement`: immediately after `Powiadomienia`.

**Validation rules**:
- The theme row belongs in the same group as account preference items.
- The row must remain usable in desktop and mobile dropdown placement.
- The sign-out row remains separated from the account/preference group.

## Public Homepage Toggle

Represents the existing public homepage theme affordance.

**Fields**:
- `scope`: public landing page.
- `behavior`: may remain as a separate toggle if it uses the app's two-state theme policy.

**Validation rules**:
- Must not reintroduce system-following behavior.
- Must continue to switch only between light and dark under the app-wide policy.
