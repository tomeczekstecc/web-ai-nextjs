# Performance Best Practices

## Client Boundary Minimization

**Problem:** Every "use client" boundary ships JavaScript to the browser.

**Solution:** Keep client components small and focused.

### ❌ Bad: Large Client Boundary

```tsx
"use client";
import { Chart } from "heavy-charting-lib"; // 300KB
import { DataGrid } from "another-heavy-lib"; // 200KB

export function Dashboard() {
  const [selected, setSelected] = useState(null);
  return (
    <div>
      <StaticHeader />         {/* 50KB, now client-side */}
      <StaticContent />        {/* 30KB, now client-side */}
      <Chart data={data} />    {/* 300KB */}
      <DataGrid 
        data={data} 
        onSelect={setSelected} 
      />                       {/* 200KB */}
    </div>
  );
}
// Total client bundle: ~580KB
```

### ✅ Good: Minimal Client Boundaries

```tsx
// src/app/dashboard/page.tsx - Server Component
export default async function DashboardPage() {
  const data = await fetchData();
  
  return (
    <div>
      <StaticHeader />          {/* Server Component - 0KB client */}
      <StaticContent />         {/* Server Component - 0KB client */}
      <ChartDisplay data={data} />  {/* Server Component - 0KB client */}
      <DataGridClient data={data} /> {/* Client Component - 200KB */}
    </div>
  );
}

// src/components/dashboard/chart-display.tsx - Server Component
import { Chart } from "heavy-charting-lib";

export function ChartDisplay({ data }) {
  return <Chart data={data} />; // Rendered on server
}

// src/components/dashboard/data-grid-client.tsx - Client Component
"use client";
import { DataGrid } from "another-heavy-lib";

export function DataGridClient({ data }) {
  const [selected, setSelected] = useState(null);
  return <DataGrid data={data} onSelect={setSelected} />;
}
// Total client bundle: ~200KB (71% reduction)
```

---

## Bundle Size Monitoring

### Analyze Your Bundle

```bash
# Build and check output
pnpm build

# Check .next/analyze/ for bundle analysis (if configured)
# Look for large chunks in build output
```

### Common Bloat Sources

#### ❌ Heavy Date Libraries

```tsx
// ❌ Bad: Moment.js (71KB gzipped)
import moment from "moment";
const formatted = moment(date).format("MMMM DD, YYYY");

// ✅ Good: date-fns (2KB per function)
import { format } from "date-fns";
const formatted = format(date, "MMMM dd, yyyy");

// ✅ Best: Native Intl API (0KB)
const formatted = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(date);
```

#### ❌ Entire Lodash

```tsx
// ❌ Bad: Entire library (~70KB)
import _ from "lodash";
const unique = _.uniq(array);

// ✅ Good: Specific function (~1KB)
import uniq from "lodash/uniq";
const unique = uniq(array);

// ✅ Best: Native methods (0KB)
const unique = [...new Set(array)];
```

#### ❌ Icon Libraries

```tsx
// ❌ Bad: All FontAwesome icons (~1MB)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCoffee } from "@fortawesome/free-solid-svg-icons";

// ✅ Good: Lucide React (tree-shakeable)
import { Coffee } from "lucide-react";
```

---

## Dynamic Imports

### Heavy Features

```tsx
// ❌ Bad: Editor loads on every page render
import RichTextEditor from "heavy-editor-lib";

export function DocumentPage() {
  return <RichTextEditor />;
}

// ✅ Good: Editor loads only when needed
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("heavy-editor-lib"),
  {
    loading: () => <EditorSkeleton />,
    ssr: false, // Don't render on server (browser-only library)
  }
);

export function DocumentPage() {
  return <RichTextEditor />;
}
```

### Conditional Features

```tsx
"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Chart library only loads when user clicks "Show Chart"
const ChartViewer = dynamic(() => import("./chart-viewer"));

export function DataView({ data }) {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <Button onClick={() => setShowChart(true)}>
        Show Chart
      </Button>
      
      {showChart && <ChartViewer data={data} />}
    </div>
  );
}
```

---

## Image Optimization

### Use Next.js Image Component

```tsx
import Image from "next/image";

// ✅ Good: Optimized automatically
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority // For above-the-fold images
  placeholder="blur" // For imported images
  blurDataURL="data:image/..." // Optional custom blur
/>

// ❌ Bad: Raw img tag
<img src="/hero.jpg" alt="Hero image" />
```

### Priority Images

```tsx
// First screen (above fold) - loads immediately
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>

// Below fold - lazy loads
<Image
  src="/content.jpg"
  alt="Content"
  width={800}
  height={400}
  loading="lazy" // Default behavior
/>
```

### Responsive Images

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

---

## Data Fetching Optimization

### TanStack Query Configuration

```tsx
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes for stable data
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Disable for static data
      retry: 1, // Only retry once
    },
  },
});
```

### Appropriate Stale Times

