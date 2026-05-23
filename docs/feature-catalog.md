# 🚀 Feature Catalog — Przegląd Funkcjonalności

> Dokument reklamowo-referencyjny. Opisuje wszystkie zaimplementowane funkcje aplikacji pogrupowane tematycznie.  
> Aktualizuj po dodaniu nowych features lub architektonicznych zmianach.

---

## 🔐 1. Bezpieczeństwo & Uwierzytelnianie

Kompletny system tożsamości oparty na **Better-Auth** sprzężony z backendem Laravel.

| Funkcja | Szczegóły |
|---|---|
| **Logowanie hasłem** | Formularz sign-in z walidacją Zod, obsługa błędów, przekierowanie `returnTo` |
| **Rejestracja** | Formularz sign-up z checkboxem zgody, walidacja e-mail + hasło |
| **Reset hasła** | Wysyłanie e-maila resetującego + ustawienie nowego hasła z tokenu |
| **Weryfikacja e-mail** | Strona `verify-email` z auto-polling statusu (token z linku) |
| **Social Login** | Google / Apple / Facebook — feature-flagowany (`AUTH_SOCIAL_LOGIN_ENABLED`) |
| **Rate limiting** | In-memory limiter na endpointach auth (okno czasowe + limit prób) |
| **Auth audit log** | Każde zdarzenie auth logowane jako `[auth-audit]` JSON z IP, provider, statusem |
| **Sesja z cache** | `React.cache` memoizuje sesję Better-Auth per request — 0 zbędnych wywołań DB |
| **returnTo bezpieczny** | `sanitizeReturnTo()` waliduje URL przed przekierowaniem (no open redirect) |
| **Redirect if authenticated** | Zalogowany user jest odbijany ze stron `/auth/*` z powrotem do aplikacji |
| **Mock bypass** | Dev-mode bypass sesji (`BETTER_AUTH_DEV_BYPASS`) — brak potrzeby konta lokalnie |

---

## 👮 2. RBAC — Kontrola Dostępu (4 warstwy)

Kompletny **4-warstwowy RBAC** sprzężony z rolami Laravel, izomorficzny między serwerem a klientem.

```
Layer 1: Server Gate       — requireRole() / requirePermission()     [route/layout]
Layer 2: Action Gate       — withRole() / withPermission()            [server actions]
Layer 3: Menu Filter       — filterFeatures() / filterSettings()      [sidebar/topnav]
Layer 4: Client UI Gates   — <RoleGate> / <PermissionGate> / <AuthorizedView>
```

### Role i uprawnienia

| Rola | Uprawnienia |
|---|---|
| `User` | `dashboard:read`, `applications:read` |
| `Oper` | + `applications:write`, `tasks:read`, `tasks:write` |
| `Admin` | + `users:read`, `users:write`, `admin:access` |

### Komponenty klienckie

| Komponent | Opis |
|---|---|
| `<RoleGate roles={...}>` | Cichy gate — ukrywa dzieci bez ostrzeżenia gdy rola nie pasuje |
| `<PermissionGate permissions={...}>` | Jak RoleGate, ale granular `domain:action` check |
| `<AuthorizedView roles={...}>` | Widoczny fallback ("Nie masz dostępu do tego zasobu.") |
| `<PrincipalProvider>` | Kontekst kliencki z danymi principals; dev-warning gdy brakuje providera |

### Serwer

| Funkcja | Opis |
|---|---|
| `requireRole(roles)` | Rzuca `unauthorized()` (401) lub `forbidden()` (403) |
| `requirePermission(perms)` | Jak `requireRole`, ale dla `domain:action` |
| `withRole(roles, fn)` | Opakowuje server action — gate zawsze odpala przed body |
| `withPermission(perms, fn)` | Jak `withRole`, ale permission-based |
| `getCurrentPrincipal()` | `React.cache` — pojedyncze `/me` na render pass |

### Extras

- Normalizacja case-insensitive ról (`"admin"` → `"Admin"`)
- Mode `"any"` (default) / `"all"` — dowolna lub wszystkie role/permy
- Dev-time `console.warn` gdy gate renderuje bez providera lub bez props

