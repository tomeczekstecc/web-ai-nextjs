# Wizard System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable multi-step form wizard engine with server-driven field mapping, Zustand global state, TanStack Query data layer, Zod + server 422 validation, and a full Tasks showcase module.

**Architecture:** A three-layer stack — engine (WizardProvider + Zustand + useWizard context), data (TanStack Query hooks + MSW), and UI (Wizard shell + self-contained Wiz input components). Page components call `useWizard()` directly — no prop drilling. Zustand is the global store for all wizard draft state, wired to Redux DevTools via middleware.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query v5 · Zustand · Zod v4 · MSW v2 · Vitest + React Testing Library

**Spec:** `docs/superpowers/specs/2026-05-10-wizard-design.md`

---

## Task 1: Add Vitest + React Testing Library

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Modify: `package.json`

- [ ] **Step 1: Install dev dependencies**

```bash
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom vite-tsconfig-paths jsdom
```

- [ ] **Step 2: Create vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 3: Create test setup file**

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Add test scripts to package.json**

In `package.json` scripts section, add:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Write a smoke test to verify the setup works**

```ts
// src/test/setup.test.ts
import { describe, it, expect } from 'vitest'

describe('test setup', () => {
  it('works', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 6: Run the smoke test**

```bash
pnpm test:run
```

Expected: `1 passed`

- [ ] **Step 7: Delete the smoke test file**

```bash
rm src/test/setup.test.ts
```

- [ ] **Step 8: Commit**

```bash
git add vitest.config.ts src/test/setup.ts package.json pnpm-lock.yaml
git commit -m "chore: add Vitest + React Testing Library"
```

---

## Task 2: Store Types

**Files:**
- Create: `src/lib/store/types.ts`

- [ ] **Step 1: Write a failing test**

```ts
// src/lib/store/store.test.ts
import { describe, it, expect } from 'vitest'
import type { StoreState } from './types'

describe('StoreState type', () => {
  it('satisfies the wizard slice shape', () => {
    const state: StoreState = {
      wizards: {},
      setWizardData: () => {},
      setWizardValidation: () => {},
      clearWizard: () => {},
    }
    expect(state.wizards).toEqual({})
  })
})
```

- [ ] **Step 2: Run to confirm it fails (missing module)**

```bash
pnpm test:run src/lib/store/store.test.ts
```

Expected: FAIL — `Cannot find module './types'`

- [ ] **Step 3: Create the types file**

```ts
// src/lib/store/types.ts
export type ValidationItem = {
  key: string
  type: 'error' | 'warning'
  msgs: string[]
}

export type WizardEntry = {
  form: Record<string, unknown>
  meta: { validation: ValidationItem[] }
}

export type WizardSlice = {
  wizards: Record<string, WizardEntry>
  setWizardData: (name: string, data: Record<string, unknown>) => void
  setWizardValidation: (name: string, items: ValidationItem[]) => void
  clearWizard: (name: string) => void
}

export type StoreState = WizardSlice
// future slices: export type StoreState = WizardSlice & NotificationSlice & ...
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
pnpm test:run src/lib/store/store.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/types.ts src/lib/store/store.test.ts
git commit -m "feat(store): add global store types"
```

---

## Task 3: Wizard Slice

**Files:**
- Create: `src/lib/store/wizard.slice.ts`

- [ ] **Step 1: Add slice tests to the existing test file**

```ts
// src/lib/store/store.test.ts  (replace entire file)
import { describe, it, expect } from 'vitest'
import { createWizardSlice } from './wizard.slice'
import type { StoreState } from './types'

