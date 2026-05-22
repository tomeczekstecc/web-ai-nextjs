# Quickstart — Copy to Clipboard Component

**Feature**: 018-copy-to-clipboard

Five-minute orientation for anyone consuming or reviewing the new
copy-to-clipboard primitive.

---

## When to use what

| Situation | Use |
|-----------|-----|
| You want a copy affordance next to a value | `<CopyButton value={...} />` |
| You want a copy affordance with visible text | `<CopyButton value={...}>{visibleText}</CopyButton>` |
| The trigger is a menu item, a toast action, or any non-button element | `useCopyToClipboard()` hook directly |
| You need to do something else after the copy (toast, analytics) | `<CopyButton ... onCopy={(value, status) => ...} />` |

---

## Basic usage

### Icon-only button

```tsx
import { CopyButton } from "@/components/ui/copy-button";

<CopyButton value={user.id} label="Kopiuj ID użytkownika" />
```

### Text + icon (whole button is one click target)

```tsx
<CopyButton value={user.email} label="Kopiuj adres e-mail">
  {user.email}
</CopyButton>
```

### Disabled state (automatic on empty value)

```tsx
<CopyButton value={maybeId ?? ""} label="Kopiuj ID" />
// Button is non-interactive when maybeId is undefined / null / "".
```

### With a side-effect callback

```tsx
import { toast } from "sonner";

<CopyButton
  value={shareUrl}
  label="Kopiuj link"
  onCopy={(_, status) => {
    if (status === "copied") toast.success("Skopiowano link");
    else toast.error("Nie udało się skopiować linku");
  }}
/>
```

### Hook directly (no button)

```tsx
"use client";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

function CopyIdMenuItem({ id }: { id: string }) {
  const { copy, status } = useCopyToClipboard();
  return (
    <DropdownMenuItem onSelect={() => copy(id)}>
      {status === "copied" ? "Skopiowano" : "Kopiuj ID"}
    </DropdownMenuItem>
  );
}
```

---

## Localization

Pass the three label props (defaults are English):

```tsx
<CopyButton
  value={diagnostics}
  label="Kopiuj szczegóły błędu"
  copiedLabel="Skopiowano"
  failedLabel="Nie udało się skopiować"
/>
```

These three strings drive both the tooltip text and the screen-reader
live-region announcement — no risk of them drifting.

---

## Manual verification against the success criteria

Visit `/copy-demo` after `pnpm dev`. The route exercises every
permutation in one place.

| Criterion | How to verify |
|-----------|---------------|
| **SC-001** — single interaction copies | Click any demo button → paste into an external field. |
| **SC-002** — confirmation 200ms / cleared by 2s | Watch the icon swap; eyeball that it returns to `Copy` within ~1.5s. |
| **SC-003** — failure surfaces, never false-success | Toggle "Simulate failure" → click → confirm `X` icon + tooltip `"Couldn't copy"` + live-region announcement; then toggle off and confirm a fresh copy succeeds normally. |
| **SC-004** — real consumer adopts the primitive | Trigger an app error (or visit `/error` if a test route exists), click the copy button on the diagnostics block. |
| **SC-005** — AT users perceive outcome without focus movement | With VoiceOver / NVDA on, focus the demo button, click; the announcement should fire without re-focusing. |
| **SC-006** — copy + paste diagnostics in < 10s | Time yourself on the error page. |

---

## Theming

The component uses `Button` variant tokens (`ghost` default) and
Lucide icons inheriting `currentColor`. Verify against both light and
dark theme by toggling the existing theme switcher while on
`/copy-demo`.

---

## What this feature does NOT do

- It does not read from the clipboard.
- It does not handle rich content (HTML, images, files).
- It does not retry failed copies.
- It does not provide global toast feedback by default — opt in via
  `onCopy`.
- It does not provide a legacy fallback for non-secure contexts. The
  `failed` state is the correct outcome there.
