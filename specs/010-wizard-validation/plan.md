# Implementation Plan: Wizard Validation System

**Branch**: `010-wizard-validation` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/010-wizard-validation/spec.md`

## Summary

Implement Phase 4 of the wizard engine: client-side Zod schema validation that blocks page navigation on failure, and server-side 422-driven summary validation with grouped jump links. The work adds a pure `validation.ts` utility module, updates `WizardProvider` to run both validation paths, and delivers `WizardSummary` as a drop-in summary page component.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, React 19, Zustand, TanStack Query, shadcn/ui, Zod, MSW
**Storage**: Zustand wizard slice (validation items); React local state (SummaryResult); no persistence
**Testing**: N/A — constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: web frontend
**Performance Goals**: Validation runs synchronously on nav click; summary fetch is async with existing busy state
**Constraints**: Polish UI labels, dark/light theme parity, no automated tests, no unnecessary comments, surgical changes only
**Scale/Scope**: Wizard engine — shared component system, no standalone route

## Constitution Check

- **Problem understood before coding**: Yes — research.md resolves all design decisions upfront
- **Simplest viable solution**: Yes — `validation.ts` is a pure module with two functions; no new abstractions
- **Surgical changes**: Yes — only `WizardProvider` needs updating; all existing components remain unchanged
- **Explicit success criteria**: Yes — defined in spec.md SC-001 through SC-005
- **TypeScript, App Router, shadcn/ui, Polish UI, theme parity**: Yes — all enforced; WizardSummary uses shadcn Alert
- **No automated tests, minimal comments**: Confirmed — no test files in deliverables
- **Backend-decoupled**: Yes — validation contract fulfilled by MSW; Laravel integration is a future concern

**Result: PASS — no violations**

## Project Structure

### Documentation (this feature)

```text
specs/010-wizard-validation/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── validation-api-contract.md
└── tasks.md
```

### Source Code (files touched by this feature)

```text
src/lib/wizard/
└── validation.ts                    ← NEW: runPageSchema + parseSummaryResult

src/components/wizard/
├── WizardProvider.tsx               ← MODIFIED: Zod nav gate + validationUrl call + summary state
└── WizardSummary.tsx                ← NEW: summary page component

src/mocks/handlers/
└── wizard.ts                        ← MODIFIED: demo validation handler fixture data

