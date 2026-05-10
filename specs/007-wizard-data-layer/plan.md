# Implementation Plan: Wizard Data Layer (Phase 2)

**Branch**: `007-wizard-data-layer` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/007-wizard-data-layer/spec.md`

## Summary

Phase 2 wires the wizard engine to real data sources. Three TanStack Query
hooks (`useWizardMapping`, `useWizardData`, `useWizardSave`) are created and
integrated into `WizardProvider`, replacing the Phase 1 stubs. Four MSW handler
factories are added so any wizard consumer can register its own mock endpoints.
The demo page is updated to use real URLs.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, React 19, TanStack Query v5,
  Zustand v5, MSW v2, sonner v2, shadcn/ui
**Storage**: Zustand global store (wizard slice) for form state; TanStack Query
  cache for mapping and initial data
**Testing**: N/A - constitution forbids automated tests
**Target Platform**: Modern desktop and mobile browsers
**Project Type**: web frontend
**Performance Goals**: Mapping cached for wizard lifetime; no duplicate fetches;
  save mutation shows feedback within one interaction cycle
**Constraints**: Polish UI, theme parity, no automated tests, no comments,
  surgical changes only to wizard files
**Scale/Scope**: 3 new hook files, 1 new MSW handler file, 2 modified files
  (WizardProvider.tsx, wizard-demo/page.tsx), 1 update to handlers/index.ts

## Constitution Check

*GATE: Must pass before implementation.*

- **Think Before Coding**: Problem is fully understood from the Phase 2 design
  doc and the Phase 1 codebase. Stubs, types, and slice are all in place.
  ✅ PASS
- **Simplicity First**: Three focused hooks, one handler file. No new
  abstractions beyond what the design doc specifies.
  ✅ PASS
- **Surgical Changes**: Only wizard-related files are touched. Existing MSW
  handlers for dashboard/applications are untouched.
  ✅ PASS
- **Goal-Driven Execution**: Success criteria in spec (SC-001 through SC-005)
  are explicit and verifiable in the browser.
  ✅ PASS
- **Frontend-First, Backend-Decoupled**: All data comes from MSW mocks. No
  Laravel integration yet. Contracts (`mappingUrl`, `dataUrl`, `saveUrl`) are
  URL strings — backend-agnostic.
  ✅ PASS
- **TypeScript, App Router, shadcn/ui**: All new files are TypeScript. Hooks
  and components stay in the App Router client layer.
  ✅ PASS
- **Polish UI, Responsiveness, Theme Parity**: No new UI components added in
  this phase. Existing Wizard layout unchanged.
  ✅ PASS
- **No Tests, Minimal Comments**: No tests planned. No code comments added.
  ✅ PASS

**All gates pass. Proceed to implementation.**

## Project Structure

### Documentation (this feature)

```text
specs/007-wizard-data-layer/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (files touched by this phase)

```text
src/
├── hooks/wizard/
│   ├── useWizardMapping.ts     ← NEW
│   ├── useWizardData.ts        ← NEW
│   └── useWizardSave.ts        ← NEW
├── components/wizard/
│   └── WizardProvider.tsx      ← MODIFIED (wire all three hooks)
├── mocks/
│   └── handlers/
│       ├── wizard.ts           ← NEW (4 factory functions)
│       └── index.ts            ← MODIFIED (register demo handlers)
└── app/
    └── wizard-demo/
        └── page.tsx            ← MODIFIED (real URLs + demo mapping fixture)
```

## Implementation Tasks

### Task 1 — `useWizardMapping`

**File**: `src/hooks/wizard/useWizardMapping.ts`

TanStack Query v5 `useQuery` hook. Fetches `mappingUrl` and returns
`PageMapping[]`. Cached for the wizard's lifetime using `mappingUrl` as the
query key.

```ts
export function useWizardMapping(mappingUrl: string) {
  return useQuery<PageMapping[]>({
    queryKey: ['wizard-mapping', mappingUrl],
    queryFn: () => fetch(mappingUrl).then(r => r.json()),
    staleTime: Infinity,
  })
}
```

