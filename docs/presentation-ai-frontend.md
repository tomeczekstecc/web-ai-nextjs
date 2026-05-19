# Wykorzystanie AI w Programowaniu Frontend
## Spec Driven Development — Na przykładzie produkcyjnego projektu Next.js 16

---

# Spec Driven Development

## Nowy paradygmat tworzenia oprogramowania

Klasyczny flow developera: **pomysł → kod → review → poprawki → deploy**

Spec Driven Development z AI: **specyfikacja → clarify → plan → tasks → implement → audit**

### Czym jest Spec Driven Development?

To podejście, w którym **specyfikacja jest kodem** — nie dokumentem, który się dezaktualizuje po pierwszym ustawieniu sprint. AI agent prowadzi feature od naturalnego opisu w języku polskim/angielskim, przez formalną specyfikację z user stories i acceptance criteria, architekturę, listę tasków z zależnościami, aż po gotową implementację.

### Dlaczego to zmienia zasady gry?

- **Specyfikacja żyje** — jest wersjonowana w Git, aktualizowana przez AI, weryfikowana automatycznie
- **AI nie zgaduje** — ma spec, plan, kontrakty API i model danych zanim napisze pierwszą linię kodu
- **Powtarzalność** — ten sam pipeline dał 12 features w tym projekcie, od auth po wizard engine
- **Jakość by design** — clarify wymusza odpowiedzi na pytania, zanim pojawią się w code review

### W tym projekcie
12 features przeprowadzonych przez pełny Spec Driven pipeline:
`001-app-auth` · `003-reusable-data-table` · `005-msw-tanstack-data-layer` · `006-wizard-foundation` · `007-wizard-data-layer` · `008-wizard-field-inputs` · `010-wizard-validation` · `011-wizard-advanced-features` · `012-tasks-showcase-module` · `014-json-menu-gen` · i więcej

Każdy feature ma: `spec.md` → `plan.md` → `data-model.md` → `contracts/` → `tasks.md` → `checklists/`

---

# Jak to osiągamy? — 7 filarów

Spec Driven Development to nie jedno narzędzie — to **ekosystem**. Pokażemy 7 filarów, które razem tworzą ten system w naszym produkcyjnym projekcie Next.js 16.

Każdy filar zilustrujemy konkretnymi plikami i wynikami z repo.

**Stack projektu:** Next.js 16 App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui

---

# Filar 1: Context — Pamięć projektu dla AI

## Problem
AI bez kontekstu generuje generyczny kod. Nie zna Twoich konwencji, architektury, stacku ani reguł.

## Rozwiązanie
Trzy pliki instrukcji + folder kontekstu, które AI czyta **przed każdą odpowiedzią**.

### Pliki instrukcji (identyczna treść, 3 narzędzia)
- **AGENTS.md** → OpenAI Codex / ChatGPT
- **CLAUDE.md** → Claude Code
- **CURSOR.md** → Cursor IDE

Każdy agent startuje z tym samym zrozumieniem projektu.

### Folder `context/` — 10 plików wiedzy domenowej
| Plik | Cel |
|------|-----|
| `project-overview.md` | Cel produktu, użytkownicy, UX |
| `project-spec.md` | Zakres, model danych, roadmapa |
| `coding-standards.md` | TypeScript, React, Next.js, Tailwind |
| `nextjs-patterns.md` | App Router, Server Components |
| `component-patterns.md` | Refaktoring, custom hooks |
| `accessibility.md` | Semantic HTML, ARIA, inkluzywność |
| `performance.md` | Bundle size, Web Vitals |
| `ui-patterns.md` | Hierarchia wizualna, spacing, design system |
| `ai-interaction.md` | Styl współpracy, workflow, commity |
| `TODO.md` | Aktywne zadania i dług techniczny |

### Efekt
AI wie, że w tym projekcie:
- Domyślnie pisze **Server Components**
- Używa **domain-driven placement** (`src/app/<domain>/`, `src/components/<domain>/`)
- Stosuje **CQRS**: reads w `queries.ts`, writes w `commands.ts`
- Nie dodaje testów (decyzja architektoniczna zapisana w constitution)
- Używa `pnpm`, nie `npm`

