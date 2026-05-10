# Data Model: Wizard Advanced Features (Phase 5)

## Overview

Phase 5 has no new domain entities. The changes are behavioral (engine functions) and presentational (demo page). This document records the relevant form shape additions used in the updated demo.

---

## Demo Form Shape (extended for Phase 5)

The existing demo wizard uses a flat form keyed by field name. Phase 5 adds two new demo fields:

```ts
type DemoForm = {
  tytul:     string     // Krok 1 — user input, Zod-validated (min 3 chars)
  opis:      string     // Krok 2 — custom textarea field via useWizardField
  typ:       string     // Krok 2 NEW — select field; controls hide prop on tytul_upr
  tytul_upr: string     // Krok 2 NEW — derived by calc from tytul (uppercase)
}
```

### Field: `typ`

- **Source**: User selection (SelectWiz or RadioWiz on Krok 2)
- **Purpose**: Demonstrates conditional visibility — when `typ === 'prosty'`, the `tytul_upr` display field is hidden
- **Mapping**: Not in server mapping fixture; label provided via hardcoded prop or mapping update

### Field: `tytul_upr` (derived)

- **Source**: `calc` function on Krok 2 — always equals `form.tytul.toUpperCase()`
- **Purpose**: Demonstrates that calc-derived fields update automatically when `tytul` changes on any page
- **Rendered as**: A disabled `InputWiz` (read-only display of derived value)
- **Mapping**: Not in server mapping fixture; label provided via hardcoded prop

---

## WizardPage.calc Contract

```ts
calc?: (form: T) => T
```

- Called synchronously after every `setValue` and `setForm`
- Must be a pure function — no side effects
- Returns the complete new form state (not a diff)
- Does not run after `clearFields` or `appendData`
- Scoped to the current page — the calc of page N does not run when on page M

---

## No Contract Changes

No public API surface, MSW endpoint, or Zustand store shape is modified by Phase 5. All additions are within the existing `WizardConfig`, `WizardPage`, and `WizardAPI` types that were already defined.
