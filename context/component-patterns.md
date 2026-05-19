# Component Refactoring Patterns

## When to Refactor

### Signs You Need Refactoring

⚠️ **Refactor when you see:**
- Component >500 lines
- 10+ `useState` or `useEffect` hooks
- Multiple distinct concerns mixed together
- Hard to test or reason about
- Long parameter lists (>5 props)
- Deeply nested conditional logic

✅ **Keep as-is when:**
- Component <300 lines and focused
- Single, clear responsibility
- Primarily presentational
- Simple CRUD forms

---

## Pattern: Custom Hooks + Feature Components

### Phase 1: Extract Business Logic to Custom Hooks

**Goal:** Separate business logic from UI rendering.

#### Before: Mixed Concerns (800 lines)

```tsx
"use client";

export function ComplexDashboard() {
  // Data fetching state
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filtering state
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState("date");
  
  // Selection state
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Export state
  const [exportFormat, setExportFormat] = useState("csv");
  
  // ... hundreds of lines of UI
}
```

#### After: Custom Hooks (150 lines main component)

```tsx
"use client";

export function ComplexDashboard() {
  const dataState = useDataManagement();
  const filterState = useFiltering();
  const selectionState = useSelection();
  const exportState = useExporting();
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardFilters {...filterState} />
      <DashboardContent {...dataState} {...selectionState} />
      <DashboardActions {...selectionState} {...exportState} />
    </div>
  );
}
```

---

## Creating Custom Hooks

### Hook Structure

```tsx
// src/hooks/dashboard/use-data-management.ts
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

export function useDataManagement() {
  const [sortBy, setSortBy] = useState("date");
  
  const query = useQuery({
    queryKey: ["dashboard-data", sortBy],
    queryFn: () => fetchDashboardData({ sortBy }),
  });
  
  const mutation = useMutation({
    mutationFn: updateData,
    onSuccess: () => query.refetch(),
  });
  
  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    sortBy,
    setSortBy,
    updateItem: mutation.mutate,
  };
}
```

### Hook Organization

```
src/hooks/
├── dashboard/
│   ├── use-data-management.ts
│   ├── use-filtering.ts
│   └── use-selection.ts
└── shared/
    ├── use-debounce.ts
    └── use-local-storage.ts
```

---

## Example Hooks

### Filter/Search Hook

```tsx
// src/hooks/dashboard/use-filtering.ts
import { useState, useMemo } from "react";

export function useFiltering<T>(items: T[], searchFields: (keyof T)[]) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<keyof T>("createdAt");
  
  const filteredItems = useMemo(() => {
    let result = [...items];
    
    if (searchTerm) {
      result = result.filter(item =>
        searchFields.some(field =>
          String(item[field]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(item => item[key as keyof T] === value);
      }
    });
    
    return result;
  }, [items, searchTerm, filters]);
  
  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortBy,
    setSortBy,
    filteredItems,
  };
}
```

### Selection Hook

```tsx
// src/hooks/shared/use-selection.ts
import { useState, useCallback } from "react";

export function useSelection<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);
  
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);
  
  return {
    selectedIds,
    selectedItems: items.filter(item => selectedIds.has(item.id)),
    isSelected: (id: string) => selectedIds.has(id),
    toggle,
    selectAll,
    clearSelection,
    hasSelection: selectedIds.size > 0,
  };
}
```

---

## Phase 2: Extract Feature Components

**Goal:** After hooks extraction, if main component is still >300 lines, split UI.

### Before: Monolithic UI

```tsx
"use client";

export function ComplexDashboard() {
  const dataState = useDataManagement();
  const filterState = useFiltering();
  
  return (
    <div className="space-y-6">
      {/* 50 lines of header */}
      <div>...</div>
      
      {/* 100 lines of filters */}
      <div>...</div>
      
      {/* 200 lines of data table */}
      <div>...</div>
    </div>
  );
}
```

### After: Feature Components

```tsx
// src/components/dashboard/complex-dashboard.tsx
"use client";

export function ComplexDashboard() {
  const dataState = useDataManagement();
  const filterState = useFiltering();
  const selectionState = useSelection(dataState.data);
  
  return (
    <div className="space-y-6">
      <DashboardHeader />
      <DashboardFilters {...filterState} />
      <DashboardTable {...dataState} {...selectionState} />
      <DashboardActions {...selectionState} />
    </div>
  );
}
```

---

## Benefits

### Before Refactoring
- ❌ 800-line component
- ❌ 20+ useState calls
- ❌ Hard to test
- ❌ Hard to reuse logic

### After Refactoring
- ✅ Main component <150 lines
- ✅ Focused custom hooks (50-100 lines each)
- ✅ Feature components (50-150 lines each)
- ✅ Easy to test each hook independently
- ✅ Logic reusable across components

---

## Common Mistakes

### ❌ Mistake 1: Premature Extraction

```tsx
// Don't extract before you need it
"use client";

// Component is only 100 lines and simple
export function SimpleForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  
  // This is fine! Don't extract to a hook yet.
  return <form>...</form>;
}
```

### ❌ Mistake 2: Over-Abstraction

```tsx
// Don't create generic hooks that hide business logic
function useGenericDataManager() {
  // Too generic
}

// ✅ Do create domain-specific hooks
function useProjectsManagement() {
  // Clear what it manages
}
```

### ❌ Mistake 3: Shared State Between Hooks

```tsx
// ❌ Bad: Hooks depend on each other
function useFiltering() {
  const sortState = useSorting(); // Coupling!
}

// ✅ Good: Hooks are independent
function useFiltering() {
  // Self-contained
}

// Component orchestrates
function Page() {
  const filterState = useFiltering();
  const sortState = useSorting();
}
```

---

## Refactoring Checklist

- [ ] Component >500 lines or 10+ hooks?
- [ ] Extract business logic to custom hooks first
- [ ] One hook per major concern
- [ ] Hooks return focused API (5-10 properties max)
- [ ] If still complex, extract feature components
- [ ] Main component becomes thin orchestrator
- [ ] Each piece testable independently
- [ ] Clear naming: `use<Domain><Action>`

---

## When to Stop

Stop when:
- ✅ Main component <150 lines
- ✅ Each hook <100 lines
- ✅ Each feature component <150 lines
- ✅ Clear responsibility for each piece
- ✅ Easy to test and understand

**Remember:** The goal is clarity, not maximum abstraction.