---

## 🧙 3. Wizard — Silnik Wieloetapowych Formularzy

Generyczny, w pełni typowany silnik wizardu z podtrzymaniem stanu przez kroki.

```
<Wizard> ← konfiguracja
  └─ <WizardProvider> ← Zustand slice + logika
       └─ <WizardShell> ← nawigacja kroków, progress bar, walidacja
            └─ <WizardPage n>   ← dowolny React content
            └─ <WizardSummary>  ← automatyczne podsumowanie pól
```

### Funkcje

| Funkcja | Opis |
|---|---|
| **Nawigacja kroków** | Pasek postępu ze stanami: `done` / `current` / `upcoming` / `disabled` |
| **Walidacja per-krok** | Ikony błędów na krokach — walidacja before/on page change |
| **Tryby** | `create` / `edit` / `view` — view ukrywa pola, pokazuje dane tylko do odczytu |
| **Save on page change** | Opcjonalne `saveOnPageChange` — auto-zapis przy każdym przejściu |
| **Custom actions** | `acceptActions` i `customActions` — dowolne CTA obok "Dalej / Zapisz" |
| **Data load** | `dataUrl` — ładuje dane z API przed uruchomieniem wizardu |
| **Mapping URL** | `mappingUrl` — pobiera mapowanie pola→kroku dla walidacji krzyżowej |
| **Save URL** | `saveUrl` — finalizuje zapis po ostatnim kroku |
| **Cancel callback** | `cancelCallback` — powrót do listy bez zapisywania |
| **Dedicated inputs** | `InputWiz`, `TextareaWiz`, `SelectWiz`, `RadioWiz`, `DateTimeWiz` |

### Używany w

- **Reports Wizard** — tworzenie/edycja/podgląd raportów (3 kroki)
- **Tasks Wizard** — 6 kroków: Start → Harmonogram → Przypisanie → Powiązane → Załączniki → Podsumowanie

---

## 📊 4. DataTable — Zaawansowana Tabela Danych

Tabela zbudowana na **TanStack Table v8** z bogatym zestawem wbudowanych funkcji.

### Cechy

| Funkcja | Opis |
|---|---|
| **Sortowanie** | Per-kolumna, klikalne nagłówki (`SortableHeader`) |
| **Filtrowanie kolumn** | `ColumnFilterPopover` — dropdown z wartościami unikalnymi |
| **Wyszukiwanie** | Client-side lub server-side (`manual: true`) |
| **Paginacja** | Client lub server, konfigurowalny rozmiar strony, `rowCount` dla totali |
| **Zaznaczanie wierszy** | Checkbox per wiersz + checkbox "zaznacz wszystkie" |
| **Drag & Drop reorder** | `@dnd-kit` — przeciąganie wierszy myszką, klawiaturą i dotykiem |
| **Widoczność kolumn** | Toggle-menu kolumn w toolbarze |
| **Export XLSX** | Eksport zaznaczonych/wszystkich wierszy do pliku Excel (`/api/internal/excel-export`) |
| **Persystencja** | `localStorage` — zapamiętuje sortowanie, filtrowanie, widoczność, rozmiar strony |
| **Skeleton** | `<DataTableSkeleton>` — placeholder ładowania zgodny z layoutem tabeli |
| **Toolbar** | Sloty `left` / `right` + `selectionContent` (bulk actions) |
| **Bulk actions** | Przykład: masowe usuwanie z dialog potwierdzenia |
| **Error state** | Komunikat błędu + przycisk "Spróbuj ponownie" |
| **Stany puste** | Konfigurowalny tekst: `emptyState`, `noResultsState`, `loadingState`, `errorState` |
| **Responsywność** | Poziomy scroll na mobile |

---

## 🧩 5. Zaawansowane Komponenty Formularzy

Gotowe bloki do budowy złożonych formularzy (`@tanstack/react-form` + Zod).

### FormRepeater

Karta-per-wiersz (stacked) z dodawaniem, usuwaniem i opcjonalnym reorder.

