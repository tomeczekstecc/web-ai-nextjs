# Implementation Plan: Tasks Showcase Module (Phase 6)

**Branch**: `012-tasks-showcase-module` | **Date**: 2026-05-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/012-tasks-showcase-module/spec.md`

## Summary

Build a self-contained task management mini-app that is the canonical reference consumer of the wizard engine (Phases 1–5). Delivers: MSW fixture data, 8 MSW handlers, 5 wizard page components, a `TasksWizard` config component, 4 App Router routes, and the task list index page. Replaces the Phase 5 demo scaffolding at `/wizard-demo` with a production-realistic showcase.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: Next.js 16 App Router, React 19, TanStack Query, Zustand, shadcn/ui, MSW, Zod, sonner
**Storage**: Zustand wizard slice (form state); MSW (all server data); no real backend
**Testing**: N/A — constitution forbids automated tests
**Target Platform**: Modern desktop browsers (showcase / dev reference)
**Performance Goals**: Smooth wizard navigation, instant calc updates, save toast on each page transition
**Constraints**: Polish UI language; no new shadcn/ui components; use existing Wiz inputs; no engine changes; no automated tests; no comments
**Scale/Scope**: 15 new files, 2 modified files; 4 routes; 5 wizard pages; 8 MSW endpoints

## Constitution Check

- ✅ Problem understood — full Phase 6 design doc reviewed; all entities, routes, MSW contracts documented
- ✅ Simplest solution — reuses all wizard engine components; no new abstractions; custom multi-select only where no Wiz variant exists
- ✅ Surgical changes — only 2 files modified (handlers/index.ts, wizard-demo/page.tsx); all other work is new files
- ✅ Success criteria explicit — SC-001 through SC-005 in spec.md; all verifiable by navigating `/wizard-demo`
- ✅ TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, theme parity preserved
- ✅ No automated tests; no comments added
- ✅ Decoupled from Laravel — all data via MSW; no real API calls

## Project Structure

### Documentation (this feature)

```text
specs/012-tasks-showcase-module/
├── plan.md           ← this file
├── spec.md
├── research.md
├── data-model.md
├── contracts/
│   └── api.md
└── tasks.md
```

### Source Code (files created / modified)

```text
src/
├── mocks/
│   ├── data/
│   │   └── tasks-wizard.ts         NEW — all fixture data
│   └── handlers/
│       ├── tasks-wizard.ts         NEW — 8 MSW handlers
│       └── index.ts                MODIFIED — register tasks-wizard handlers
│
├── components/
│   └── tasks-wizard/
│       ├── TasksWizard.tsx         NEW — WizardConfig assembly
│       └── pages/
│           ├── StartPage.tsx       NEW — title, type, description; Zod schema
│           ├── SchedulePage.tsx    NEW — priority, dates; calc for urgency
│           ├── AssignmentPage.tsx  NEW — assignee dict; hide when type=personal
│           ├── RelatedPage.tsx     NEW — custom multi-select via useWizardField
│           └── SummaryPage.tsx     NEW — WizardSummary + acceptButtons
│
└── app/
    └── wizard-demo/
        ├── page.tsx                MODIFIED — task list table (replaces Phase 5 demo)
        ├── new/
        │   └── page.tsx            NEW — create wizard (edit mode)
        ├── [id]/
        │   └── page.tsx            NEW — edit wizard
        └── [id]/view/
            └── page.tsx            NEW — view wizard
