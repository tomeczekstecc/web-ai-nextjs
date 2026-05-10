# Research: Wizard System Phase 1

**Date**: 2026-05-10
**Branch**: `006-wizard-foundation`

---

## Decision 1: Zustand slice pattern (StateCreator)

**Decision**: Use `StateCreator<StoreState, [], [], WizardSlice>` for the wizard slice function, merged into a single `create()` call in `index.ts`.

**Rationale**: Zustand's `StateCreator` type enables writing the wizard slice as a standalone function that receives `set` and `get`, keeping it testable and isolated. Merging slices with spread in `create()` is the Zustand-recommended pattern for multi-slice stores. It avoids class inheritance, extra packages, or complex composition.

**Alternatives considered**:
- `zustand/middleware` `immer` slice — adds Immer dependency for immutability; not needed since the wizard state is shallow
- Separate `create()` per slice — would give each slice its own store instance; state would not be visible in a single DevTools panel

---

## Decision 2: devtools middleware with named actions

**Decision**: Wrap the `create()` call with `devtools()` from `zustand/middleware`. Each `set()` call passes a string label as the third argument (e.g., `'wizard/setData'`).

**Rationale**: The Redux DevTools browser extension works with Zustand's `devtools` middleware out of the box — no separate extension required. Named actions appear in the DevTools action log, making debugging form state changes straightforward.

**Alternatives considered**:
- No devtools — blind to state changes during development; rejected
- Redux Toolkit with `createSlice` — adds 40 KB dependency + Redux mental model to a project already using TanStack Query; rejected

---

## Decision 3: React `use()` hook for context consumption

**Decision**: Use the React 19 `use()` hook in `useWizard.ts` instead of `useContext()`.

**Rationale**: React 19 ships `use()` as the preferred way to consume context (and promises). The project targets React 19 (confirmed in `package.json`). `use()` is compatible with Suspense, supports throwing on null context, and is the forward-looking pattern.

**Alternatives considered**:
- `useContext()` — works identically; kept for compatibility note, but `use()` is idiomatic React 19

---

## Decision 4: Separate WizardContext.ts file

**Decision**: `WizardContext.ts` is a standalone file exporting only `createContext<WizardAPI | null>(null)`. It does not import from `WizardProvider` or `useWizard`.

**Rationale**: `useWizard.ts` imports from `WizardContext.ts`. `WizardProvider.tsx` imports `useWizard.ts` (indirectly via composition in `Wizard.tsx`). A combined file would create a circular import. Separating the context creation into its own file breaks the cycle cleanly.

**Alternatives considered**:
- Single `WizardProvider.tsx` exporting both context and hook — circular import at `WizardShell` consuming `useWizard` inside the same file tree; rejected

---

## Decision 5: Polish UI — button labels

**Decision**: All user-facing button text in the Wizard shell uses Polish.

| Button | Polish label |
|---|---|
| Back | Wstecz |
| Next | Dalej |
| Save | Zapisz |
| Save and Quit | Zapisz i wyjdź |
| Cancel | Anuluj |
| Read-only indicator | Tylko do odczytu |

**Rationale**: Constitution Principle VII mandates Polish as the UI language.

---

## Decision 6: nav function exposed via WizardAPI context

**Decision**: The `nav(toPage: number)` function is part of `WizardAPI` and provided through context, so `Wizard.tsx` (the shell) calls `useWizard()` to get `nav`, `save`, and `saveAndQuit` rather than receiving them as props.

**Rationale**: Keeps the shell component free of prop drilling. `WizardShell` (rendered inside `WizardProvider`) naturally accesses everything through context.

**Alternatives considered**:
- Event-based nav (`window.dispatchEvent`) — too indirect; rejected
- Passing nav as a prop from `Wizard` to `WizardShell` — leaks internal state out of the context boundary; rejected
