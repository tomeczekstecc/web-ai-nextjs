# Implementation Plan: Wizard Field Input Components (Phase 3)

**Branch**: `009-wizard-field-inputs` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/008-wizard-field-inputs/spec.md`

## Summary

Phase 3 delivers the field-level developer API for the wizard engine. A new hook
(`useWizardField`) and five self-contained Wiz input components (`InputWiz`,
`SelectWiz`, `TextareaWiz`, `DateTimeWiz`, `RadioWiz`) reduce per-field page code
to a single line. An internal `ValidationWrapper` handles the red-border + error
alert + scroll anchor pattern shared by all five components. Three missing
shadcn/ui components (`textarea`, `radio-group`, `alert`) must be installed first.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, React 19, shadcn/ui (base-nova),
  Tailwind CSS v4, Zustand v5 (wizard slice from Phase 1)
**Storage**: No new storage — reads from Zustand form and validation state via
  `useWizard()` context established in Phase 1
**Testing**: N/A — constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: web frontend
**Performance Goals**: No measurable performance concern — components are thin
  wrappers over existing shadcn primitives
**Constraints**: Polish UI, theme parity (light/dark), no comments, surgical
  changes, no automated tests
**Scale/Scope**: 1 new hook, 1 internal component, 5 input components, 3 shadcn
  installs, 1 demo page update

## Constitution Check

- **Think Before Coding**: Phase 1 and 2 codebase is understood. `ValidationItem`
  shape (`key`, `type`, `msgs[]`) confirmed from `src/lib/store/types.ts`.
  Missing shadcn components identified. ✅ PASS
- **Simplicity First**: Each Wiz component delegates all logic to `useWizardField`
  and `ValidationWrapper`. No duplication, no over-abstraction. ✅ PASS
- **Surgical Changes**: Only wizard hook and input files are created. Demo page
  update is one component change. No other files touched. ✅ PASS
- **Goal-Driven Execution**: Success criteria from spec (SC-001 to SC-005) are
  explicit and browser-verifiable. ✅ PASS
- **Frontend-First, Backend-Decoupled**: No backend calls. Pure UI layer over
  existing store and context. ✅ PASS
- **TypeScript, App Router, shadcn/ui**: All files are `.tsx`/`.ts`. Components
  use shadcn primitives. `'use client'` on all input components. ✅ PASS
- **Polish UI, Responsiveness, Theme Parity**: shadcn primitives handle
  light/dark. Destructive ring/alert tokens are theme-aware. ✅ PASS
- **No Tests, Minimal Comments**: No tests. No comments. ✅ PASS

**All gates pass. Proceed to implementation.**

## Project Structure

### Documentation (this feature)

```text
specs/008-wizard-field-inputs/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (files created/modified)

```text
src/
├── components/ui/
│   ├── textarea.tsx          ← INSTALL (shadcn)
│   ├── radio-group.tsx       ← INSTALL (shadcn)
│   └── alert.tsx             ← INSTALL (shadcn)
├── hooks/wizard/
│   └── useWizardField.ts     ← NEW
├── components/wizard/
│   ├── ValidationWrapper.tsx ← NEW (internal only, not re-exported)
│   └── inputs/
│       ├── InputWiz.tsx      ← NEW
│       ├── SelectWiz.tsx     ← NEW
│       ├── TextareaWiz.tsx   ← NEW
│       ├── DateTimeWiz.tsx   ← NEW
│       └── RadioWiz.tsx      ← NEW
└── app/
    └── wizard-demo/
        └── page.tsx          ← MODIFIED (Krok1: replace raw input with InputWiz)
```

## Implementation Tasks

### Task 1 — Install Missing shadcn/ui Components

Install `textarea`, `radio-group`, and `alert` via the shadcn CLI. These are
prerequisites for `TextareaWiz`, `RadioWiz`, and `ValidationWrapper`.

```sh
pnpm dlx shadcn@latest add textarea
pnpm dlx shadcn@latest add radio-group
pnpm dlx shadcn@latest add alert
```

Verify that `src/components/ui/textarea.tsx`, `radio-group.tsx`, and `alert.tsx`
are created after each install.

---

### Task 2 — `useWizardField`

**File**: `src/hooks/wizard/useWizardField.ts`

Reads from `useWizard()` context and returns the six field-level values. Uses the
confirmed `ValidationItem` shape: `key` and `msgs[0]`.

```ts
'use client'

import { useWizard } from '@/hooks/wizard/useWizard'

export function useWizardField(keyName: string) {
  const { form, setValue, getLabel, getDisplay, validation, mode } = useWizard()
  const label = getLabel(keyName)
  const value = form[keyName] ?? ''
  const onChange = (v: unknown) => setValue(keyName as never, v)
  const hidden = !getDisplay(keyName)
  const disabled = mode === 'view'
  const error = validation.find(item => item.key === keyName)?.msgs[0]
  return { label, value, onChange, hidden, disabled, error }
}
```

