# UI Design Patterns

## Visual Hierarchy Principles

**Rule:** Every screen should have one primary action, 2-3 secondary actions, and unlimited tertiary actions.

### ✅ Good: Clear Hierarchy

```tsx
<div className="flex items-center gap-4">
  <Button size="lg" variant="default">
    Create Project
  </Button>
  <Button size="default" variant="outline">
    Import
  </Button>
  <Button size="sm" variant="ghost">
    View Archive
  </Button>
</div>
```

### ❌ Bad: Everything Screams

```tsx
<div className="flex items-center gap-4">
  <Button size="lg" variant="default">Create</Button>
  <Button size="lg" variant="default">Import</Button>
  <Button size="lg" variant="default">Archive</Button>
  <Button size="lg" variant="default">Settings</Button>
</div>
```

---

## Heading Hierarchy

**Rule:** Every domain under `src/app/(app)/` follows a strict heading hierarchy. The brand name rendered in `AppSidebar` / `AppTopNav` occupies the implicit H1 level — no explicit `<h1>` appears in page content. The domain `layout.tsx` renders the `<h2>` as the first visible heading in the content area.

| Level | Element | Style | Rendered by |
|-------|---------|-------|-------------|
| H1 (implicit) | brand name in sidebar / top nav | `text-lg font-bold` | `AppSidebar` header / `AppTopNav` |
| H2 | `<h2>` | `text-2xl font-bold tracking-tight` | Domain `layout.tsx` — one per domain |
| H3 | `<h3>` | `text-xl font-semibold tracking-tight` | Table / section headings within a page |
| H4 | `<h4>` | `text-lg font-medium` | Subsection or card group titles |

### ❌ Bad: explicit h1 in content, skipped levels

```tsx
{/* Wrong — no h1 inside (app) content */}
<h1>Przegląd</h1>

{/* Wrong — skipped h2 */}
<h2>Sekcja</h2>
<h4>Szczegóły</h4>
```

---

## Spacing System

Use Tailwind's spacing scale consistently:

| Spacing | Size | Use For |
|---------|------|---------|
| `space-y-2` | 8px | Tight related content (label + input) |
| `space-y-4` | 16px | Form fields, list items |
| `space-y-6` | 24px | Sections within a card |
| `space-y-8` | 32px | Major page sections |
| `space-y-12` | 48px | Hero to content, major breaks |

### Example: Form Layout

```tsx
<form className="space-y-6">
  {/* Field group - space-y-2 */}
  <div className="space-y-2">
    <label>Email</label>
    <input type="email" />
    <p className="text-sm text-muted-foreground">We'll never share your email.</p>
  </div>
  
  {/* Next field group - separated by space-y-6 from parent */}
  <div className="space-y-2">
    <label>Password</label>
    <input type="password" />
  </div>
  
  {/* Button - separated by space-y-6 */}
  <Button type="submit">Sign Up</Button>
</form>
```

### Example: Page Layout

```tsx
<div className="space-y-12">
  {/* Hero section */}
  <section className="space-y-6">
    <h1 className="text-4xl font-bold">Welcome</h1>
    <p className="text-xl text-muted-foreground">Get started today</p>
    <Button size="lg">Get Started</Button>
  </section>
  
  {/* Features section - major break (space-y-12) */}
  <section className="space-y-8">
    <h2 className="text-2xl font-semibold">Features</h2>
    <div className="grid gap-6">
      <FeatureCard />
      <FeatureCard />
      <FeatureCard />
    </div>
  </section>
</div>
```

---

## Card vs. Naked Content

### Use Cards For

- Distinct, self-contained units
- Interactive surfaces (clickable items)
- Grouped related data
- Elevated content

```tsx
// ✅ Good: Cards for distinct project items
<div className="grid gap-6">
  <Card className="p-6">
    <h3 className="font-semibold">Project Alpha</h3>
    <p className="text-sm text-muted-foreground">In progress</p>
  </Card>
  <Card className="p-6">
    <h3 className="font-semibold">Project Beta</h3>
    <p className="text-sm text-muted-foreground">Completed</p>
  </Card>
</div>
```

### Don't Use Cards For

- Page-level layouts (cards within cards = noise)
- Simple lists where borders suffice
- Content that naturally flows (articles, docs)

