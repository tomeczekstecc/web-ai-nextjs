# Quickstart: Light/Dark Theme Toggle

## Implementation Steps

1. Update the root theme provider usage so only explicit light and dark states are supported.
2. Ensure missing, invalid, or stale system theme values resolve to `Jasny`.
3. Add theme state handling to `src/components/nav-user.tsx`.
4. Insert one `DropdownMenuItem` after `Powiadomienia`.
5. Render `Moon + Ciemny` when the app is light.
6. Render `Sun + Jasny` when the app is dark.
7. Set the opposite theme immediately when the row is activated.
8. Add clear action-oriented accessible text for both states.
9. Confirm the existing public homepage toggle still works with the two-state app policy.

## Manual Verification

1. Run `pnpm dev`.
2. Open the authenticated app surface that renders the sidebar user dropdown.
3. Open the user dropdown on desktop width.
4. Confirm the order is `Konto`, `Rozliczenia`, `Powiadomienia`, theme row, separator, `Wyloguj`.
5. In light mode, confirm the row shows a Moon icon and `Ciemny`.
6. Activate the row and confirm the app immediately switches to dark mode.
7. Reopen the dropdown and confirm the row now shows a Sun icon and `Jasny`.
8. Activate the row and confirm the app immediately switches back to light mode.
9. Reload the page and confirm the chosen theme persists.
10. Force or simulate a stale `system` stored preference, reload, and confirm the app falls back to `Jasny`.
11. Check a mobile-width viewport and confirm the row remains aligned and labels are not clipped.
12. Confirm no `Systemowy` label or system-following behavior is exposed anywhere affected by the feature.
13. Run `pnpm lint`.
14. Run `pnpm build`.

## Out Of Scope

- New account settings pages.
- A two-option selector, radio group, or submenu.
- Account-level server persistence.
- Automated tests.
