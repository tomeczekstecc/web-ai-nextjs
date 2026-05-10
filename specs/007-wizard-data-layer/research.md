# Research: Wizard Data Layer (Phase 2)

## TanStack Query v5 Patterns for Wizard Hooks

**Decision**: Use `useQuery` for mapping and data fetches; `useMutation` for save.

**Rationale**: TanStack Query v5 (installed at 5.100.9) provides automatic
caching, deduplication, and stale-while-revalidate behaviour out of the box.
Mapping is fetched once and cached by `mappingUrl` as the query key, so
re-renders don't trigger repeated network calls. Data fetch is similarly keyed
by `dataUrl`.

**Query shape (v5)**:
```ts
const { data, isLoading } = useQuery({
  queryKey: ['wizard-mapping', mappingUrl],
  queryFn: () => fetch(mappingUrl).then(r => r.json()),
})
```

**Mutation shape (v5)**:
```ts
const mutation = useMutation({
  mutationFn: (payload: Record<string, unknown>) =>
    fetch(saveUrl, { method: 'PUT', body: JSON.stringify(payload),
                     headers: { 'Content-Type': 'application/json' } }),
  onSuccess: () => toast.success('Saved'),
  onError: () => toast.error('Save failed'),
})
```

**Alternatives considered**: Custom `useEffect` + `fetch` — rejected because it
lacks caching, deduplication, and loading state management that TQ provides for
free.

---

## Sonner Toast Integration

**Decision**: Import `toast` from `sonner` directly in the `useWizardSave` hook.

**Rationale**: `sonner` is already in the project (v2.0.7). The `<Toaster>`
component is expected to be in the root layout (verify before implementation).
Calling `toast.success()` / `toast.error()` from mutation callbacks is the
canonical pattern.

**Alternatives considered**: Passing a toast callback from the consumer — rejected
as unnecessary coupling.

---

## MSW Handler Factory Pattern

**Decision**: Export four factory functions from `src/mocks/handlers/wizard.ts`,
each returning an MSW `http.get` or `http.put` handler.

**Rationale**: Each wizard feature needs its own URL-specific handlers. Factories
let consumers declare their own mock data without touching wizard internals. MSW
v2 uses `http.get(url, resolver)` syntax (not the v1 `rest.get` pattern).

```ts
export function createWizardMappingHandler(url: string, pages: PageMapping[]) {
  return http.get(url, () => HttpResponse.json(pages))
}
export function createWizardDataHandler(url: string, data: Record<string, unknown>) {
  return http.get(url, () => HttpResponse.json(data))
}
export function createWizardSaveHandler(url: string) {
  return http.put(url, () => HttpResponse.json({ ok: true }))
}
export function createWizardValidationHandler(url: string, result: SummaryResult) {
  return http.get(url, () => HttpResponse.json(result, { status: 422 }))
}
```

**Alternatives considered**: Inline handlers per feature — rejected because it
creates copy-paste duplication across every wizard consumer.

---

## WizardProvider Integration Strategy

**Decision**: Hooks live outside `WizardProvider`; the provider receives hook
results as parameters (or calls them internally at the top level).

**Rationale**: React rules of hooks require that hooks are called at the
component's top level. `WizardProvider` is a component, so it can call
`useWizardMapping`, `useWizardData`, and `useWizardSave` directly. The hook
return values are wired into the context API and the provider's internal state.

**Mapping → side nav**: Once `useWizardMapping` resolves, the `mapping` state
variable is set via `setMapping`. The `WizardAPI.mapping` is live so `Wizard.tsx`
re-renders the side nav with real labels.

**Data → Zustand**: When `useWizardData` resolves, its flat result is written
into the Zustand slice via `setWizardData`. This populates form fields on first
render.

**Auto-save on nav**: The `nav(toPage)` function in `WizardProvider` checks
`saveOnPageChange && mode === 'edit'` and awaits the save mutation before setting
the page index. On save error, navigation still proceeds (non-blocking save).

---

## `setPageByName` Fix for Empty Mapping (Phase 1 Bug)

**Finding**: Phase 1's `setPageByName` uses `mapping.findIndex(m => m.name ===
pageName)`. With an empty mapping array, this always returns `-1` and navigation
silently fails. After Phase 2, mapping comes from the server so `setPageByName`
will work correctly once the mapping query resolves. No code change needed
beyond wiring the real mapping.

---

## Resolved Clarifications

All design questions were pre-resolved by the Phase 2 design doc. No open
clarifications remain.
