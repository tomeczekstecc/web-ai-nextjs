# Quickstart: Wizard Data Layer (Phase 2)

## What changes after Phase 2

Phase 1 delivered a working wizard shell with hardcoded empty mapping and stub
save/refetch functions. Phase 2 makes it data-aware.

**Before Phase 2** — WizardProvider has:
- `const [mapping] = useState<PageMapping[]>([])` (always empty)
- `getLabel: (field) => '[${field}]'` (returns placeholder)
- `save: async () => {}` (no-op)
- `refetch: () => {}` (no-op)

**After Phase 2** — WizardProvider:
- calls `useWizardMapping(mappingUrl)` → real side nav labels
- calls `useWizardData(dataUrl, name, setWizardData)` → pre-fills form
- calls `useWizardSave(saveUrl, name)` → real save/save-and-quit
- auto-saves on nav when `saveOnPageChange && mode === 'edit'`

---

## New files

```
src/hooks/wizard/
  useWizardMapping.ts   TQ query → PageMapping[]
  useWizardData.ts      TQ query → writes form into Zustand on success
  useWizardSave.ts      TQ mutation → PUT saveUrl, sonner toast

src/mocks/handlers/
  wizard.ts             4 factory functions for MSW handlers
```

---

## Modified files

```
src/components/wizard/WizardProvider.tsx
  - imports and wires the three new hooks
  - replaces stub implementations in WizardAPI

src/app/wizard-demo/page.tsx
  - passes real mappingUrl, dataUrl, saveUrl
  - registers MSW handlers via the new factory functions

src/mocks/handlers/index.ts
  - registers demo wizard handlers
```

---

## Wiring a new wizard consumer (after Phase 2)

```tsx
// 1. Register MSW handlers (in your feature's handler file)
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
} from '@/mocks/handlers/wizard'

export const myWizardHandlers = [
  createWizardMappingHandler('/api/my-wizard/mapping', myMappingFixture),
  createWizardDataHandler('/api/my-wizard/data', myDataFixture),
  createWizardSaveHandler('/api/my-wizard/save'),
]

// 2. Mount the wizard
<Wizard
  name="my-wizard"
  mode="edit"
  pages={myPages}
  mappingUrl="/api/my-wizard/mapping"
  dataUrl="/api/my-wizard/data"
  saveUrl="/api/my-wizard/save"
  saveOnPageChange={true}
/>
```

---

## Dev verification checklist

After implementation, verify manually in the browser:

- [ ] Side nav labels match the MSW mapping fixture labels
- [ ] Form fields are pre-populated from the MSW data fixture on load
- [ ] Clicking Save fires a PUT visible in the MSW request log
- [ ] A sonner success toast appears after Save
- [ ] Clicking Next (with `saveOnPageChange: true` in edit mode) fires a PUT
      before the page changes
- [ ] Clicking "Save and Quit" invokes the `saveAndQuitCallback`
