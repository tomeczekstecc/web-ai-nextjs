# API Mutation Pattern

How write operations are layered in this repo: **pure transport in `commands.ts` + UX orchestration in a React hook**. Reads follow the mirror pattern with `queries.ts` and `useQuery` consumers.

This complements `ddd-patterns.md` (which covers *where* files live) by describing *why* the layers split and *how* they compose.

---

## Core principle

> **If it imports React or `@tanstack/react-query`, it does not belong in `commands.ts`.**

Commands are framework-agnostic verbs. Hooks wire those verbs into the UI lifecycle (optimistic update, rollback, toast, invalidation).

---

## The two layers

```
UI (button onClick)
   │
   ▼
Hook layer  ── use<Verb><Entity>            ← src/hooks/<domain>/ or src/components/<domain>/hooks/
   │   • optimistic cache update
   │   • rollback on error (snapshot in onMutate, restore in onError)
   │   • toast feedback
   │   • cache invalidation in onSettled
   │   calls ↓
   ▼
Command layer ── <verb><Entity>             ← src/lib/api/domains/<domain>/commands.ts
   │   • pure async function
   │   • one HTTP call
   │   • throws on failure, resolves on success
   │   uses ↓
   ▼
Transport ── browserFetch                   ← src/lib/api/core/browser-http
```

### Responsibilities

| Layer | Knows about | Does NOT know about |
|---|---|---|
| Command | HTTP, DTOs, endpoint shape | React, cache, toasts, UI copy |
| Hook | TanStack Query cache, toasts, the specific UI flow | HTTP details, endpoint URL, DTO mapping |

The hook depends on the command's **promise contract** only: *resolves on success, throws on failure*. That single contract is the seam.

---

## Command layer (`commands.ts`)

```ts
// src/lib/api/domains/dashboard/commands.ts
import { browserFetch } from "@/lib/api/core/browser-http";

export async function deleteDashboardReviewItem(id: number): Promise<void> {
  const result = await browserFetch<void>(`/dashboard/review-items/${id}`, {
    method: "DELETE",
  });
  if (!result.ok) throw new Error(result.error.message);
}
```

Rules:

- Pure async function. No hooks, no React, no toasts, no cache.
- Always **throw** on `!result.ok` — TanStack Query treats thrown errors as mutation failures.
- Return typed data from the response, or `void` when there is nothing meaningful to return.
- Naming: `create*`, `update*`, `delete*`, `submit*`, `archive*`, etc. (see `ddd-patterns.md`).
- One command = one endpoint call. Compose at the hook level, not here.

---

## Hook layer (`use<Verb><Entity>.ts`)

Standard shape for an optimistic mutation:

```ts
// src/hooks/dashboard/use-delete-dashboard-item.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { toast } from "@/components/toast"
import { deleteDashboardReviewItem } from "@/lib/api/domains/dashboard/commands"
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys"
import type {
  DashboardReviewItem,
  DashboardReviewItemsResponse,
} from "@/lib/api/domains/dashboard/contract"

export function useDeleteDashboardItem(item: DashboardReviewItem) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteDashboardReviewItem(item.id),

    // 1. Optimistic update — patch cache before the request fires
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.reviewItems() })
      const previous = queryClient.getQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
      )
      queryClient.setQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
        (old) =>
          old ? { ...old, items: old.items.filter((i) => i.id !== item.id) } : old,
      )
      return { previous } // becomes ctx in onError / onSettled
    },

    // 2. Rollback on failure
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(dashboardKeys.reviewItems(), ctx.previous)
      }
      toast.error("Nie udało się usunąć pozycji. Spróbuj ponownie.")
    },

    // 3. UX feedback on success
    onSuccess: () => {
      toast.success(`"${item.header}" został usunięty.`)
    },

    // 4. Reconcile with server truth — always
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
    },
  })
}
```

### The four callbacks, always in this order

1. **`onMutate`** — cancel in-flight queries, snapshot the cache, apply the optimistic patch, return the snapshot as context.
2. **`onError(_err, _vars, ctx)`** — restore from `ctx.previous`, show error toast.
3. **`onSuccess`** — show success toast. The cache is already correct from `onMutate`; usually nothing else to patch.
4. **`onSettled`** — `invalidateQueries` on every affected key. Safety net against drift between optimistic state and server truth.

