# Data Model: Wizard Data Layer (Phase 2)

## Entities

### PageMapping (server response from `mappingUrl`)

```ts
type PageMapping = {
  name:   string       // matches WizardPage.name
  label:  string       // displayed in side nav
  fields: FieldMeta[]
}
```

Already defined in `src/lib/wizard/types.ts`. No changes needed.

### FieldMeta (per-field descriptor within PageMapping)

```ts
type FieldMeta = {
  name:     string
  label:    string
  type:     'input' | 'select' | 'textarea' | 'date' | 'radio' | 'checkbox'
  lp:       number
  display:  boolean
  max?:     number
  decimal?: number
}
```

Already defined in `src/lib/wizard/types.ts`. No changes needed.

### WizardEntry (Zustand slice, keyed by wizard name)

```ts
type WizardEntry = {
  form: Record<string, unknown>   // flat key-value form state
  meta: {
    validation: ValidationItem[]  // per-field validation errors
  }
}
```

Already defined in `src/lib/store/types.ts`. No changes needed.

### SavePayload

The full flat `form` object from Zustand is sent as-is as the PUT body:

```ts
type SavePayload = Record<string, unknown>
```

No new type needed — it's just `wizardEntry.form`.

---

## State Transitions

```
wizard mounts
  → useWizardMapping fires (loading: true)
  → useWizardData fires (loading: true)

mapping resolves
  → setMapping(data) → side nav re-renders with real labels

data resolves
  → setWizardData(name, data) → form fields pre-filled
  → loading: false

user edits field
  → setValue(key, value) → Zustand updated → optional calc run

user clicks Next (saveOnPageChange: true, mode: edit)
  → save mutation fires → PUT /saveUrl with full form
  → on success: toast.success, navigate to next page
  → on error: toast.error, navigate anyway (non-blocking)

user clicks Save (explicit)
  → save mutation fires → PUT /saveUrl
  → on success: toast.success, stay on page

user clicks Save and Quit
  → save mutation fires → PUT /saveUrl
  → on success: saveAndQuitCallback()
```

---

## Mapping Helper Functions

`WizardAPI` exposes helpers that look up field metadata from the mapping array.
Phase 2 wires these to real mapping data:

```ts
getLabel(field, page?)   // FieldMeta.label for the given field name
getType(field, page?)    // FieldMeta.type
getDisplay(field, page?) // FieldMeta.display
getMax(field, page?)     // FieldMeta.max (optional)
getDecimal(field, page?) // FieldMeta.decimal ?? 2
```

Without a `page` argument, helpers search all pages for the first matching
field name.