The `as never` cast on `setValue` avoids a TypeScript generic mismatch when the
wizard is typed as `WizardAPI` (no type parameter available in the hook).

---

### Task 3 — `ValidationWrapper`

**File**: `src/components/wizard/ValidationWrapper.tsx`

Internal component. Not exported from any index or public surface. Wraps children
with a red ring on validation hit, renders a scroll anchor, and shows a shadcn
Alert below.

```tsx
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '@/hooks/wizard/useWizard'

type Props = {
  field: string
  error: string | undefined
  children: React.ReactNode
}

export function ValidationWrapper({ field, error, children }: Props) {
  const { pageKey } = useWizard()
  return (
    <div className="flex flex-col gap-1">
      <span id={`${pageKey}.${field}`} />
      <div className={error ? 'ring-2 ring-destructive rounded-md' : undefined}>
        {children}
      </div>
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

---

### Task 4 — `InputWiz`

**File**: `src/components/wizard/inputs/InputWiz.tsx`

```tsx
'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type Props = {
  keyName: string
  hide?: boolean
  label?: string
}

export function InputWiz({ keyName, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <Input
          id={keyName}
          value={f.value as string}
          onChange={e => f.onChange(e.target.value)}
          disabled={f.disabled}
        />
      </ValidationWrapper>
    </div>
  )
}
```

---

### Task 5 — `SelectWiz`

**File**: `src/components/wizard/inputs/SelectWiz.tsx`

```tsx
'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type OptionItem = { value: string; label: string }

type Props = {
  keyName: string
  options: OptionItem[]
  hide?: boolean
  label?: string
}

export function SelectWiz({ keyName, options, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <Select
          value={f.value as string}
          onValueChange={v => f.onChange(v)}
          disabled={f.disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ValidationWrapper>
    </div>
  )
}
```

---

### Task 6 — `TextareaWiz`

**File**: `src/components/wizard/inputs/TextareaWiz.tsx`

```tsx
'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type Props = {
  keyName: string
  hide?: boolean
  label?: string
}

export function TextareaWiz({ keyName, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <Textarea
          id={keyName}
          value={f.value as string}
          onChange={e => f.onChange(e.target.value)}
          disabled={f.disabled}
        />
      </ValidationWrapper>
    </div>
  )
}
```

---

### Task 7 — `DateTimeWiz`

**File**: `src/components/wizard/inputs/DateTimeWiz.tsx`

Uses a native `<input>` styled to match shadcn `Input` rather than a calendar
popover. `hideTime` switches between `date` and `datetime-local` input types.

```tsx
'use client'

import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'
import { cn } from '@/lib/utils'

type Props = {
  keyName: string
  hideTime?: boolean
  hide?: boolean
  label?: string
}

export function DateTimeWiz({ keyName, hideTime, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <input
          id={keyName}
          type={hideTime ? 'date' : 'datetime-local'}
          value={f.value as string}
          onChange={e => f.onChange(e.target.value)}
          disabled={f.disabled}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
            'transition-colors placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </ValidationWrapper>
    </div>
  )
}
```

---

### Task 8 — `RadioWiz`

**File**: `src/components/wizard/inputs/RadioWiz.tsx`

```tsx
'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type OptionItem = { value: string; label: string }

type Props = {
  keyName: string
  options: OptionItem[]
  hide?: boolean
  label?: string
}

export function RadioWiz({ keyName, options, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <RadioGroup
          value={f.value as string}
          onValueChange={v => f.onChange(v)}
          disabled={f.disabled}
          className="flex flex-col gap-2"
        >
          {options.map(o => (
            <div key={o.value} className="flex items-center gap-2">
              <RadioGroupItem value={o.value} id={`${keyName}-${o.value}`} />
              <Label htmlFor={`${keyName}-${o.value}`}>{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </ValidationWrapper>
    </div>
  )
}
```

---

### Task 9 — Demo Page Update

**File**: `src/app/wizard-demo/page.tsx`

Replace the raw `<input>` in `Krok1` with `<InputWiz keyName="tytul" />`. The
`useWizard()` import in `Krok1` can be removed since `InputWiz` handles it
internally.

```tsx
// After Krok1:
function Krok1() {
  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <h2 className="text-lg font-semibold">Krok 1 — Start</h2>
      <InputWiz keyName="tytul" />
      <p className="text-xs text-muted-foreground">
        Przejdź do Kroku 2 i wróć — tytuł powinien zostać.
      </p>
    </div>
  )
}
```

---

## UI / Theme / Responsiveness Impact

- All Wiz components use shadcn primitives — light/dark theme handled by CSS
  variables already in place.
- `ring-destructive` and `text-destructive` tokens are theme-aware.
- `DateTimeWiz` copies the same Tailwind classes as shadcn `Input` so it blends
  visually in both themes.
- No mobile-specific work needed — shadcn primitives are responsive by default.

## Laravel Integration Readiness

- No new data contracts. Field names in Wiz components map directly to the flat
  form payload defined in Phase 2.

## Complexity Tracking

No constitution violations. All changes are additive within the wizard domain.
