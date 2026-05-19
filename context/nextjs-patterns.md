# Next.js 16 App Router Patterns

## Server Components First Rule

**Default:** All components are Server Components unless they need client-side features.

### Decision Checklist

When creating a component, ask:

1. **Does it use React hooks?** → Client Component
2. **Does it have event handlers?** → Client Component
3. **Does it access browser APIs?** → Client Component
4. **Does it fetch data?** → Server Component
5. **Is it static content?** → Server Component
6. **Can you split it?** → Extract interactive parts to Client Component

**Default answer:** Server Component unless 1-3 apply.

---

## When to Use Server Components (Default)

✅ **Use Server Components for:**
- Data fetching from APIs or databases
- Reading environment variables or secrets
- Rendering static content
- SEO-critical content
- Large dependencies (date libraries, markdown parsers, etc.)
- Content that doesn't need interactivity

**Example:**
```tsx
// src/app/posts/page.tsx - Server Component (default)
export default async function PostsPage() {
  const posts = await fetch('/api/posts').then(r => r.json());
  return <PostList posts={posts} />;
}
```

---

## When to Use Client Components (Explicit "use client")

✅ **Use Client Components ONLY for:**
- React hooks (useState, useEffect, useContext, etc.)
- Browser APIs (localStorage, window, document, etc.)
- Event handlers (onClick, onChange, onSubmit, etc.)
- Custom hooks that use the above
- Third-party libraries that require client-side code

---

## Minimize Client Boundaries

**Rule:** Push "use client" as deep as possible in the component tree.

### ✅ Good: Small client boundary

```tsx
// src/app/posts/page.tsx - Server Component (default)
export default async function PostsPage() {
  const posts = await fetchPosts();
  return (
    <div>
      <Header />           {/* Server Component */}
      <StaticContent />    {/* Server Component */}
      <PostsDialog posts={posts} /> {/* Client Component boundary */}
    </div>
  );
}

// src/components/posts/posts-dialog.tsx - Client Component
"use client";

export function PostsDialog({ posts }) {
  const [open, setOpen] = useState(false); // ✅ Client-side only where needed
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        {posts.map(post => <PostCard key={post.id} post={post} />)}
      </DialogContent>
    </Dialog>
  );
}
```

### ❌ Bad: Large client boundary

```tsx
"use client"; // ❌ Everything below is now client-side

export default function PostsPage() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Header />           {/* Now client (loses SSR benefits) */}
      <StaticContent />    {/* Now client (loses SSR benefits) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>...</DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## Anti-Pattern: Unnecessary Client Component

### ❌ Bad: Entire page is client

```tsx
"use client";

export default function DashboardPage() {
  const [filter, setFilter] = useState("");
  
  return (
    <div>
      <DashboardHeader />      {/* Static, but now client-side */}
      <DashboardStats />       {/* Static, but now client-side */}
      <FilterInput 
        value={filter} 
        onChange={setFilter} 
      />
    </div>
  );
}
```

### ✅ Good: Extract only interactive parts

```tsx
// src/app/dashboard/page.tsx - Server Component
export default async function DashboardPage() {
  const stats = await fetchStats();
  
  return (
    <div>
      <DashboardHeader />          {/* Server Component */}
      <DashboardStats stats={stats} /> {/* Server Component */}
      <DashboardFilters />         {/* Client Component */}
    </div>
  );
}

// src/components/dashboard/dashboard-filters.tsx - Client Component
"use client";

export function DashboardFilters() {
  const [filter, setFilter] = useState("");
  
  return (
    <FilterInput 
      value={filter} 
      onChange={setFilter} 
    />
  );
}
```

---

## Data Passing Rules

### Server → Client: Pass serializable props

✅ **Good:**
```tsx
// Server Component
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />; // ✅ Serializable JSON data
}
```

❌ **Cannot pass:**
- Functions
- Class instances
- Date objects (convert to string/number)
- undefined (use null instead)

### Bad Example: Passing functions

```tsx
// ❌ Bad: Server function passed to client
export default async function Page() {
  const handler = async () => {
    "use server";
    // server logic
  };
  
  return <ClientComponent onClick={handler} />; // ❌ Error!
}
```

### Good Example: Define handlers in client

```tsx
// ✅ Good: Handler defined in client component
"use client";