```tsx
// User profile - rarely changes
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
  staleTime: 10 * 60 * 1000, // 10 minutes
});

// Live data - changes frequently
const { data } = useQuery({
  queryKey: ["notifications"],
  queryFn: fetchNotifications,
  staleTime: 30 * 1000, // 30 seconds
  refetchInterval: 60 * 1000, // Refetch every minute
});

// Static data - never changes
const { data } = useQuery({
  queryKey: ["app-config"],
  queryFn: fetchAppConfig,
  staleTime: Infinity, // Never stale
});
```

### Select for Data Transformation

```tsx
// ❌ Bad: Transform in render (runs every render)
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
});
const activeUsers = data?.filter(u => u.active);

// ✅ Good: Transform in select (runs only when data changes)
const { data: activeUsers } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  select: (data) => data.filter(u => u.active),
});
```

### Prefetch Critical Data

```tsx
// src/app/dashboard/page.tsx - Server Component
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function DashboardPage() {
  const queryClient = new QueryClient();
  
  // Prefetch on server
  await queryClient.prefetchQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardContent />
    </HydrationBoundary>
  );
}
```

---

## Memoization

### React.memo for Expensive Components

```tsx
// ❌ Bad: Re-renders on every parent render
export function ExpensiveList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <ExpensiveListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

// ✅ Good: Only re-renders when items change
export const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <ExpensiveListItem key={item.id} item={item} />
      ))}
    </ul>
  );
});
```

### useMemo for Expensive Calculations

```tsx
"use client";
import { useMemo } from "react";

export function DataAnalysis({ data }) {
  // ❌ Bad: Recalculates on every render
  const stats = calculateComplexStats(data);
  
  // ✅ Good: Only recalculates when data changes
  const stats = useMemo(
    () => calculateComplexStats(data),
    [data]
  );
  
  return <StatsDisplay stats={stats} />;
}
```

### useCallback for Event Handlers

```tsx
"use client";
import { useCallback } from "react";

export function SearchInput({ onSearch }) {
  // ❌ Bad: Creates new function on every render
  const handleChange = (e) => {
    onSearch(e.target.value);
  };
  
  // ✅ Good: Stable function reference
  const handleChange = useCallback((e) => {
    onSearch(e.target.value);
  }, [onSearch]);
  
  return <input onChange={handleChange} />;
}
```

**Warning:** Don't overuse! Only memoize when:
- Expensive calculations
- Passing to memoized child components
- Performance profiling shows benefit

---

## Virtualization

### Large Lists

```tsx
// ❌ Bad: Renders 10,000 items
export function LargeList({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// ✅ Good: Only renders visible items
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualizedList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: "500px", overflow: "auto" }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Performance Budget

### Target Metrics

**Core Web Vitals:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms
- **CLS (Cumulative Layout Shift):** < 0.1

**Additional Metrics:**
- **FCP (First Contentful Paint):** < 1.8s
- **TTI (Time to Interactive):** < 3.8s
- **Bundle size per route:** < 200KB (gzipped)

### Monitor in Production

```tsx
// src/app/layout.tsx
export const metadata = {
  // Enable Next.js Analytics
};

// Optional: Custom monitoring
useEffect(() => {
  if (typeof window !== "undefined") {
    // Track Web Vitals
    import("web-vitals").then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}, []);
```

---

## Checklist

Before marking a feature complete:

### Bundle Size
- [ ] Check build output for large chunks
- [ ] Heavy libraries dynamically imported or server-rendered
- [ ] Only necessary code in client components
- [ ] Tree-shaking working (no unused exports)

### Images
- [ ] Using Next.js Image component
- [ ] Above-fold images have `priority`
- [ ] Appropriate `sizes` attribute for responsive
- [ ] Alt text present

### Data Fetching
- [ ] Appropriate staleTime configured
- [ ] Critical data prefetched on server
- [ ] No unnecessary refetching
- [ ] Mutations invalidate correct queries

### Rendering
- [ ] Heavy calculations memoized
- [ ] Large lists virtualized
- [ ] Expensive components use React.memo
- [ ] No unnecessary re-renders

### Testing
- [ ] Run Lighthouse audit
- [ ] Check bundle size with build output
- [ ] Test on slow 3G connection
- [ ] Profile with React DevTools

---

## Tools

- **Lighthouse:** Chrome DevTools > Lighthouse tab
- **React DevTools Profiler:** Profile component renders
- **Next.js Bundle Analyzer:** Visualize bundle sizes
- **WebPageTest:** Test on real devices and networks
- **Chrome DevTools Coverage:** Find unused code

---

## Quick Reference

**Performance hierarchy:**
1. **Don't load it:** Server Components, static rendering
2. **Load it later:** Dynamic imports, lazy loading
3. **Load less:** Code splitting, tree shaking
4. **Cache it:** TanStack Query, HTTP caching
5. **Optimize it:** Memoization, virtualization

**Remember:** Premature optimization is the root of all evil. Profile first, then optimize the bottlenecks.