```tsx
// ❌ Bad: Unnecessary card nesting
<Card className="p-6">
  <h1>Dashboard</h1>
  <Card><ProjectSummary /></Card>
  <Card><RecentActivity /></Card>
</Card>

// ✅ Good: Naked content at page level
<div className="space-y-6 p-6">
  <h1>Dashboard</h1>
  <Card><ProjectSummary /></Card>
  <Card><RecentActivity /></Card>
</div>
```

---

## Empty States

**Always design for zero data.**

### ✅ Good: Helpful Empty State

```tsx
{items.length > 0 ? (
  <ItemList items={items} />
) : (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold">No items yet</h3>
    <p className="text-sm text-muted-foreground mb-4">
      Get started by creating your first item.
    </p>
    <Button onClick={handleCreate}>
      <Plus className="mr-2 h-4 w-4" />
      Create Item
    </Button>
  </div>
)}
```

### ❌ Bad: Generic or Missing

```tsx
// Missing empty state
{items.map(item => <ItemCard key={item.id} item={item} />)}

// Generic message
{items.length === 0 && <p>No items</p>}
```

---

## Loading States

### Skeleton Over Spinners

```tsx
// ✅ Good: Skeleton matches final layout
{isLoading ? (
  <div className="space-y-4">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-12 w-3/4" />
  </div>
) : (
  <ActualContent />
)}

// ❌ Bad: Generic spinner
{isLoading ? (
  <div className="flex justify-center p-12">
    <Loader2 className="h-8 w-8 animate-spin" />
  </div>
) : (
  <ActualContent />
)}
```

### Skeleton Granularity: View-Specific vs Reusable Component

**Rule:** The skeleton should approximate the layout of what it replaces — not be pixel-perfect, but close enough that the page doesn't jump on load. Build skeletons at two levels:

| Level | When to use | Example |
|---|---|---|
| **Component skeleton** | Reusable component used in multiple places | `DataTableSkeleton`, `CardListSkeleton` |
| **View skeleton** | Page-specific loading state, composes component skeletons + view-specific pieces | Heading + `DataTableSkeleton` |

**Component-level skeleton** — build once, reuse across all views that use that component:

```tsx
// src/components/data-table/skeleton.tsx
// One skeleton for every DataTable usage — not duplicated per feature.
export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-24" />
      </div>
      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        <Skeleton className="h-10 w-full rounded-none" />
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**View-level skeleton** — composes reusable skeletons + view-specific chrome (page title, section headings):

```tsx
// ✅ Good: view-specific heading + reusable table skeleton
if (isLoading) {
  return (
    <div className="flex flex-col gap-4 px-4 lg:px-6">
      <Skeleton className="h-7 w-48" /> {/* page heading */}
      <DataTableSkeleton rows={5} />
    </div>
  )
}

// ❌ Bad: generic text — no layout match, causes jarring jump
if (isLoading) {
  return <div className="py-8 text-muted-foreground">Ładowanie...</div>
}

// ❌ Bad: duplicating table skeleton per feature instead of reusing DataTableSkeleton
if (isLoading) {
  return (
    <div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  )
}
```

### Skeleton Component

```tsx
// src/components/ui/skeleton.tsx
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}
```

---

## Error States

**Be specific and actionable.**

### ✅ Good: Clear Error + Action

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Failed to load projects</AlertTitle>
  <AlertDescription>
    We couldn't connect to the server. Check your internet connection and try again.
  </AlertDescription>
  <Button variant="outline" size="sm" onClick={retry} className="mt-2">
    Try Again
  </Button>
</Alert>
```

### ❌ Bad: Generic Error

```tsx
<p className="text-red-500">Error occurred</p>

// Or worse
<p className="text-red-500">{error.message}</p>
// Might show technical jargon like "ERR_CONNECTION_REFUSED"
```

### Error Boundary

```tsx
// src/components/error-boundary.tsx
"use client";

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            An unexpected error occurred. Please refresh the page.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Form Validation States

### Field States

```tsx
<div>
  <label htmlFor="email" className="text-sm font-medium">
    Email
  </label>
  <input
    id="email"
    type="email"
    className={cn(
      "input",
      error && "border-destructive focus-visible:ring-destructive"
    )}
    aria-invalid={!!error}
  />
  {error && (
    <p className="text-sm text-destructive mt-1">
      {error}
    </p>
  )}
  {!error && hint && (
    <p className="text-sm text-muted-foreground mt-1">
      {hint}
    </p>
  )}
