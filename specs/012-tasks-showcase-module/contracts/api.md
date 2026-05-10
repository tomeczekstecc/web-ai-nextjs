# API Contracts: Tasks Showcase Module (Phase 6)

All endpoints are MSW-mocked. No real backend exists. These contracts define what the frontend expects from each endpoint.

---

## Wizard Endpoints

### GET `/api/tasks/wizard/mapping`

Returns the page and field mapping for the task wizard.

**Response** (200):
```json
[
  { "name": "start",      "label": "Start",        "fields": [...] },
  { "name": "schedule",   "label": "Harmonogram",  "fields": [...] },
  { "name": "assignment", "label": "Przypisanie",   "fields": [...] },
  { "name": "related",    "label": "Powiązane",     "fields": [...] },
  { "name": "summary",    "label": "Podsumowanie",  "fields": [] }
]
```

Full fixture shape: see `data-model.md` → Mapping fixture.

Handler factory: `createWizardMappingHandler('/api/tasks/wizard/mapping', mappingFixture)`

---

### GET `/api/tasks/wizard/data`

Returns an empty form for create mode.

**Response** (200):
```json
{
  "title": "",
  "type": "",
  "description": "",
  "priority": "normal",
  "deadline": "",
  "start_date": "",
  "assignee_id": null,
  "related_ids": [],
  "notes": ""
}
```

Handler factory: `createWizardDataHandler('/api/tasks/wizard/data', emptyTaskForm)`

---

### GET `/api/tasks/wizard/data/:id`

Returns a pre-filled form for edit mode. IDs 1, 2, 3 map to fixture tasks.

**Response** (200): Same shape as above, populated with task data.
**Response** (404): `{ error: 'Not found' }` for unknown IDs.

Handler: custom `http.get` with `:id` param extraction.

---

### PUT `/api/tasks/wizard/save`

Accepts the flat form payload and returns success.

**Request body**: Flat `TaskForm` object (including `deadline_urgency` — ignored by handler).
**Response** (200): `{ ok: true }`

Handler factory: `createWizardSaveHandler('/api/tasks/wizard/save')`

---

### GET `/api/tasks/wizard/validate`

Returns a fixture `SummaryResult` with one error and one warning.

**Response** (422):
```json
{
  "error":   { "start.title": ["Tytuł jest wymagany..."] },
  "warning": { "schedule.deadline": ["Termin jest bardzo bliski..."] },
  "dicts_msg": { "error": {}, "warning": {} }
}
```

Handler factory: `createWizardValidationHandler('/api/tasks/wizard/validate', validationFixture)`

---

## Task List & Dict Endpoints

### GET `/api/tasks/list`

Returns the task list for the index page.

**Response** (200):
```json
[
  { "id": 1, "title": "Przygotowanie raportu Q2", "type": "złożone", "priority": "high",   "deadline": "2026-05-15" },
  { "id": 2, "title": "Spotkanie z klientem",     "type": "personal", "priority": "normal", "deadline": "2026-05-20" },
  { "id": 3, "title": "Aktualizacja dokumentacji","type": "proste",   "priority": "low",    "deadline": "2026-06-01" }
]
```

Handler: custom `http.get('/api/tasks/list', ...)`

---

### GET `/api/tasks/dict/types`

Returns task type options for the SelectWiz on the Start page.

**Response** (200):
```json
[
  { "value": "złożone",  "label": "Złożone" },
  { "value": "personal", "label": "Osobiste" },
  { "value": "proste",   "label": "Proste" }
]
```

Handler: custom `http.get('/api/tasks/dict/types', ...)`

---

### GET `/api/tasks/dict/assignees`

Returns assignee options for the SelectWiz on the Assignment page.

**Response** (200):
```json
[
  { "value": 1, "label": "Anna Kowalska" },
  { "value": 2, "label": "Jan Nowak" },
  { "value": 3, "label": "Maria Wiśniewska" }
]
```

Handler: custom `http.get('/api/tasks/dict/assignees', ...)`
