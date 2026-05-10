# Data Model: Tasks Showcase Module (Phase 6)

## Domain Entities

### Task (MSW fixture shape)

```ts
type Task = {
  id:          number
  title:       string
  type:        string           // 'złożone' | 'personal' | 'proste'
  description: string
  priority:    'low' | 'normal' | 'high'
  deadline:    string           // ISO date string 'YYYY-MM-DD'
  start_date:  string           // ISO date string 'YYYY-MM-DD'
  assignee_id: number | null    // null when type === 'personal'
  related_ids: number[]
  notes:       string
}
```

Used by: task list, pre-filled edit fixtures.

---

### TaskForm (flat wizard form)

```ts
type TaskForm = {
  title:            string
  type:             string
  description:      string
  priority:         'low' | 'normal' | 'high'
  deadline:         string           // ISO date 'YYYY-MM-DD'
  start_date:       string           // ISO date 'YYYY-MM-DD'
  assignee_id:      number | null
  related_ids:      number[]
  notes:            string
  deadline_urgency: string           // derived by calc — NOT sent to server
}
```

`deadline_urgency` is derived by the `SchedulePage` calc function:
- `'Pilne'` — deadline within 3 days
- `'Normalne'` — deadline 3–14 days away
- `'Spokojnie'` — deadline more than 14 days away
- `'Brak daty'` — no deadline set

**Server payload**: On save, `deadline_urgency` should be excluded from the PUT body. The `SchedulePage` does not declare `noPayload: true` (the whole form is sent), so the backend must tolerate or ignore the extra key. For MSW, the save handler echoes `{ ok: true }` regardless.

---

### DictOption

```ts
type DictOption = {
  value: string | number
  label: string
}
```

Used by: task type select, assignee select, related tasks list.

---

### PageMapping (server-driven field metadata)

```ts
type PageMapping = {
  name:   string
  label:  string
  fields: FieldMeta[]
}

type FieldMeta = {
  name:    string
  label:   string
  type:    'input' | 'select' | 'textarea' | 'date' | 'radio' | 'checkbox'
  lp:      number
  display: boolean
  max?:    number
  decimal?: number
}
```

The mapping fixture returns 5 pages matching the wizard route structure.

---

## Fixture Data

### Task list fixture (3 tasks)

| ID | Title | Type | Priority | Deadline |
|----|-------|------|----------|---------|
| 1 | Przygotowanie raportu Q2 | złożone | high | 2026-05-15 |
| 2 | Spotkanie z klientem | personal | normal | 2026-05-20 |
| 3 | Aktualizacja dokumentacji | proste | low | 2026-06-01 |

### Dict options

**Task types** (`/api/tasks/dict/types`):
```ts
[
  { value: 'złożone', label: 'Złożone' },
  { value: 'personal', label: 'Osobiste' },
  { value: 'proste',  label: 'Proste' },
]
```

**Assignees** (`/api/tasks/dict/assignees`):
```ts
[
  { value: 1, label: 'Anna Kowalska' },
  { value: 2, label: 'Jan Nowak' },
  { value: 3, label: 'Maria Wiśniewska' },
]
```

### Mapping fixture (5 pages)

```ts
[
  {
    name: 'start', label: 'Start',
    fields: [
      { name: 'title',       label: 'Tytuł',       type: 'input',    lp: 1, display: true },
      { name: 'type',        label: 'Typ zadania',  type: 'select',   lp: 2, display: true },
      { name: 'description', label: 'Opis',         type: 'textarea', lp: 3, display: true },
    ]
  },
  {
    name: 'schedule', label: 'Harmonogram',
    fields: [
      { name: 'priority',   label: 'Priorytet',  type: 'radio', lp: 1, display: true },
      { name: 'deadline',   label: 'Termin',     type: 'date',  lp: 2, display: true },
      { name: 'start_date', label: 'Data start', type: 'date',  lp: 3, display: true },
    ]
  },
  {
    name: 'assignment', label: 'Przypisanie',
    fields: [
      { name: 'assignee_id', label: 'Przypisany do', type: 'select', lp: 1, display: true },
    ]
  },
  {
    name: 'related', label: 'Powiązane',
    fields: [
      { name: 'related_ids', label: 'Powiązane zadania', type: 'checkbox', lp: 1, display: true },
    ]
  },
  {
    name: 'summary', label: 'Podsumowanie',
    fields: []
  },
]
```

### Validation fixture (`/api/tasks/wizard/validate`)

```ts
{
  error: {
    'start.title': ['Tytuł jest wymagany i musi mieć co najmniej 3 znaki'],
  },
  warning: {
    'schedule.deadline': ['Termin jest bardzo bliski — upewnij się, że zadanie jest wykonalne'],
  },
  dicts_msg: {
    error:   {},
    warning: {},
  }
}
```

---

## Wizard Page → Field Mapping

| Page | Fields (form keys) | Wiz component | Notes |
|------|-------------------|---------------|-------|
| start | `title`, `type`, `description` | InputWiz, SelectWiz, TextareaWiz | Zod schema on `title` |
| schedule | `priority`, `deadline`, `start_date`, `deadline_urgency` | RadioWiz, DateTimeWiz×2, read-only display | `calc` derives urgency |
| assignment | `assignee_id` | SelectWiz | hidden when `type === 'personal'` |
| related | `related_ids` | custom checkbox list via `useWizardField` | array of numbers |
| summary | — | WizardSummary | `isSummaryPage: true` |