</div>
```

### Success States

```tsx
{isSuccess && (
  <Alert variant="default" className="border-green-500 bg-green-50 dark:bg-green-950">
    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>
      Your changes have been saved.
    </AlertDescription>
  </Alert>
)}
```

---

## Typography Scale

Use consistent type sizes:

| Element | Tailwind Class | Use For |
|---------|---------------|---------|
| Hero | `text-4xl` or `text-5xl` | Landing page heroes |
| Page Title | `text-2xl` or `text-3xl` | H1 on pages |
| Section Title | `text-xl` | H2 sections |
| Subsection | `text-lg` | H3 subsections |
| Body | `text-base` | Default body text |
| Small | `text-sm` | Secondary info, captions |
| Tiny | `text-xs` | Timestamps, labels |

### Example

```tsx
<div className="space-y-6">
  <h1 className="text-3xl font-bold tracking-tight">
    Dashboard
  </h1>
  
  <section className="space-y-4">
    <h2 className="text-xl font-semibold">
      Recent Activity
    </h2>
    <div className="space-y-2">
      <p className="text-base">
        Your latest updates appear here.
      </p>
      <p className="text-sm text-muted-foreground">
        Last updated 5 minutes ago
      </p>
    </div>
  </section>
</div>
```

---

## Color Usage

### Semantic Colors

```tsx
// Success
<Badge variant="default" className="bg-green-500">Active</Badge>

// Warning
<Badge variant="default" className="bg-yellow-500">Pending</Badge>

// Error
<Badge variant="destructive">Failed</Badge>

// Info
<Badge variant="outline">Draft</Badge>
```

### Text Colors

```tsx
// Primary text
<p className="text-foreground">Main content</p>

// Secondary text
<p className="text-muted-foreground">Supporting text</p>

// Accent
<a href="#" className="text-primary hover:underline">Link</a>

// Semantic
<p className="text-destructive">Error message</p>
```

---

## Buttons

### Variant = Context, Not Style

**Rule:** Use semantic variants only when the variant carries meaning the user needs — not to add color or visual interest.

The available semantic variant is `destructive`. Use it **only** when the action is irreversible or causes data loss. For everything else, use hierarchy (size + `default` / `outline` / `ghost`) to signal prominence.

```tsx
// ✅ Correct — variant signals irreversible consequence
<Button variant="destructive">Usuń projekt</Button>

// ❌ Wrong — destructive used for styling, not meaning
<Button variant="destructive">Anuluj</Button>

// ✅ Correct — cancel uses outline, not destructive
<Button variant="outline">Anuluj</Button>
```

**Adding new semantic variants** (e.g. `success`, `warning`) is only justified when:
- The color carries information the user cannot get from label or icon alone
- The variant is defined via CSS custom properties in the theme (not hardcoded Tailwind colors)
- The preset (`base-nova`) does not already provide it

---

### Size and Prominence

```tsx
// Hero CTA
<Button size="lg" className="text-lg px-8">
  Get Started
</Button>

// Primary action
<Button size="default">
  Save Changes
</Button>

// Secondary action
<Button size="default" variant="outline">
  Cancel
</Button>

// Tertiary/subtle action
<Button size="sm" variant="ghost">
  View Details
</Button>

// Icon only
<Button size="icon" variant="ghost">
  <Settings className="h-4 w-4" />
</Button>
```

### Icon-Only Buttons with Tooltip

**Rule:** When a button has only an icon (no visible label), wrap it in a `Tooltip`
so the label is discoverable on hover and via assistive technology. The button
still needs `aria-label` for screen readers — the tooltip provides the visual
label for sighted users.

Use this pattern for compact toolbar actions where labels would crowd the UI
(table toolbars, sidebar actions, dense forms). Prefer labelled buttons for
primary or destructive actions where the consequence must be obvious without
hover.

```tsx
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { resolveIcon } from "@/lib/icons"

const FileSpreadsheetIcon = resolveIcon("FileSpreadsheet")