### When to skip optimistic updates

- The user must see authoritative data immediately (payments, balances, anything where lying briefly is unacceptable).
- The mutation's effect on the cache is non-trivial to compute (server-side ordering, derived counts, joins).

In those cases keep only `mutationFn`, `onSuccess` (toast + invalidate), and `onError` (toast). Still no transport logic in the hook.

---

## File placement

```
src/lib/api/domains/<domain>/
  contract.ts        # types/DTOs
  queries.ts         # read transport — pure async fns
  commands.ts        # write transport — pure async fns
  query-keys.ts      # cache key factory (used by both reads and mutation invalidations)
  query-options.ts   # reusable queryOptions for reads (optional)

src/hooks/<domain>/
  use-<verb>-<entity>.ts   # mutation hooks (orchestration)
```

If a hook is only used by one feature component tree and will never be shared, it may also live at `src/components/<domain>/hooks/`. Default to `src/hooks/<domain>/` when in doubt.

---

## Naming

| Artifact | Pattern | Example |
|---|---|---|
| Command function | `<verb><Entity>` | `deleteDashboardReviewItem`, `createTask` |
| Mutation hook | `use<Verb><Entity>` | `useDeleteDashboardItem`, `useCreateTask` |
| Query function | `fetch<Entity>` / `list<Entity>` | `fetchTaskList` |
| Query key | `<domain>Keys.<resource>()` | `dashboardKeys.reviewItems()` |

Mutation hook names should reflect the **user action**, not the transport (`useDeleteDashboardItem`, not `useDeleteDashboardReviewItemMutation`).

---

## Why this split pays off

| Concern | Lives in | Reusable from |
|---|---|---|
| HTTP call | `commands.ts` | hooks, server actions, scripts, tests, MSW handlers |
| Cache + UX orchestration | `use-*.ts` hook | React components only |
| Cache keys | `query-keys.ts` | both reads (`useQuery`) and writes (`invalidateQueries`) |
| Types | `contract.ts` | everywhere |

- **Testability** — commands are plain async functions; mock `browserFetch` and assert URL/method/body. No React render needed.
- **Swappability** — replace the command (different endpoint, mock) and the hook keeps working. Replace the hook (drop optimistic update, different copy) and the command keeps working.
- **Bundle hygiene** — server code or scripts can import commands without pulling React/Query into their graph.
- **CQRS clarity** — reads in `queries.ts`, writes in `commands.ts`; UI concerns nowhere near transport.

---

## Common pitfalls

- **Putting `useMutation` in `commands.ts`.** Breaks the layering and forces React into every importer.
- **Forgetting `cancelQueries` in `onMutate`.** A racing refetch can overwrite your optimistic patch.
- **Skipping `onSettled` invalidation.** Optimistic state drifts from server truth (counts, ordering, server-derived fields).
- **Optimistic updater assumes a cache shape that may change** (e.g. `{ items: [] }` vs `{ data, meta }`). Type the updater carefully and update it when `contract.ts` changes.
- **Per-row hook bound to a single item** (`useDeleteDashboardItem(item)`). Fine for a row component; if many rows share one hook instance, prefer `useDeleteDashboardItem()` returning a mutation whose `mutate(item)` takes the item.

---

## Checklist for a new mutation

- [ ] Add the pure async function to `src/lib/api/domains/<domain>/commands.ts`. Throws on `!result.ok`.
- [ ] Add/extend types in `contract.ts`.
- [ ] Add the affected key(s) to `query-keys.ts` if missing.
- [ ] Create `use<Verb><Entity>` under `src/hooks/<domain>/`.
- [ ] Decide: optimistic update or not. If yes, implement all four callbacks.
- [ ] Invalidate every list/detail key the mutation affects in `onSettled`.
- [ ] Toast on both success and error. Use Polish copy consistent with the rest of the app.
- [ ] Consumer component imports only the hook, never the command directly.