Returns `{ data, isLoading, isError, refetch }`.

---

### Task 2 — `useWizardData`

**File**: `src/hooks/wizard/useWizardData.ts`

TanStack Query v5 `useQuery` hook. Fetches `dataUrl` and on success writes the
flat result into the Zustand wizard slice.

```ts
export function useWizardData(
  dataUrl: string,
  wizardName: string,
  setWizardData: (name: string, data: Record<string, unknown>) => void,
) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['wizard-data', dataUrl],
    queryFn: () => fetch(dataUrl).then(r => r.json()),
    staleTime: Infinity,
  })
}
```

The caller (`WizardProvider`) handles the `onSuccess` side-effect via a
`useEffect` watching `data`:

```ts
const { data: fetchedData, isLoading: dataLoading, refetch } = useWizardData(dataUrl, name, setWizardData)

useEffect(() => {
  if (fetchedData) setWizardData(name, fetchedData)
}, [fetchedData, name, setWizardData])
```

Returns `{ data, isLoading, isError, refetch }`.

---

### Task 3 — `useWizardSave`

**File**: `src/hooks/wizard/useWizardSave.ts`

TanStack Query v5 `useMutation` hook. Sends `PUT saveUrl` with the full flat
form payload. On success fires `toast.success`. On error fires `toast.error`.

```ts
export function useWizardSave(saveUrl: string | undefined) {
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: (payload) => {
      if (!saveUrl) return Promise.resolve()
      return fetch(saveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(() => undefined)
    },
    onSuccess: () => toast.success('Zapisano'),
    onError: () => toast.error('Błąd zapisu'),
  })
}
```

Returns `{ mutateAsync, isPending }`.

---

### Task 4 — MSW Handler Factories

**File**: `src/mocks/handlers/wizard.ts`

Four factory functions using MSW v2 `http` and `HttpResponse`:

```ts
import { http, HttpResponse } from 'msw'
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export function createWizardMappingHandler(url: string, pages: PageMapping[]) {
  return http.get(url, () => HttpResponse.json(pages))
}

export function createWizardDataHandler(url: string, data: Record<string, unknown>) {
  return http.get(url, () => HttpResponse.json(data))
}

export function createWizardSaveHandler(url: string) {
  return http.put(url, () => HttpResponse.json({ ok: true }))
}

export function createWizardValidationHandler(url: string, result: SummaryResult) {
  return http.get(url, () => HttpResponse.json(result, { status: 422 }))
}
```

---

### Task 5 — `WizardProvider` Integration

**File**: `src/components/wizard/WizardProvider.tsx` (modify existing)

Replace the three stubs with real hook calls. Key changes:

1. Import `useWizardMapping`, `useWizardData`, `useWizardSave`.
2. Replace `const [mapping] = useState<PageMapping[]>([])` with:
   ```ts
   const { data: mappingData, isLoading: mappingLoading } = useWizardMapping(mappingUrl)
   const mapping = mappingData ?? []
   ```
3. Add `useWizardData` call and a `useEffect` to write fetched data into Zustand:
   ```ts
   const { data: fetchedData, isLoading: dataLoading, refetch } = useWizardData(dataUrl)
   useEffect(() => {
     if (fetchedData) setWizardData(name, fetchedData)
   }, [fetchedData, name, setWizardData])
   ```
4. Add `useWizardSave` call:
   ```ts
   const saveMutation = useWizardSave(saveUrl)
   ```
5. Replace `save: async () => {}` stub:
   ```ts
   save: async () => { await saveMutation.mutateAsync(form as Record<string, unknown>) },
   ```
6. Replace `saveAndQuit: async () => {}` stub:
   ```ts
   saveAndQuit: async () => {
     await saveMutation.mutateAsync(form as Record<string, unknown>)
     saveAndQuitCallback?.()
   },
   ```