```tsx
<FormRepeater form={form} name="parameters" newItem={() => ({ name: "", type: "" })}
  label="Parametry" addLabel="+ Dodaj parametr" min={0} max={10}>
  {({ name }) => <div className="grid grid-cols-4 gap-3">...</div>}
</FormRepeater>
```

### TableRepeater

Tabelaryczny repeater — wspólny nagłówek, jeden `<tr>` per wiersz.

```tsx
<TableRepeater form={form} name="instruments" columns={[{ header: "Nazwa" }, { header: "Kwota PLN", align: "right" }]}
  actionsPosition="left">
  {({ name }) => <><td>...</td><td>...</td></>}
</TableRepeater>
```

### DualListTransfer

Transfer list (dostępne ↔ wybrane) z wyszukiwaniem w każdej kolumnie.

```tsx
<DualListTransfer available={users} selected={assigned} onChange={setAssigned} />
```

| Funkcja | Opis |
|---|---|
| Przenoszenie jednostkowe | `>` / `<` |
| Przenoszenie wszystkich | `>>` / `<<` |
| Wyszukiwanie | Live filter w lewej i prawej liście |
| Disabled state | Blokada edycji |

### Field (system pól formularza)

`<Field>`, `<FieldLabel>`, `<FieldDescription>`, `<FieldError>`, `<FieldGroup>` — spójny wrapper z semantic HTML i ARIA.

---

## 📁 6. File Uploader — Zarządzanie Plikami

Kompletny komponent upload z kolejką, podglądem plików i repozytorium.

```
<Uploader adapter={...} queryKey={...} fields={[...]} />
  ├─ <DropzoneArea>      — drag & drop + click-to-browse
  ├─ <QueueList>         — pliki oczekujące na upload
  │    └─ <QueueRow>     — per-plik: status, błędy, pola metadanych, upload/anuluj
  └─ <RepositoryList>    — już wgrane pliki
       └─ <RepositoryRow>— pobierz / edytuj metadane / usuń (z potwierdzeniem)
```

| Funkcja | Opis |
|---|---|
| **Drag & drop** | `react-dropzone` — strefa upuszczania z wizualnym feedbackiem |
| **Typy/rozmiary** | Konfigurowalny `config` (allowedTypes, maxSize, maxFiles) |
| **Metadane per plik** | Dynamiczne `fields` — dowolne pola do wypełnienia przed uploadem |
| **Walidacja** | Per-plik błędy walidacji (field-level + custom `validate`) |
| **Progress XHR** | Właściwy XHR z progress event (nie fetch) |
| **Edit dialog** | Edycja metadanych istniejącego pliku w modalu |
| **Delete dialog** | Potwierdzenie przed trwałym usunięciem |
| **Read-only mode** | `readOnly` — podgląd bez możliwości edycji |
| **Granular perms** | `canMutateRow(file)` — per-plik decyzja o możliwości edycji/usuwania |
| **Copy override** | Wszystkie label-y są nadpisywalne przez `copy` prop |
| **TanStack mutations** | Upload/edit/delete/download przez `useMutation` z optymistycznym UI |

---

## 📈 7. Dashboard & Wizualizacje Danych

| Komponent | Opis |
|---|---|
| **Section Cards** | KPI cards — metryki z ikonami i trendami |
| **Activity Chart** | Recharts `AreaChart` — aktywność w czasie (desktop vs mobile), `accessibilityLayer` |
| **Review Items Table** | DataTable z zaznaczaniem, bulk delete, row actions |
| **App Drawer** | Sheet (boczny panel) z podglądem szczegółów + formularzem edycji + wykresem |
| **Cell Viewer** | `<Drawer>` kierunkowy — `bottom` na mobile, `right` na desktop |
| **Bulk Delete** | Dialog potwierdzenia z wariantem `destructive` i pending state |
| **Add Project Dialog** | Modal z formularzem dodawania pozycji |
| **Lazy chart** | `dynamic(() => import(...))` — wykres ładowany tylko po kliknięciu (ssr: false) |

---

## 📋 8. Domeny Biznesowe

### Raporty

