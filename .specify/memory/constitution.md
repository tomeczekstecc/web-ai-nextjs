<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- Added Think Before Coding
- Added Simplicity First
- Added Surgical Changes
- Added Goal-Driven Execution
- Added Frontend-First, Backend-Decoupled
- Added TypeScript, App Router, Design System
- Added Polish UI, Responsiveness, Theme Parity
- Added Clean Code, KISS, DRY
- Added No Tests, Minimal Comments
Added sections:
- Technical Constraints
- Development Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/tasks-template.md
Follow-up TODOs:
- None
-->
# CI-PRS Constitution

## Core Principles

### I. Think Before Coding
Każda implementacja MUST zaczynać się od zrozumienia problemu, założeń,
ryzyk i trade-offów przed rozpoczęciem zmian w kodzie. Specyfikacja i plan
MUST usuwać niejasności, zanim powstanie implementacja.

### II. Simplicity First
Każde rozwiązanie MUST wybierać najprostszą formę, która spełnia wymagania,
bez zbędnych abstrakcji, warstw i nadbudowy.

### III. Surgical Changes
Zmiany MUST być możliwie małe, precyzyjne i ograniczone do obszarów
bezpośrednio związanych z celem funkcji. Nie wolno modyfikować kodu poza
zakresem zadania bez wyraźnego uzasadnienia.

### IV. Goal-Driven Execution
Każda praca MUST mieć jasno określony cel, mierzalne kryteria ukończenia
oraz weryfikowalny rezultat. Implementacja bez jawnej definicji sukcesu nie
jest gotowa do rozpoczęcia.

### V. Frontend-First, Backend-Decoupled
Repozytorium MUST rozwijać warstwę frontendową w Next.js jako niezależny
interfejs gotowy do późniejszej integracji z backendem Laravel. Kod UI,
struktura danych widokowych i kontrakty integracyjne SHOULD być projektowane
tak, aby minimalizować zależność od bieżącej implementacji backendu.

### VI. TypeScript, App Router, Design System
Nowy kod frontendowy MUST być pisany w TypeScript i zgodny z architekturą
Next.js App Router. Wspólne elementy UI MUST korzystać z ustalonego systemu
komponentów opartego o shadcn/ui, współdzielonych helperów i tokenów motywu.

### VII. Polish UI, Responsiveness, Theme Parity
Każdy ekran MUST działać poprawnie na desktopie i mobile oraz zachowywać
spójność między trybem jasnym i ciemnym. Językiem interfejsu użytkownika MUST
być język polski, chyba że wymaganie funkcji stanowi inaczej.

### VIII. Clean Code, KISS, DRY
Każda zmiana MUST być zgodna z zasadami Clean Code. Kod MUST być prosty,
czytelny i możliwie oczywisty w utrzymaniu. KISS obowiązuje domyślnie, a DRY
obowiązuje w warstwie logiki, komponentów i stylów.

### IX. No Tests, Minimal Comments
W tym projekcie nie tworzymy testów automatycznych. Plany, taski i
implementacja MUST nie zakładać dodawania testów jednostkowych,
integracyjnych ani e2e. Komentarze w kodzie są zabronione, z wyjątkiem
komentarzy dotyczących wysokiego zagrożenia bezpieczeństwa lub komentarzy
TODO wskazujących świadomie odłożony brak albo ryzyko.

## Technical Constraints

Projekt frontendowy MUST używać:
- Next.js z App Router
- TypeScript
- shadcn/ui
- jasnego i ciemnego motywu
- języka polskiego w interfejsie użytkownika

Backend Laravel jest traktowany jako osobna odpowiedzialność
architektoniczna. Kontrakty i punkty integracji SHOULD być opisywane w
specyfikacjach oraz planach implementacyjnych zanim dojdzie do spięcia danych.

## Development Workflow

Każda większa funkcja MUST przejść sekwencję:
1. specify
2. plan
3. tasks
4. implementacja

W planie każdej funkcji MUST znaleźć się:
- wpływ na UI
- wpływ na tryb jasny i ciemny
- wpływ na responsywność
- wpływ na przyszłą integrację z Laravel
- ocena prostoty rozwiązania
- kontrola duplikacji i nadmiarowej złożoności
- definicja mierzalnego kryterium sukcesu

Taski SHOULD być grupowane tak, aby dostarczać niezależne przyrosty wartości
i ograniczać konflikty między plikami. Taski nie mogą generować zadań
związanych z testami, dopóki konstytucja nie zostanie formalnie zmieniona.

## Governance

Konstytucja ma pierwszeństwo nad lokalnymi nawykami implementacyjnymi. Każdy
plan i review MUST sprawdzać zgodność z tymi zasadami. Zmiany konstytucji
wymagają jawnego uzasadnienia, aktualizacji powiązanych szablonów Spec-Kit,
i podniesienia wersji zgodnie z semver.

**Version**: 1.0.0 | **Ratified**: 2026-04-21 | **Last Amended**: 2026-04-21
