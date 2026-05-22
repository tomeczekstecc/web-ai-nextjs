# Contract — `useCopyToClipboard`

**Feature**: 018-copy-to-clipboard
**Location**: `src/hooks/use-copy-to-clipboard.ts`
**Stability**: Internal — consumed by `CopyButton` and by any feature that
needs copy semantics without rendering the default button.

---

## Signature

```ts
type CopyStatus = "idle" | "copied" | "failed";

type UseCopyToClipboardOptions = {
  /** ms until status auto-resets back to "idle" after a copy attempt. Default 1500. */
  resetAfter?: number;
};

type UseCopyToClipboardReturn = {
  /** Write `value` to the clipboard. Resolves true on success, false on failure. */
  copy: (value: string) => Promise<boolean>;
  /** Current status of the most recent copy attempt. */
  status: CopyStatus;
  /** Manually return status to "idle" (cancels any pending auto-reset). */
  reset: () => void;
};

export function useCopyToClipboard(
  options?: UseCopyToClipboardOptions,
): UseCopyToClipboardReturn;
```

---

## Behavior

### `copy(value)`

1. If `typeof navigator === "undefined"` **or** `!navigator.clipboard?.writeText`:
   - Set `status` to `"failed"`. Return `false`.
2. Otherwise, call `navigator.clipboard.writeText(value)`:
   - On resolve: set `status` to `"copied"`. Return `true`.
   - On reject: set `status` to `"failed"`. Return `false`.
3. In all cases (success or failure), schedule an auto-reset to `"idle"`
   after `resetAfter` ms (default 1500). A new `copy()` call cancels any
   pending reset and starts a fresh one when the new attempt resolves.
4. `value === ""` is **not** special-cased here. The hook writes `""`,
   reports success, and behaves identically to a non-empty value. (Policy
   for empty values lives in `CopyButton`.)

### `status`

- Starts at `"idle"`.
- Transitions only via `copy()` or `reset()`.
- Stable React state — consumers can use it in render / effects.

### `reset()`

- Sets `status` to `"idle"` immediately.
- Clears any pending auto-reset timer.
- Idempotent — safe to call when already `"idle"`.

### Lifecycle / safety

- The pending auto-reset timer id is held in a ref and cleared on
  unmount. No setState fires after unmount.
- The hook never throws. All Clipboard API failures are caught and
  surfaced via `status === "failed"` + a `false` return value.
- The hook is the **single chokepoint** for all clipboard writes in the
  product (FR-008). Any future fallback (e.g. `document.execCommand`,
  permissions probe, telemetry) is added here without changing
  consumers.

---

## Usage example (consumer-side)

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

## Out of scope

- Reading from the clipboard.
- Writing rich content (HTML, images, files).
- Permissions API probing.
- Telemetry on success/failure rates.