| Funkcja | Opis |
|---|---|
| Lista raportów | DataTable z kolumnami, paginacją, row actions |
| Tworzenie raportu | Reports Wizard (3 kroki: Dane podstawowe, Zapytanie SQL/Monaco, Uprawnienia) |
| Edycja raportu | Wizard w trybie `edit` z załadowanymi danymi |
| Podgląd raportu | Wizard w trybie `view` z przyciskiem "Edytuj" |
| Generowanie raportu | Async job z polling co 3s, max 20 prób, auto-download po zakończeniu |
| Pobieranie | `useFileDownload` hook — trigger browser download |
| Usuwanie | Row action z confirmation dialog (destructive pattern) |
| Monaco Editor | SQL editor z syntax highlighting w kroku "Zapytanie" |

### Aplikacje

| Widok | Opis |
|---|---|
| Lista moich aplikacji | DataTable z paginacją, breadcrumbs |
| Wszystkie aplikacje | Osobny widok (Admin/Oper) |
| Szczegół — Admin | Pełne dane + akcje administracyjne |
| Szczegół — Oper | Dane operacyjne |
| Szczegół — User | Widok użytkownika końcowego |

### Zadania (Zadania)

| Funkcja | Opis |
|---|---|
| Lista zadań | DataTable |
| Nowe zadanie | TasksWizard — 6 kroków |
| Krok: Start | Tytuł, opis, typ |
| Krok: Harmonogram | DateTimePicker, terminy |
| Krok: Przypisanie | DualListTransfer użytkowników |
| Krok: Powiązane | Relacje z innymi obiektami |
| Krok: Załączniki | `<Uploader>` z metadanymi pliku |
| Krok: Podsumowanie | `<WizardSummary>` — przegląd wszystkich kroków |
| Widok szczegółowy | Wizard w trybie `view` |

### Konkursy / Projekty

| Domena | Widoki |
|---|---|
| Projekty | Aktywne / Zakończone (tabbed layout) |
| Konkursy | Aktywne / Archiwum (tabbed layout) |
| Admin | Oddzielny layout z `requireRole("Admin")` |

---

## 🗺️ 9. Layout & Nawigacja

| Funkcja | Opis |
|---|---|
| **App Sidebar** | Dynamiczne menu z API — items filtrowane przez RBAC |
| **Top Nav layout** | Alternatywny layout z menu poziomym (feature-flagowany) |
| **Breadcrumbs** | Rejestr + `from-menu` resolver — auto-generowane ze struktury menu lub z registry |
| **Page Title** | `<PageTitle>` w site-header z wartością z breadcrumb registry |
| **Collapsible sidebar** | `SidebarRail` — collapse/expand bez ukrywania treści |
| **Mobile hamburger** | `AppSidebar mobileOnly` — sidebar jako Sheet na małych ekranach |
| **Team Switcher** | Przełącznik organizacji/kontekstu |
| **Nav Sections** | `NavMain`, `NavDocuments`, `NavProjects`, `NavSecondary` — sekcje sidebar |
| **Skeleton nav** | `SidebarMenuSkeleton` podczas ładowania menu z API |
| **returnTo aware** | `x-url` header z middleware — redirect po loginie trafia z powrotem do żądanej strony |

---

## ♿ 10. Dostępność (Accessibility)

| Obszar | Implementacja |
|---|---|
| **Daty** | `<RelativeTime>` — `<time dateTime="ISO">` + `title` dla screen readerów |
| **Icon-only buttons** | Zawsze `aria-label` + `<Tooltip>` z widocznym tekstem |
| **Drag & Drop** | `@dnd-kit` z `KeyboardSensor` + `TouchSensor` — pełna obsługa klawiatury i dotyku |
| **Charts** | `accessibilityLayer` w Recharts AreaChart |
| **CopyButton** | `<span class="sr-only" aria-live="polite">` — ogłasza status kopiowania |
| **ThemeToggle** | `aria-label` zmienia się dynamicznie: "Przełącz na jasny/ciemny motyw" |
| **Forbidden/Unauthorized** | Dedykowane strony 401/403 z czytelnym komunikatem |
| **Form fields** | `<Field>` system — `<label>` zawsze powiązany z inputem, `aria-describedby` dla opisów/błędów |
| **Dialogs** | `<Dialog>` z Radix UI — focus trap, Escape close, ARIA role dialog |
| **Drawer** | `<Drawer>` z Radix UI/Vaul — kierunkowy, focus-managed |
| **Dev warnings** | `<RoleGate>` / `<AuthorizedView>` ostrzegają dev-time gdy brakuje providera lub props |

