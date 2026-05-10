# Quickstart: Using the Wizard (Phase 1)

After Phase 1 is implemented, a developer wires up a multi-page wizard like this:

## Minimal example (3 pages, no data fetching)

```tsx
// src/app/my-feature/page.tsx
'use client'

import { Wizard } from '@/components/wizard/Wizard'
import { Step1 } from './pages/Step1'
import { Step2 } from './pages/Step2'
import { Step3 } from './pages/Step3'

export default function MyFeaturePage() {
  return (
    <Wizard
      name="my-feature"
      mode="edit"
      pages={[
        { name: 'krok-1', form: <Step1 /> },
        { name: 'krok-2', form: <Step2 /> },
        { name: 'krok-3', form: <Step3 /> },
      ]}
      mappingUrl="/api/my-feature/mapping"
      dataUrl="/api/my-feature/data"
      saveOnPageChange={false}
    />
  )
}
```

## Reading and writing form state in a page component

```tsx
// src/app/my-feature/pages/Step1.tsx
'use client'

import { useWizard } from '@/hooks/wizard/useWizard'

export function Step1() {
  const { form, setValue } = useWizard()

  return (
    <div className="flex flex-col gap-4">
      <input
        value={(form.title as string) ?? ''}
        onChange={e => setValue('title', e.target.value)}
        placeholder="Tytuł"
      />
    </div>
  )
}
```

## Viewing the state in Redux DevTools

1. Open Chrome DevTools → Redux tab
2. The store is named `ci-prs-store`
3. Navigate between wizard pages to see `wizard/setData`, `wizard/setValidation`, `wizard/clear` actions logged in real time

## Notes

- `name` must be unique per wizard instance on the page
- In Phase 1, side nav labels come from `page.name` — server-driven labels are Phase 2
- `mappingUrl` and `dataUrl` are required props but are not fetched until Phase 2
