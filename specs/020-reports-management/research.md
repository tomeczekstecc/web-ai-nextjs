# Research: Reports Management Module

**Feature**: 020-reports-management
**Date**: 2026-05-22
**Status**: Complete — all NEEDS CLARIFICATION resolved via grill session + codebase exploration

---

## 1. Monaco Editor Integration (next-themes + Next.js 16)

**Decision**: Use `@monaco-editor/react` with `dynamic()` + `ssr: false`; read theme from `next-themes` `useTheme()` hook.

**Rationale**:
- `@monaco-editor/react` handles Monaco worker setup automatically — no custom `webpack` config needed.
- SSR guard via `dynamic()` is required because Monaco references `window` at import time.
- Existing precedent in this codebase: `DashboardActivityChart` uses the same `dynamic` + `ssr: false` pattern.
- Theme mapping: `resolvedTheme === 'dark'` → `'vs-dark'`; else → `'light'`.

**Alternatives considered**:
- Manual CDN-hosted Monaco: rejected — adds runtime network dependency, harder to version-lock.
- Custom webpack worker plugin: rejected — unnecessary with `@monaco-editor/react` defaults.

---

## 2. Wizard Data Wiring for Reports

**Decision**: Mirror `tasks-wizard` pattern exactly. Use `mappingUrl`, `dataUrl`, `saveUrl` props on `<Wizard>`. Add Next.js route handlers under `src/app/api/reports/wizard/`.

**Rationale**:
- `WizardProvider` uses raw `fetch()` for data/mapping/save — not TanStack Query. Route handlers proxy to backend.
- Existing `tasks-wizard` uses the same pattern without issues.
- `saveOnPageChange: false` — single explicit "Zapisz" commit matches spec intent.

**Alternatives considered**:
- TanStack Query in each step: rejected — wizard store is Zustand-backed; mixing TQ as data source adds complexity.
- Direct backend call (skip Next.js API route): possible but inconsistent with existing pattern.

---

## 3. Generation Polling

**Decision**: Custom `useReportGeneration` hook using `setInterval` / `clearInterval` internally, not TanStack Query `refetchInterval`.

**Rationale**:
- Polling is tied to a one-off job (fire-and-forget), not a cached resource. `refetchInterval` is for resources that remain valid across sessions.
- `setInterval` with a ref-based attempt counter is the simplest correct approach.
- Constants: `REPORT_POLL_INTERVAL_MS = 3000`, `REPORT_POLL_MAX_ATTEMPTS = 20` in `src/lib/api/domains/reports/polling.ts`.
- State stored in Zustand `reports.slice.ts` as `Record<number, GenerationState>`.

**Alternatives considered**:
- TanStack Query `refetchInterval`: rejected — creates stale cache entries and couples polling lifetime to query invalidation logic.
- Long polling / WebSocket: out of scope; backend exposes REST polling endpoints.

---

## 4. Zustand Store Slice Addition

**Decision**: New `src/lib/store/reports.slice.ts`; add `ReportsSlice` to `StoreState`; compose in `index.ts`.

**Rationale**:
- Existing store uses slices (`wizard.slice.ts`). Adding a `reports.slice.ts` follows the established pattern exactly.
- Generation state must survive table re-renders caused by search/pagination.
- "Disable all buttons when any pending" derived inline: `Object.values(states).some(s => s === 'pending')`.

**Slice shape**:
```ts
type GenerationState = 'idle' | 'pending' | 'done' | 'failed'
type ReportsSlice = {
  generationStates: Record<number, GenerationState>
  setGenerationState: (reportId: number, state: GenerationState) => void
  clearGenerationState: (reportId: number) => void
}
```

---

## 5. Parameter Table in Step 2 (Zapytanie)

**Decision**: Custom `ParameterTable` component; state via `useWizard().setValue('parameters', [...])`. No TanStack Form in wizard steps.

**Rationale**:
- All existing wizard pages (`StartPage`, `AssignmentPage`, etc.) use `*Wiz` inputs writing to Zustand via `useWizard()`. `TableRepeater` is TanStack Form-based and would require a two-store sync bridge.
- Custom table is trivially simple: a `<table>` with an input per cell, driven by `form.parameters as QueryParameter[]`.
- View mode: pass `disabled` prop derived from wizard `mode === 'view'`.

---

## 6. Generation Drawer — FormRepeater Integration

**Decision**: Generation drawer creates its own isolated `useForm()` instance (TanStack Form). `FormRepeater` renders the runtime parameter inputs. Add/remove disabled (`min` = `max` = `parameters.length`).

**Rationale**:
- The generation drawer is outside the wizard and has no Zustand store dependency.
- `FormRepeater` is a TanStack Form render-prop component — it requires a `form` object.
- Pre-populating the form with `parameters.map(p => ({ name: p.name, value: p.defaultValue ?? '' }))` satisfies the spec's "pre-filled default values" requirement.
- After confirm, extract `form.state.values.runtimeParameters` and pass to `/generate`.

---

## 7. DualListTransfer Component

**Decision**: New reusable primitive at `src/components/ui/dual-list-transfer.tsx`.

**API**:
```tsx
type DualListItem = { id: number; label: string }
<DualListTransfer
  available={DualListItem[]}
  selected={DualListItem[]}
  onChange={(selected: DualListItem[]) => void}
  disabled?: boolean
/>
```

**Internal state**: independent left-selection and right-selection sets (`Set<number>`), plus two search strings.

**Rationale**:
- No existing component in codebase. Scoped to `src/components/ui/` for future reuse.
- Four transfer buttons: `>>` (all right), `>` (selected right), `<` (selected left), `<<` (all left).

---

## 8. TextareaWiz maxLength Extension

**Decision**: Add optional `maxLength?: number` prop to `TextareaWiz`. When set, render a `<p>` below showing `maxLength - value.length` remaining characters.

**Implementation**:
```tsx
{maxLength && (
  <p className="text-xs text-muted-foreground text-right">
    {maxLength - (f.value as string ?? '').length} / {maxLength}
  </p>
)}
```

Passes `maxLength` to `<Textarea>` as well to enforce at HTML level.

---

## 9. Breadcrumb Registry

**Decision**: Four entries added to `src/lib/breadcrumbs/registry.ts` mirroring the `wizard-demo` entries.

No research needed — pattern is identical to existing entries.

---

## 10. Sidebar Navigation

**Decision**: No changes needed. `menuConfigFixture` already contains:
```ts
{ key: "reports", label: "Raporty", icon: "bar-chart-3", to: "/reports" }
```
