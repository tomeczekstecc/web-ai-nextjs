# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

**Language/Version**: [e.g., TypeScript 5.x or NEEDS CLARIFICATION]
**Primary Dependencies**: [e.g., Next.js App Router, React, shadcn/ui or NEEDS CLARIFICATION]
**Storage**: [e.g., browser state, remote Laravel API, N/A or NEEDS CLARIFICATION]
**Testing**: N/A - constitution forbids automated tests
**Target Platform**: [e.g., modern desktop and mobile browsers]
**Project Type**: web frontend
**Performance Goals**: [e.g., smooth UI, readable first paint, responsive interactions]
**Constraints**: [e.g., Polish UI, theme parity, Laravel-ready integration, no automated tests]
**Scale/Scope**: [domain-specific, e.g., landing page, dashboard, 10 screens]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Is the problem understood before coding begins?
- Is the approach the simplest viable solution?
- Are the planned edits surgical and limited in scope?
- Are success criteria explicit and verifiable?
- Does the feature preserve TypeScript, App Router, shadcn/ui, Polish UI, responsiveness, and theme parity?
- Does the plan avoid automated tests and unnecessary comments?
- Does the plan preserve decoupling from Laravel implementation details?

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
app/
components/
lib/
public/
```

**Structure Decision**: Capture only the real frontend paths touched by the feature and keep edits minimal.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., extra abstraction] | [current need] | [why simpler option was insufficient] |
