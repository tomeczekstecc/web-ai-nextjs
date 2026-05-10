# Quickstart: Wizard Validation System (Phase 4)

## Adding Client-Side Zod Validation to a Page

Import Zod and declare a `schema` on the `WizardPage` config:

```tsx
import { z } from 'zod'

const pages: WizardPage[] = [
  {
    name: 'krok-1',
    form: <KrokJedenPage />,
    schema: z.object({
      tytul: z.string().min(3, 'Tytuł musi mieć co najmniej 3 znaki'),
    }),
  },
  ...
]
```

When the user clicks Back or Next, `WizardProvider` runs the schema automatically. If it fails, navigation is blocked and inline errors appear on the failing fields via the Wiz components' `ValidationWrapper`.

No additional code is required in the page component.

---

## Adding a Summary Page

Add a page with `isSummaryPage: true` and render `<WizardSummary>` as the page content:

```tsx
import { WizardSummary } from '@/components/wizard/WizardSummary'

const pages: WizardPage[] = [
  ...
  {
    name: 'podsumowanie',
    isSummaryPage: true,
    form: <WizardSummary />,
  },
]
```

Then configure `validationUrl` on the `WizardConfig`:

```tsx
<Wizard
  name="my-wizard"
  mode="edit"
  pages={pages}
  mappingUrl="/api/my-wizard/mapping"
  dataUrl="/api/my-wizard/data"
  saveUrl="/api/my-wizard/save"
  validationUrl="/api/my-wizard/validate"
  saveOnPageChange={true}
  acceptButtons={(summary) => (
    <Button onClick={handleSubmit}>Wyślij</Button>
  )}
/>
```

When the user enters the summary page, `WizardProvider` calls `validationUrl` and passes the result to `WizardSummary`. Error and warning groups with jump links are rendered automatically.

---

## MSW Handler for Validation

Register a validation handler using the existing factory:

```ts
// src/mocks/handlers/index.ts
import { createWizardValidationHandler } from './wizard'

createWizardValidationHandler('/api/my-wizard/validate', {
  error: { tytul: ['Tytuł jest wymagany'] },
  warning: { opis: ['Opis jest bardzo krótki'] },
  dicts_msg: { error: {}, warning: {} },
})
```

Return an empty result to simulate a passing validation:

```ts
createWizardValidationHandler('/api/my-wizard/validate', {
  error: {},
  warning: {},
})
```

---

## Using the Escape Hatch — Custom Field with Validation

For custom inputs, `useWizardField` already returns `error` from the validation store:

```tsx
const f = useWizardField('my_custom_field')
if (f.hidden) return null

return (
  <div>
    <label>{f.label}</label>
    <MyCustomInput value={f.value} onChange={f.onChange} disabled={f.disabled} />
    {f.error && <p className="text-destructive text-sm">{f.error}</p>}
  </div>
)
```

Both Zod (client) and server 422 errors flow through the same `error` value — no additional wiring required.