```

## Implementation Design

### Layer 1 — Fixture Data (`src/mocks/data/tasks-wizard.ts`)

Single file exporting all fixture constants:

```ts
export const TASK_MAPPING: PageMapping[]          // 5-page mapping fixture
export const EMPTY_TASK_FORM: Record<...>          // empty create form
export const TASK_FIXTURES: Record<number, ...>    // tasks 1,2,3 pre-filled
export const TASK_LIST: TaskListItem[]             // 3-row list
export const TASK_TYPES: DictOption[]              // 3 type options
export const TASK_ASSIGNEES: DictOption[]          // 3 assignee options
export const TASK_VALIDATION: SummaryResult        // 1 error + 1 warning
```

All values typed, no runtime logic.

---

### Layer 2 — MSW Handlers (`src/mocks/handlers/tasks-wizard.ts`)

Exports a single `taskWizardHandlers` array consumed by `handlers/index.ts`.

Uses factory functions for wizard endpoints:
- `createWizardMappingHandler('/api/tasks/wizard/mapping', TASK_MAPPING)`
- `createWizardDataHandler('/api/tasks/wizard/data', EMPTY_TASK_FORM)`
- `createWizardSaveHandler('/api/tasks/wizard/save')`
- `createWizardValidationHandler('/api/tasks/wizard/validate', TASK_VALIDATION)`

Custom handlers for parameterized and non-wizard endpoints:
- `http.get('/api/tasks/wizard/data/:id', ...)` — extracts `id`, returns `TASK_FIXTURES[Number(id)]` or 404
- `http.get('/api/tasks/list', ...)` — returns `TASK_LIST`
- `http.get('/api/tasks/dict/types', ...)` — returns `TASK_TYPES`
- `http.get('/api/tasks/dict/assignees', ...)` — returns `TASK_ASSIGNEES`

`handlers/index.ts` change: add `import { taskWizardHandlers } from './tasks-wizard'` and spread into the `handlers` export array.

---

### Layer 3 — Wizard Page Components

#### `StartPage.tsx`

```tsx
function StartPage() {
  return (
    <div className="flex flex-col gap-4">
      <InputWiz keyName="title" />
      <SelectWiz keyName="type" options={TYPE_OPTIONS} />
      <TextareaWiz keyName="description" />
    </div>
  )
}
```

`TYPE_OPTIONS` fetched via `useQuery` from `/api/tasks/dict/types` — or passed as a static import from the fixture for simplicity (avoids a second fetch on this page). Decision: **use static import from fixture** to keep pages simple.

Zod schema on this page:
```ts
z.object({ title: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki') })
```

#### `SchedulePage.tsx`

```tsx
function SchedulePage() {
  const { form } = useWizard()
  return (
    <div className="flex flex-col gap-4">
      <RadioWiz keyName="priority" options={PRIORITY_OPTIONS} />
      <DateTimeWiz keyName="deadline" hideTime />
      <DateTimeWiz keyName="start_date" hideTime />
      <div>
        <p className="text-sm font-medium">Pilność terminu</p>
        <Badge>{(form.deadline_urgency as string) || 'Brak daty'}</Badge>
      </div>
    </div>
  )
}
```

`PRIORITY_OPTIONS`: `[{ value: 'low', label: 'Niski' }, { value: 'normal', label: 'Normalny' }, { value: 'high', label: 'Wysoki' }]`

`calc` on this page:
```ts
calc: (form) => {
  const deadline = form.deadline as string
  if (!deadline) return { ...form, deadline_urgency: 'Brak daty' }
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  const urgency = days < 3 ? 'Pilne' : days <= 14 ? 'Normalne' : 'Spokojnie'
  return { ...form, deadline_urgency: urgency }
}
```

#### `AssignmentPage.tsx`

```tsx
function AssignmentPage() {
  const { form } = useWizard()
  return (
    <div className="flex flex-col gap-4">
      <SelectWiz keyName="assignee_id" options={ASSIGNEE_OPTIONS} hide={form.type === 'personal'} />
      {form.type === 'personal' && (
        <p className="text-sm text-muted-foreground">Zadanie osobiste — brak przypisania.</p>
      )}
    </div>
  )
}
```

`ASSIGNEE_OPTIONS`: static import from fixture (same pattern as TYPE_OPTIONS).

#### `RelatedPage.tsx`

Custom multi-select using `useWizardField`:

```tsx
function RelatedPage() {
  const f = useWizardField('related_ids')
  const selected = (f.value as number[]) ?? []
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{f.label}</p>
      {TASK_LIST.filter(t => t.id !== currentId).map(task => (
        <label key={task.id} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(task.id)}
            onChange={() => {
              const next = selected.includes(task.id)
                ? selected.filter(id => id !== task.id)
                : [...selected, task.id]
              f.onChange(next)
            }}
            disabled={f.disabled}
          />
          {task.title}
        </label>
      ))}
    </div>
  )
}
```

`TASK_LIST` is a static import from the fixture. The `currentId` concept is not needed in the demo — all 3 tasks can appear as candidates.

#### `SummaryPage.tsx`

```tsx
function SummaryPage() {
  return <WizardSummary />
}
```

`acceptButtons` is provided at the `TasksWizard` config level (not in the page component).

---

### Layer 4 — TasksWizard Config (`TasksWizard.tsx`)

```tsx
'use client'

