# Research: Wizard Advanced Features (Phase 5)

## Summary

Phase 5 was expected to wire `calc`, `clearFields`, `appendData`, `acceptButtons`, `customButtons`, and `cancelCallback` into the wizard engine. All six features are **already fully implemented** in the engine from prior phases. Phase 5 work reduces to: updating the demo page to demonstrate each feature at least once.

---

## Decision: Engine implementation status

**Decision:** No engine changes required. All Phase 5 APIs exist and work.

**Rationale:** A full codebase survey confirmed:

| Feature | Type | WizardProvider impl | Wizard.tsx wiring |
|---------|------|---------------------|-------------------|
| `calc` | `WizardPage.calc?: (form: T) => T` | Applied in `setValue` and `setForm` | N/A |
| `clearFields` | `WizardAPI.clearFields` | `delete updated[f]` loop | N/A |
| `appendData` | `WizardAPI.appendData` | Shallow merge via spread | N/A |
| `acceptButtons` | `WizardConfig.acceptButtons` | Passed through context | Rendered on last page (edit mode) |
| `customButtons` | `WizardConfig.customButtons` | Passed through context | Rendered on last page (all modes) |
| `cancelCallback` | `WizardConfig.cancelCallback` | Passed through context | Cancel button calls it (edit mode) |

**Alternatives considered:** None — the implementation matches the design spec exactly.

---

## Decision: calc scoping

**Decision:** `calc` runs only on `setValue` and `setForm`, not on `clearFields` or `appendData`.

**Rationale:** This is intentional. `clearFields` and `appendData` are bulk/programmatic mutations where running `calc` mid-way could produce incorrect derived state. If a caller needs `calc` to run after an `appendData`, they should call `setForm` explicitly.

**Alternatives considered:** Running `calc` after every mutation — rejected because it can cause infinite loops when `calc` writes back to the same fields being cleared or appended.

---

## Decision: Demo page update strategy

**Decision:** Update `src/app/wizard-demo/page.tsx` in-place. Add:
1. A `calc` function on `krok-2` that derives a display field (`tytul_upr` — uppercase of `tytul`) from the already-stored `tytul`.
2. A `SelectWiz` or `InputWiz` field on `krok-2` with a `hide` prop controlled by a form value, demonstrating conditional visibility.
3. `cancelCallback` on the edit-mode `Wizard` (logs or shows a toast).
4. `customButtons` on the edit-mode `Wizard` (a secondary "Zapisz jako szkic" / "Save as Draft" button).
5. Improve `acceptButtons` to be reactive to the `summary` argument (disable when there are errors).

**Rationale:** Keeping everything on the existing demo page avoids creating new routes and MSW handlers. All the MSW handlers for the demo already exist. The goal is demonstrability, not a production feature.

**Alternatives considered:** Creating a new dedicated Phase 5 demo route — rejected because the Phase 5 design doc says "Demo page updated" (not "new demo page"), and the existing demo already has the full 4-step wizard with validation.

---

## Decision: MSW handlers

**Decision:** No new MSW handlers needed. The existing `/api/wizard-demo/mapping`, `/data`, `/save`, and `/validate` handlers cover all demo needs.

**Rationale:** The Phase 5 demo only adds new fields (`tytul_upr`, a hidden toggle field) to an existing wizard that already has MSW handlers returning field mapping. The mapping handler can remain as-is; the new fields will just not appear in the server mapping (which is fine — they'll still render using hardcoded labels or via the `label` override prop).

**Alternatives considered:** Updating the MSW mapping handler to include the new fields — acceptable but unnecessary for the demo purpose.
