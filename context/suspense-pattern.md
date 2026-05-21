# Suspense Pattern

## Overview

This project uses two complementary forms of React Suspense to stream UI progressively and decouple loading states from data-fetching logic:

1. **File-based boundaries** — Next.js App Router `loading.tsx` / `error.tsx` co-located with a route segment automatically wrap that segment in a `<Suspense>` / error boundary. Use these for full-segment fallbacks.
2. **Inline `<Suspense>`** — Explicit `<Suspense fallback={…}>` inside a Server Component layout for finer-grained streaming within a single segment (e.g. a slow widget inside an otherwise fast page).

The React 19 `use()` hook integrates with inline boundaries to pass server-resolved promises to Client Components without blocking the page shell.

---

## File-Based Boundaries

### How it works

Place `loading.tsx` and/or `error.tsx` next to `page.tsx`. Next.js wraps the segment automatically:

```text
src/app/(app)/applications/
├── page.tsx          ← async server component — fetches data
├── loading.tsx       ← Suspense fallback for the whole segment
└── error.tsx         ← error boundary (must be "use client")
```

### Skeleton conventions

| Location | Skeleton approach |
|---|---|
| Root-level (`src/app/loading.tsx`) | Full-page hand-crafted `animate-pulse` shapes that mirror the page layout |
| Feature segments (`src/app/(app)/*/loading.tsx`) | shadcn `<Skeleton>` components that mirror the feature's table / card / list shape |

**Root-level** (mirrors the landing/page shell layout — no Skeleton import):

```tsx
// src/app/loading.tsx
export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col gap-6">
        <div className="h-8 w-56 animate-pulse rounded-full bg-muted" />
        <div className="h-20 w-full max-w-3xl animate-pulse rounded-3xl bg-muted" />
      </div>
    </main>
  );
}
```

**Feature segment** (mirrors data-table shape with shadcn Skeleton):

```tsx
// src/app/(app)/applications/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Error boundary conventions

Error boundaries must be Client Components. They receive `error` (with optional `digest`) and `reset` (re-mounts the segment):

```tsx
// src/app/(app)/applications/error.tsx
"use client";

import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ApplicationsError({ error, reset }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-lg font-semibold">Błąd ładowania</h2>
      <p className="text-sm text-muted-foreground">
        {error.message || "Wystąpił nieoczekiwany błąd."}
      </p>
      <Button onClick={reset} variant="outline">Spróbuj ponownie</Button>
    </div>
  );
}
```

---

## Inline `<Suspense>` (within a page)

Use when only part of a page is slow. The page shell streams immediately; the deferred section streams in behind it.

```tsx
// src/app/(app)/dashboard/page.tsx  — Server Component
import { Suspense } from "react";
import { StatsSkeleton } from "@/components/dashboard/stats-skeleton";
import { SlowStats } from "@/components/dashboard/slow-stats";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Shell renders instantly */}
      <QuickSummary />

      {/* SlowStats suspends while fetching; skeleton shows in the meantime */}
      <Suspense fallback={<StatsSkeleton />}>
        <SlowStats />
      </Suspense>
    </div>
  );
}
```

### Nested boundaries

Use nested `<Suspense>` for independent sections that should stream at their own pace:

```tsx
<Suspense fallback={<SidebarSkeleton />}>
  <Sidebar>
    <Suspense fallback={<ActivitySkeleton />}>
      <RecentActivity />
    </Suspense>
  </Sidebar>
</Suspense>
```

---

## React 19 `use()` Hook

Pass a server-resolved Promise from a Server Component to a Client Component. The Client Component suspends until the Promise resolves — requires a `<Suspense>` boundary above it.

```tsx
// src/app/(app)/messages/page.tsx — Server Component
import { Suspense } from "react";
import { MessagesList } from "@/components/messages/messages-list";
import { fetchMessages } from "@/lib/api/domains/messages/queries";

export default function MessagesPage() {
  // Do NOT await — pass the promise directly
  const messagesPromise = fetchMessages();

  return (
    <Suspense fallback={<p>Ładowanie wiadomości…</p>}>
      <MessagesList messagesPromise={messagesPromise} />
    </Suspense>
  );
}

// src/components/messages/messages-list.tsx — Client Component
"use client";

import { use } from "react";

export function MessagesList({ messagesPromise }: { messagesPromise: Promise<Message[]> }) {
  const messages = use(messagesPromise); // suspends until resolved

  return (
    <ul>
      {messages.map((m) => (
        <li key={m.id}>{m.text}</li>
      ))}
    </ul>
  );
}
```

---

## Key Rules

- **File-based first** — always add `loading.tsx` next to a new `page.tsx` under `(app)/`. Omitting it means the user sees a blank segment while data loads.
- **Skeleton must mirror the real layout** — placeholder shapes should match the dimensions and structure of the real content to avoid layout shift.
- **Root loading uses `animate-pulse` shapes; feature loading uses `<Skeleton>`** — keep the two conventions separate; do not mix them in the same file.
- **`error.tsx` must be `"use client"`** — Next.js requires it. Never forget the directive.
- **`error.tsx` must expose a `reset` button** — always include the `reset()` call so users can retry without a full page reload.
- **Do not `await` inside the Server Component when using `use()`** — pass the raw `Promise` so the shell renders immediately and the Client Component suspends independently.
- **`use()` requires a `<Suspense>` boundary** — the hook will throw if no boundary is above it in the tree. Pair them always.
- **Inline `<Suspense>` only in Server Components** — wrapping a Client Component's own subtree in `<Suspense>` is valid but uncommon; prefer the file-based approach for simplicity unless the granularity is genuinely needed.

---

## Anti-Patterns

```tsx
// ❌ Await at page level — blocks the entire shell
export default async function DashboardPage() {
  const stats = await fetchSlowStats(); // whole page waits
  return <StatsCard stats={stats} />;
}

// ✅ Defer with Suspense — shell streams, stats fill in
export default function DashboardPage() {
  return (
    <Suspense fallback={<StatsSkeleton />}>
      <SlowStats /> {/* async Server Component — awaits internally */}
    </Suspense>
  );
}
```

```tsx
// ❌ Generic spinner that doesn't match content shape
export default function Loading() {
  return <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full" />;
}

// ✅ Skeleton that mirrors the real content layout
export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
```

```tsx
// ❌ error.tsx missing "use client" — Next.js will throw
export default function Error({ reset }) {
  return <button onClick={reset}>Retry</button>;
}

// ✅
"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <Button onClick={reset}>Spróbuj ponownie</Button>;
}
```

---

## File Map

```text
src/app/
├── loading.tsx                         ← root Suspense fallback (animate-pulse, full-page)
├── error.tsx                           ← root error boundary ("use client")
└── (app)/
    └── <feature>/
        ├── page.tsx                    ← async Server Component
        ├── loading.tsx                 ← feature Suspense fallback (<Skeleton>)
        └── error.tsx                   ← feature error boundary ("use client")

src/components/<feature>/
├── <feature>-skeleton.tsx              ← reusable skeleton for inline <Suspense> fallbacks
└── <slow-section>.tsx                  ← async Server Component wrapped by inline Suspense
```
