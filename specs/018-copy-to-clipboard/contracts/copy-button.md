# Contract — `<CopyButton>`

**Feature**: 018-copy-to-clipboard
**Location**: `src/components/ui/copy-button.tsx`
**Stability**: Internal shadcn-style primitive — consumed wherever a
user-facing copy affordance is needed.

---

## Props

```ts
import type { ComponentProps } from "react";
import type { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type CopyStatus = "idle" | "copied" | "failed";

export type CopyButtonProps = {
  /** Text to write to the clipboard when the button is activated. */
  value: string;

  /** Accessible name + tooltip text in icon-only mode. Default: "Copy". */
  label?: string;
  /** Confirmation label after a successful copy. Default: "Copied". */
  copiedLabel?: string;
  /** Failure label after an unsuccessful copy. Default: "Couldn't copy". */
  failedLabel?: string;

  /**
   * Optional inline content rendered to the left of the icon.
   * When present, the button uses `size="sm"` by default and skips the tooltip
   * (the visible text acts as the label). When absent, the button is icon-only
   * with `size="icon"` and shows a tooltip.
   */
  children?: React.ReactNode;

  /**
   * Override the confirmation window (ms). Forwarded to useCopyToClipboard.
   * Default: 1500.
   */
  resetAfter?: number;

  /** Side-effect callback fired after each copy attempt. */
  onCopy?: (value: string, status: Exclude<CopyStatus, "idle">) => void;

  /** Force-disable the button regardless of `value`. */
  disabled?: boolean;

  /** Pass-through props for visual style and layout (variant, size, className, ref, etc.). */
} & Omit<ButtonProps, "children" | "disabled" | "onClick" | "aria-label">;
```

**Prop precedence rules**:
- `disabled` is `true` when either the consumer passes `disabled` or
  `value === ""`. The component never enables a button the consumer
  asked to disable.
- If `children` is omitted, default `size` resolves to `"icon"`.
  If `children` is present, default `size` resolves to `"sm"`.
  Consumer-supplied `size` always wins.
- Default `variant` is `"ghost"`. Consumer-supplied `variant` always wins.

---

## Rendering

### Icon-only mode (`children` omitted)

```
[ <icon> ]              ← inside <Button size="icon" variant="ghost">
  └── aria-label = label (stable)
  └── wrapped in <Tooltip><TooltipTrigger asChild>… <TooltipContent>{currentStatusLabel}</TooltipContent></Tooltip>
  └── <span class="sr-only" aria-live="polite">{currentAnnouncement}</span>
```

### Inline-text mode (`children` present)

```
[ {children} <icon> ]   ← inside <Button size="sm" variant="ghost">
  └── aria-label = label (stable)
  └── no tooltip — the visible children act as the label
  └── <span class="sr-only" aria-live="polite">{currentAnnouncement}</span>
```

### Icon selection (Lucide)

| `status` | Icon |
|----------|------|
| `idle`   | `Copy`  |
| `copied` | `Check` |
| `failed` | `X`     |

Icon has `aria-hidden="true"` in both modes — the textual channels
(aria-label, tooltip, live region, optional children) own all
semantics. State is also exposed via `data-state="idle|copied|failed"`
on the button element for any future test/CSS targeting.

### Live region content

```ts
currentAnnouncement = {
  idle:   "",
  copied: copiedLabel,
  failed: failedLabel,
}[status];
```

The live region span is always rendered (even when empty) so
`aria-live` listeners are already attached when the text changes.

### Tooltip content (icon-only mode only)

```ts
currentStatusLabel = {
  idle:   label,
  copied: copiedLabel,
  failed: failedLabel,
}[status];
```

---

## Behavior

- `onClick` (mouse) and `onKeyDown` (Enter / Space via the underlying
  `<Button>`'s default behavior) both invoke `copy(value)` from the
  hook. No custom keyboard handling required.
- After `copy()` resolves, fires `onCopy(value, "copied" | "failed")`
  exactly once per attempt.
- Visual state, tooltip text, and live-region text all derive from a
  single `status` value — they cannot drift.
- When `disabled` (either forced or because `value === ""`), the button
  is non-interactive: pointer/keyboard activation is a no-op, no
  status change, no `onCopy` fire, and the tooltip is suppressed.

---

## Accessibility contract

| Requirement (spec) | How met |
|--------------------|---------|
| FR-006 — keyboard operable, AT-perceivable outcome without focus movement | Built on `<Button>` (keyboard activation via Enter/Space); outcome via `aria-live="polite"` span — does not require focus to move. |
| FR-007 — three configurable labels | `label`, `copiedLabel`, `failedLabel` props with English defaults. |
| FR-009 — three states distinguishable without color | Distinct icon shapes (`Copy` / `Check` / `X`) + text content change. Color used only as redundant cue. |
| FR-011 — single click target whether icon-only or with text | One `<Button>` element. No nested interactive children. |
| FR-012 — non-interactive on empty value | `disabled` when `value === ""`. |

---

## Theming

- Uses `Button` variant tokens (`ghost`, `outline`). No hardcoded colors.
- Verified manually in both light and dark theme via the demo route.

---

## Out of scope

- A separate headless trigger (`<CopyTrigger asChild>`). The hook is
  the reuse path for non-button cases.
- Built-in toast feedback. Consumers wire `onCopy` to `sonner.toast`
  themselves if they want one.
- Reading from the clipboard.