type SetFn = (partial: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => void

function makeSlice() {
  let state: Partial<StoreState> = {}
  const set: SetFn = (partial) => {
    const update = typeof partial === 'function' ? partial(state as StoreState) : partial
    state = { ...state, ...update }
  }
  const slice = createWizardSlice(set as Parameters<typeof createWizardSlice>[0], () => state as StoreState, {} as never)
  return { slice, getState: () => state as StoreState }
}

describe('wizard slice', () => {
  it('initialises with empty wizards map', () => {
    const { slice } = makeSlice()
    expect(slice.wizards).toEqual({})
  })

  it('setWizardData creates an entry keyed by name', () => {
    const { slice, getState } = makeSlice()
    slice.setWizardData('my-wiz', { title: 'Hello' })
    expect(getState().wizards['my-wiz'].form).toEqual({ title: 'Hello' })
  })

  it('setWizardData preserves existing validation', () => {
    const { slice, getState } = makeSlice()
    slice.setWizardData('my-wiz', { title: 'Hello' })
    slice.setWizardValidation('my-wiz', [{ key: 'title', type: 'error', msgs: ['required'] }])
    slice.setWizardData('my-wiz', { title: 'Updated' })
    expect(getState().wizards['my-wiz'].meta.validation).toHaveLength(1)
  })

  it('setWizardValidation writes validation items', () => {
    const { slice, getState } = makeSlice()
    slice.setWizardData('my-wiz', {})
    slice.setWizardValidation('my-wiz', [{ key: 'title', type: 'error', msgs: ['required'] }])
    expect(getState().wizards['my-wiz'].meta.validation[0].key).toBe('title')
  })

  it('clearWizard removes the entry', () => {
    const { slice, getState } = makeSlice()
    slice.setWizardData('my-wiz', { title: 'Hello' })
    slice.clearWizard('my-wiz')
    expect(getState().wizards['my-wiz']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/lib/store/store.test.ts
```

Expected: FAIL — `Cannot find module './wizard.slice'`

- [ ] **Step 3: Implement the wizard slice**

```ts
// src/lib/store/wizard.slice.ts
import type { StateCreator } from 'zustand'
import type { StoreState, WizardSlice } from './types'

export const createWizardSlice: StateCreator<StoreState, [], [], WizardSlice> = (set) => ({
  wizards: {},

  setWizardData: (name, data) =>
    set(
      (state) => ({
        wizards: {
          ...state.wizards,
          [name]: {
            form: data,
            meta: state.wizards[name]?.meta ?? { validation: [] },
          },
        },
      }),
      false,
      'wizard/setData'
    ),

  setWizardValidation: (name, items) =>
    set(
      (state) => ({
        wizards: {
          ...state.wizards,
          [name]: {
            form: state.wizards[name]?.form ?? {},
            meta: { validation: items },
          },
        },
      }),
      false,
      'wizard/setValidation'
    ),

  clearWizard: (name) =>
    set(
      (state) => {
        const { [name]: _, ...rest } = state.wizards
        return { wizards: rest }
      },
      false,
      'wizard/clear'
    ),
})
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test:run src/lib/store/store.test.ts
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/store/wizard.slice.ts src/lib/store/store.test.ts
git commit -m "feat(store): add wizard Zustand slice"
```

---

## Task 4: Global Store with DevTools

**Files:**
- Create: `src/lib/store/index.ts`

- [ ] **Step 1: Install Zustand**

```bash
pnpm add zustand
```

- [ ] **Step 2: Create the global store**

```ts
// src/lib/store/index.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createWizardSlice } from './wizard.slice'
import type { StoreState } from './types'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
    }),
    { name: 'ci-prs-store' }
  )
)
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no type errors in store files

- [ ] **Step 4: Commit**

```bash
git add src/lib/store/index.ts pnpm-lock.yaml
git commit -m "feat(store): create global Zustand store with Redux DevTools"
```

---

## Task 5: Wizard Types

**Files:**
- Create: `src/lib/wizard/types.ts`

- [ ] **Step 1: Create the types file**

```ts
// src/lib/wizard/types.ts
import type { z } from 'zod'
import type { ValidationItem } from '@/lib/store/types'

export type { ValidationItem }

export type FieldType = 'input' | 'select' | 'textarea' | 'date' | 'radio' | 'checkbox'

export type FieldMeta = {
  name: string
  label: string
  type: FieldType
  lp: number
  display: boolean
  max?: number
  decimal?: number
}

export type PageMapping = {
  name: string
  label: string
  fields: FieldMeta[]
}

export type SummaryResult = {
  error: Record<string, string[]>
  warning: Record<string, string[]>
  dicts_msg?: {
    error: Record<string, string[]>
    warning: Record<string, string[]>
  }
}

export type WizardPage<T = Record<string, unknown>> = {
  name: string
  form: React.ReactElement
  disabled?: boolean
  isSummaryPage?: boolean
  noPayload?: boolean
  calc?: (form: T) => T
  schema?: z.ZodSchema
}

export type WizardConfig<T = Record<string, unknown>> = {
  name: string
  mode: 'view' | 'edit'
  pages: WizardPage<T>[]
  mappingUrl: string
  dataUrl: string
  saveUrl?: string
  validationUrl?: string
  saveOnPageChange: boolean
  addData?: Record<string, unknown>
  acceptButtons?: (summary: SummaryResult | null) => React.ReactNode
  customButtons?: () => React.ReactNode
  saveAndQuitCallback?: () => void
  cancelCallback?: () => void
}

export type WizardAPI<T = Record<string, unknown>> = {
  form: T
  setValue: (key: keyof T & string, value: unknown) => void
  setForm: (form: T) => void
  appendData: (data: Partial<T>) => void
  clearFields: (fields: (keyof T & string)[]) => void
  mapping: PageMapping[]
  getLabel: (field: string, page?: string) => string
  getType: (field: string, page?: string) => FieldType
  getDisplay: (field: string, page?: string) => boolean
  getMax: (field: string, page?: string) => number | undefined
  getDecimal: (field: string, page?: string) => number
  page: number
  pageKey: string
  setPageByName: (name: string, scrollTo?: string) => void
  validation: ValidationItem[]
  setValidation: (items: ValidationItem[]) => void
  summary: SummaryResult | null
  mode: 'view' | 'edit'
  loading: boolean
  busy: boolean
  refetch: () => void
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/wizard/types.ts
git commit -m "feat(wizard): add wizard types"
```

---

## Task 6: WizardContext + useWizard Hook

**Files:**
- Create: `src/components/wizard/WizardContext.ts`
- Create: `src/hooks/wizard/useWizard.ts`

- [ ] **Step 1: Write a failing test**

```ts
// src/hooks/wizard/useWizard.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useWizard } from './useWizard'

describe('useWizard', () => {
  it('throws when called outside WizardProvider', () => {
    expect(() => renderHook(() => useWizard())).toThrow(
      'useWizard must be used inside <WizardProvider>'
    )
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/hooks/wizard/useWizard.test.ts
```

Expected: FAIL — `Cannot find module './useWizard'`

- [ ] **Step 3: Create the context**

```ts
// src/components/wizard/WizardContext.ts
import { createContext } from 'react'
import type { WizardAPI } from '@/lib/wizard/types'

export const WizardContext = createContext<WizardAPI | null>(null)
```

- [ ] **Step 4: Create the hook**

```ts
// src/hooks/wizard/useWizard.ts
'use client'

import { use } from 'react'
import { WizardContext } from '@/components/wizard/WizardContext'
import type { WizardAPI } from '@/lib/wizard/types'

export function useWizard<T = Record<string, unknown>>(): WizardAPI<T> {
  const ctx = use(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside <WizardProvider>')
  return ctx as WizardAPI<T>
}
```

- [ ] **Step 5: Run test to confirm it passes**

```bash
pnpm test:run src/hooks/wizard/useWizard.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/wizard/WizardContext.ts src/hooks/wizard/useWizard.ts src/hooks/wizard/useWizard.test.ts
git commit -m "feat(wizard): add WizardContext and useWizard hook"
```

---

## Task 7: WizardProvider (Skeleton — Navigation Only)

No data fetching yet. Provides form state from Zustand + navigation.

**Files:**
- Create: `src/components/wizard/WizardProvider.tsx`

- [ ] **Step 1: Create WizardProvider**

```tsx
// src/components/wizard/WizardProvider.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WizardContext } from './WizardContext'
import { useStore } from '@/lib/store'
import type { WizardAPI, WizardConfig, FieldMeta, PageMapping, SummaryResult } from '@/lib/wizard/types'
import type { ValidationItem } from '@/lib/store/types'

export function WizardProvider<T extends Record<string, unknown>>({
  name,
  mode,
  pages,
  mappingUrl: _mappingUrl,
  dataUrl: _dataUrl,
  saveUrl: _saveUrl,
  validationUrl: _validationUrl,
  saveOnPageChange: _saveOnPageChange,
  addData: _addData,
  saveAndQuitCallback: _saveAndQuitCallback,
  cancelCallback: _cancelCallback,
  children,
}: WizardConfig<T> & { children: React.ReactNode }) {
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const [mapping, setMapping] = useState<PageMapping[]>([])
  const scrollToRef = useRef<string | null>(null)

  const { wizards, setWizardData, setWizardValidation, clearWizard } = useStore()
  const wizardState = wizards[name] ?? { form: {}, meta: { validation: [] } }
  const form = wizardState.form as T
  const validation = wizardState.meta.validation
  const pageKey = pages[page]?.name ?? ''

  useEffect(() => {
    clearWizard(name)
    return () => { clearWizard(name) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  useEffect(() => {
    if (scrollToRef.current) {
      document.getElementById(scrollToRef.current)?.scrollIntoView({ behavior: 'smooth' })
      scrollToRef.current = null
    }
  }, [page])

  const getFieldMeta = useCallback((field: string, _page?: string): FieldMeta | undefined => {
    const pageData = _page
      ? mapping.find(p => p.name === _page)
      : mapping[page]
    if (!pageData) return undefined
    const path = field.split('.').filter(n => !/^\d+$/.test(n))
    return path.reduce<FieldMeta | undefined>((found, key) => {
      if (!found) return (pageData as unknown as { fields: FieldMeta[] }).fields?.find(f => f.name === key)
      return undefined
    }, undefined)
  }, [mapping, page])

  const getLabel = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.label ?? `[${field}]`, [getFieldMeta])

  const getType = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.type ?? 'input', [getFieldMeta])

  const getDisplay = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.display ?? true, [getFieldMeta])

  const getMax = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.max, [getFieldMeta])

  const getDecimal = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.decimal ?? 2, [getFieldMeta])

  const setValue = useCallback((key: keyof T & string, value: unknown) => {
    const updated = { ...form, [key]: value } as T
    const finalForm = pages[page]?.calc ? pages[page].calc!(updated) : updated
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [form, page, pages, name, setWizardData])

  const setForm = useCallback((newForm: T) => {
    const finalForm = pages[page]?.calc ? pages[page].calc!(newForm) : newForm
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [page, pages, name, setWizardData])

  const appendData = useCallback((data: Partial<T>) => {
    setWizardData(name, { ...form, ...data } as Record<string, unknown>)
  }, [form, name, setWizardData])

  const clearFields = useCallback((fields: (keyof T & string)[]) => {
    const updated = { ...form }
    fields.forEach(f => { delete updated[f] })
    setWizardData(name, updated as Record<string, unknown>)
  }, [form, name, setWizardData])

  const setValidation = useCallback((items: ValidationItem[]) => {
    setWizardValidation(name, items)
  }, [name, setWizardValidation])

  const setPageByName = useCallback((pageName: string, scrollTo?: string) => {
    const idx = mapping.findIndex(m => m.name === pageName)
    if (idx !== -1) {
      if (scrollTo) scrollToRef.current = scrollTo
      setPage(idx)
    }
  }, [mapping])

  const nav = useCallback(async (toPage: number) => {
    setBusy(true)
    setWizardValidation(name, [])
    setSummary(null)
    setPage(toPage)
    setBusy(false)
  }, [name, setWizardValidation])

  const api: WizardAPI<T> = {
    form,
    setValue,
    setForm,
    appendData,
    clearFields,
    mapping,
    getLabel,
    getType,
    getDisplay,
    getMax,
    getDecimal,
    page,
    pageKey,
    setPageByName,
    validation,
    setValidation,
    summary,
    mode,
    loading,
    busy,
    refetch: () => {},
  }

  return (
    <WizardContext.Provider value={api as unknown as WizardAPI}>
      {children}
    </WizardContext.Provider>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/wizard/WizardProvider.tsx
git commit -m "feat(wizard): add WizardProvider skeleton with navigation and Zustand form state"
```

---

## Task 8: Wizard Shell (Wizard.tsx)

The outer shell: layout, vertical side nav, Back/Next/Save/Cancel buttons. Renders the current page component.

**Files:**
- Create: `src/components/wizard/Wizard.tsx`

- [ ] **Step 1: Create Wizard.tsx**

```tsx
// src/components/wizard/Wizard.tsx
'use client'

import { WizardProvider } from './WizardProvider'
import { useWizard } from '@/hooks/wizard/useWizard'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { WizardConfig } from '@/lib/wizard/types'

export function Wizard<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  return (
    <WizardProvider {...props}>
      <WizardShell {...props} />
    </WizardProvider>
  )
}

function WizardShell<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  const {
    page,
    mapping,
    busy,
    loading,
    mode,
    summary,
    validation,
  } = useWizard()

  const pages = props.pages
  const totalPages = pages.length
  const isFirst = page === 0
  const isLast = page === totalPages - 1
  const hasErrors = validation.some(v => v.type === 'error') || Object.keys(summary?.error ?? {}).length > 0

  function NavButtons({ className }: { className?: string }) {
    return (
      <div className={cn('flex items-center gap-2 flex-wrap', className)}>
        {!isFirst && (
          <Button variant="secondary" onClick={() => navTo(page - 1)} disabled={busy}>
            ← Back
          </Button>
        )}

        {mode === 'edit' && !loading && (
          <>
            <Button variant="outline" onClick={props.cancelCallback} disabled={busy}>
              Cancel
            </Button>

            {!isLast && props.saveUrl && (
              <DropdownMenu>
                <div className="flex">
                  <Button onClick={save} disabled={busy} className="rounded-r-none">
                    Save
                  </Button>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="icon" className="rounded-l-none border-l border-primary-foreground/20" disabled={busy}>
                      ▾
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={saveAndQuit}>Save and Quit</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {isLast && !hasErrors && props.acceptButtons?.(summary)}
            {isLast && props.customButtons?.()}
          </>
        )}

        {mode === 'view' && (
          <Button variant="outline" disabled>Read-only</Button>
        )}

        {!isLast && (
          <Button variant="default" onClick={() => navTo(page + 1)} disabled={busy} className="ml-auto">
            Next →
          </Button>
        )}
      </div>
    )
  }

  async function save() {
    if (!props.saveUrl || pages[page]?.noPayload) return
    // save is handled by useWizardSave wired in WizardProvider — placeholder until Task 13
  }

  async function saveAndQuit() {
    await save()
    props.saveAndQuitCallback?.()
  }

  function navTo(toPage: number) {
    // nav is exposed via a ref callback in WizardProvider in Task 13
    // for now dispatch a custom event picked up by WizardProvider
    window.dispatchEvent(new CustomEvent('wizard:nav', { detail: { to: toPage, name: props.name } }))
  }

  return (
    <div className="grid grid-cols-[200px_1fr] gap-6">
      {/* Side nav */}
      <nav className="flex flex-col gap-1 pt-2">
        {mapping.length > 0
          ? mapping.map((p, i) => (
              <button
                key={p.name}
                onClick={() => navTo(i)}
                disabled={pages[i]?.disabled || loading || busy}
                className={cn(
                  'text-left px-3 py-2 rounded-md text-sm transition-colors',
                  page === i
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {p.label}
              </button>
            ))
          : pages.map((p, i) => (
              <button
                key={p.name}
                onClick={() => navTo(i)}
                disabled={pages[i]?.disabled || loading || busy}
                className={cn(
                  'text-left px-3 py-2 rounded-md text-sm transition-colors',
                  page === i
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {p.name}
              </button>
            ))}
      </nav>

      {/* Content */}
      <div className="flex flex-col gap-4 min-w-0">
        <NavButtons />
        <div className="flex-1">{pages[page]?.form}</div>
        <NavButtons className="sticky bottom-4 bg-background/80 backdrop-blur p-2 rounded-lg border" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

Expected: no errors

- [ ] **Step 3: Create a minimal stub demo page to smoke-test the shell**

```tsx
// src/app/wizard-demo/page.tsx
'use client'

import { Wizard } from '@/components/wizard/Wizard'

function PageOne() {
  return <div className="p-4 border rounded">Page 1 content</div>
}

function PageTwo() {
  return <div className="p-4 border rounded">Page 2 content</div>
}

export default function WizardDemoPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Wizard Demo</h1>
      <Wizard
        name="demo"
        mode="edit"
        pages={[
          { name: 'page-one', form: <PageOne /> },
          { name: 'page-two', form: <PageTwo /> },
        ]}
        mappingUrl="/api/wizard/demo/mapping"
        dataUrl="/api/wizard/demo/data"
        saveOnPageChange={false}
      />
    </div>
  )
}
```

- [ ] **Step 4: Run dev server and open http://localhost:3600/wizard-demo — verify shell renders, side nav shows page names, Next/Back buttons appear**

```bash
pnpm dev
```

- [ ] **Step 5: Fix the `navTo` to use a proper approach — update Wizard.tsx to expose nav through a context callback**

The `window.dispatchEvent` hack from Step 1 must be replaced. Update `WizardProvider` to expose a `nav` function in the context. Add `nav` to `WizardAPI` in `types.ts`:

In `src/lib/wizard/types.ts`, add to `WizardAPI`:
```ts
nav: (toPage: number) => Promise<void>
```

In `WizardProvider.tsx`, expose `nav` in `api`:
```ts
// in the api object:
nav,
```

In `Wizard.tsx`, replace `navTo` with:
```ts
const { nav } = useWizard()
function navTo(toPage: number) { nav(toPage) }
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add src/components/wizard/Wizard.tsx src/app/wizard-demo/page.tsx src/lib/wizard/types.ts src/components/wizard/WizardProvider.tsx
git commit -m "feat(wizard): add Wizard shell with vertical side nav and nav buttons"
```

---

## Task 9: Wizard API Client

Follows the existing `browserFetch` pattern from `src/lib/api/domains/applications/client.ts`.

**Files:**
- Create: `src/lib/api/domains/wizard/client.ts`

- [ ] **Step 1: Create the wizard API client**

```ts
// src/lib/api/domains/wizard/client.ts
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function wizardFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  })
  if (!res.ok && res.status !== 422) {
    throw new Error(`Wizard fetch failed: ${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export async function fetchWizardMapping(url: string): Promise<PageMapping[]> {
  return wizardFetch<PageMapping[]>(url)
}

export async function fetchWizardData(url: string): Promise<Record<string, unknown>> {
  return wizardFetch<Record<string, unknown>>(url)
}

export async function saveWizardData(
  url: string,
  data: Record<string, unknown>
): Promise<{ status: string }> {
  return wizardFetch<{ status: string }>(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchWizardValidation(
  url: string
): Promise<{ httpStatus: number; data: SummaryResult }> {
  const res = await fetch(`${API_BASE}${url}`, { credentials: 'include' })
  const data = await res.json() as SummaryResult
  return { httpStatus: res.status, data }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/domains/wizard/client.ts
git commit -m "feat(wizard): add wizard API client"
```

---

## Task 10: useWizardMapping

**Files:**
- Create: `src/hooks/wizard/useWizardMapping.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/wizard/useWizardMapping.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWizardMapping } from '@/lib/api/domains/wizard/client'
import type { PageMapping } from '@/lib/wizard/types'

export function useWizardMapping(mappingUrl: string) {
  return useQuery<PageMapping[]>({
    queryKey: ['wizard-mapping', mappingUrl],
    queryFn: () => fetchWizardMapping(mappingUrl),
    staleTime: Infinity,
    enabled: !!mappingUrl,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/wizard/useWizardMapping.ts
git commit -m "feat(wizard): add useWizardMapping TanStack Query hook"
```

---

## Task 11: useWizardData

**Files:**
- Create: `src/hooks/wizard/useWizardData.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/wizard/useWizardData.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchWizardData } from '@/lib/api/domains/wizard/client'

export function useWizardData(dataUrl: string, wizardName: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['wizard-data', wizardName, dataUrl],
    queryFn: () => fetchWizardData(dataUrl),
    staleTime: 0,
    enabled: !!dataUrl,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/wizard/useWizardData.ts
git commit -m "feat(wizard): add useWizardData TanStack Query hook"
```

---

## Task 12: useWizardSave

**Files:**
- Create: `src/hooks/wizard/useWizardSave.ts`

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/wizard/useWizardSave.ts
'use client'

import { useMutation } from '@tanstack/react-query'
import { saveWizardData } from '@/lib/api/domains/wizard/client'
import { toast } from 'sonner'

export function useWizardSave(saveUrl: string) {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => saveWizardData(saveUrl, data),
    onSuccess: () => {
      toast.success('Data saved', { duration: 1500 })
    },
    onError: () => {
      toast.error('Save failed — please try again')
    },
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/wizard/useWizardSave.ts
git commit -m "feat(wizard): add useWizardSave TanStack Query mutation"
```

---

## Task 13: Wire Data Layer into WizardProvider

Replace the skeleton WizardProvider with the full data-aware version.

**Files:**
- Modify: `src/components/wizard/WizardProvider.tsx`

- [ ] **Step 1: Replace WizardProvider.tsx with the full implementation**

```tsx
// src/components/wizard/WizardProvider.tsx
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { WizardContext } from './WizardContext'
import { useStore } from '@/lib/store'
import { useWizardMapping } from '@/hooks/wizard/useWizardMapping'
import { useWizardData } from '@/hooks/wizard/useWizardData'
import { useWizardSave } from '@/hooks/wizard/useWizardSave'
import { fetchWizardValidation } from '@/lib/api/domains/wizard/client'
import type { WizardAPI, WizardConfig, FieldMeta, PageMapping, SummaryResult } from '@/lib/wizard/types'
import type { ValidationItem } from '@/lib/store/types'

export function WizardProvider<T extends Record<string, unknown>>({
  name,
  mode,
  pages,
  mappingUrl,
  dataUrl,
  saveUrl,
  validationUrl,
  saveOnPageChange,
  addData,
  saveAndQuitCallback,
  cancelCallback: _cancelCallback,
  children,
}: WizardConfig<T> & { children: React.ReactNode }) {
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(true)
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<SummaryResult | null>(null)
  const scrollToRef = useRef<string | null>(null)

  const { wizards, setWizardData, setWizardValidation, clearWizard } = useStore()
  const wizardState = wizards[name] ?? { form: {}, meta: { validation: [] } }
  const form = wizardState.form as T
  const validation = wizardState.meta.validation
  const pageKey = pages[page]?.name ?? ''

  const mappingQuery = useWizardMapping(mappingUrl)
  const mapping: PageMapping[] = mappingQuery.data ?? []

  const dataQuery = useWizardData(dataUrl, name)
  const saveMutation = useWizardSave(saveUrl ?? '')

  useEffect(() => {
    clearWizard(name)
    return () => { clearWizard(name) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name])

  useEffect(() => {
    if (dataQuery.data) {
      setWizardData(name, dataQuery.data)
      setBusy(false)
    }
  }, [dataQuery.data, name, setWizardData])

  useEffect(() => {
    if (scrollToRef.current) {
      document.getElementById(scrollToRef.current)?.scrollIntoView({ behavior: 'smooth' })
      scrollToRef.current = null
    }
    if (pages[page]?.isSummaryPage && validationUrl) {
      setBusy(true)
      fetchWizardValidation(validationUrl).then(({ httpStatus, data }) => {
        setSummary(httpStatus === 422 ? data : null)
        setBusy(false)
      })
    } else {
      setSummary(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const getFieldMeta = useCallback((field: string, _page?: string): FieldMeta | undefined => {
    const pageData = _page ? mapping.find(p => p.name === _page) : mapping[page]
    if (!pageData) return undefined
    return pageData.fields.find(f => f.name === field)
  }, [mapping, page])

  const getLabel = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.label ?? `[${field}]`, [getFieldMeta])

  const getType = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.type ?? 'input', [getFieldMeta])

  const getDisplay = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.display ?? true, [getFieldMeta])

  const getMax = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.max, [getFieldMeta])

  const getDecimal = useCallback((field: string, p?: string) =>
    getFieldMeta(field, p)?.decimal ?? 2, [getFieldMeta])

  const setValue = useCallback((key: keyof T & string, value: unknown) => {
    const updated = { ...form, [key]: value } as T
    const finalForm = pages[page]?.calc ? pages[page].calc!(updated) : updated
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [form, page, pages, name, setWizardData])

  const setForm = useCallback((newForm: T) => {
    const finalForm = pages[page]?.calc ? pages[page].calc!(newForm) : newForm
    setWizardData(name, finalForm as Record<string, unknown>)
  }, [page, pages, name, setWizardData])

  const appendData = useCallback((data: Partial<T>) => {
    setWizardData(name, { ...form, ...data } as Record<string, unknown>)
  }, [form, name, setWizardData])

  const clearFields = useCallback((fields: (keyof T & string)[]) => {
    const updated = { ...form }
    fields.forEach(f => { delete updated[f] })
    setWizardData(name, updated as Record<string, unknown>)
  }, [form, name, setWizardData])

  const setValidation = useCallback((items: ValidationItem[]) => {
    setWizardValidation(name, items)
  }, [name, setWizardValidation])

  const setPageByName = useCallback((pageName: string, scrollTo?: string) => {
    const idx = mapping.findIndex(m => m.name === pageName)
    if (idx !== -1) {
      if (scrollTo) scrollToRef.current = scrollTo
      setWizardValidation(name, [])
      setPage(idx)
    }
  }, [mapping, name, setWizardValidation])

  const save = useCallback(async () => {
    if (!saveUrl || pages[page]?.noPayload) return
    const payload = addData ? { ...form, ...addData } : form
    await saveMutation.mutateAsync(payload as Record<string, unknown>)
  }, [saveUrl, pages, page, form, addData, saveMutation])

  const nav = useCallback(async (toPage: number) => {
    setBusy(true)
    if (saveOnPageChange && mode === 'edit' && !pages[page]?.isSummaryPage) {
      await save()
    }
    setWizardValidation(name, [])
    setPage(toPage)
    setBusy(false)
  }, [saveOnPageChange, mode, pages, page, save, name, setWizardValidation])

  const saveAndQuit = useCallback(async () => {
    await save()
    saveAndQuitCallback?.()
  }, [save, saveAndQuitCallback])

  const api: WizardAPI<T> = {
    form,
    setValue,
    setForm,
    appendData,
    clearFields,
    mapping,
    getLabel,
    getType,
    getDisplay,
    getMax,
    getDecimal,
    page,
    pageKey,
    setPageByName,
    validation,
    setValidation,
    summary,
    mode,
    loading,
    busy,
    refetch: dataQuery.refetch,
    nav,
    save,
    saveAndQuit,
  }

  return (
    <WizardContext.Provider value={api as unknown as WizardAPI}>
      {children}
    </WizardContext.Provider>
  )
}
```

- [ ] **Step 2: Add `nav`, `save`, `saveAndQuit` to `WizardAPI` in types.ts**

In `src/lib/wizard/types.ts`, add to `WizardAPI<T>`:
```ts
nav: (toPage: number) => Promise<void>
save: () => Promise<void>
saveAndQuit: () => Promise<void>
```

- [ ] **Step 3: Update Wizard.tsx to use `nav`, `save`, `saveAndQuit` from context**

In `src/components/wizard/Wizard.tsx`, update `WizardShell` to destructure `nav`, `save`, `saveAndQuit` from `useWizard()` and remove the local `save()` and `saveAndQuit()` functions. Replace `navTo` references with direct `nav(i)` calls.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard/WizardProvider.tsx src/lib/wizard/types.ts src/components/wizard/Wizard.tsx
git commit -m "feat(wizard): wire TanStack Query data layer into WizardProvider"
```

---

## Task 14: MSW Wizard Handler Factories

**Files:**
- Create: `src/mocks/handlers/wizard.ts`

- [ ] **Step 1: Create handler factories**

```ts
// src/mocks/handlers/wizard.ts
import { http, HttpResponse } from 'msw'
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export function createWizardMappingHandler(url: string, pages: PageMapping[]) {
  return http.get(url, () => HttpResponse.json(pages))
}

export function createWizardDataHandler(url: string, data: Record<string, unknown>) {
  return http.get(url, () => HttpResponse.json(data))
}

export function createWizardDataByIdHandler(
  url: string,
  dataMap: Record<string, Record<string, unknown>>
) {
  return http.get(`${url}/:id`, ({ params }) => {
    const data = dataMap[params.id as string]
    return data
      ? HttpResponse.json(data)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  })
}

export function createWizardSaveHandler(url: string) {
  return http.put(url, () => HttpResponse.json({ status: 'success' }))
}

export function createWizardValidationHandler(url: string, result: SummaryResult) {
  return http.get(url, () => HttpResponse.json(result, { status: 422 }))
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/handlers/wizard.ts
git commit -m "feat(wizard): add MSW wizard handler factories"
```

---

## Task 15: ValidationWrapper (Internal Component)

Used only inside Wiz input components — not exported as public API.

**Files:**
- Create: `src/components/wizard/ValidationWrapper.tsx`

- [ ] **Step 1: Create ValidationWrapper**

```tsx
// src/components/wizard/ValidationWrapper.tsx
'use client'

import { useWizard } from '@/hooks/wizard/useWizard'
import { cn } from '@/lib/utils'

type Props = {
  field: string
  children: React.ReactNode
  className?: string
}

export function ValidationWrapper({ field, children, className }: Props) {
  const { validation, pageKey } = useWizard()
  const errors = validation.filter(v => v.key === field)
  const hasError = errors.length > 0

  return (
    <div id={`${pageKey}.${field}`} className={cn('flex flex-col gap-1', className)}>
      <div className={cn(hasError && 'ring-2 ring-destructive rounded-md')}>{children}</div>
      {errors.map((e, i) => (
        <p key={i} className="text-sm text-destructive">
          {e.msgs[0] ?? 'Validation error'}
        </p>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/wizard/ValidationWrapper.tsx
git commit -m "feat(wizard): add ValidationWrapper internal component"
```

---

## Task 16: useWizardField Hook

**Files:**
- Create: `src/hooks/wizard/useWizardField.ts`

- [ ] **Step 1: Write a failing test**

```ts
// src/hooks/wizard/useWizardField.test.tsx
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { WizardContext } from '@/components/wizard/WizardContext'
import { useWizardField } from './useWizardField'
import type { WizardAPI } from '@/lib/wizard/types'

function makeApi(overrides: Partial<WizardAPI> = {}): WizardAPI {
  return {
    form: { title: 'Hello' },
    setValue: () => {},
    setForm: () => {},
    appendData: () => {},
    clearFields: () => {},
    mapping: [],
    getLabel: (f) => `Label:${f}`,
    getType: () => 'input',
    getDisplay: () => true,
    getMax: () => undefined,
    getDecimal: () => 2,
    page: 0,
    pageKey: 'start',
    setPageByName: () => {},
    validation: [],
    setValidation: () => {},
    summary: null,
    mode: 'edit',
    loading: false,
    busy: false,
    refetch: () => {},
    nav: async () => {},
    save: async () => {},
    saveAndQuit: async () => {},
    ...overrides,
  }
}

function wrapper(api: WizardAPI) {
  return ({ children }: { children: React.ReactNode }) => (
    <WizardContext.Provider value={api}>{children}</WizardContext.Provider>
  )
}

describe('useWizardField', () => {
  it('returns label from getLabel', () => {
    const { result } = renderHook(() => useWizardField('title'), { wrapper: wrapper(makeApi()) })
    expect(result.current.label).toBe('Label:title')
  })

  it('returns value from form', () => {
    const { result } = renderHook(() => useWizardField('title'), { wrapper: wrapper(makeApi()) })
    expect(result.current.value).toBe('Hello')
  })

  it('returns hidden=true when getDisplay returns false', () => {
    const { result } = renderHook(
      () => useWizardField('title'),
      { wrapper: wrapper(makeApi({ getDisplay: () => false })) }
    )
    expect(result.current.hidden).toBe(true)
  })

  it('returns disabled=true in view mode', () => {
    const { result } = renderHook(
      () => useWizardField('title'),
      { wrapper: wrapper(makeApi({ mode: 'view' })) }
    )
    expect(result.current.disabled).toBe(true)
  })

  it('returns error message when validation matches field', () => {
    const { result } = renderHook(
      () => useWizardField('title'),
      { wrapper: wrapper(makeApi({ validation: [{ key: 'title', type: 'error', msgs: ['Required'] }] })) }
    )
    expect(result.current.error).toBe('Required')
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/hooks/wizard/useWizardField.test.tsx
```

Expected: FAIL — `Cannot find module './useWizardField'`

- [ ] **Step 3: Implement useWizardField**

```ts
// src/hooks/wizard/useWizardField.ts
'use client'

import { useCallback } from 'react'
import { useWizard } from './useWizard'

export type WizardFieldBinding = {
  label: string
  value: unknown
  onChange: (value: unknown) => void
  hidden: boolean
  disabled: boolean
  error: string | undefined
}

export function useWizardField(keyName: string): WizardFieldBinding {
  const { form, setValue, getLabel, getDisplay, validation, mode } = useWizard()

  const onChange = useCallback((value: unknown) => {
    setValue(keyName, value)
  }, [keyName, setValue])

  const error = validation.find(v => v.key === keyName)?.msgs[0]

  return {
    label: getLabel(keyName),
    value: form[keyName] as unknown,
    onChange,
    hidden: !getDisplay(keyName),
    disabled: mode === 'view',
    error,
  }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pnpm test:run src/hooks/wizard/useWizardField.test.tsx
```

Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/hooks/wizard/useWizardField.ts src/hooks/wizard/useWizardField.test.tsx
git commit -m "feat(wizard): add useWizardField hook"
```

---

## Task 17–21: Wiz Input Components

All five components follow the same pattern: call `useWizardField`, skip render if hidden, wrap in `ValidationWrapper`, render shadcn primitive.

**Files:**
- Create: `src/components/wizard/inputs/InputWiz.tsx`
- Create: `src/components/wizard/inputs/SelectWiz.tsx`
- Create: `src/components/wizard/inputs/TextareaWiz.tsx`
- Create: `src/components/wizard/inputs/DateTimeWiz.tsx`
- Create: `src/components/wizard/inputs/RadioWiz.tsx`

- [ ] **Step 1: Write a test for InputWiz (representative test for all Wiz components)**

```tsx
// src/components/wizard/inputs/InputWiz.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardContext } from '@/components/wizard/WizardContext'
import { InputWiz } from './InputWiz'
import type { WizardAPI } from '@/lib/wizard/types'

function makeApi(overrides: Partial<WizardAPI> = {}): WizardAPI {
  return {
    form: { title: '' },
    setValue: () => {},
    setForm: () => {},
    appendData: () => {},
    clearFields: () => {},
    mapping: [],
    getLabel: (f) => `Label:${f}`,
    getType: () => 'input',
    getDisplay: () => true,
    getMax: () => undefined,
    getDecimal: () => 2,
    page: 0,
    pageKey: 'start',
    setPageByName: () => {},
    validation: [],
    setValidation: () => {},
    summary: null,
    mode: 'edit',
    loading: false,
    busy: false,
    refetch: () => {},
    nav: async () => {},
    save: async () => {},
    saveAndQuit: async () => {},
    ...overrides,
  }
}

describe('InputWiz', () => {
  it('renders the server-mapped label', () => {
    render(
      <WizardContext.Provider value={makeApi()}>
        <InputWiz keyName="title" />
      </WizardContext.Provider>
    )
    expect(screen.getByText('Label:title')).toBeInTheDocument()
  })

  it('renders nothing when hidden', () => {
    const { container } = render(
      <WizardContext.Provider value={makeApi({ getDisplay: () => false })}>
        <InputWiz keyName="title" />
      </WizardContext.Provider>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('is disabled in view mode', () => {
    render(
      <WizardContext.Provider value={makeApi({ mode: 'view' })}>
        <InputWiz keyName="title" />
      </WizardContext.Provider>
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/components/wizard/inputs/InputWiz.test.tsx
```

Expected: FAIL — `Cannot find module './InputWiz'`

- [ ] **Step 3: Create InputWiz**

```tsx
// src/components/wizard/inputs/InputWiz.tsx
'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { ValidationWrapper } from '../ValidationWrapper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  keyName: string
  label?: string
  hide?: boolean
  placeholder?: string
}

export function InputWiz({ keyName, label: labelProp, hide, placeholder }: Props) {
  const field = useWizardField(keyName)
  if (hide || field.hidden) return null

  return (
    <ValidationWrapper field={keyName}>
      <Label htmlFor={keyName}>{labelProp ?? field.label}</Label>
      <Input
        id={keyName}
        value={(field.value as string) ?? ''}
        onChange={e => field.onChange(e.target.value)}
        disabled={field.disabled}
        placeholder={placeholder}
        className="mt-1"
      />
    </ValidationWrapper>
  )
}
```

- [ ] **Step 4: Run InputWiz tests**

```bash
pnpm test:run src/components/wizard/inputs/InputWiz.test.tsx
```

Expected: 3 passed

- [ ] **Step 5: Create SelectWiz**

```tsx
// src/components/wizard/inputs/SelectWiz.tsx
'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { ValidationWrapper } from '../ValidationWrapper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type Option = { value: string; label: string }

type Props = {
  keyName: string
  options: Option[]
  label?: string
  hide?: boolean
  placeholder?: string
}

export function SelectWiz({ keyName, options, label: labelProp, hide, placeholder }: Props) {
  const field = useWizardField(keyName)
  if (hide || field.hidden) return null

  return (
    <ValidationWrapper field={keyName}>
      <Label htmlFor={keyName}>{labelProp ?? field.label}</Label>
      <Select
        value={(field.value as string) ?? ''}
        onValueChange={field.onChange}
        disabled={field.disabled}
      >
        <SelectTrigger id={keyName} className="mt-1">
          <SelectValue placeholder={placeholder ?? 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ValidationWrapper>
  )
}
```

- [ ] **Step 6: Create TextareaWiz**

```tsx
// src/components/wizard/inputs/TextareaWiz.tsx
'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { ValidationWrapper } from '../ValidationWrapper'
import { Label } from '@/components/ui/label'

type Props = {
  keyName: string
  label?: string
  hide?: boolean
  rows?: number
  placeholder?: string
}

export function TextareaWiz({ keyName, label: labelProp, hide, rows = 3, placeholder }: Props) {
  const field = useWizardField(keyName)
  if (hide || field.hidden) return null

  return (
    <ValidationWrapper field={keyName}>
      <Label htmlFor={keyName}>{labelProp ?? field.label}</Label>
      <textarea
        id={keyName}
        value={(field.value as string) ?? ''}
        onChange={e => field.onChange(e.target.value)}
        disabled={field.disabled}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      />
    </ValidationWrapper>
  )
}
```

- [ ] **Step 7: Create DateTimeWiz**

```tsx
// src/components/wizard/inputs/DateTimeWiz.tsx
'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { ValidationWrapper } from '../ValidationWrapper'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Props = {
  keyName: string
  label?: string
  hide?: boolean
  hideTime?: boolean
}

export function DateTimeWiz({ keyName, label: labelProp, hide, hideTime }: Props) {
  const field = useWizardField(keyName)
  if (hide || field.hidden) return null

  return (
    <ValidationWrapper field={keyName}>
      <Label htmlFor={keyName}>{labelProp ?? field.label}</Label>
      <Input
        id={keyName}
        type={hideTime ? 'date' : 'datetime-local'}
        value={(field.value as string) ?? ''}
        onChange={e => field.onChange(e.target.value)}
        disabled={field.disabled}
        className="mt-1"
      />
    </ValidationWrapper>
  )
}
```

- [ ] **Step 8: Create RadioWiz**

```tsx
// src/components/wizard/inputs/RadioWiz.tsx
'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { ValidationWrapper } from '../ValidationWrapper'
import { Label } from '@/components/ui/label'

type Option = { value: string; label: string }

type Props = {
  keyName: string
  options: Option[]
  label?: string
  hide?: boolean
}

export function RadioWiz({ keyName, options, label: labelProp, hide }: Props) {
  const field = useWizardField(keyName)
  if (hide || field.hidden) return null

  return (
    <ValidationWrapper field={keyName}>
      <fieldset>
        <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2">
          {labelProp ?? field.label}
        </legend>
        <div className="flex flex-col gap-2 mt-1">
          {options.map(o => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name={keyName}
                value={o.value}
                checked={field.value === o.value}
                onChange={() => field.onChange(o.value)}
                disabled={field.disabled}
                className="accent-primary"
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </ValidationWrapper>
  )
}
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 10: Commit**

```bash
git add src/components/wizard/inputs/ src/components/wizard/inputs/InputWiz.test.tsx
git commit -m "feat(wizard): add self-contained Wiz input components"
```

---

## Task 22: Validation Utilities

**Files:**
- Create: `src/lib/wizard/validation.ts`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/wizard/validation.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { runPageValidation, summaryHasErrors, summaryHasWarnings } from './validation'
import type { SummaryResult } from './types'

describe('runPageValidation', () => {
  const schema = z.object({ title: z.string().min(3, 'Too short') })

  it('returns empty array when data is valid', () => {
    const result = runPageValidation(schema, { title: 'Hello' })
    expect(result).toEqual([])
  })

  it('returns ValidationItem for each Zod issue', () => {
    const result = runPageValidation(schema, { title: 'Hi' })
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('title')
    expect(result[0].type).toBe('error')
    expect(result[0].msgs[0]).toBe('Too short')
  })
})

describe('summaryHasErrors', () => {
  it('returns false for null', () => {
    expect(summaryHasErrors(null)).toBe(false)
  })

  it('returns true when error keys exist', () => {
    const s: SummaryResult = { error: { title: ['Required'] }, warning: {} }
    expect(summaryHasErrors(s)).toBe(true)
  })

  it('returns true when dicts_msg.error keys exist', () => {
    const s: SummaryResult = { error: {}, warning: {}, dicts_msg: { error: { dict: ['Bad'] }, warning: {} } }
    expect(summaryHasErrors(s)).toBe(true)
  })

  it('returns false when no errors', () => {
    const s: SummaryResult = { error: {}, warning: { title: ['Check this'] } }
    expect(summaryHasErrors(s)).toBe(false)
  })
})

describe('summaryHasWarnings', () => {
  it('returns true when warning keys exist', () => {
    const s: SummaryResult = { error: {}, warning: { title: ['Check this'] } }
    expect(summaryHasWarnings(s)).toBe(true)
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/lib/wizard/validation.test.ts
```

Expected: FAIL — `Cannot find module './validation'`

- [ ] **Step 3: Implement validation.ts**

```ts
// src/lib/wizard/validation.ts
import { z } from 'zod'
import type { ValidationItem, SummaryResult } from './types'

export function runPageValidation(
  schema: z.ZodSchema,
  data: Record<string, unknown>
): ValidationItem[] {
  const result = schema.safeParse(data)
  if (result.success) return []

  return result.error.issues.map(issue => ({
    key: issue.path.join('.'),
    type: 'error' as const,
    msgs: [issue.message],
  }))
}

export function summaryHasErrors(summary: SummaryResult | null): boolean {
  if (!summary) return false
  return (
    Object.keys(summary.error ?? {}).length > 0 ||
    Object.keys(summary.dicts_msg?.error ?? {}).length > 0
  )
}

export function summaryHasWarnings(summary: SummaryResult | null): boolean {
  if (!summary) return false
  return (
    Object.keys(summary.warning ?? {}).length > 0 ||
    Object.keys(summary.dicts_msg?.warning ?? {}).length > 0
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/lib/wizard/validation.test.ts
```

Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
git add src/lib/wizard/validation.ts src/lib/wizard/validation.test.ts
git commit -m "feat(wizard): add validation utilities (Zod runner + summary helpers)"
```

---

## Task 23: Zod Page Validation in WizardProvider

Block navigation when the current page's `schema` fails.

**Files:**
- Modify: `src/components/wizard/WizardProvider.tsx`

- [ ] **Step 1: Update `nav` in WizardProvider to run page schema before navigating**

In `WizardProvider.tsx`, replace the `nav` callback with:

```ts
const nav = useCallback(async (toPage: number) => {
  // Run Zod schema if defined for current page
  const schema = pages[page]?.schema
  if (schema) {
    const errors = runPageValidation(schema, form as Record<string, unknown>)
    if (errors.length > 0) {
      setWizardValidation(name, errors)
      return // block navigation
    }
  }

  setBusy(true)
  if (saveOnPageChange && mode === 'edit' && !pages[page]?.isSummaryPage) {
    await save()
  }
  setWizardValidation(name, [])
  setPage(toPage)
  setBusy(false)
}, [saveOnPageChange, mode, pages, page, save, name, setWizardValidation, form])
```

Add the import at the top of `WizardProvider.tsx`:
```ts
import { runPageValidation } from '@/lib/wizard/validation'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/wizard/WizardProvider.tsx
git commit -m "feat(wizard): block page navigation when Zod schema fails"
```

---

## Task 24: WizardSummary Component

**Files:**
- Create: `src/components/wizard/WizardSummary.tsx`

- [ ] **Step 1: Write a failing render test**

```tsx
// src/components/wizard/WizardSummary.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WizardContext } from './WizardContext'
import { WizardSummary } from './WizardSummary'
import type { WizardAPI, SummaryResult } from '@/lib/wizard/types'

const mapping = [
  { name: 'start', label: 'Start', fields: [{ name: 'title', label: 'Title', type: 'input' as const, lp: 1, display: true }] },
]

function makeApi(summary: SummaryResult | null): WizardAPI {
  return {
    form: {},
    setValue: () => {},
    setForm: () => {},
    appendData: () => {},
    clearFields: () => {},
    mapping,
    getLabel: (f) => f === 'title' ? 'Title' : f,
    getType: () => 'input',
    getDisplay: () => true,
    getMax: () => undefined,
    getDecimal: () => 2,
    page: 0,
    pageKey: 'start',
    setPageByName: () => {},
    validation: [],
    setValidation: () => {},
    summary,
    mode: 'edit',
    loading: false,
    busy: false,
    refetch: () => {},
    nav: async () => {},
    save: async () => {},
    saveAndQuit: async () => {},
  }
}

describe('WizardSummary', () => {
  it('shows success message when no errors', () => {
    render(
      <WizardContext.Provider value={makeApi(null)}>
        <WizardSummary success="All good!" failed="Has errors" loading="Loading..." />
      </WizardContext.Provider>
    )
    expect(screen.getByText('All good!')).toBeInTheDocument()
  })

  it('shows error message when summary has errors', () => {
    const summary: SummaryResult = { error: { 'title': ['Required'] }, warning: {} }
    render(
      <WizardContext.Provider value={makeApi(summary)}>
        <WizardSummary success="All good!" failed="Has errors" loading="Loading..." />
      </WizardContext.Provider>
    )
    expect(screen.getByText('Has errors')).toBeInTheDocument()
  })

  it('renders "Go to page" button for pages with errors', () => {
    const summary: SummaryResult = { error: { 'title': ['Required'] }, warning: {} }
    render(
      <WizardContext.Provider value={makeApi(summary)}>
        <WizardSummary success="All good!" failed="Has errors" loading="Loading..." />
      </WizardContext.Provider>
    )
    expect(screen.getByText('Go to page')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm it fails**

```bash
pnpm test:run src/components/wizard/WizardSummary.test.tsx
```

Expected: FAIL — `Cannot find module './WizardSummary'`

- [ ] **Step 3: Create WizardSummary**

```tsx
// src/components/wizard/WizardSummary.tsx
'use client'

import { useWizard } from '@/hooks/wizard/useWizard'
import { summaryHasErrors, summaryHasWarnings } from '@/lib/wizard/validation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  success: string
  failed: string
  loading: string
  warning?: string
}

export function WizardSummary({ success, failed, loading: loadingText, warning: warningText }: Props) {
  const { summary, mapping, getLabel, setValidation, setPageByName, busy } = useWizard()

  const isError = summaryHasErrors(summary)
  const isWarning = !isError && summaryHasWarnings(summary)
  const isSuccess = !isError && !isWarning

  const statusText = busy ? loadingText : isError ? failed : isWarning ? (warningText ?? failed) : success
  const statusVariant = isError ? 'destructive' : isWarning ? 'warning' : 'success'

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(
        'rounded-md p-4 font-semibold',
        statusVariant === 'destructive' && 'bg-destructive/10 text-destructive border border-destructive/20',
        statusVariant === 'warning' && 'bg-yellow-50 text-yellow-800 border border-yellow-200',
        statusVariant === 'success' && 'bg-green-50 text-green-800 border border-green-200',
      )}>
        {statusText}
      </div>

      {mapping.map(p => {
        const pageErrors = Object.entries(summary?.error ?? {})
          .filter(([key]) => p.fields.some(f => f.name === key.split('.')[0]))
          .map(([key, msgs]) => ({
            key: key.replace(`${p.name}.`, ''),
            type: 'error' as const,
            label: getLabel(key.replace(`${p.name}.`, ''), p.name),
            msgs,
          }))

        const pageWarnings = Object.entries(summary?.warning ?? {})
          .filter(([key]) => p.fields.some(f => f.name === key.split('.')[0]))
          .map(([key, msgs]) => ({
            key: key.replace(`${p.name}.`, ''),
            type: 'warning' as const,
            label: getLabel(key.replace(`${p.name}.`, ''), p.name),
            msgs,
          }))
          .filter(w => !pageErrors.find(e => e.key === w.key))

        const items = [...pageErrors, ...pageWarnings]
        if (items.length === 0) return null

        return (
          <div key={p.name} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold">{p.label}</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setValidation([...pageErrors, ...pageWarnings])
                  setPageByName(p.name)
                }}
              >
                Go to page
              </Button>
            </div>

            {items.map((item, i) => (
              <div
                key={`${item.key}-${i}`}
                className={cn(
                  'rounded-md p-3 text-sm border',
                  item.type === 'error'
                    ? 'bg-destructive/5 border-destructive/20 text-destructive'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                )}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Field: <strong>{item.label}</strong></span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setValidation([...pageErrors, ...pageWarnings])
                      setPageByName(p.name, `${p.name}.${item.key}`)
                    }}
                  >
                    Go to field
                  </Button>
                </div>
                {item.msgs.map((msg, j) => (
                  <div key={j} className="mt-1">Message: <strong>{msg}</strong></div>
                ))}
              </div>
            ))}
          </div>
        )
      })}

      {/* Dictionary-level errors */}
      {(() => {
        const dictItems = [
          ...Object.entries(summary?.dicts_msg?.error ?? {}).map(([key, msgs]) => ({
            key, type: 'error' as const, label: getLabel(key), msgs,
          })),
          ...Object.entries(summary?.dicts_msg?.warning ?? {}).map(([key, msgs]) => ({
            key, type: 'warning' as const, label: getLabel(key), msgs,
          })),
        ]
        if (dictItems.length === 0) return null
        return (
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold">Dictionary errors / warnings</h4>
            {dictItems.map((item, i) => (
              <div
                key={`dict-${item.key}-${i}`}
                className={cn(
                  'rounded-md p-3 text-sm border',
                  item.type === 'error'
                    ? 'bg-destructive/5 border-destructive/20 text-destructive'
                    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                )}
              >
                <div>Dictionary: <strong>{item.label}</strong></div>
                {item.msgs.map((msg, j) => (
                  <div key={j} className="mt-1">Message: <strong>{msg}</strong></div>
                ))}
              </div>
            ))}
          </div>
        )
      })()}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run src/components/wizard/WizardSummary.test.tsx
```

Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/wizard/WizardSummary.tsx src/components/wizard/WizardSummary.test.tsx
git commit -m "feat(wizard): add WizardSummary component with error grouping and jump links"
```

---

## Task 25: acceptButtons + customButtons + cancelCallback in Wizard.tsx

**Files:**
- Modify: `src/components/wizard/Wizard.tsx`

- [ ] **Step 1: Wire accept/custom buttons and cancel into WizardShell's NavButtons**

In `WizardShell`, the `NavButtons` component already references `props.acceptButtons` and `props.cancelCallback`. Verify the `isLast && !hasErrors` condition uses `summaryHasErrors`:

Add import at top of `Wizard.tsx`:
```ts
import { summaryHasErrors } from '@/lib/wizard/validation'
```

Update `hasErrors` in `WizardShell`:
```ts
const hasErrors = summaryHasErrors(summary) || validation.some(v => v.type === 'error')
```

Update Cancel button `onClick` to use context `cancelCallback` via WizardConfig prop:
```tsx
<Button variant="outline" onClick={props.cancelCallback} disabled={busy}>
  Cancel
</Button>
```

This is already correct from Task 8 — verify it is in place, then run build.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/wizard/Wizard.tsx
git commit -m "feat(wizard): wire acceptButtons, customButtons, cancelCallback in Wizard shell"
```

---

## Task 26: Tasks MSW Data Fixtures

**Files:**
- Create: `src/mocks/data/tasks-wizard.ts`

- [ ] **Step 1: Create fixture data**

```ts
// src/mocks/data/tasks-wizard.ts
import type { PageMapping, SummaryResult } from '@/lib/wizard/types'

export const tasksWizardMapping: PageMapping[] = [
  {
    name: 'start',
    label: 'Start',
    fields: [
      { name: 'title',       label: 'Title',       type: 'input',    lp: 1, display: true },
      { name: 'type',        label: 'Task Type',   type: 'select',   lp: 2, display: true },
      { name: 'description', label: 'Description', type: 'textarea', lp: 3, display: true },
    ],
  },
  {
    name: 'schedule',
    label: 'Schedule',
    fields: [
      { name: 'priority',   label: 'Priority',   type: 'radio', lp: 1, display: true },
      { name: 'deadline',   label: 'Deadline',   type: 'date',  lp: 2, display: true },
      { name: 'start_date', label: 'Start Date', type: 'date',  lp: 3, display: true },
    ],
  },
  {
    name: 'assignment',
    label: 'Assignment',
    fields: [
      { name: 'assignee_id', label: 'Assignee', type: 'select', lp: 1, display: true },
    ],
  },
  {
    name: 'related',
    label: 'Related Tasks',
    fields: [
      { name: 'related_ids', label: 'Related Tasks', type: 'select', lp: 1, display: true },
    ],
  },
  {
    name: 'summary',
    label: 'Summary',
    fields: [],
  },
]

export const tasksWizardEmptyForm: Record<string, unknown> = {
  title: '',
  type: '',
  description: '',
  priority: 'normal',
  deadline: '',
  start_date: '',
  assignee_id: '',
  related_ids: [],
  notes: '',
}

export const tasksWizardExistingTasks: Record<string, Record<string, unknown>> = {
  '1': {
    title: 'Fix login bug',
    type: 'bug',
    description: 'Users cannot log in on mobile.',
    priority: 'high',
    deadline: '2026-06-01',
    start_date: '2026-05-15',
    assignee_id: '2',
    related_ids: [],
    notes: '',
  },
  '2': {
    title: 'Update docs',
    type: 'documentation',
    description: 'Update the API reference.',
    priority: 'low',
    deadline: '2026-07-01',
    start_date: '2026-06-01',
    assignee_id: '1',
    related_ids: ['1'],
    notes: '',
  },
}

export const tasksWizardValidationError: SummaryResult = {
  error: {
    title: ['Title must be at least 3 characters'],
  },
  warning: {
    deadline: ['Deadline is in the past'],
  },
}

export const tasksList = [
  { id: '1', title: 'Fix login bug',  type: 'bug',           priority: 'high', status: 'open' },
  { id: '2', title: 'Update docs',   type: 'documentation', priority: 'low',  status: 'open' },
]

export const tasksAssignees = [
  { value: '1', label: 'Alice Smith' },
  { value: '2', label: 'Bob Jones' },
  { value: '3', label: 'Carol White' },
]

export const tasksTypes = [
  { value: 'bug',           label: 'Bug' },
  { value: 'feature',       label: 'Feature' },
  { value: 'documentation', label: 'Documentation' },
  { value: 'personal',      label: 'Personal' },
]

export const tasksPriorities = [
  { value: 'low',    label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high',   label: 'High' },
]
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/data/tasks-wizard.ts
git commit -m "feat(tasks-wizard): add MSW fixture data"
```

---

## Task 27: Tasks MSW Handlers + Registration

**Files:**
- Create: `src/mocks/handlers/tasks-wizard.ts`
- Modify: `src/mocks/handlers/index.ts`

- [ ] **Step 1: Create tasks-wizard handlers**

```ts
// src/mocks/handlers/tasks-wizard.ts
import { http, HttpResponse } from 'msw'
import {
  tasksWizardMapping,
  tasksWizardEmptyForm,
  tasksWizardExistingTasks,
  tasksWizardValidationError,
  tasksList,
  tasksAssignees,
  tasksTypes,
} from '@/mocks/data/tasks-wizard'

export const tasksWizardHandlers = [
  http.get('/api/tasks/wizard/mapping', () =>
    HttpResponse.json(tasksWizardMapping)
  ),

  http.get('/api/tasks/wizard/data', () =>
    HttpResponse.json(tasksWizardEmptyForm)
  ),

  http.get('/api/tasks/wizard/data/:id', ({ params }) => {
    const data = tasksWizardExistingTasks[params.id as string]
    return data
      ? HttpResponse.json(data)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 })
  }),

  http.put('/api/tasks/wizard/save', () =>
    HttpResponse.json({ status: 'success' })
  ),

  http.get('/api/tasks/wizard/validate', () =>
    HttpResponse.json(tasksWizardValidationError, { status: 422 })
  ),

  http.get('/api/tasks/list', () =>
    HttpResponse.json({ items: tasksList })
  ),

  http.get('/api/tasks/dict/assignees', () =>
    HttpResponse.json(tasksAssignees)
  ),

  http.get('/api/tasks/dict/types', () =>
    HttpResponse.json(tasksTypes)
  ),
]
```

- [ ] **Step 2: Register handlers in index.ts**

```ts
// src/mocks/handlers/index.ts
import { applicationsHandlers } from '@/mocks/handlers/applications'
import { dashboardHandlers } from '@/mocks/handlers/dashboard'
import { tasksWizardHandlers } from '@/mocks/handlers/tasks-wizard'

export const handlers = [
  ...dashboardHandlers,
  ...applicationsHandlers,
  ...tasksWizardHandlers,
]
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/mocks/handlers/tasks-wizard.ts src/mocks/handlers/index.ts
git commit -m "feat(tasks-wizard): add MSW handlers and register them"
```

---

## Task 28: TasksWizard Config + StartPage + SchedulePage

**Files:**
- Create: `src/components/tasks-wizard/TasksWizard.tsx`
- Create: `src/components/tasks-wizard/pages/StartPage.tsx`
- Create: `src/components/tasks-wizard/pages/SchedulePage.tsx`

- [ ] **Step 1: Create TasksWizard config component**

```tsx
// src/components/tasks-wizard/TasksWizard.tsx
'use client'

import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Wizard } from '@/components/wizard/Wizard'
import { StartPage } from './pages/StartPage'
import { SchedulePage } from './pages/SchedulePage'
import { AssignmentPage } from './pages/AssignmentPage'
import { RelatedPage } from './pages/RelatedPage'
import { SummaryPage } from './pages/SummaryPage'
import { WizardSummary } from '@/components/wizard/WizardSummary'
import { Button } from '@/components/ui/button'
import type { TaskForm } from './types'

const startSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  type: z.string().min(1, 'Task type is required'),
})

type Props = {
  id?: string
  mode?: 'edit' | 'view'
}

export function TasksWizard({ id, mode = 'edit' }: Props) {
  const router = useRouter()
  const isNew = !id
  const dataUrl = isNew ? '/api/tasks/wizard/data' : `/api/tasks/wizard/data/${id}`

  return (
    <Wizard<TaskForm>
      name={`task-${id ?? 'new'}`}
      mode={mode}
      mappingUrl="/api/tasks/wizard/mapping"
      dataUrl={dataUrl}
      saveUrl="/api/tasks/wizard/save"
      validationUrl="/api/tasks/wizard/validate"
      saveOnPageChange
      cancelCallback={() => router.push('/wizard-demo')}
      saveAndQuitCallback={() => router.push('/wizard-demo')}
      acceptButtons={(summary) => (
        !summary || Object.keys(summary.error ?? {}).length === 0
          ? <Button variant="default" onClick={() => router.push('/wizard-demo')}>
              Submit Task
            </Button>
          : null
      )}
      pages={[
        {
          name: 'start',
          form: <StartPage />,
          schema: startSchema,
        },
        {
          name: 'schedule',
          form: <SchedulePage />,
          calc: (form) => ({
            ...form,
            urgency: (() => {
              if (!form.deadline) return ''
              const days = Math.ceil((new Date(form.deadline as string).getTime() - Date.now()) / 86400000)
              if (days < 0) return 'overdue'
              if (days <= 3) return 'urgent'
              if (days <= 7) return 'soon'
              return 'normal'
            })(),
          }),
        },
        {
          name: 'assignment',
          form: <AssignmentPage />,
        },
        {
          name: 'related',
          form: <RelatedPage />,
        },
        {
          name: 'summary',
          form: <SummaryPage />,
          isSummaryPage: true,
          noPayload: true,
        },
      ]}
    />
  )
}
```

- [ ] **Step 2: Create the TaskForm type**

```ts
// src/components/tasks-wizard/types.ts
export type TaskForm = {
  title: string
  type: string
  description: string
  priority: 'low' | 'normal' | 'high'
  deadline: string
  start_date: string
  assignee_id: string
  related_ids: string[]
  notes: string
  urgency?: string
}
```

- [ ] **Step 3: Create StartPage**

```tsx
// src/components/tasks-wizard/pages/StartPage.tsx
'use client'

import { InputWiz } from '@/components/wizard/inputs/InputWiz'
import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { TextareaWiz } from '@/components/wizard/inputs/TextareaWiz'
import { tasksTypes } from '@/mocks/data/tasks-wizard'

export function StartPage() {
  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <InputWiz keyName="title" />
      <SelectWiz keyName="type" options={tasksTypes} />
      <TextareaWiz keyName="description" rows={4} />
    </div>
  )
}
```

- [ ] **Step 4: Create SchedulePage**

```tsx
// src/components/tasks-wizard/pages/SchedulePage.tsx
'use client'

import { RadioWiz } from '@/components/wizard/inputs/RadioWiz'
import { DateTimeWiz } from '@/components/wizard/inputs/DateTimeWiz'
import { useWizard } from '@/hooks/wizard/useWizard'
import { tasksPriorities } from '@/mocks/data/tasks-wizard'
import type { TaskForm } from '../types'

export function SchedulePage() {
  const { form } = useWizard<TaskForm>()

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <RadioWiz keyName="priority" options={tasksPriorities} />
      <DateTimeWiz keyName="deadline" hideTime />
      <DateTimeWiz keyName="start_date" hideTime />
      {form.urgency && (
        <p className="text-sm text-muted-foreground">
          Urgency: <strong className={
            form.urgency === 'overdue' ? 'text-destructive' :
            form.urgency === 'urgent' ? 'text-orange-600' :
            form.urgency === 'soon' ? 'text-yellow-600' : 'text-green-600'
          }>{form.urgency}</strong>
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/tasks-wizard/
git commit -m "feat(tasks-wizard): add TasksWizard config, StartPage, SchedulePage"
```

---

## Task 29: AssignmentPage + RelatedPage + SummaryPage

**Files:**
- Create: `src/components/tasks-wizard/pages/AssignmentPage.tsx`
- Create: `src/components/tasks-wizard/pages/RelatedPage.tsx`
- Create: `src/components/tasks-wizard/pages/SummaryPage.tsx`

- [ ] **Step 1: Create AssignmentPage**

```tsx
// src/components/tasks-wizard/pages/AssignmentPage.tsx
'use client'

import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { useWizard } from '@/hooks/wizard/useWizard'
import { tasksAssignees } from '@/mocks/data/tasks-wizard'
import type { TaskForm } from '../types'

export function AssignmentPage() {
  const { form } = useWizard<TaskForm>()

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <SelectWiz
        keyName="assignee_id"
        options={tasksAssignees}
        hide={form.type === 'personal'}
      />
      {form.type === 'personal' && (
        <p className="text-sm text-muted-foreground">
          Personal tasks do not require an assignee.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create RelatedPage**

```tsx
// src/components/tasks-wizard/pages/RelatedPage.tsx
'use client'

import { useWizard } from '@/hooks/wizard/useWizard'
import { ValidationWrapper } from '@/components/wizard/ValidationWrapper'
import { Label } from '@/components/ui/label'
import { tasksList } from '@/mocks/data/tasks-wizard'
import type { TaskForm } from '../types'

export function RelatedPage() {
  const { form, setValue } = useWizard<TaskForm>()
  const selected = (form.related_ids as string[]) ?? []

  function toggle(id: string) {
    const next = selected.includes(id)
      ? selected.filter(s => s !== id)
      : [...selected, id]
    setValue('related_ids', next)
  }

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <ValidationWrapper field="related_ids">
        <Label>Related Tasks</Label>
        <div className="mt-2 flex flex-col gap-2">
          {tasksList.map(task => (
            <label key={task.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(task.id)}
                onChange={() => toggle(task.id)}
                className="accent-primary"
              />
              <span className="text-sm">{task.title} <span className="text-muted-foreground">({task.type})</span></span>
            </label>
          ))}
        </div>
      </ValidationWrapper>
    </div>
  )
}
```

- [ ] **Step 3: Create SummaryPage**

```tsx
// src/components/tasks-wizard/pages/SummaryPage.tsx
'use client'

import { WizardSummary } from '@/components/wizard/WizardSummary'

export function SummaryPage() {
  return (
    <WizardSummary
      loading="Validating task data…"
      failed="Please fix the errors below before submitting."
      success="All data is valid. You can submit the task."
      warning="There are warnings — review them before submitting."
    />
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/tasks-wizard/pages/AssignmentPage.tsx src/components/tasks-wizard/pages/RelatedPage.tsx src/components/tasks-wizard/pages/SummaryPage.tsx
git commit -m "feat(tasks-wizard): add AssignmentPage, RelatedPage, SummaryPage"
```

---

## Task 30: wizard-demo Routes

Replace the stub page with full task management routes.

**Files:**
- Modify: `src/app/wizard-demo/page.tsx`
- Create: `src/app/wizard-demo/new/page.tsx`
- Create: `src/app/wizard-demo/[id]/page.tsx`
- Create: `src/app/wizard-demo/[id]/view/page.tsx`

- [ ] **Step 1: Create the task list index page**

```tsx
// src/app/wizard-demo/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Task = { id: string; title: string; type: string; priority: string; status: string }

export default function WizardDemoPage() {
  const { data, isLoading } = useQuery<{ items: Task[] }>({
    queryKey: ['tasks-list'],
    queryFn: async () => {
      const res = await fetch('/api/tasks/list', { credentials: 'include' })
      return res.json()
    },
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Button asChild>
          <Link href="/wizard-demo/new">New Task</Link>
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {data?.items && (
        <div className="border rounded-lg divide-y">
          {data.items.map(task => (
            <div key={task.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.type} · {task.priority}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/wizard-demo/${task.id}/view`}>View</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/wizard-demo/${task.id}`}>Edit</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create the new task route**

```tsx
// src/app/wizard-demo/new/page.tsx
'use client'

import { TasksWizard } from '@/components/tasks-wizard/TasksWizard'

export default function NewTaskPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">New Task</h1>
      <TasksWizard />
    </div>
  )
}
```

- [ ] **Step 3: Create the edit task route**

```tsx
// src/app/wizard-demo/[id]/page.tsx
'use client'

import { use } from 'react'
import { TasksWizard } from '@/components/tasks-wizard/TasksWizard'

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Task #{id}</h1>
      <TasksWizard id={id} mode="edit" />
    </div>
  )
}
```

- [ ] **Step 4: Create the view task route**

```tsx
// src/app/wizard-demo/[id]/view/page.tsx
'use client'

import { use } from 'react'
import { TasksWizard } from '@/components/tasks-wizard/TasksWizard'

export default function ViewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Task #{id}</h1>
      <TasksWizard id={id} mode="view" />
    </div>
  )
}
```

- [ ] **Step 5: Verify TypeScript compiles and build passes**

```bash
pnpm build
```

Expected: no errors

- [ ] **Step 6: Run dev server and verify the full flow**

```bash
pnpm dev
```

Verify at http://localhost:3600/wizard-demo:
1. Task list shows two MSW-seeded tasks with View / Edit links
2. "New Task" opens a 5-step wizard with "Start" as the first page
3. Side nav shows all 5 page labels from the MSW mapping response
4. Filling Start page with a title < 3 chars and clicking Next shows an inline Zod error and blocks navigation
5. Valid data on Start page allows Next; toast fires on each page change (saveOnPageChange)
6. Schedule page shows urgency label that updates as you change the deadline
7. Assignment page hides the Assignee field when type is "personal"
8. Related page shows checkboxes; checking a task updates the form
9. Summary page calls `/api/tasks/wizard/validate` and shows the fixture error with "Go to page" / "Go to field" buttons
10. Clicking "Go to field" jumps back to the correct page and scrolls to the field
11. Edit mode for task #1 pre-fills all fields from the MSW data fixture
12. View mode for task #1 shows all fields as disabled with no save buttons

- [ ] **Step 7: Run all tests**

```bash
pnpm test:run
```

Expected: all tests pass

- [ ] **Step 8: Commit**

```bash
git add src/app/wizard-demo/
git commit -m "feat(tasks-wizard): add wizard-demo routes (list, new, edit, view)"
```

---

## Self-Review Checklist

After the above is complete, verify these spec requirements are covered:

| Spec requirement | Covered by |
|---|---|
| Global Zustand store with devtools | Task 4 |
| Named wizard slice | Task 3 |
| Server-driven mapping | Task 10, 13, 14 |
| MSW for all data | Tasks 14, 26, 27 |
| `useWizard()` context hook | Task 6 |
| WizardProvider | Tasks 7, 13, 23 |
| Vertical side nav (labels from mapping) | Task 8 |
| Back / Next / Save / Cancel nav buttons | Tasks 8, 25 |
| Save and Quit | Task 13 |
| `saveOnPageChange` | Task 13 |
| `useWizardField()` escape hatch | Task 16 |
| Self-contained Wiz input components | Tasks 17–21 |
| `ValidationWrapper` internal | Task 15 |
| Zod per-page schema | Tasks 22, 23 |
| Server 422 summary | Tasks 9, 13 |
| `WizardSummary` with jump links | Task 24 |
| `calc` per page | Task 13 (setValue), Task 28 (SchedulePage) |
| `clearFields` | Task 13 |
| `appendData` | Task 13 |
| `acceptButtons` | Tasks 25, 28 |
| `customButtons` | Task 25 |
| `cancelCallback` | Tasks 13, 28 |
| View mode (disabled) | Tasks 8, 13 |
| `isSummaryPage` | Tasks 13, 28 |
| `noPayload` | Tasks 13, 28 |
| Tasks showcase module | Tasks 26–30 |
| 5-step Tasks wizard | Tasks 28–29 |
| `hide` on Wiz components | Tasks 17–21, Task 29 |
| `calc` urgency label | Task 28 |
| Zod schema on StartPage | Task 28 |
| dict lookup (assignees) | Tasks 26–29 |
| Task list index | Task 30 |
| New / Edit / View routes | Task 30 |
