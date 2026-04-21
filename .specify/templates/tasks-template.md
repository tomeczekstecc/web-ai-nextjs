---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Do not add automated tests. Constitution forbids test tasks unless the constitution changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and validation of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Current project: `app/`, `components/`, `lib/`, `public/`
- Adjust paths based on the real structure captured in plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal project preparation required for the feature

- [ ] T001 Create or align file structure per implementation plan
- [ ] T002 Configure only the dependencies and shared utilities required by this feature
- [ ] T003 [P] Prepare theme, copy, or UI foundation needed by multiple stories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core groundwork that MUST be complete before user stories

- [ ] T004 Establish the minimal data shape or integration boundary required by all stories
- [ ] T005 [P] Prepare shared UI primitives needed across stories
- [ ] T006 [P] Prepare routing, layout, or state boundaries required by the feature

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - [Title] (Priority: P1)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own]

### Implementation for User Story 1

- [ ] T007 [P] [US1] Create or update UI building block in [file]
- [ ] T008 [P] [US1] Create or update supporting data mapping in [file]
- [ ] T009 [US1] Implement primary story flow in [file]
- [ ] T010 [US1] Add validation, loading, or error states in [file]
- [ ] T011 [US1] Verify light mode, dark mode, mobile, and desktop behavior

**Checkpoint**: User Story 1 should be fully functional and independently verifiable

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own]

### Implementation for User Story 2

- [ ] T012 [P] [US2] Create or update supporting UI in [file]
- [ ] T013 [US2] Implement story behavior in [file]
- [ ] T014 [US2] Integrate with shared primitives without expanding scope unnecessarily
- [ ] T015 [US2] Verify light mode, dark mode, mobile, and desktop behavior

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Validation**: [How to verify this story works on its own]

### Implementation for User Story 3

- [ ] T016 [P] [US3] Create or update story-specific UI in [file]
- [ ] T017 [US3] Implement story behavior in [file]
- [ ] T018 [US3] Verify light mode, dark mode, mobile, and desktop behavior

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Refine Polish copy and consistency across screens
- [ ] TXXX Remove duplication and simplify abstractions
- [ ] TXXX Review unnecessary comments and keep only TODO/security exceptions
- [ ] TXXX Validate quickstart or manual verification flow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- Each user story SHOULD remain independently implementable and independently verifiable
- Shared code MAY be reused only when it keeps the solution simpler and more maintainable

### Within Each User Story

- Prefer the simplest viable implementation
- Keep edits surgical and scoped to the story goal
- Finish the story's core path before optional refinements
- Validate the story manually against acceptance scenarios and success criteria

### Parallel Opportunities

- Tasks marked [P] can run in parallel when they touch different files
- Separate user stories can proceed in parallel after foundational work completes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and verifiable
- Avoid vague tasks, same-file conflicts, unnecessary abstractions, and test tasks
