# Button Patterns

How to choose `Button` variants, sizes, and icon-only forms in this repository. The available variants ship with the `base-nova` shadcn preset: `default` · `outline` · `secondary` · `ghost` · `destructive` · `link`. **There is no `success` / `warning` / `info` variant** — color must never be used to convey meaning that isn't already in the variant or the label.

This file is the single source of truth for button decisions. UI hierarchy and spacing live in `ui-patterns.md`.

---

## Variant = Context, Not Style

**Rule:** Use semantic variants only when the variant carries meaning the user needs — not to add color or visual interest.

The available semantic variant is `destructive`. Use it **only** when the action is irreversible or causes data loss. For everything else, use hierarchy (size + `default` / `outline` / `ghost`) to signal prominence.

```tsx
// ✅ Correct — variant signals irreversible consequence
<Button variant="destructive">Usuń projekt</Button>

// ❌ Wrong — destructive used for styling, not meaning
<Button variant="destructive">Anuluj</Button>

// ✅ Correct — cancel uses outline, not destructive
<Button variant="outline">Anuluj</Button>
```

**Adding new semantic variants** (e.g. `success`, `warning`) is only justified when:
- The color carries information the user cannot get from label or icon alone
- The variant is defined via CSS custom properties in the theme (not hardcoded Tailwind colors)
- The preset (`base-nova`) does not already provide it

---

## Size and Prominence

```tsx
// Hero CTA
<Button size="lg" className="text-lg px-8">
  Get Started
</Button>

// Primary action
<Button size="default">
  Save Changes
</Button>

// Secondary action
<Button size="default" variant="outline">
  Cancel
</Button>

// Tertiary/subtle action
<Button size="sm" variant="ghost">
  View Details
</Button>

// Icon only
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

## Icon-Only Buttons with Tooltip

**Rule:** When a button has only an icon (no visible label), wrap it in a `Tooltip`
so the label is discoverable on hover and via assistive technology. The button
still needs `aria-label` for screen readers — the tooltip provides the visual
label for sighted users.

Use this pattern for compact toolbar actions where labels would crowd the UI
(table toolbars, sidebar actions, dense forms). Prefer labelled buttons for
primary or destructive actions where the consequence must be obvious without
hover.

```tsx
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { resolveIcon } from "@/lib/icons"

const FileSpreadsheetIcon = resolveIcon("FileSpreadsheet")

<Tooltip>
  <TooltipTrigger
    render={
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onExport}
        disabled={isExporting}
        aria-label="Eksportuj"
      />
    }
  >
    <FileSpreadsheetIcon />
  </TooltipTrigger>
  <TooltipContent>Eksportuj</TooltipContent>
</Tooltip>
```

Button size pairings for icon-only buttons:

| Use alongside | Icon-only size |
|---|---|
| `size="xs"` (`h-6`) | `size="icon-xs"` |
| `size="sm"` (`h-7`) | `size="icon-sm"` |
| `size="default"` (`h-8`) | `size="icon"` |
| `size="lg"` (`h-9`) | `size="icon-lg"` |

## Loading State

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</Button>
```

---

## Choosing a Variant at the Call Site

**Rule:** Pick the variant that matches the *intent of the action in its surface*,
not the desired color.

### Intent → variant mapping

| Intent at the call site | Variant | Example labels |
|---|---|---|
| **Primary forward action** — the next step the user is meant to take on this surface | `default` | Zapisz, Kontynuuj, Utwórz, Wyślij, Złóż wniosek, Dalej |
| **Destructive / irreversible** — deletes data, cannot be undone without effort | `destructive` | Usuń, Odrzuć, Wycofaj wniosek |
| **Secondary action** alongside a primary one on the same surface | `outline` | Anuluj, Wstecz, Edytuj (as a side action) |
| **Tertiary / contextual action** in a dense surface (toolbar, row, card header) | `ghost` | Szczegóły, Pokaż więcej, akcje ikon-only |
| **Grouped / chip-like control** (toggle groups, filter bar segments) | `secondary` | filtry, segmenty |
| **Inline navigation in prose** | `link` | „zobacz dokumentację" w opisie |

### Heuristic for multi-button surfaces

Think of every surface (dialog, form, card footer, toolbar) as a small decision
tree with **one** primary path forward:

- **One** primary forward action → `default`
- A „go back / cancel / leave as is" sibling → `outline`
- A "discard / delete / wycofaj" sibling → `destructive`
- Anything else → `ghost`

This gives sighted users the same cue a colored "success" variant would —
"this is the path forward, this is the dangerous one" — without breaking the
design system.

### Examples

#### ✅ Dialog footer: save vs. cancel vs. delete

```tsx
<DialogFooter>
  <Button variant="destructive" onClick={onDelete}>Usuń</Button>
  <Button variant="outline" onClick={onClose}>Anuluj</Button>
  <Button onClick={onSave}>Zapisz</Button>     {/* default = primary forward */}
</DialogFooter>
```

#### ✅ Wizard step footer

```tsx
<div className="flex justify-between">
  <Button variant="ghost" onClick={onBack}>Wstecz</Button>
  <Button onClick={onNext}>Dalej</Button>           {/* default = forward */}
</div>
```

#### ✅ Table row actions

```tsx
<Button variant="ghost" size="icon-sm" aria-label="Edytuj"><EditIcon /></Button>
<Button variant="ghost" size="icon-sm" aria-label="Usuń"><TrashIcon /></Button>
{/* destructive *colour* is not used in dense row UI — the confirm dialog carries the destructive variant */}
```

#### ❌ Anti-patterns

```tsx
{/* ❌ destructive used for styling, not meaning */}
<Button variant="destructive">Anuluj</Button>

{/* ❌ two primary buttons competing for attention on the same surface */}
<Button>Zapisz</Button>
<Button>Wyślij do akceptacji</Button>

{/* ❌ destructive on the trigger AND the confirm — user sees red twice with no escalation */}
<Button variant="destructive">Usuń wniosek</Button>
// …opens dialog…
<Button variant="destructive">Usuń</Button>
{/* Prefer: trigger = ghost/outline, confirm in dialog = destructive */}

{/* ❌ reaching for a non-existent semantic variant */}
<Button variant="success">Zatwierdź</Button>   {/* use default */}
<Button variant="warning">Wycofaj</Button>     {/* use destructive or outline */}
```

### Checklist before merging a surface with multiple buttons

- [ ] Exactly one `default` (primary forward action) per surface
- [ ] `destructive` only when the action is irreversible (delete, discard, withdraw)
- [ ] `outline` used for "cancel / back / side action", not for styling
- [ ] No `<Button variant="destructive">Anuluj</Button>` or similar style-driven misuse
- [ ] Trigger of a destructive flow is **not** `destructive` if the confirm dialog already is
- [ ] No hard-coded `bg-red-*` / `bg-green-*` colors used to fake a missing variant

## Related

- `destructive-actions.md` — the confirm-before-delete pattern that pairs with the `destructive` variant
- `icon-system.md` — icon resolution for icon-only buttons
- `ui-patterns.md` — visual hierarchy, spacing, and the rest of the design system
