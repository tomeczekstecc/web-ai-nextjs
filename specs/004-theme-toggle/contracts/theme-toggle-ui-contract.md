# UI Contract: Light/Dark Theme Toggle

## Account Dropdown Contract

The authenticated user dropdown contains the theme command in the same group as account preference actions.

Required order:

```text
Konto
Rozliczenia
Powiadomienia
[Theme action row]
---
Wyloguj
```

## Theme Action Row Contract

When the current app theme is light:

```text
Icon: Moon
Visible label: Ciemny
Accessible action: Przełącz na ciemny motyw
Activation result: app theme becomes dark
```

When the current app theme is dark:

```text
Icon: Sun
Visible label: Jasny
Accessible action: Przełącz na jasny motyw
Activation result: app theme becomes light
```

The row must:
- use the same menu item shape as nearby account dropdown rows
- show exactly one next-action label
- apply the theme immediately on activation
- close the dropdown through normal menu behavior
- avoid checkmarks, selected-state text, or secondary current-state hints
- never show `Systemowy`

## App-Wide Theme Policy Contract

Valid app theme states:

```text
light
dark
```

User-facing labels:

```text
light -> Jasny
dark -> Ciemny
```

Fallback behavior:
- no stored value -> `light`
- invalid stored value -> `light`
- stale `system` stored value -> `light`

The app must not follow operating system theme preference after this feature is implemented.

## Public Homepage Contract

The public homepage may keep its existing standalone toggle. It must still operate under the same app-wide policy:
- no `Systemowy`
- no system-following mode
- only light/dark cycling