**Bez kontekstu:** AI pisze `npm install`, tworzy Client Components i umieszcza pliki losowo.
**Z kontekstem:** AI generuje kod, który pasuje do repo jak gdyby pisał członek zespołu.

---

# Filar 2: Skills — Wielorazowe instrukcje specjalistyczne

## Problem
Generyczne prompty dają generyczne wyniki. Code review? AI sprawdza formatowanie zamiast regresji.

## Rozwiązanie
**34 skille** — specjalistyczne instrukcje aktywowane kontekstowo.

### Przykłady skilli w projekcie

**🔍 Jakość kodu:**
- `code-review` — szuka bugów i regresji, nie stylu. Priorytet: broken states > security > a11y > performance > maintainability
- `security-check` — audyt secrets, unsafe rendering, auth, input trust
- `design-pattern-check` — granice komponentów, state ownership, coupling

**♿ Dostępność:**
- `accessibility` — semantic HTML, keyboard, focus, contrast
- `aria-check` — dialogi, menu, tabs, formularze, custom controls

**⚡ Wydajność:**
- `performance` — bundle size, rendering cost, client boundaries
- `nextjs-app-router` — route structure, server/client boundaries, metadata

**🎨 UI:**
- `shadcn` — 50+ reguł dla shadcn/ui: styling, forms, composition, semantic colors
- `ui-design` — hierarchia wizualna, spacing, typografia, polish
- `tanstack-form` — wzorce formularzy z Zod walidacją

**🔄 Workflow:**
- `git-add-push` — stage, commit (conventional), push do wszystkich remote
- `context7-first` — sprawdź dokumentację przed kodowaniem
- `todo-context` — strukturyzowane TODO z priorytetem i domeną

### Jak to działa
```
Użytkownik: "zrób review tego komponentu"
↓
Agent automatycznie aktywuje skill `code-review`
↓
Skill narzuca priorytety: bugs > security > a11y > performance > style
↓
Wynik: konkretne findings z severity i ścieżkami plików
```

### Kluczowa cecha
Skille to **nie prompty** — to **instrukcje z regułami, checklistami i workflow**. Skill `shadcn` ma ponad 50 reguł z przykładami Incorrect/Correct. Skill `code-review` zabrania rekomendowania testów (bo constitution projektu to zabrania).

---

# Filar 3: MCP — Model Context Protocol

## Problem
AI halucynuje API bibliotek. Pisze kod do Next.js 14, gdy używamy 16. Wymyśla nieistniejące propsy.

## Rozwiązanie
**MCP** — protokół łączący AI z zewnętrznymi źródłami danych w czasie rzeczywistym.

### Nasze serwery MCP

**📚 Context7 — Live dokumentacja**
```json
{
  "context7": {
    "url": "https://mcp.context7.com/mcp"
  }
}
```
Workflow:
1. `resolve-library-id("next.js")` → pobierz ID biblioteki
2. `query-docs("server components data fetching")` → pobierz aktualną dokumentację
3. AI pisze kod oparty na **oficjalnych docs**, nie na pamięci treningowej

