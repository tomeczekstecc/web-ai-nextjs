# Date Format — ISO by Default

How dates and times are formatted across the UI in this repository. The default visible date format is **ISO 8601 short** (`YYYY-MM-DD`); relative time is reserved for activity/audit surfaces and must always carry an ISO tooltip.

---

**Rule:** The default visible date format across the app is **ISO 8601 short**:
`YYYY-MM-DD` (np. `2026-05-31`). For timestamps with time: `YYYY-MM-DD HH:mm`
(local time, np. `2026-05-31 14:23`). Wszędzie tam gdzie data jest wyświetlana
użytkownikowi — tabele, listy, karty, badge'e terminu, eksport CSV/XLSX, tooltipy,
formatery DataTable — stosuj ten format, chyba że konkretny widok ma
udokumentowany wyjątek (patrz niżej).

## Why ISO

- **Jednoznaczne** — nie ma wątpliwości czy `05/06/2026` to maj czy czerwiec.
- **Sortowalne leksykograficznie** — `"2026-05-31" < "2026-06-01"` działa jak string sort, co upraszcza eksport, CSV, debug.
- **Spójne między backendem a frontendem** — API zwraca ISO; renderowanie ISO eliminuje warstwę formatowania, która mogłaby się zdesynchronizować.
- **A11y / i18n-neutral** — nie zależy od locale przeglądarki.

## How

Używaj `date-fns` (już jest w `package.json`) z formatem `"yyyy-MM-dd"`.
Nie używaj `toLocaleDateString()`, `Intl.DateTimeFormat` bez explicit locale,
ani ręcznych `${y}-${m}-${d}` z paddingiem.

```ts
import { format, parseISO } from "date-fns"

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value
  return format(date, "yyyy-MM-dd")
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value
  return format(date, "yyyy-MM-dd HH:mm")
}
```

Centralise these helpers in `src/lib/format/date.ts` (utwórz jeśli nie istnieje)
i importuj wszędzie zamiast formatować inline.

## Examples

```tsx
// ✅ Correct — ISO format via shared helper
import { formatDate } from "@/lib/format/date"

<TableCell>{formatDate(item.deadline)}</TableCell>
<Badge>Termin: {formatDate(deadline)}</Badge>

// ❌ Wrong — ambiguous locale-dependent format
<TableCell>{new Date(item.deadline).toLocaleDateString()}</TableCell>

// ❌ Wrong — polski format pisany ręcznie
<TableCell>{`${d}.${m}.${y}`}</TableCell>     {/* „31.05.2026" */}

// ❌ Wrong — wymyślony format, niespójny z resztą aplikacji
<TableCell>{format(date, "d MMMM yyyy", { locale: pl })}</TableCell>
```

## Inputs

Native `<input type="date">` już używa ISO w `value` — nic nie zmieniamy.
W komponencie `react-day-picker` formatuj wyświetlaną wartość przez
`formatDate()` (nie `format(date, "PPP")`).

## Exceptions (require explicit approval)

Dopuszczalne wyłącznie gdy:

- Widok jest ściśle „prosowy" / marketingowy (landing, e-mail, summary tekstowy) — wtedy możesz użyć dłuższego formatu `"d MMMM yyyy"` z polską lokalizacją.
- Komponent jawnie reprezentuje *względny* czas („2 godziny temu") — wtedy użyj `formatDistanceToNow` z `date-fns`, ale **zawsze** dodaj ISO w `title` / tooltipie:
  ```tsx
  <span title={formatDateTime(value)}>{formatDistanceToNow(parseISO(value))}</span>
  ```

Każdy taki wyjątek dokumentujemy w tabeli poniżej.

## Relative Time („minutę temu", „godzinę temu")

Dla pól o charakterze „kiedy się to wydarzyło" (timeline, activity feed,
„Ostatnio edytowane", badge'e „Utworzone…", listy zdarzeń) renderuj **względny**
czas po polsku zamiast surowej daty ISO. To czytelniejsze dla człowieka, ale
**zawsze** musi towarzyszyć mu absolutna data ISO w `title` / tooltipie —
użytkownik musi móc sprawdzić dokładny moment.

### Use the `<RelativeTime>` component (preferred)

