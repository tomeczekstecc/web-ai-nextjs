# Destructive Actions Always Confirm

How irreversible / destructive actions (delete, remove, discard, withdraw, revoke, archive-without-undo) are gated in this repository. The trigger is always non-destructive; the **confirmation dialog's confirm button** carries the `destructive` variant.

---

**Rule:** Every irreversible / destructive action **must** be preceded by a confirmation
dialog. The trigger button is non-destructive; the **dialog's confirm button**
carries the `destructive` variant.

This applies to: pojedyncze wiersze, akcje masowe (`bulk delete`), kasowanie
zasobów z poziomu szczegółów, „Wycofaj wniosek", „Odrzuć" itp. Wyjątek: "undo"
lub "soft-delete with toast undo" — wtedy potwierdzenie nie jest wymagane, ale
musi być widoczny mechanizm cofnięcia w stylu Sonner toast z `action`.

## Why

- Color alone ("red button") is not enough — colorblind users, mis-clicks,
  muscle memory.
- The dialog forces a deliberate second action and surfaces *what* will be
  deleted („Usunąć wniosek #1234?") plus *consequences* („Tej operacji nie
  można cofnąć").
- Centralises destructive UX so it looks and behaves the same everywhere.

## Pattern

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { resolveIcon } from "@/lib/icons"

const Trash2Icon = resolveIcon("Trash2")

<Dialog>
  {/* Trigger — NOT destructive. Ghost / outline depending on density. */}
  <DialogTrigger
    render={
      <Button variant="ghost" size="icon-sm" aria-label="Usuń wniosek" />
    }
  >
    <Trash2Icon />
  </DialogTrigger>

  <DialogContent>
    <DialogHeader>
      <DialogTitle>Usunąć wniosek?</DialogTitle>
      <DialogDescription>
        Wniosek „{title}" zostanie trwale usunięty. Tej operacji nie można cofnąć.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose render={<Button variant="outline">Anuluj</Button>} />
      <Button
        variant="destructive"
        onClick={() => onDelete(id)}
        disabled={isPending}
      >
        {isPending ? "Usuwanie…" : "Usuń wniosek"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Bulk delete variant

The trigger jest najczęściej w pasku akcji zaznaczonych wierszy. Pokazać liczbę:

```tsx
<DialogTitle>Usunąć {count} wnioski?</DialogTitle>
<DialogDescription>
  Wybrane wnioski zostaną trwale usunięte. Tej operacji nie można cofnąć.
</DialogDescription>
…
<Button variant="destructive" onClick={() => onDelete(selectedIds)}>
  {isPending ? "Usuwanie…" : `Usuń zaznaczone (${count})`}
</Button>
```

Dla *bardzo* dużych operacji (10+ rekordów, kaskadowe efekty) wymagać wpisania
frazy potwierdzającej („USUŃ") zanim przycisk destructive się odblokuje.

## Anti-patterns

```tsx
{/* ❌ Bezpośrednie usunięcie z triggera — brak potwierdzenia */}
<Button variant="destructive" onClick={() => deleteItems(ids)}>
  Usuń zaznaczone
</Button>

{/* ❌ destructive na triggerze I na confirm — dwa razy czerwone, bez eskalacji */}
<DialogTrigger render={<Button variant="destructive">Usuń</Button>} />
…
<Button variant="destructive">Usuń</Button>

{/* ❌ window.confirm — nie używamy natywnych dialogów, niezgodne ze stylem aplikacji */}
if (window.confirm("Usunąć?")) deleteItem(id)

{/* ❌ Dialog bez nazwanego zasobu — użytkownik nie wie co usuwa */}
<DialogTitle>Czy na pewno?</DialogTitle>
```

## Checklist for every destructive action

- [ ] Trigger button is `ghost` / `outline`, **never** `destructive`
- [ ] Confirmation `Dialog` (or `AlertDialog`) opens before the mutation fires
- [ ] Dialog title names the **specific resource** being deleted („Usunąć wniosek „XYZ"?"), or the count for bulk
- [ ] Dialog description explicitly states irreversibility („Tej operacji nie można cofnąć")
- [ ] Confirm button uses `variant="destructive"` and an action verb label („Usuń", not „OK")
- [ ] Cancel button uses `variant="outline"` with label „Anuluj"
- [ ] Confirm button shows a pending state („Usuwanie…") and is disabled while the mutation runs
- [ ] Bulk operations show the count in both trigger and confirm
- [ ] Exception (soft-delete + undo toast): use Sonner toast with `action: { label: "Cofnij", onClick }`

## Related

- `button-patterns.md` — `destructive` variant rules + intent-to-variant mapping
- `api-mutation-pattern.md` — the mutation that runs after the confirm
- `accessibility.md` — dialog focus management