<Tooltip>
  <TooltipTrigger
    render={
      <Button
        variant="outline"
        size="icon-sm"
        onClick={onExport}
        disabled={isExporting}
        aria-label="Eksportuj"
      />
    }
  >
    <FileSpreadsheetIcon />
  </TooltipTrigger>
  <TooltipContent>Eksportuj</TooltipContent>
</Tooltip>
```

Button size pairings for icon-only buttons:

| Use alongside | Icon-only size |
|---|---|
| `size="xs"` (`h-6`) | `size="icon-xs"` |
| `size="sm"` (`h-7`) | `size="icon-sm"` |
| `size="default"` (`h-8`) | `size="icon"` |
| `size="lg"` (`h-9`) | `size="icon-lg"` |

### Loading State

```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save Changes"
  )}
</Button>
```

---

## Responsive Design

### Mobile-First Approach

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
  <h1 className="text-2xl font-semibold">Dashboard</h1>
  <div className="flex gap-2">
    <Button>Action 1</Button>
    <Button variant="outline">Action 2</Button>
  </div>
</div>

// Single column on mobile, grid on desktop
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

### Hide on Small Screens

```tsx
// Show only on desktop
<div className="hidden md:block">
  <DetailedSidebar />
</div>

// Show only on mobile
<div className="md:hidden">
  <MobileMenu />
</div>
```

---

## Avoid Generic Layouts

### ❌ Bad: Copy-Paste Generic

```tsx
// Every page looks the same
<div className="container max-w-7xl mx-auto p-6">
  <h1>Page Title</h1>
  <div className="grid grid-cols-3 gap-6">
    <Card>...</Card>
    <Card>...</Card>
    <Card>...</Card>
  </div>
</div>
```

### ✅ Good: Intentional Layout

```tsx
// Dashboard: Wide layout with sidebar
<div className="flex">
  <Sidebar />
  <main className="flex-1 p-6">
    <DashboardContent />
  </main>
</div>

// Article: Narrow, readable width
<article className="mx-auto max-w-2xl px-6 py-12">
  <h1 className="text-3xl font-bold mb-6">Article Title</h1>
  <div className="prose prose-gray dark:prose-invert">
    {content}
  </div>
</article>

// Data table: Full width
<div className="p-6">
  <h1 className="text-2xl font-semibold mb-6">Users</h1>
  <DataTable />
</div>
```

---

## Checklist

Before marking UI complete:

### Visual Hierarchy
- [ ] Clear primary action
- [ ] Secondary actions less prominent
- [ ] Tertiary actions subtle
- [ ] No competing focal points

### Spacing
- [ ] Consistent spacing scale used
- [ ] Related items grouped
- [ ] Sections clearly separated
- [ ] Not too cramped or too spacious

### States
- [ ] Empty state designed
- [ ] Loading state (skeleton preferred)
- [ ] Error state with action
- [ ] Success feedback

### Responsive
- [ ] Works on mobile (320px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1280px+ width)
- [ ] No horizontal scroll

### Typography
- [ ] Consistent type scale
- [ ] Readable line length (<75ch for prose)
- [ ] Sufficient line height (1.5 for body)
- [ ] Clear hierarchy

### Color
- [ ] Not relying on color alone
- [ ] Sufficient contrast (4.5:1 minimum)
- [ ] Dark mode works
- [ ] Semantic colors used correctly

---

## Component & Styling Rules

### shadcn/ui Components Only

**Rule:** Use only shadcn/ui components sourced from `src/components/ui/`. Do not introduce third-party UI libraries, hand-rolled component alternatives, or one-off styled wrappers that duplicate what shadcn already provides.

```tsx
// ✅ Correct — use the shadcn component from src/components/ui/
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ❌ Wrong — custom wrapper that re-implements a shadcn primitive
export function MyButton({ children }) {
  return <button className="rounded bg-blue-600 px-4 py-2 text-white">{children}</button>
}

// ❌ Wrong — raw HTML element where a shadcn component exists
<input type="text" className="border rounded px-3 py-2" />
<label htmlFor="x">Name</label>
<select>...</select>
<textarea className="border rounded" />

