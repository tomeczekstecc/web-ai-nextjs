# Quickstart: Wizard Field Input Components (Phase 3)

## What changes after Phase 3

Phase 2 delivered the data layer. Phase 3 delivers the field-level developer
API — Wiz components and `useWizardField`.

**Before Phase 3** — page authors write:
```tsx
function Krok1() {
  const { form, setValue } = useWizard()
  return (
    <div>
      <label htmlFor="tytul">Tytuł</label>
      <input value={form.tytul} onChange={e => setValue('tytul', e.target.value)} />
    </div>
  )
}
```

**After Phase 3** — page authors write:
```tsx
function Krok1() {
  return (
    <div className="flex flex-col gap-4">
      <InputWiz keyName="tytul" />
    </div>
  )
}
```

No label, no mode check, no validation wiring — everything is encapsulated.

---

## New files

```
src/hooks/wizard/
  useWizardField.ts       ← escape hatch hook + internal hook for Wiz components

src/components/wizard/
  ValidationWrapper.tsx   ← INTERNAL: red border + alert + scroll anchor (not exported publicly)
  inputs/
    InputWiz.tsx
    SelectWiz.tsx
    TextareaWiz.tsx
    DateTimeWiz.tsx
    RadioWiz.tsx
```

## Modified files

```
src/components/ui/
  textarea.tsx            ← install via shadcn CLI
  radio-group.tsx         ← install via shadcn CLI

src/app/wizard-demo/page.tsx
  ← update Krok1 to use InputWiz instead of raw <input>
```

---

## Using Wiz components

```tsx
import { InputWiz } from '@/components/wizard/inputs/InputWiz'
import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { TextareaWiz } from '@/components/wizard/inputs/TextareaWiz'
import { DateTimeWiz } from '@/components/wizard/inputs/DateTimeWiz'
import { RadioWiz } from '@/components/wizard/inputs/RadioWiz'

function MyPage() {
  const { form } = useWizard()
  return (
    <div className="flex flex-col gap-4">
      <InputWiz keyName="title" />
      <SelectWiz keyName="type" options={typeOptions} />
      <TextareaWiz keyName="description" />
      <DateTimeWiz keyName="deadline" hideTime />
      <RadioWiz keyName="priority" options={priorityOptions} hide={form.type === 'personal'} />
    </div>
  )
}
```

## Using the escape hatch

```tsx
function StarRating({ keyName }: { keyName: string }) {
  const f = useWizardField(keyName)
  if (f.hidden) return null
  return (
    <div>
      <label>{f.label}</label>
      <MyStarInput value={f.value} onChange={f.onChange} disabled={f.disabled} />
      {f.error && <p className="text-destructive text-sm">{f.error}</p>}
    </div>
  )
}
```

---

## Dev verification checklist

After implementation, verify manually:

- [ ] `<InputWiz keyName="tytul" />` in Krok1 shows label "Tytuł" from MSW mapping
- [ ] `<InputWiz>` is disabled (not interactive) when demo wizard is in view mode
- [ ] Forcing a validation error via Zustand devtools shows red border + error text
- [ ] `hide={true}` on any Wiz component leaves no visible DOM element
- [ ] `useWizardField` escape hatch in a custom component reads label from mapping
- [ ] `TextareaWiz` and `RadioWiz` render correctly after shadcn install
