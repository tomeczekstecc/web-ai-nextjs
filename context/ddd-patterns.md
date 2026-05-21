# Domain-Driven Design Patterns (Lite)

This project uses a pragmatic, lite DDD approach focused on clear domain boundaries and consistent file organization — not full tactical DDD with aggregates, repositories, or domain events.

## Core Principle

**Organize code by business domain, not by technical layer.**

Instead of:
```
src/lib/api/
src/lib/mappers/
src/lib/types/
```

We use:
```
src/lib/api/domains/applications/
src/lib/api/domains/dashboard/
src/lib/api/domains/menu/
```

---

## Domain Locations

| Location | Purpose | Example |
|----------|---------|---------|
| `src/app/<domain>/` | Feature routes | `src/app/applications/`, `src/app/auth/` |
| `src/components/<domain>/` | Feature UI components | `src/components/dashboard/`, `src/components/auth/` |
| `src/lib/api/domains/<domain>/` | API integration (contracts, mappers, queries, commands) | `src/lib/api/domains/applications/` |
| `src/lib/<domain>/` | Domain helpers shared across routes/components | `src/lib/menu/`, `src/lib/wizard/` |
| `src/hooks/<domain>/` | Domain-specific hooks | `src/hooks/wizard/`, `src/hooks/menu/` |

---

## API Domain Structure

Each domain in `src/lib/api/domains/<domain>/` follows this structure:

```
src/lib/api/domains/applications/
├── contract.ts      # Types: Payload (API), Model (frontend), Input/Params
├── mapper.ts        # Transform Payload → Model (snake_case → camelCase, strings → Date)
├── client.ts        # Browser-safe fetch functions (for TanStack Query)
├── query-keys.ts    # TanStack Query key factory
├── query-options.ts # Reusable query options with staleTime, retry
├── commands.ts      # Write operations (create, update, delete) — optional
```

### File Responsibilities

#### `contract.ts` — Domain Types

```ts
// Raw API payload (matches backend response)
export type ApplicationPayload = {
  id: string;
  label: string;
  status: ApplicationStatus;
  created_at: string;  // snake_case from API
  updated_at: string;
};

// Frontend model (clean, typed)
export type Application = {
  id: string;
  label: string;
  status: ApplicationStatus;
  createdAt: Date;     // camelCase, proper types
  updatedAt: Date;
};

// Input types for mutations
export type CreateApplicationInput = {
  label: string;
};
```

#### `mapper.ts` — Payload → Model

```ts
import type { Application, ApplicationPayload } from "./contract";

export function mapApplication(payload: ApplicationPayload): Application {
  return {
    id: payload.id,
    label: payload.label,
    status: payload.status,
    createdAt: new Date(payload.created_at),
    updatedAt: new Date(payload.updated_at),
  };
}
```

#### `client.ts` — Browser Fetch Functions

```ts
import { browserFetch } from "@/lib/api/core/browser-http";
import { mapApplication } from "./mapper";
import type { Application, ApplicationPayload } from "./contract";

export async function fetchApplication(id: string): Promise<Application> {
  const result = await browserFetch<ApplicationPayload>(`/applications/${id}`);
  if (!result.ok) throw new Error(result.error.message);
  return mapApplication(result.data);
}
```

#### `query-keys.ts` — Query Key Factory

```ts
export const applicationKeys = {
  all: ["applications"] as const,
  lists: () => [...applicationKeys.all, "list"] as const,
  list: (params: ApplicationListParams) => [...applicationKeys.lists(), params] as const,
  details: () => [...applicationKeys.all, "detail"] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
};
```

#### `query-options.ts` — Reusable Query Options

```ts
import { queryOptions } from "@tanstack/react-query";
import { fetchApplication } from "./client";
import { applicationKeys } from "./query-keys";

export const applicationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: applicationKeys.detail(id),
    queryFn: () => fetchApplication(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
```

---

## Domain Helpers (`src/lib/<domain>/`)

For domain logic that isn't API-related but is shared across routes and components:

```
src/lib/menu/
├── env.ts       # Environment-based menu config
├── filter.ts    # Permission filtering logic
├── icons.ts     # Re-exports from central icon system

src/lib/wizard/
├── types.ts     # Wizard step definitions
├── validation.ts # Step validation logic

src/lib/icons.ts  # App-global icon registry (not domain-specific)
```

---

## CQRS Lite

We follow a basic read/write separation in API domains:

| File | Operations | Side Effects |
|------|------------|--------------|
| `client.ts` / `queries.ts` | `fetch*`, `get*`, `list*` | None (read-only) |
| `commands.ts` | `create*`, `update*`, `delete*`, `submit*` | Mutates backend state |

**Rules:**
- Queries must not change backend state
- Commands must not be called from queries
- Share pure code (mappers, contracts) — not operations

---

## When to Create a New Domain

Create a new domain folder when:

1. **New bounded context** — distinct business capability (e.g., `billing`, `notifications`)
2. **Own API endpoints** — the feature has dedicated backend routes
3. **Reusable across routes** — multiple pages consume the same data

**Don't create a domain for:**
- One-off UI components (keep in `src/components/`)
- Route-specific logic (keep in the route file)
- Generic utilities (keep in `src/lib/utils.ts` or `src/lib/<utility>.ts`)

---

## Naming Conventions

| Concept | Convention | Example |
|---------|------------|---------|
| Domain folder | kebab-case | `auth-user`, `landing-page` |
| Contract types | PascalCase | `Application`, `ApplicationPayload` |
| Payload suffix | `*Payload` | `ApplicationPayload` (raw API) |
| Input suffix | `*Input` | `CreateApplicationInput` |
| Params suffix | `*Params` | `ApplicationListParams` |
| Mapper functions | `map*` | `mapApplication`, `mapApplicationList` |
| Fetch functions | `fetch*` | `fetchApplication`, `fetchApplicationList` |
| Query keys | `*Keys` | `applicationKeys` |

---

## What We Don't Use (Full DDD)

This project intentionally skips these tactical DDD patterns:

| Pattern | Why Not |
|---------|---------|
| Aggregates | Frontend doesn't own persistence boundaries |
| Repositories | `client.ts` fetch functions are simpler |
| Domain Events | No event-driven architecture needed |
| Value Objects | TypeScript types + Zod validation suffice |
| Domain Services | Plain functions in domain folders work |
| Ubiquitous Language glossary | Team is small, context is clear |

---

## Quick Reference

```
# API domain with full CRUD
src/lib/api/domains/applications/
  contract.ts       # Payload, Model, Input types
  mapper.ts         # Payload → Model
  client.ts         # fetch* functions
  query-keys.ts     # TanStack Query keys
  query-options.ts  # queryOptions()
  commands.ts       # create*, update*, delete*

# Domain helpers
src/lib/menu/
  filter.ts         # Business logic
  icons.ts          # Re-exports

# Feature routes
src/app/applications/
  page.tsx
  [id]/page.tsx

# Feature components
src/components/applications/
  application-card.tsx
  application-list.tsx
```

---

## Checklist for New Domains

- [ ] Create `src/lib/api/domains/<domain>/contract.ts` with Payload and Model types
- [ ] Create `mapper.ts` if API response needs transformation
- [ ] Create `client.ts` with fetch functions
- [ ] Create `query-keys.ts` and `query-options.ts` for TanStack Query
- [ ] Create `commands.ts` for write operations (if needed)
- [ ] Create `src/components/<domain>/` for feature UI
- [ ] Create `src/app/<domain>/` for routes
- [ ] Create `src/lib/<domain>/` only if helpers are shared across multiple consumers