// ✅ Correct — shadcn equivalents
<Input type="text" />
<Label htmlFor="x">Name</Label>
<Select>...</Select>
<Textarea />
```

**This applies to raw HTML elements too.** Do not use bare `<button>`, `<input>`, `<label>`, `<select>`, `<textarea>`, `<a>` (when a `Link` or `Button` variant applies), `<table>`, `<dialog>`, etc. when a shadcn/ui equivalent exists in `src/components/ui/`. Raw semantic HTML is acceptable only for structural/layout elements (`<div>`, `<section>`, `<article>`, `<main>`, `<header>`, `<footer>`, `<ul>`, `<li>`, `<p>`, `<span>`, `<h1>`–`<h6>`) that shadcn does not provide a wrapper for.

### No Custom CSS (except globals.css)

**Rule:** Custom CSS must not be added outside `src/app/globals.css`. All visual styling goes through Tailwind utility classes. CSS-in-JS, `.module.css`, `.module.scss`, `styled-components`, and arbitrary `style={{}}` attribute blocks are prohibited unless registered as an approved deviation below.

```tsx
// ✅ Correct — Tailwind utilities only
<div className="flex items-center gap-4 rounded-lg border p-4">

// ❌ Wrong — inline style block
<div style={{ display: "flex", alignItems: "center", gap: "16px" }}>

// ❌ Wrong — CSS module import
import styles from "./MyComponent.module.css"
```

CSS custom properties passed via `style={{}}` solely to feed a Tailwind `var()` or animation value are allowed **only** when registered below.

---

### Approved Deviations from the No-Custom-CSS Rule

Any departure from the rules above must be listed here. Do not remove entries — mark them resolved if fixed.

| File | Deviation | Reason | Status |
|------|-----------|--------|--------|
| `src/app/page.tsx` | `style={{ "--blob-duration": "...", "--blob-delay": "..." }}` on blob animation divs | CSS custom properties required to drive per-element animation timing; cannot be expressed as static Tailwind classes | ✅ Approved |
| `src/components/data-table/draggable-row.tsx` | `style={{ transform: CSS.Transform.toString(transform), transition }}` | dnd-kit's `useSortable` produces dynamic transform values at runtime that cannot be expressed as Tailwind classes | ✅ Approved |
| `src/components/ui/chart.tsx` | `style={{}}` inside the shadcn chart component | Upstream shadcn/ui registry file — not hand-rolled; deviations inside `src/components/ui/` from the registry are acceptable | ✅ Approved |
| `src/components/ui/toggle-group.tsx` | `style={{ "--gap": spacing }}` | Upstream shadcn/ui registry file — CSS custom property used internally by the component's Tailwind `gap-[--gap]` pattern | ✅ Approved |

> **To add a new deviation:** open a PR that adds a row to this table with file, deviation description, and justification. Do not merge UI changes that introduce unapproved custom styles.

---

## Icon System

### Central Icon Registry

**Rule:** All icon usage must go through the central icon registry at `src/lib/icons.ts`. Do not import icons directly from `lucide-react` in components — always use `resolveIcon()`.

This ensures:
- Consistent icon usage across the app
- Single source of truth for available icons
- Easy refactoring if icon library changes
- Fallback handling for missing icons

```tsx
// ✅ Correct — always use the registry
import { resolveIcon } from "@/lib/icons";

// Resolve once at module scope (avoids re-resolving on every render)
const ArrowRight = resolveIcon("ArrowRight");

function NavButton() {
  return (
    <Button>
      <ArrowRight />
      Continue
    </Button>
  );
}

function MenuItem({ iconName }: { iconName: string }) {
  const Icon = resolveIcon(iconName);  // "arrow-right" → ArrowRight (with fallback)
  return <Icon className="h-4 w-4" />;
}

// ❌ Wrong — direct import from lucide-react
import { ArrowRight, Settings } from "lucide-react";

// ❌ Wrong — dynamic import without registry
import * as Icons from "lucide-react";
const Icon = Icons[iconName];
```

### Usage

```tsx
import { resolveIcon } from "@/lib/icons";

// From data (kebab-case)
const Icon = resolveIcon("layout-dashboard");  // → LayoutDashboard

// Hardcoded (PascalCase with autocomplete)
const Icon = resolveIcon("LayoutDashboard");   // → LayoutDashboard

