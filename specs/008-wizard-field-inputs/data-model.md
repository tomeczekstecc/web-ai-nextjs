# Data Model: Wizard Field Input Components (Phase 3)

## Entities

### useWizardField Return Value

The hook returns a plain object. No new type is added to types.ts — this is
an inferred type from the hook's return.

```ts
{
  label:    string           // from getLabel(keyName)
  value:    unknown          // from form[keyName] ?? ''
  onChange: (v: unknown) => void  // calls setValue(keyName, v)
  hidden:   boolean          // !getDisplay(keyName) || hide prop
  disabled: boolean          // mode === 'view'
  error:    string | undefined    // from validation array for this field
}
```

### WizProps (shared base props for all Wiz components)

```ts
type WizProps = {
  keyName: string
  hide?:   boolean    // explicit hide override
  label?:  string     // server label override
}
```

### Variant-Specific Props

```ts
// SelectWiz and RadioWiz
type OptionItem = { value: string; label: string }

// DateTimeWiz
type DateTimeWizProps = WizProps & {
  hideTime?: boolean   // true → <input type="date">; false → <input type="datetime-local">
}
```

### ValidationWrapper Props

Internal component — not part of the public API.

```ts
type ValidationWrapperProps = {
  field:   string             // used for scroll anchor id
  error:   string | undefined // from useWizardField
  children: React.ReactNode
}
```

The scroll anchor is rendered as `<span id={pageKey + '.' + field} />` inside
the wrapper, so WizardSummary jump-links reach the correct field.

---

## Component Rendering Model

```
<InputWiz keyName="title" />
  └── useWizardField('title')
        ├── label  → "Title" (from mapping)
        ├── value  → form.title
        ├── onChange → setValue('title', v)
        ├── hidden → false
        ├── disabled → mode === 'view'
        └── error → validation['title']?.message
  └── if hidden → return null
  └── <div className="flex flex-col gap-1">
        <Label>{label}</Label>
        <ValidationWrapper field="title" error={error}>
          <Input value={value} onChange={...} disabled={disabled} />
        </ValidationWrapper>
      </div>
```

---

## ValidationItem Shape (confirmed from src/lib/store/types.ts)

```ts
type ValidationItem = {
  key:  string              // field name — match against keyName
  type: 'error' | 'warning'
  msgs: string[]            // first message shown as inline error
}
```

`useWizardField` uses `item.key === keyName` for lookup and returns `item.msgs[0]`
as the `error` string.

---

## File Dependency Graph

```
useWizardField.ts
  └── useWizard.ts (Phase 1)

ValidationWrapper.tsx
  └── useWizard.ts (for pageKey)
  └── Alert (shadcn/ui)

InputWiz.tsx
  └── useWizardField.ts
  └── ValidationWrapper.tsx
  └── Input (shadcn/ui)
  └── Label (shadcn/ui)

SelectWiz.tsx
  └── useWizardField.ts
  └── ValidationWrapper.tsx
  └── Select (shadcn/ui)
  └── Label (shadcn/ui)

TextareaWiz.tsx
  └── useWizardField.ts
  └── ValidationWrapper.tsx
  └── Textarea (shadcn/ui — install first)
  └── Label (shadcn/ui)

DateTimeWiz.tsx
  └── useWizardField.ts
  └── ValidationWrapper.tsx
  └── Label (shadcn/ui)
  └── plain <input type="date|datetime-local"> (styled)

RadioWiz.tsx
  └── useWizardField.ts
  └── ValidationWrapper.tsx
  └── RadioGroup (shadcn/ui — install first)
  └── Label (shadcn/ui)
```