```tsx
import { RelativeTime } from "@/components/ui/relative-time"

<RelativeTime value={item.updatedAt} />
// → <time dateTime="2026-05-31 14:23" title="2026-05-31 14:23">
//     2 godziny temu
//   </time>
```

Komponent:

- renderuje semantyczny `<time>` z `dateTime` i `title` w formacie ISO,
- automatycznie spełnia regułę „ISO w tooltipie",
- jest server component (zero JS na kliencie),
- akceptuje `fallback` dla `null` / niepoprawnej wartości.

### Or compose manually with `formatRelative`

Gdy potrzebujesz własnego wrappera (inline w prozie, własne style, kompozycja
z innymi elementami), użyj helpera bezpośrednio — ale pamiętaj o `title`:

```tsx
import { formatDateTime, formatRelative } from "@/lib/format/date"

<time dateTime={formatDateTime(value)} title={formatDateTime(value)}>
  {formatRelative(value)}
</time>
```

### Example outputs (locale = pl)

| Distance | Output |
|---|---|
| < 60 s | „mniej niż minutę temu" |
| 1 min | „minutę temu" |
| 15 min | „15 minut temu" |
| 1 h | „około godziny temu" |
| 3 h | „około 3 godzin temu" |
| 1 d | „1 dzień temu" |
| przyszłość | „za 2 dni", „za minutę" |

### When to use vs. ISO

| Surface | Use |
|---|---|
| Activity / audit log, „Ostatnia aktywność", notyfikacje | `<RelativeTime>` |
| Kolumna „Termin" / „Data złożenia" w tabeli operacyjnej | ISO przez `formatDate()` |
| Eksport XLSX/CSV, raporty | ISO przez `formatDate()` |
| „Ostatnio edytowane 3 godziny temu" w nagłówku karty | `<RelativeTime>` |
| Date pickery, formularze | ISO (`yyyy-MM-dd`) w state, ISO w display |

Reguła kciuka: **względny** dla zdarzeń świeżych w czasie, **ISO** dla danych
operacyjnych / planowanych / eksportowanych.

### Auto-refresh („tykający" zegar)

`<RelativeTime>` to server component — etykieta jest liczona raz przy renderze.
W długo otwartych widokach „2 minuty temu" nie zamieni się w „3 minuty temu"
samo z siebie. Jeśli tego potrzebujesz (np. ekran monitoringu / live feed):

- owiń `<RelativeTime>` w cienki client component, który trzyma `useState` na
  numer ticka i `useEffect` z `setInterval(..., 60_000)` — i przekazuje
  `key={tick}` żeby wymusić re-render,
- nie używaj `setInterval` o częstotliwości < 30 s — marnujesz CPU i baterię.

Na razie ten przypadek nie występuje; jeśli kiedyś się pojawi, dodaj
`<RelativeTimeLive>` w `src/components/ui/` zamiast inline'ować w każdym miejscu.

## Approved Deviations from the ISO Date Rule

| File | Format used | Reason | Status |
|------|-------------|--------|--------|
| `src/components/ui/calendar.tsx` (line ~43) | `date.toLocaleString(locale?.code, { month: "short" })` for the calendar month header („Sty", „Lut"…) | Upstream shadcn/ui registry file — same status as other `src/components/ui/` deviations registered in the CSS table | ✅ Approved |
| `src/components/ui/calendar.tsx` (line ~200) | `date.toLocaleDateString(locale?.code)` for the internal `data-day` HTML attribute (non-visible, used as a selector) | Upstream shadcn/ui registry file; not user-visible text | ✅ Approved |

## Checklist

- [ ] Wszystkie daty w UI przechodzą przez `formatDate` / `formatDateTime` z `src/lib/format/date.ts`
- [ ] Żadnych `toLocaleDateString()` ani inline `${y}-${m}-${d}`
- [ ] Eksport XLSX/CSV trzyma ISO (`yyyy-MM-dd`) chyba że raport ma udokumentowany wyjątek
- [ ] Względne daty („2h temu") mają ISO w `title`
- [ ] Inputy dat zwracają ISO do form state (`yyyy-MM-dd`)

## Related

- `accessibility.md` — `<time>` element semantics
- `ui-patterns.md` — table column formatting context
