# CI-PRS Web

## API integration pattern

This project uses a server-first API layer in `src/lib/api` so page and component code stay small even when backend integration grows.

### Goals

- Keep transport details out of pages and components.
- Keep backend DTOs separate from frontend view models.
- Make each backend area grow inside its own domain folder.
- Allow the UI to handle backend failures consistently.

### Folder structure

```text
src/lib/api/
  core/
    config.ts
    http.ts
  contracts/
    common.ts
  domains/
    landing-page/
      contract.ts
      mapper.ts
      queries.ts
    applications/
      contract.ts
      mapper.ts
      commands.ts
```

### Responsibilities

- `src/lib/api/core/config.ts`
  Reads API configuration such as `API_URL` and builds absolute backend URLs.
- `src/lib/api/core/http.ts`
  Owns the shared `fetch` wrapper, JSON parsing, and normalized API error handling.
- `src/lib/api/contracts/common.ts`
  Defines common request, response, and error types used across domains.
- `src/lib/api/domains/<domain>/contract.ts`
  Defines the raw backend payloads and the frontend-friendly models for that domain.
- `src/lib/api/domains/<domain>/mapper.ts`
  Maps backend DTO fields like `primary_cta_label` into frontend fields like `primaryCtaLabel`.
- `src/lib/api/domains/<domain>/queries.ts`
  Contains read-side operations for that domain and decides how fallback behavior should work.
- `src/lib/api/domains/<domain>/commands.ts`
  Contains write-side operations for that domain such as create, update, submit, and delete flows.

### Request flow

1. A page imports a domain query, for example `getLandingPageContent` from `src/lib/api/domains/landing-page/queries.ts`.
2. The domain query calls the shared `apiRequest()` helper in `src/lib/api/core/http.ts`.
3. The HTTP layer builds the full backend URL from `API_URL`.
4. The backend response is parsed into a raw DTO.
5. The domain mapper converts the DTO into the model used by the UI.
6. The page renders only the mapped model and does not need to know transport details.

### CQRS rule of thumb

- `queries.ts` is the read side. Query functions should fetch data and return mapped read models without causing backend state changes.
- `commands.ts` is the write side. Command functions may create, update, submit, revoke, provision, or otherwise change backend state.
- Pages and server components should import domain queries for route data.
- Server actions, route handlers, and event-style flows should import domain commands for writes.
- Query and command functions should import the shared HTTP client directly instead of calling each other.
- Only mappers should translate backend field naming into frontend naming.
- New endpoints should be added inside a domain folder instead of wiring `fetch` directly in the page.

### Example: adding a new endpoint

If you need a new `users` integration, add:

```text
src/lib/api/domains/users/
  contract.ts
  mapper.ts
  queries.ts
  commands.ts
```

Then:

- define the backend DTOs in `contract.ts`
- define the frontend model in `contract.ts`
- map DTO -> model in `mapper.ts`
- call `apiRequest()` in `queries.ts`
- call `apiRequest()` in `commands.ts` for writes
- import the query from the page or server component

### Example: command

For write flows, add a `commands.ts` file to the domain. A typical command keeps the request DTO, response DTO, and mapped frontend model inside the same domain boundary.

This repo now includes a concrete example in `src/lib/api/domains/applications/`.

```ts
// src/lib/api/domains/applications/commands.ts
import "server-only";

import { apiRequest } from "@/lib/api/core/http";
import type { ApiResult } from "@/lib/api/contracts/common";
import { mapApplication } from "@/lib/api/domains/applications/mapper";
import type {
  Application,
  ApplicationPayload,
  CreateApplicationInput,
} from "@/lib/api/domains/applications/contract";

export async function createApplication(
  input: CreateApplicationInput,
): Promise<ApiResult<Application>> {
  const result = await apiRequest<ApplicationPayload, CreateApplicationInput>({
    path: "/api/applications",
    method: "POST",
    body: input,
  });

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    status: result.status,
    data: mapApplication(result.data),
  };
}
```

Example contract shape:

```ts
// src/lib/api/domains/applications/contract.ts
export type CreateApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export type ApplicationPayload = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: "draft" | "submitted";
};

export type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "draft" | "submitted";
};
```

Example mapper:

```ts
// src/lib/api/domains/applications/mapper.ts
import type {
  Application,
  ApplicationPayload,
} from "@/lib/api/domains/applications/contract";

export function mapApplication(payload: ApplicationPayload): Application {
  return {
    id: payload.id,
    firstName: payload.first_name,
    lastName: payload.last_name,
    email: payload.email,
    status: payload.status,
  };
}
```

CQRS rule of thumb:

- `queries.ts` is for reads.
- `commands.ts` is for writes.
- Both should call `apiRequest()`.
- Queries should not call commands, and commands should not call queries.
- Only the domain layer should know raw backend field names.
- Components should consume mapped frontend models, not DTOs.

### Transitional compatibility

Legacy flat files such as `src/lib/api/client.ts` and `src/lib/api/contracts.ts` currently re-export the new modules. That keeps the refactor incremental while new code moves to the domain-folder pattern.