export function ClientComponent() {
  const handler = async () => {
    await fetch("/api/action", { method: "POST" });
  };
  
  return <button onClick={handler}>Click</button>;
}
```

---

## Benefits Comparison

| Feature | Server Component | Client Component |
|---------|------------------|------------------|
| Default | ✅ Yes | ❌ No (needs "use client") |
| Data fetching | ✅ async/await | ⚠️ useEffect + state |
| Hooks | ❌ No | ✅ Yes |
| Event handlers | ❌ No | ✅ Yes |
| Browser APIs | ❌ No | ✅ Yes |
| Large deps | ✅ Yes (zero client JS) | ❌ No (increases bundle) |
| SEO | ✅ Fully rendered | ⚠️ Client-rendered |
| Secrets | ✅ Can access safely | ❌ Never expose |

### Bundle Size Impact

```tsx
// Server Component: luxon library (237KB) stays on server
import { DateTime } from "luxon";

export default async function PostDate({ date }) {
  const formatted = DateTime.fromISO(date).toFormat("LLL dd, yyyy");
  return <time dateTime={date}>{formatted}</time>;
}

// Client Component: luxon library (237KB) sent to browser
"use client";
import { DateTime } from "luxon";

export function PostDate({ date }) {
  const formatted = DateTime.fromISO(date).toFormat("LLL dd, yyyy");
  return <time dateTime={date}>{formatted}</time>;
}
```

**Impact:** 237KB added to client bundle for every page using PostDate.

---

## Common Patterns

### Pattern 1: Interactive Wrapper

Server Component wraps Client Component with data:

```tsx
// src/app/products/page.tsx - Server Component
export default async function ProductsPage() {
  const products = await fetchProducts();
  
  return (
    <div>
      <h1>Products</h1>
      <ProductGrid products={products} />
    </div>
  );
}

// src/components/products/product-grid.tsx - Client Component
"use client";

export function ProductGrid({ products }) {
  const [view, setView] = useState("grid");
  
  return (
    <div>
      <ViewToggle value={view} onChange={setView} />
      {view === "grid" ? (
        <GridView products={products} />
      ) : (
        <ListView products={products} />
      )}
    </div>
  );
}
```

### Pattern 2: Composition

Server Component renders multiple client boundaries:

```tsx
// src/app/dashboard/page.tsx - Server Component
export default async function DashboardPage() {
  const [stats, activity, projects] = await Promise.all([
    fetchStats(),
    fetchActivity(),
    fetchProjects(),
  ]);
  
  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />          {/* Server */}
      <ActivityFeed activity={activity} />  {/* Client */}
      <ProjectsTable projects={projects} /> {/* Client */}
    </div>
  );
}
```

### Pattern 3: Slots

Server Component provides slots for client children:

```tsx
// src/components/layout/sidebar-layout.tsx - Server Component
export function SidebarLayout({ 
  sidebar, 
  children 
}: { 
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

// Usage in page
export default async function Page() {
  const data = await fetchData();
  
  return (
    <SidebarLayout
      sidebar={<InteractiveSidebar />}  {/* Client */}
    >
      <StaticContent data={data} />      {/* Server */}
    </SidebarLayout>
  );
}
```

---

## Loading and Error States

### Server Component: Suspense

```tsx
import { Suspense } from "react";

export default function Page() {
  return (
    <div>
      <Header />
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
    </div>
  );
}

async function Posts() {
  const posts = await fetchPosts();
  return <PostList posts={posts} />;
}
```

### Client Component: State

```tsx
"use client";

export function Posts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  
  if (isLoading) return <PostsSkeleton />;
  if (error) return <ErrorMessage />;
  return <PostList posts={data} />;
}
```

---

## Verification Checklist

Before marking a component complete:

- [ ] Is this component using "use client"?
- [ ] If yes, does it actually need client features (hooks/events/browser APIs)?
- [ ] Can I extract the interactive part to a smaller client component?
- [ ] Am I passing only serializable data across the boundary?
- [ ] Is the bundle size acceptable for this client component?
- [ ] Could this be a Server Component that fetches data instead?

---

## Quick Reference

**When in doubt:**
1. Start with Server Component (default)
2. Add "use client" only when you need:
   - `useState`, `useEffect`, `useContext`, etc.
   - `onClick`, `onChange`, `onSubmit`, etc.
   - `window`, `document`, `localStorage`, etc.
3. Extract the smallest interactive part possible
4. Test the page - if it renders, you did it right

**Rule of thumb:** If you're not sure whether you need "use client", you probably don't.