7. Wire `loading` from the two fetch states:
   ```ts
   const loading = mappingLoading || dataLoading
   ```
8. Wire `refetch` to the data refetch function.
9. Update `nav()` to auto-save when `saveOnPageChange && mode === 'edit'`:
   ```ts
   const nav = useCallback(async (toPage: number) => {
     setBusy(true)
     if (saveOnPageChange && mode === 'edit' && saveUrl) {
       await saveMutation.mutateAsync(form as Record<string, unknown>).catch(() => {})
     }
     setWizardValidation(name, [])
     setPage(toPage)
     setBusy(false)
   }, [saveOnPageChange, mode, saveUrl, saveMutation, form, name, setWizardValidation])
   ```
10. Replace mapping helpers (`getLabel`, `getType`, `getDisplay`, `getMax`,
    `getDecimal`) to look up real values from `mapping`:
    ```ts
    getLabel: (field, pg) => {
      const pages = pg ? mapping.filter(m => m.name === pg) : mapping
      return pages.flatMap(m => m.fields).find(f => f.name === field)?.label ?? field
    },
    getType: (field, pg) => {
      const pages = pg ? mapping.filter(m => m.name === pg) : mapping
      return pages.flatMap(m => m.fields).find(f => f.name === field)?.type ?? 'input'
    },
    getDisplay: (field, pg) => {
      const pages = pg ? mapping.filter(m => m.name === pg) : mapping
      return pages.flatMap(m => m.fields).find(f => f.name === field)?.display ?? true
    },
    getMax: (field, pg) => {
      const pages = pg ? mapping.filter(m => m.name === pg) : mapping
      return pages.flatMap(m => m.fields).find(f => f.name === field)?.max
    },
    getDecimal: (field, pg) => {
      const pages = pg ? mapping.filter(m => m.name === pg) : mapping
      return pages.flatMap(m => m.fields).find(f => f.name === field)?.decimal ?? 2
    },
    ```

---

### Task 6 — Demo Page + MSW Registration

**File**: `src/app/wizard-demo/page.tsx` (modify existing)

Add real URLs to the `<Wizard>` component and a small demo mapping fixture:

```ts
const MAPPING_URL = '/api/wizard-demo/mapping'
const DATA_URL = '/api/wizard-demo/data'
const SAVE_URL = '/api/wizard-demo/save'
```

**File**: `src/mocks/handlers/index.ts` (modify existing)

Import and register demo handlers:

```ts
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
} from './wizard'

// demo fixture (inline in index.ts or extracted to mocks/data/wizard-demo.ts)
const demoMapping: PageMapping[] = [
  { name: 'step1', label: 'Dane podstawowe', fields: [
    { name: 'title', label: 'Tytuł', type: 'input', lp: 1, display: true },
  ]},
  { name: 'step2', label: 'Szczegóły', fields: [
    { name: 'details', label: 'Opis', type: 'textarea', lp: 1, display: true },
  ]},
]

export const handlers = [
  // ... existing handlers ...
  createWizardMappingHandler('/api/wizard-demo/mapping', demoMapping),
  createWizardDataHandler('/api/wizard-demo/data', { title: '', details: '' }),
  createWizardSaveHandler('/api/wizard-demo/save'),
]
```

---

## UI / Theme / Responsiveness Impact

- No new UI components introduced in this phase.
- `loading` state in `WizardProvider` should disable nav buttons when
  `loading === true`. Verify `Wizard.tsx` already reads `loading` from the API
  and applies a disabled/skeleton state. If not, add a minimal loading guard.
- No light/dark theme changes needed.
- No mobile layout changes needed.

## Laravel Integration Readiness

- `mappingUrl`, `dataUrl`, `saveUrl` are plain URL strings. Replacing MSW with
  a real Laravel endpoint requires only changing the URL — no hook changes.
- PUT payload is the flat form object; the shape must be documented as the
  integration contract (see `data-model.md`).

## Complexity Tracking

No constitution violations. All changes are within the wizard domain.
