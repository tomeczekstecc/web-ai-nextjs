# Implementation Plan: Light/Dark Theme Toggle

**Branch**: `004-theme-toggle` | **Date**: 2026-05-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-theme-toggle/spec.md`

## Summary

Add a single authenticated account dropdown row that cycles the app-wide theme between `Jasny` and `Ciemny`. The row appears after `Powiadomienia`, uses the opposite-action label with Sun/Moon icons, announces the switch action clearly, and removes system-following theme behavior from the app configuration so only explicit light and dark states remain valid. The existing public homepage toggle may remain separate.

## Technical Context

**Language/Version**: TypeScript 5.8.x, React 19, Next.js 16 App Router  
**Primary Dependencies**: `next-themes`, shadcn/ui dropdown primitives, lucide-react icons, existing sidebar/user navigation components  
**Storage**: Existing `next-themes` browser preference storage; valid app states limited to light and dark, with invalid or system values falling back to light  
**Testing**: N/A - constitution forbids automated tests  
**Target Platform**: Modern desktop and mobile browsers  
**Project Type**: web frontend  
**Performance Goals**: Immediate visual theme change on menu activation; no visible menu layout shift or clipped labels on common mobile/desktop widths  
**Constraints**: Polish UI copy, light/dark theme parity, responsive authenticated sidebar/dropdown behavior, no `Systemowy` option or hidden system-following mode, no automated tests, no backend or route coupling  
**Scale/Scope**: One app theme provider configuration, one authenticated user dropdown row, optional reuse or small adjustment of the existing public homepage theme toggle

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Problem understood before coding begins?** Yes. The grilled decisions define app-wide removal of system mode, a single cycle row after `Powiadomienia`, action-only labels, and `Jasny` fallback.
- **Simplest viable solution?** Yes. Use existing `next-themes`, existing `NavUser`, existing shadcn dropdown primitives, and lucide icons without introducing a new settings system.
- **Planned edits surgical and limited in scope?** Yes. Edits are expected in `src/app/layout.tsx`, `src/components/nav-user.tsx`, and possibly `src/components/theme-toggle.tsx` only if the existing public toggle needs alignment with the two-state app policy.
- **Success criteria explicit and verifiable?** Yes. The spec defines exact placement, labels, icons, no-system behavior, fallback, persistence, and manual verification outcomes.
- **Preserves TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?** Yes. The plan uses the existing App Router provider and dropdown UI with Polish labels and both theme states.
- **Avoids automated tests and unnecessary comments?** Yes. Verification is manual plus lint/build as appropriate; no automated tests or code comments are planned.
- **Preserves decoupling from Laravel implementation details?** Yes. This is a browser UI preference and has no backend integration requirement.

**Gate Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/004-theme-toggle/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  `- theme-toggle-ui-contract.md
`- checklists/
   `- requirements.md
```

### Source Code (`src/`)

```text
src/app/
`- layout.tsx

src/components/
|- nav-user.tsx
|- theme-provider.tsx
`- theme-toggle.tsx
```

**Structure Decision**: Keep the account-menu behavior in `NavUser` because `Konto`, `Rozliczenia`, and `Powiadomienia` already live there. Keep app-wide theme configuration at the root layout/provider boundary. Do not create a new settings route, API domain, or shared abstraction for this small interaction.

## Phase 0: Research Outcomes

1. Configure `next-themes` for explicit light/dark operation by disabling system preference support and defaulting to light.
2. Keep `suppressHydrationWarning` on the root `<html>` and avoid rendering theme-dependent labels before the client knows the active theme.
3. Use a normal shadcn `DropdownMenuItem` inside the existing account dropdown group for the cycle command.
4. Use lucide `Moon` for the `Ciemny` action and `Sun`/`SunMedium` for the `Jasny` action.
5. Treat stale `system`, missing, or unsupported stored preference values as `Jasny`.
6. Keep public homepage theme access separate unless implementation reveals it violates the app-wide two-state configuration.

See [research.md](./research.md) for rationale and alternatives.

## Phase 1: Design Artifacts

- [data-model.md](./data-model.md) defines the theme preference, action row, valid states, fallback rules, and state transitions.
- [contracts/theme-toggle-ui-contract.md](./contracts/theme-toggle-ui-contract.md) defines the expected authenticated account dropdown behavior, labels, icons, accessibility text, and persistence/fallback contract.
- [quickstart.md](./quickstart.md) captures implementation steps and manual verification flows.

## Implementation Strategy

### Slice 1 - App-Wide Theme Policy

- Update the root theme provider usage so the app supports only explicit light and dark states.
- Default missing or invalid theme state to `Jasny`.
- Ensure stale system-following preferences do not remain visible or behaviorally active.

### Slice 2 - Account Dropdown Cycle Row

- Add one theme row after `Powiadomienia` in `NavUser`.
- Derive the next action from the current resolved theme.
- Render `Moon + Ciemny` when the app is light and `Sun + Jasny` when the app is dark.
- Apply the opposite theme immediately when the row is activated.

### Slice 3 - Accessibility, Public Toggle, and Verification

- Provide action-oriented accessible text: switching to dark from light and switching to light from dark.
- Keep the public homepage toggle functioning with the app-wide two-state policy.
- Verify desktop/mobile menu placement, no `Systemowy` exposure, reload persistence, stale-system fallback, Polish labels, and light/dark visual behavior.

## Post-Design Constitution Check

- The plan remains simple and surgical: existing provider plus existing dropdown.
- No backend or Laravel coupling is introduced.
- The UI remains Polish-first, responsive, and theme-aware.
- No automated tests are planned under the current constitution; verification remains manual plus `pnpm lint` and `pnpm build`.
- The design avoids a new abstraction because there is one authenticated placement and one existing public toggle.

**Post-Design Gate Status**: PASS

## Complexity Tracking

No constitution violations require justification.