---

## 🎨 11. UX & Design System

| Funkcja | Opis |
|---|---|
| **Dark / Light mode** | `next-themes` — toggle z `SunMedium` / `Moon`, zero flash (SSR-safe) |
| **shadcn/ui base-nova** | Design system `base-nova` — spójne tokeny kolorów, spacing, radius |
| **Toast notifications** | Sonner — `toast.success()`, `toast.error()`, `toast.info()` |
| **Skeleton loading** | Per-komponent skelety — `<DataTableSkeleton>`, `<Skeleton>` |
| **Error boundaries** | `error.tsx` per route segment — lokalne handleowanie błędów |
| **Loading states** | `loading.tsx` per route segment — instant fallback |
| **Destructive pattern** | Każda destruktywna akcja: trigger (outline) → dialog confirmation → przycisk `destructive` z pending |
| **Responsive drawers** | Drawer zmienia kierunek: `bottom` (mobile) ↔ `right` (desktop) |
| **Button variants** | `default` / `destructive` / `outline` / `ghost` / `link` — intent, nie kolor |
| **Copy Button** | `<CopyButton>` z feedback `copied` / `failed`, tooltip, `sr-only` announcement |
| **Relative Time** | Polska lokalizacja: "minutę temu", "2 godziny temu", "za 3 dni" |
| **Copy Demo** | Strona demonstracyjna wzorców kopiowania do schowka |

---

## 🛠️ 12. Architektura & Developer Experience

### Stack

| Warstwa | Technologia |
|---|---|
| Framework | Next.js 16 App Router, React 19 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Server state | TanStack Query v5 (caching, invalidation, polling) |
| Form state | TanStack Form v1 + Zod v4 |
| Table | TanStack Table v8 |
| Global state | Zustand v5 (slices: `wizard`, `reports`) |
| Auth | Better-Auth v1 + Laravel bridge |
| Mocks | MSW v2 (service worker) |
| Drag & Drop | @dnd-kit (core + sortable + modifiers) |
| Excel export | ExcelJS (server-only) |
| Charts | Recharts v3 |
| Dates | date-fns v4 + Polish locale |
| Icons | Lucide React — centralny `resolveIcon()` registry |
| Editor | Monaco Editor (dynamiczny import, ssr: false) |

### Wzorce architektoniczne

| Wzorzec | Opis |
|---|---|
| **Server Components first** | `'use client'` tylko na interaktywnych liściach |
| **Lite DDD** | `src/lib/api/domains/<domain>/` — queries.ts + commands.ts + mapper.ts + contract.ts |
| **CQRS** | Reads w `queries.ts`, writes w `commands.ts` |
| **API Mapper** | Backend DTOs nigdy nie wychodzą poza domain folder — mapper tworzy typed model |
| **commands.ts + mutation hook** | Czyste funkcje transportu + hooki UX (toast, invalidation, rollback) |
| **Per-request memoization** | `React.cache` na `getBetterAuthSession` + `getAccessForCurrentRequest` + `getCurrentPrincipal` |
| **Query key factory** | `dashboardKeys`, `reportsKeys` — każda domena zarządza swoimi kluczami |
| **Zustand slices** | Jeden store `useStore` importowany ze `src/lib/store/index.ts` |
| **Domain-first routing** | `src/app/(app)/<domain>/` + `src/components/<domain>/` + `src/lib/api/domains/<domain>/` |
| **Breadcrumb registry** | Deklaratywny rejestr + resolver z menu API — zero breadcrumb prop-drillingu |
| **Icon registry** | `resolveIcon(name)` — jedyne miejsce importujące ikony, chroni bundle size |

---

## ⚡ 13. Wydajność (Performance)

