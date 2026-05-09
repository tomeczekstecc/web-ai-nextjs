# Research: Light/Dark Theme Toggle

## Decision: Disable system theme support app-wide

**Rationale**: The feature explicitly excludes `Systemowy`, and the grilled decision made this app-wide rather than only hiding the option. `next-themes` supports disabling system preference handling with `enableSystem={false}` and supports explicit theme lists. The app should therefore allow only `light` and `dark`, with `light` as the default.

**Alternatives considered**:
- Keep `defaultTheme="system"` while hiding the UI option: rejected because it preserves a hidden third state.
- Preserve the system-resolved visual mode until the user chooses: rejected because stale `system` would remain behaviorally active.

## Decision: Treat stale or invalid preferences as Jasny

**Rationale**: A missing, invalid, or previous `system` value must become a valid app choice. `Jasny` is the agreed default and avoids surprising users with a dark first load.

**Alternatives considered**:
- Coerce stale values to the currently resolved system appearance: rejected because it recreates system-following behavior.
- Ask the user to choose on next visit: rejected as too much friction for a small preference.

## Decision: Add one cycle row inside `NavUser`

**Rationale**: `Konto`, `Rozliczenia`, and `Powiadomienia` are already rendered in `src/components/nav-user.tsx` as shadcn `DropdownMenuItem`s. Adding one adjacent item after `Powiadomienia` is the smallest change that satisfies placement and alignment.

**Alternatives considered**:
- Add a separate settings page: rejected as out of scope.
- Add a two-option submenu or radio group: rejected by the grilled decision to use a single cycle row.
- Move the public homepage toggle into the account menu: rejected because the homepage is a separate public surface.

## Decision: Use action-only labels and matching lucide icons

**Rationale**: A cycle control should describe what clicking it does. In light mode it should show `Moon + Ciemny`; in dark mode it should show `Sun + Jasny`. No checkmark or current-state hint is needed, which keeps the row consistent with existing menu items.

**Alternatives considered**:
- Show current state labels: rejected because the row would be ambiguous as a command.
- Show both current and next state: rejected because it adds noise to a compact menu.

## Decision: Keep theme-dependent rendering client-safe

**Rationale**: `next-themes` documents that UI using `useTheme` can cause hydration mismatch if rendered before mount. The existing `ThemeToggle` already guards theme-dependent output. The new menu row should use a similar mounted guard or a stable fallback label until the client theme is known.

**Alternatives considered**:
- Render based on server assumptions only: rejected because the selected browser preference is client-side.
- Delay the entire user menu: rejected because only the theme row depends on client theme state.

## Decision: Manual verification plus lint/build

**Rationale**: The constitution forbids automated tests. This feature can be validated manually through the account dropdown, reload persistence, stale preference handling, desktop/mobile responsive checks, and build/lint feedback.

**Alternatives considered**:
- Add unit or e2e tests for theme behavior: rejected by project constitution.
