# Research: Wizard Field Input Components (Phase 3)

## Missing shadcn/ui Components

**Finding**: `src/components/ui/` has `input`, `select`, and `label` but is
missing `textarea` and `radio-group`. `calendar` and `popover` (needed for a
full date picker) are also absent.

**Decision**:
- `textarea` — install via `pnpm dlx shadcn@latest add textarea`
- `radio-group` — install via `pnpm dlx shadcn@latest add radio-group`
- `DateTimeWiz` — use a styled `<input type="date" />` / `<input type="datetime-local" />`
  as a self-contained primitive rather than installing the full Calendar + Popover
  stack. The spec allows this fallback and it stays consistent with the `base-nova`
  style when wrapped in the same border/focus styling as `Input`.

**Rationale**: Keeping dependencies minimal. The date input fallback is testable,
accessible, and works in all modern browsers. A full calendar popover can be
upgraded later as a non-breaking enhancement.

**Alternatives considered**:
- Installing `calendar` + `popover` — rejected as over-engineering for Phase 3;
  the spec explicitly calls this acceptable.
- Using a third-party date picker library — rejected; adds a new dependency
  outside the established shadcn/ui pattern.

---

## `useWizardField` Hook Design

**Decision**: `useWizardField(keyName)` is a thin wrapper over `useWizard()` that
derives all six values (`label`, `value`, `onChange`, `hidden`, `disabled`,
`error`) in one call and returns them as a plain object.

```ts
export function useWizardField(keyName: string) {
  const { form, setValue, getLabel, getDisplay, validation, mode } = useWizard()
  const label = getLabel(keyName)
  const value = form[keyName] ?? ''
  const onChange = (v: unknown) => setValue(keyName as never, v)
  const hidden = !getDisplay(keyName)
  const disabled = mode === 'view'
  const error = validation.find(item => item.field === keyName)?.message
  return { label, value, onChange, hidden, disabled, error }
}
```

**Rationale**: Single hook call gives page authors the escape hatch with no
prop-drilling or context manipulation. All Wiz components call this same hook
internally, so the public and internal APIs are identical.

**Alternatives considered**: Passing props down from the page — rejected because
it breaks the "one line per field" contract and requires page authors to know
about mapping, validation, and mode.

---

## `ValidationWrapper` Internal Pattern

**Decision**: `ValidationWrapper` is a co-located internal component in
`src/components/wizard/ValidationWrapper.tsx` and is NOT re-exported from any
public index. Each Wiz component imports it directly from a relative path.

The scroll anchor uses `id={pageKey + '.' + field}` so WizardSummary jump-links
can target individual fields. The component wraps its child(ren) in a
`<div className="relative">` with a red ring when an error is present, and
renders a shadcn `Alert` with `variant="destructive"` below.

**Alternatives considered**: Inline validation inside each Wiz component — rejected
because it duplicates the border + alert pattern across five components, making
future restyling harder.

---

## Wiz Component Props Contract

Each Wiz component follows this minimal contract:

```ts
type WizProps = {
  keyName: string        // must match a field name in the server mapping
  hide?: boolean         // explicit override; combined with getDisplay()
  label?: string         // override the server-mapped label when needed
}
```

Additional props per variant:
- `SelectWiz`: `options: { value: string; label: string }[]`
- `RadioWiz`: `options: { value: string; label: string }[]`
- `DateTimeWiz`: `hideTime?: boolean` (if false, uses datetime-local; if true, date only)

**Rationale**: Minimal surface. Options are not in the field mapping (mapping
carries metadata, not values), so they must be props.

---

## ValidationItem.field vs ValidationItem.key

**Finding**: Looking at `src/lib/store/types.ts`, the `ValidationItem` type uses
`field` as the key (based on Phase 1 implementation). `useWizardField` looks up
`validation.find(item => item.field === keyName)`. Need to verify the exact shape
of `ValidationItem` before implementation.

**Action**: Read `src/lib/store/types.ts` before implementing `useWizardField`
to confirm field name used for field lookup.

---

## Light/Dark Mode for Wiz Components

**Decision**: All Wiz components use shadcn/ui primitives (`Input`, `Select`,
`Textarea`, `RadioGroup`) which already handle light/dark mode via the project's
CSS variable theme system. No additional theme work is needed. The validation
error state uses `ring-destructive` / `border-destructive` tokens which are also
theme-aware.

---

## Resolved Clarifications

All design questions were pre-resolved by the Phase 3 design doc and spec.
No open clarifications remain.