// Unknown icon falls back to Circle
const Icon = resolveIcon("unknown");           // → Circle
```

### Registry API

| Function | Purpose |
|----------|--------|
| `resolveIcon(name)` | Resolve icon name to component. Accepts kebab-case, snake_case, or PascalCase. Returns `Circle` fallback if not found. Has TypeScript autocomplete on registered names. |
| `getIconNames()` | List all registered icon names (useful for icon pickers). |
| `isIconName(name)` | Type guard for checking if a string is a valid icon name. |
| `FallbackIcon` | The fallback component (`Circle`) used when resolution fails. |

### Adding Icons to the Registry

When a feature needs dynamic resolution of a new icon:

1. Import the icon from `lucide-react` in `src/lib/icons.ts`
2. Add it to the `iconRegistry` object under the appropriate category
3. The icon is now available via `resolveIcon("icon-name")`

```ts
// src/lib/icons.ts
import { NewIcon } from "lucide-react";

const iconRegistry = {
  // ... existing icons
  NewIcon,
};
```

### Icon Sizing Convention

| Context | Size | Class |
|---------|------|-------|
| Inline with text | 16px | `h-4 w-4` |
| Button icons | 16px | `h-4 w-4` |
| Nav items | 16–20px | `h-4 w-4` or `h-5 w-5` |
| Empty states | 48px | `h-12 w-12` |
| Hero/feature | 64px+ | `h-16 w-16` or larger |

### Icon Accessibility

```tsx
// Decorative icon (label provides meaning)
<Button>
  <ArrowRight className="h-4 w-4" aria-hidden="true" />
  Continue
</Button>

// Icon-only button (needs accessible label)
<Button variant="ghost" size="icon" aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>

// Status icon (convey meaning via sr-only text)
<span className="flex items-center gap-2">
  <CircleCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
  <span>Completed</span>
</span>
```

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/)

---

## Domain-Scoped Page Layout

**Rule:** Domain pages under `src/app/(app)/` do **not** render their own breadcrumbs or
`<h2>` heading. The app shell renders both **once**, deriving them from the current pathname
via a config-driven mapper. Pages contain content only.

### Architecture

```
AppShell  (src/components/app-shell.tsx)
  ├── SiteHeader / AppTopNav         ← navigation chrome
  ├── BreadcrumbBar | BreadcrumbTrail ← from src/components/breadcrumb-bar.tsx
  ├── PageTitle                       ← <h2> derived from last crumb
  └── {children}                      ← page content (no chrome here)
```

Breadcrumbs are resolved by `resolveBreadcrumbs(pathname, menu)` from
`src/lib/breadcrumbs/resolve.ts`, which combines two sources in order:

1. **`breadcrumbRegistry`** — `src/lib/breadcrumbs/registry.ts`. An array of
   `{ match, map }` entries. `match` is a route pattern (`:name` for dynamic
   segments, e.g. `/wizard-demo/:id/view`). `map({ pathname, segments, params })`
   returns the full `BreadcrumbEntry[]` trail. Longest matching pattern wins.
2. **`MenuConfig` fallback** — `src/lib/breadcrumbs/from-menu.ts`. Walks the
   loaded menu config and picks the longest `to` that prefixes the pathname.
   Anything already present in `MenuConfig` (mock or API) becomes breadcrumbs
   automatically — no per-route code.

Nav-mode switching, `<h2>` rendering, and breadcrumb markup are handled by
`AppShell` + `BreadcrumbTrail` / `BreadcrumbBar` / `PageTitle`. Consumers never
import `SiteHeader`, `getNavLayout`, or breadcrumb primitives directly.

### `BreadcrumbEntry` shape

```ts
// src/lib/breadcrumbs/types.ts
export type BreadcrumbEntry = { label: string; href?: string }
```

The **last** entry has no `href` → rendered as `<BreadcrumbPage>` (sets
`aria-current="page"`) and reused as the `<h2>` text by `PageTitle`.

### Standard case — route covered by `MenuConfig`

Nothing to write. Add the route to the menu (or rely on the existing menu
entry) and the breadcrumb appears automatically.

```
src/app/(app)/
  <domain>/
    layout.tsx?   ← optional, only for metadata or shared content padding
    page.tsx      ← content only — no headings, no breadcrumbs
