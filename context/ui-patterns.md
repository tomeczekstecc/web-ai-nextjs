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

### Usage in Data Tables

```tsx
export function DataTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <Skeleton className="h-10 w-full" />
      
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
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

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Lucide Icons](https://lucide.dev/)

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
