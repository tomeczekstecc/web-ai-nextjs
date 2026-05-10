# Feature Specification: MSW-Backed Data Layer

**Feature Branch**: `005-msw-tanstack-data-layer`
**Created**: 2026-05-09
**Status**: Draft
**Input**: User description: "użyjmy MSW (Mock Service Worker), zastąpmy wszystkie dotychczose mock data, użyjmy TanstackQuery zamiast pobierania danych bezpośrednio z json"

## User Scenarios *(mandatory)*

Każda historia użytkownika musi być niezależnie wartościowa i możliwa do
zaprezentowania jako przyrost funkcji.

### User Story 1 - Dashboard Data Loaded Through Shared Data Layer (Priority: P1)

As a developer working on the dashboard, I want all dashboard data to arrive through the same data-fetching mechanism used by other parts of the app so that I work with one consistent pattern rather than a mix of direct file imports and query-based fetches.

**Why this priority**: The dashboard page currently imports a static JSON file and passes raw data directly to components. This bypasses the shared data layer and makes it harder to later replace mock data with real API calls. Unifying the mechanism is the highest-value first step.

**Independent Validation**: Load the authenticated dashboard page and confirm the document review table and area chart render with data. No static JSON file import should remain in dashboard page or component files.

**Acceptance Scenarios**:

1. **Given** the developer opens the dashboard page, **When** the page loads, **Then** the document review table displays the same data it showed before without any visible change for the end user.
2. **Given** the developer opens the dashboard page, **When** the chart area component renders, **Then** the chart displays time-series data without any hardcoded inline array in the component file.
3. **Given** no backend is running, **When** the dashboard loads in development mode, **Then** all dashboard data is served by the intercepted request layer rather than an imported file.

---

### User Story 2 - All Mock Data Centralised in One Interception Layer (Priority: P2)

As a developer, I want all mock data for the application to be defined in one place so that I can update, extend, or replace it without hunting through multiple component and page files.

**Why this priority**: Mock data is currently scattered across a JSON file, inline component arrays, and domain-level mock functions. Centralising it means any future switch to real API responses requires changing one layer rather than many files.

**Independent Validation**: Identify the central mock data definition location. Confirm that no dashboard component or page file contains hardcoded data arrays or imports a static data file. Confirm the landing-page and auth-user domains no longer carry inline fallback payloads when the interception layer is active.

**Acceptance Scenarios**:

1. **Given** a developer needs to change the document review table data, **When** they open the project, **Then** there is one clearly identifiable place to update that data.
2. **Given** the application is running in development mode, **When** any data request is made by dashboard, applications, or landing-page areas, **Then** the response comes from the centralised mock interception layer rather than an inline array or imported file.
3. **Given** the application is built for production, **When** it runs, **Then** the mock interception layer is not active and all requests go to the real backend.

---

### User Story 3 - Landing Page Content Served From Data Layer (Priority: P3)

As a developer, I want the landing-page domain to retrieve its content through the same data layer as other domains so that the hardcoded fallback payload in the query function is removed.

**Why this priority**: The landing-page domain currently has a hardcoded Polish-language content payload embedded in the query function itself. This is the least critical piece but still contributes to the scattered mock-data problem.

**Independent Validation**: Open the public landing page and confirm it renders the same content as before. Confirm the landing-page query function no longer contains an inline hardcoded payload.

**Acceptance Scenarios**:

1. **Given** the application runs in development mode, **When** the landing page loads, **Then** the content is delivered by the mock interception layer rather than a hardcoded fallback inside the query function.
2. **Given** a developer changes the landing page copy in the mock data layer, **When** the page refreshes, **Then** the updated content is displayed.

### Edge Cases

- If the mock interception layer is disabled or fails to start, the application should surface a clear developer-facing error rather than silently rendering empty components.
- If a new domain is added in future, the interception layer's structure should make it obvious where to add the corresponding mock handler.
- On production builds the interception layer must never activate, even if included as a dev dependency.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a single centralised location where all mock request handlers are defined for development use.
- **FR-002**: The dashboard document review table MUST receive its data through the shared data-fetching mechanism, not via a static file import.
- **FR-003**: The dashboard chart area MUST receive its time-series data through the shared data-fetching mechanism, not via an inline hardcoded array.
- **FR-004**: The landing-page domain query MUST NOT contain an inline hardcoded content payload; content MUST be served by the centralised mock layer during development.
- **FR-005**: The auth-user domain mock functions MAY remain as server-side mocks since they do not represent client data fetching; they are out of scope for the mock interception layer.
- **FR-006**: All data currently displayed in the dashboard and landing page MUST continue to display correctly after the migration.
- **FR-007**: The mock interception layer MUST be active only in the development environment and MUST NOT activate in production builds.
- **FR-008**: Each data domain that previously used scattered mock data MUST have a corresponding handler in the centralised mock layer.
- **FR-009**: The data-fetching approach for dashboard data MUST be consistent with the existing pattern used by the applications domain.
- **FR-010**: Removing the mock interception layer (or disabling it) MUST NOT cause a runtime crash; it MUST result in a clear, diagnosable failure mode for developers.

### Key Entities

- **Mock Handler**: A definition that intercepts a specific data request in development and returns a pre-defined response. Lives in the centralised mock layer.
- **Data Request**: A client-initiated call to retrieve a named data resource (document review items, chart data, landing-page content, applications list, etc.).
- **Data Domain**: A bounded area of the application (dashboard, applications, landing-page) that owns a set of related data requests.
- **Development Data Layer**: The active interception mechanism during development that routes all data requests to mock handlers instead of the real backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 static JSON file imports remain in page or component files for data that was previously mocked.
- **SC-002**: 0 inline hardcoded data arrays remain in component files for data that was previously mocked.
- **SC-003**: 100% of dashboard and landing-page data requests in development are served by the centralised mock layer.
- **SC-004**: All previously visible data (document review rows, chart series, landing-page content) continues to render correctly after migration — confirmed by manual review.
- **SC-005**: The production build contains no active mock interception and passes `pnpm build` without errors.
- **SC-006**: A developer can locate all mock data definitions in under 30 seconds by navigating to the centralised mock layer directory.

## Assumptions

- The applications domain already uses the shared data-fetching mechanism and is treated as the reference pattern; it does not require rework, only a corresponding mock handler if one is missing.
- The auth-user server-side mock (`AUTH_LARAVEL_MOCK_ENABLED`) is a separate server-boundary concern and is explicitly out of scope for this feature.
- The `featureIcons` array on the public homepage is UI configuration data, not fetched content, and is out of scope.
- The project runs a local development server (`pnpm dev`) where the mock interception layer will be active.
- No real backend API is available during development, so the mock interception layer must fully substitute it for all in-scope data domains.
- Polish-language content in mock payloads should be preserved as-is from the existing hardcoded sources.