export function TasksWizard({ id, mode }: { id?: number; mode: 'edit' | 'view' }) {
  const router = useRouter()
  const dataUrl = id ? `/api/tasks/wizard/data/${id}` : '/api/tasks/wizard/data'

  const pages: WizardPage<TaskForm>[] = [
    { name: 'start',      form: <StartPage />,      schema: startSchema },
    { name: 'schedule',   form: <SchedulePage />,   calc: scheduleCalc },
    { name: 'assignment', form: <AssignmentPage /> },
    { name: 'related',    form: <RelatedPage /> },
    { name: 'summary',    form: <SummaryPage />,    isSummaryPage: true },
  ]

  return (
    <Wizard
      name="tasks-wizard"
      mode={mode}
      pages={pages}
      mappingUrl="/api/tasks/wizard/mapping"
      dataUrl={dataUrl}
      saveUrl="/api/tasks/wizard/save"
      validationUrl="/api/tasks/wizard/validate"
      saveOnPageChange={true}
      cancelCallback={() => router.push('/wizard-demo')}
      saveAndQuitCallback={() => router.push('/wizard-demo')}
      acceptButtons={(summary) => {
        const hasErrors = summary && Object.keys(summary.error ?? {}).length > 0
        return (
          <Button variant="default" disabled={!!hasErrors} onClick={() => {
            toast.success('Zadanie zostało wysłane!')
            router.push('/wizard-demo')
          }}>
            Wyślij zadanie
          </Button>
        )
      }}
    />
  )
}
```

---

### Layer 5 — Routes

#### `src/app/wizard-demo/page.tsx` (REPLACE)

Task list page. Uses `useQuery` to fetch from `/api/tasks/list`. Renders a shadcn Table with columns: Tytuł, Typ, Priorytet, Termin, and action links (Edytuj, Podgląd). Has a "Nowe zadanie" button.

This is a `'use client'` page because it uses TanStack Query for data fetching.

#### `src/app/wizard-demo/new/page.tsx`

```tsx
'use client'
export default function NewTaskPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nowe zadanie</h1>
      <TasksWizard mode="edit" />
    </div>
  )
}
```

#### `src/app/wizard-demo/[id]/page.tsx`

```tsx
'use client'
export default function EditTaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edycja zadania #{params.id}</h1>
      <TasksWizard id={Number(params.id)} mode="edit" />
    </div>
  )
}
```

#### `src/app/wizard-demo/[id]/view/page.tsx`

```tsx
'use client'
export default function ViewTaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Podgląd zadania #{params.id}</h1>
      <TasksWizard id={Number(params.id)} mode="view" />
    </div>
  )
}
```

---

## UI Impact Summary

| Area | Change | Light/Dark | Responsive |
|------|--------|-----------|------------|
| `/wizard-demo` | Task list table replaces Phase 5 demo | ✅ shadcn Table | ✅ horizontal scroll on mobile |
| `/wizard-demo/new` | New wizard route | ✅ inherits wizard styles | ✅ |
| `/wizard-demo/[id]` | Edit wizard route | ✅ | ✅ |
| `/wizard-demo/[id]/view` | View wizard route | ✅ | ✅ |
| SchedulePage | Urgency badge (derived via calc) | ✅ uses Badge component | ✅ |
| AssignmentPage | Message when type=personal | ✅ muted text | ✅ |
| RelatedPage | Checkbox list | ✅ native checkbox | ✅ |

## Laravel Integration Notes

- All endpoints are MSW-mocked. For Laravel integration, replace MSW handlers with real API calls.
- The flat `TaskForm` matches what a Laravel controller would receive in a `PUT /api/tasks/{id}` body.
- `deadline_urgency` is frontend-only — exclude it from the Laravel payload via a backend guard or by stripping it in the save handler.
- Dict endpoints (`/api/tasks/dict/types`, `/api/tasks/dict/assignees`) map to Laravel resource collections.

## Success Criteria Verification

| Criterion | How to verify |
|-----------|---------------|
| SC-001: Task list visible, create reachable | Navigate to `/wizard-demo` — see table; click "Nowe zadanie" — wizard opens |
| SC-002: Full create flow + validation jump | Complete 5 steps; observe save toasts; see fixture error on summary with working jump link |
| SC-003: Edit pre-fills all fields | Click edit on task 1 — all fields populated from fixture |
| SC-004: View mode disables all inputs | Click view on task 2 — all inputs disabled, no Save/Cancel |
| SC-005: All engine features exercised | Check each feature against the design doc table in Phase 6 spec |