src/app/wizard-demo/
└── page.tsx                         ← MODIFIED: add summary page + Zod schema + validationUrl
```

## Implementation Tasks

### Task P4.1 — Create validation.ts

**File**: `src/lib/wizard/validation.ts`

Create a pure utility module with two exported functions. No React, no hooks.

**`runPageSchema<T>(schema, form): ValidationItem[]`**

- Call `schema.safeParse(form)`
- If `result.success` → return `[]`
- Collect all `result.error.issues`
- Group by `String(issue.path[0] ?? '')` as the key
- Collect `issue.message` into `msgs[]` per key
- Return `ValidationItem[]` with `type: 'error'` for all entries

**`parseSummaryResult(result: SummaryResult): ValidationItem[]`**

- Iterate `Object.entries(result.error ?? {})` → `ValidationItem { key, type: 'error', msgs }`
- Iterate `Object.entries(result.warning ?? {})` → `ValidationItem { key, type: 'warning', msgs }`
  - Skip any key that already has an error entry (de-duplicate)
- Do NOT process `result.dicts_msg` — WizardSummary reads those from the raw `summary` object
- Return combined array

**Imports needed**: `z` from `zod`, `ValidationItem` from `@/lib/store/types`, `SummaryResult` from `@/lib/wizard/types`

---

### Task P4.2 — Update WizardProvider

**File**: `src/components/wizard/WizardProvider.tsx`

Three targeted changes:

**1. Add `summary` state**

```tsx
const [summary, setSummary] = useState<SummaryResult | null>(null)
```

Pass `summary` into the `WizardContext` value. The existing placeholder is `summary: null` — replace with the state variable.

**2. Wire Zod validation into the `nav(toPage)` function**

Before executing the page change, run the current page's schema if it exists:

```tsx
const currentPage = pages[page]
if (currentPage.schema) {
  const errors = runPageSchema(currentPage.schema, form)
  if (errors.length > 0) {
    setWizardValidation(name, errors)
    return  // block navigation
  }
}
setWizardValidation(name, [])  // clear stale errors before moving
```

This replaces the existing unconditional `setWizardValidation(name, [])` call that currently runs on every nav.

**3. Wire `validationUrl` call on summary page entry**

After `setPage(toPage)` executes, check if the target page has `isSummaryPage: true`:

```tsx
const targetPage = pages[toPage]
if (targetPage.isSummaryPage && validationUrl) {
  try {
    const res = await fetch(validationUrl)
    const result: SummaryResult = await res.json()
    setSummary(result)
    setWizardValidation(name, parseSummaryResult(result))
  } catch {
    // non-blocking; summary stays null
  }
}
```

Note: `setPageByName` navigates without running the Zod gate and without clearing validation — that is the existing behavior and must be preserved.

**Imports to add**: `runPageSchema`, `parseSummaryResult` from `@/lib/wizard/validation`; `SummaryResult` from `@/lib/wizard/types`

---

### Task P4.3 — Create WizardSummary

**File**: `src/components/wizard/WizardSummary.tsx`

A client component (`'use client'`) that renders the full summary view.

**Structure**:

```tsx
export function WizardSummary() {
  const { summary, validation, mapping, setPageByName, pageKey, acceptButtons } = useWizard()
  // derive status, groups, dicts
}
```

**Status derivation**:

```tsx
const hasErrors   = Object.keys(summary?.error ?? {}).length > 0 || Object.keys(summary?.dicts_msg?.error ?? {}).length > 0
const hasWarnings = validation.some(v => v.type === 'warning')
const status      = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'
```

**Page grouping**:

```tsx
const groups = mapping.map(p => ({
  page:     p,
  errors:   validation.filter(v => v.type === 'error'   && p.fields.some(f => f.name === v.key)),
  warnings: validation.filter(v => v.type === 'warning' && p.fields.some(f => f.name === v.key)),
})).filter(g => g.errors.length > 0 || g.warnings.length > 0)
```

**Rendering**:

1. Status `<Alert>` at top — variant matches status (destructive / yellow / green). Polish text:
   - error: "Formularz zawiera błędy. Popraw pola oznaczone poniżej."
   - warning: "Formularz zawiera ostrzeżenia. Sprawdź oznaczone pola."
   - success: "Formularz jest poprawny. Możesz przesłać dane."

2. Per page group:
   - Page label (bold) + "Przejdź do strony" `<Button variant="outline" size="sm">` → `setPageByName(page.name)`
   - Per error item: field label (from `page.fields.find`) + "Przejdź do pola" button → `setPageByName(page.name, page.name + '.' + item.key)`
   - Per warning item: same pattern, different styling

3. `dicts_msg` section (if `summary?.dicts_msg?.error` has entries):
   - Section heading "Błędy systemowe"
   - Render each entry as a list item (no jump button — no field to jump to)

4. `acceptButtons` section at bottom:
   - Render `acceptButtons(summary)` only when `!hasErrors`

**Note**: `acceptButtons` comes from the wizard config. Access it from `useWizard()` — ensure the WizardAPI exposes it (it is part of `WizardConfig` and should be threaded through `WizardContext` by `WizardProvider`).

---

### Task P4.4 — Update MSW demo validation handler fixture

**File**: `src/mocks/handlers/wizard.ts`

Locate the `createWizardValidationHandler` call for the demo wizard and update the fixture to include a realistic SummaryResult:

```ts
createWizardValidationHandler('/api/wizard-demo/validate', {
  error: {
    tytul: ['Tytuł jest wymagany i musi mieć co najmniej 3 znaki.'],
  },
  warning: {
    opis: ['Opis jest bardzo krótki. Rozważ dodanie więcej szczegółów.'],
  },
  dicts_msg: {
    error: {
      formularz: ['Formularz zawiera błędy, które muszą zostać poprawione przed zapisem.'],
    },
    warning: {},
  },
})
```

This provides coverage for all three WizardSummary sections (error, warning, dicts_msg).

---

### Task P4.5 — Update demo page

**File**: `src/app/wizard-demo/page.tsx`

Three targeted changes:

**1. Add Zod schema to krok-1**

```tsx
import { z } from 'zod'
// on the krok-1 WizardPage entry:
schema: z.object({
  tytul: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki'),
}),
```

**2. Add a summary page (krok-4)**

```tsx
import { WizardSummary } from '@/components/wizard/WizardSummary'
// append to pages array:
{
  name: 'krok-4',
  isSummaryPage: true,
  form: <WizardSummary />,
},
```

**3. Wire `validationUrl` on the WizardConfig**

Add to both the edit and view wizard instances:

```tsx
validationUrl="/api/wizard-demo/validate"
```

And add an `acceptButtons` prop to the edit instance:

```tsx
acceptButtons={(summary) => (
  <Button variant="default" onClick={() => console.log('submit', summary)}>
    Wyślij
  </Button>
)}
```

---

## UI Impact

| Concern | Impact |
|---|---|
| Light/dark theme | WizardSummary uses shadcn `Alert` (theme-aware) and `Button` (existing variants) — no custom colours |
| Responsiveness | Summary list is a vertical stack — works at all widths |
| Polish UI | All user-visible strings in WizardSummary are Polish |
| Laravel integration | `validationUrl` will point to a real Laravel endpoint; the SummaryResult shape is the contract |

## Complexity Tracking

No constitution violations — no entry required.