```

### Override / dynamic case — registry entry

Use the registry when:

- the route isn't in `MenuConfig` (e.g. a feature playground like `/wizard-demo`),
- the trail copy must differ from menu labels (e.g. add a `Start` root crumb),
- the trail depends on dynamic segments (e.g. `Edycja zadania #${id}`).

```ts
// src/lib/breadcrumbs/registry.ts
export const breadcrumbRegistry: RegistryEntry[] = [
  {
    match: "/wizard-demo/:id/view",
    map: ({ params }) => [
      { label: "Start",   href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: `Podgląd zadania #${params.id}` },
    ],
  },
  // …
]
```

The page itself stays clean:

```tsx
// src/app/(app)/wizard-demo/[id]/view/page.tsx  (server component)
import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

export default async function ViewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <TasksWizard id={Number(id)} mode="view" />
}
```

A route-level `layout.tsx` is only needed for metadata or shared content padding,
not for breadcrumbs:

```tsx
// src/app/(app)/wizard-demo/[id]/layout.tsx — padding only
export default function WizardDemoIdLayout({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pb-8 lg:px-6">{children}</div>
}
```

### Breadcrumb rules

- Pages **never** call `<DomainLayout>`, `<SiteHeader>`, `<Breadcrumb*>`, or `getNavLayout`.
- The **last item** in a trail has no `href` → becomes `<BreadcrumbPage>` + `<h2>` text.
- Every **preceding item** has an `href` → `<BreadcrumbLink>`.
- Standard depth is 3: `Start → Domain → Current Page`. A 4th level is fine for dynamic
  sub-pages: `Start → Domain → Item → Action`.
- Trails are config: edit `breadcrumbRegistry` (or `MenuConfig`) — never inline in a page.
- When no source matches the pathname, the bar and `<h2>` simply do not render.

### Sidebar collapse trigger placement

`SidebarTrigger` lives in `AppSidebar`’s `SidebarHeader` — always visible, independent of
which domain is active. `AppShell`, `SiteHeader`, and domain files never render it.

### ✅ Correct

```tsx
// page.tsx — content only
export default function RaportyPage() {
  return <RaportyTable />
}
```

```ts
// registry entry for a route not covered by MenuConfig
{
  match: "/raporty/:id",
  map: ({ params }) => [
    { label: "Start",   href: "/dashboard" },
    { label: "Raporty", href: "/raporty" },
    { label: `Raport #${params.id}` },
  ],
}
```

### ❌ Wrong

```tsx
{/* Re-introducing a per-page chrome wrapper */}
import { DomainLayout } from "@/components/domain-layout"   // ← deleted

{/* Calling getNavLayout in a page or layout */}
const navLayout = getNavLayout()

{/* Importing SiteHeader directly */}
import { SiteHeader } from "@/components/site-header"

{/* Writing h2 / h1 manually for the page title */}
<h2 className="text-2xl font-bold tracking-tight">Raporty</h2>
<h1>Raporty</h1>

{/* Inlining breadcrumbs in a page or layout */}
export default function RaportyPage() {
  return <div><Breadcrumb>...</Breadcrumb><RaportyTable /></div>
}
```

### Checklist — before marking a domain complete

- [ ] Page renders content only — no `<DomainLayout>`, `<SiteHeader>`, `<Breadcrumb*>`, or `<h2>`/`<h1>` page title
- [ ] Route is either present in `MenuConfig` or has a `breadcrumbRegistry` entry
- [ ] Last entry of the resolved trail has no `href`
- [ ] Root anchor is `{ label: "Start", href: "/dashboard" }` when an explicit registry trail is needed
- [ ] Dynamic labels use `params` from the registry mapper, not the page
- [ ] No `getNavLayout` or `useNavLayout` reads in domain files
- [ ] Optional `layout.tsx` only carries metadata or shared padding — never chrome
---

## Quick Reference

**Visual hierarchy:** 1 primary, 2-3 secondary, unlimited tertiary

**Spacing:** 2 (tight) → 4 (related) → 6 (sections) → 8 (major) → 12 (breaks)

**Empty states:** Icon + heading + description + action

**Loading:** Skeleton > spinner

**Errors:** Specific message + retry action

**Cards:** For distinct items, not page wrappers

**Responsive:** Mobile-first, test at 320px

**When in doubt:** Look at existing pages and match the pattern.