| Optymalizacja | Gdzie |
|---|---|
| **`React.cache`** | Session + principal — 0 zbędnych round-tripów w trakcie render pass |
| **`dynamic()`** | Recharts chart w DrawerCell/AppDrawer — ładowany on-demand, `ssr: false` |
| **`server-only`** | ExcelJS (900 KB) — gwarancja że nie trafi do bundle klienta |
| **Lazy menu icons** | Ikony menu pobierane z backendu — nie bundlowane statycznie |
| **Polling throttle** | Report generation: co 3 s, max 20 prób — nie flooding API |
| **Persisted preferences** | DataTable preferencje z localStorage — brak re-fetch przy powrocie |
| **Suspense boundaries** | `loading.tsx` per route + `<DataTableSkeleton>` — instant perceived load |
| **Session cookie cache** | `session.cookieCache` w Better-Auth — większość reads omija DB |
| **MSW mocks** | Development bez backendu — zero latency mock layer |

---

## 📅 14. Internacjonalizacja & Formatowanie Dat

Polska lokalizacja jako pierwszy język interfejsu.

| Funkcja | Opis |
|---|---|
| **ISO 8601 default** | `YYYY-MM-DD` i `YYYY-MM-DD HH:mm` — spójny format w całej aplikacji |
| **`<RelativeTime>`** | Czas względny po polsku (`date-fns/locale/pl`) z ISO w `title`/`dateTime` |
| **`formatDate()`** | Helper zwracający `YYYY-MM-DD`, akceptuje `string | Date | number | null` |
| **`formatDateTime()`** | Helper zwracający `YYYY-MM-DD HH:mm` |
| **`formatRelative()`** | "minutę temu", "za 3 dni" — zawsze z ISO fallbackiem |
| **Polska UI** | Wszystkie label-e, komunikaty błędów, placeholdery, toasty — po polsku |
| **Locale na formularze** | `react-day-picker` z polskim Calendar — tygodnie, miesiące po polsku |

---

## 🗺️ Mapa Tras (Route Map)

```
/                          → Landing page
/auth/sign-in              → Logowanie (+ social providers)
/auth/sign-up              → Rejestracja
/auth/verify-email         → Weryfikacja e-mail
/auth/reset-password       → Reset hasła
/auth/access-denied        → Brak dostępu
/auth/unavailable          → Serwis niedostępny

/(app)/dashboard           → Dashboard główny
/(app)/applications/       → Moje aplikacje
/(app)/applications/all    → Wszystkie aplikacje (Admin/Oper)
/(app)/applications/[id]   → Szczegół aplikacji (widok per rola)
/(app)/projects/active     → Projekty aktywne
/(app)/projects/completed  → Projekty zakończone
/(app)/competitions/active → Konkursy aktywne
/(app)/competitions/archive→ Konkursy archiwum
/(app)/zadania/            → Lista zadań
/(app)/zadania/new         → Nowe zadanie (wizard)
/(app)/zadania/[id]        → Edycja zadania (wizard)
/(app)/zadania/[id]/view   → Podgląd zadania (wizard view)
/(app)/reports/            → Lista raportów
/(app)/reports/new         → Nowy raport (wizard)
/(app)/reports/[id]        → Edycja raportu (wizard)
/(app)/reports/[id]/view   → Podgląd raportu (wizard view)
/(app)/admin/              → Panel administracyjny (requireRole: Admin)
/(app)/copy-demo           → Demo wzorców kopiowania
```

---

## 📦 Podsumowanie — liczby

| Kategoria | Ilość |
|---|---|
| Strony (routes) | 20+ |
| Komponenty domeny | 40+ |
| Komponenty UI (`/ui`) | 30+ |
| Custom hooks | 15+ |
| API domains | 6 (auth-user, dashboard, applications, tasks, reports, menu) |
| Wzorce RBAC | 4 warstwy, 3 role, domain:action permissions |
| Wizard pages (łącznie) | 9 (3 reports + 6 tasks) |
| DataTable features | 14 wbudowanych funkcji |

---

*Wygenerowano: 2026-05-23 | Projekt: ci-prs/1/web*