**🎭 Playwright — Browser automation**
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp@latest"]
  }
}
```
AI może:
- Otworzyć stronę w przeglądarce
- Zrobić screenshot
- Kliknąć elementy, wypełnić formularze
- Zweryfikować wizualnie efekt swoich zmian

### Efekt
Zamiast: *"Myślę, że w Next.js 16 metadata exportuje się tak..."*
AI mówi: *"Sprawdziłem w dokumentacji — w Next.js 16 metadata API wygląda tak: ..."*

---

# Filar 4: Subagents — Wyspecjalizowani agenci

## Problem
Jeden agent nie może być ekspertem od wszystkiego jednocześnie. Audyt kodu wymaga innego podejścia niż SEO review.

## Rozwiązanie
**Dedykowani subagenci** z własnym modelem, uprawnieniami, narzędziami i pamięcią.

### Agent: Codebase Auditor 🟠
| Parametr | Wartość |
|----------|---------|
| Model | Sonnet (głęboka analiza) |
| Kolor | Pomarańczowy |
| Pamięć | Projektowa (persystentna) |
| Narzędzia | Read-only + Context7 + Playwright |

**Co robi:**
- Audyt architectural placement (czy pliki są we właściwych folderach)
- Sprawdza server-first pattern (czy `'use client'` jest tylko na liściach)
- Wykrywa DTO leaks (czy surowe backend DTOs wyciekają do UI)
- Weryfikuje CQRS (reads w queries.ts, writes w commands.ts)
- Raportuje: CRITICAL → WARNING → SUGGESTION

**Czego NIE robi:** Nie zmienia kodu. Tylko raportuje i rekomenduje.

### Agent: SEO Checker 🟢
| Parametr | Wartość |
|----------|---------|
| Model | Haiku (szybki, tani) |
| Kolor | Zielony |
| Pamięć | Projektowa (persystentna) |
| Narzędzia | Read-only + Context7 |

**Co robi:**
- Sprawdza meta tags (title 50-60 znaków, description 150-160)
- Weryfikuje robots.ts (czy `/dashboard`, `/auth/*` mają `noindex`)
- Audytuje sitemap.ts (czy nie zawiera protected routes)
- Sprawdza Open Graph tags na stronach publicznych

### Kluczowa cecha
Każdy subagent **buduje pamięć** między sesjami. Auditor pamięta, które wzorce łamią konwencje. SEO Checker pamięta, które route'y są publiczne, a które chronione.

---

# Filar 5: Spec Kit — Od pomysłu do kodu w 6 krokach

## Problem
AI świetnie pisze kod, ale bez struktury tworzy chaos. Brak specyfikacji → brak spójności → refaktor.

## Rozwiązanie
**Spec Kit** — pełny pipeline od opisu słownego do gotowej implementacji.

### Pipeline

```
specify → clarify → plan → tasks → implement → analyze
   ↓         ↓        ↓       ↓         ↓          ↓
 spec.md  pytania  plan.md  tasks.md   kod     audyt
          + odpow.  + arch.  + deps   + lint   jakości
```

### 6 kroków na żywym przykładzie: `014-json-menu-gen`

**Krok 1: Specify** — "Chcę JSON-driven navigation menu"
→ Generuje `spec.md` z user stories, acceptance scenarios, priorytetami

**Krok 2: Clarify** — AI zadaje 5 precyzujących pytań
→ "Kiedy refetchować menu config?", "Jak działa active route matching?"
→ Odpowiedzi wracają do spec.md

**Krok 3: Plan** — Architektura i design
→ `plan.md`: techniczna architektura, dependencje, approach, constraints
→ `data-model.md`: typy, kontrakty API
→ `contracts/`: schema endpoint'ów

**Krok 4: Tasks** — Dependency-ordered task lista
→ `tasks.md`: taski pogrupowane per user story z `[P]` (parallel) i zależnościami

**Krok 5: Implement** — AI wykonuje taski po kolei
→ Sprawdza zależności, pisze kod, uruchamia `pnpm lint`, commituje

**Krok 6: Analyze** — Cross-artifact consistency check
→ Czy plan zgadza się ze spec? Czy tasks pokrywają plan? Czy jest luka?

### Skala
W tym projekcie: **12 features** przeprowadzonych przez pełny pipeline:
- `001-app-auth` → autentykacja
- `003-reusable-data-table` → generyczny data table
- `006-wizard-foundation` → multi-step wizard engine
- `014-json-menu-gen` → server-driven navigation
- ...i 8 kolejnych

---

# Filar 6: Plugins — Rozszerzenia agenta

## Problem
Podstawowy agent to model + terminal. Potrzebujemy wyspecjalizowanych narzędzi.

## Rozwiązanie
**4 pluginy** zainstalowane w Claude Code:

| Plugin | Cel |
|--------|-----|
| `superpowers` | Rozszerzone uprawnienia systemowe |
| `code-review` | Wbudowany, natywny code review |
| `commit-commands` | Konwencjonalne commity z poziomu agenta |
| `andrej-karpathy-skills` | Skille AI od Andreja Karpathy'ego |

### Jak współgrają z resztą
Plugins działają **razem** ze skillami i subagentami. Subagent `codebase-auditor` używa pluginu `code-review` wewnętrznie. Skill `git-add-push` korzysta z `commit-commands`.

---

# Filar 7: Agent Memory — Pamięć między sesjami

## Problem
Każda nowa rozmowa z AI zaczyna się od zera. Agent nie pamięta decyzji, preferencji, ani kontekstu z wczoraj.

## Rozwiązanie
**Persystentna pamięć** zapisywana w plikach Markdown, wersjonowana w Git.

### 4 typy pamięci
| Typ | Przykład |
|-----|---------|
| `user` | "Developer preferuje terse responses, bez trailing summaries" |
| `feedback` | "Nie mockuj bazy — mieliśmy incident z rozbieżnością mock vs prod" |
| `project` | "Merge freeze od 5 marca — mobile team tnie release branch" |
| `reference` | "Bugi pipeline'u śledzone w Linear, projekt INGEST" |

### Architektura pamięci
```
.claude/agent-memory/
├── codebase-auditor/     ← auditor pamięta wzorce i violations
│   └── MEMORY.md         ← indeks pamięci
├── seo-checker/          ← SEO checker pamięta klasyfikacje route'ów
│   └── MEMORY.md
```

### Reguły bezpieczeństwa
- Pamięć może się zdezaktualizować → agent **weryfikuje** przed użyciem
- "Pamięć mówi, że X istnieje" ≠ "X istnieje teraz"
- Przed rekomendacją: sprawdź czy plik/funkcja nadal istnieje
- Jeśli pamięć koliduje z kodem → **ufaj kodowi**, zaktualizuj pamięć

---

# Jak to wszystko współgra — Pełny workflow

```
Programista: "Dodaj JSON-driven nawigację do sidebar'a"

1. CONTEXT      → Agent czyta CLAUDE.md + context/ → zna stack, konwencje, architekturę
2. SKILLS       → Aktywuje: nextjs-app-router, shadcn, context7-first
3. MCP          → Context7: sprawdza aktualne API Next.js 16 metadata i navigation
4. SPEC KIT     → specify → clarify → plan → tasks → implement
5. SUBAGENTS    → codebase-auditor weryfikuje zgodność z konwencjami
6. PLUGINS      → commit-commands: konwencjonalny commit
7. MEMORY       → Zapisuje: "route /dashboard jest protected, /about jest public"

Wynik: a441115 feat(nav): implement JSON-driven navigation menu
```

---

# Liczby z projektu

| Metryka | Wartość |
|---------|---------|
| Features przez AI pipeline | **12** |
| Skille specjalistyczne | **34** (projekt) + **6** (globalne) |
| Pliki kontekstu | **10** |
| Subagenci | **2** (auditor + SEO) |
| Serwery MCP | **2** (Context7 + Playwright) |
| Pluginy | **4** |
| Spec Kit artefakty per feature | **6-8** plików |

---

# Wnioski

## Spec Driven Development — nowy standard

AI to nie autocomplete — to **partner w procesie** wytwarzania oprogramowania. Pojedynczy element (skill, MCP, subagent) daje umiarkowane korzyści. **Siła jest w kompozycji** — gdy context informuje skille, skille kierują MCP, MCP zasila subagentów, a Spec Kit orkiestruje cały flow.

## 3 filary Spec Driven Development

**1. Specyfikacja jest kodem**
Spec żyje w Git, jest źródłem prawdy, AI ją czyta i aktualizuje. Koniec z "specyfikacja w Confluence, kod w repo, prawda nigdzie".

**2. Context > Prompt**
34 skille, 10 plików kontekstu, 2 subagentów z pamięcią — to nie prompty, to **środowisko**, w którym AI pracuje jak członek zespołu.

**3. Pipeline > Narzędzie**
`specify → clarify → plan → tasks → implement → analyze` — wartość nie jest w "AI pisze kod", ale w "AI prowadzi feature od pomysłu do produkcji".

---

# Q&A

Pytania?

**Repo do eksploracji:** Ten projekt jest żywym przykładem — każdy filar można zobaczyć w akcji.
