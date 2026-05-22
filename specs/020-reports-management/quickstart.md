# Quickstart: Reports Management Module

**Feature**: 020-reports-management
**Branch**: `020-reports-management`

---

## Prerequisites

```bash
pnpm add @monaco-editor/react monaco-editor
```

---

## New Files

### Routes
```
src/app/(app)/reports/
├── layout.tsx                        # metadata + passthrough layout
├── page.tsx                          # reports list (prefetch + HydrationBoundary)
├── new/
│   └── page.tsx                      # ReportsWizard mode="create"
└── [id]/
    ├── page.tsx                      # ReportsWizard mode="edit"
    └── view/
        └── page.tsx                  # ReportsWizard mode="view"
```

### Next.js API Route Handlers
```
src/app/api/reports/
├── route.ts                          # GET /api/reports (list)
└── wizard/
    ├── mapping/route.ts              # GET /api/reports/wizard/mapping
    ├── data/route.ts                 # GET /api/reports/wizard/data
    ├── data/[id]/route.ts            # GET /api/reports/wizard/data/[id]
    └── save/route.ts                 # POST /api/reports/wizard/save
```

### Domain Library
```
src/lib/api/domains/reports/
├── contract.ts                       # TypeScript types (Report, Permission, etc.)
├── client.ts                         # browserFetch wrappers (list, delete, generate, check-status, download, test-query, permissions)
├── commands.ts                       # write operations (deleteReport, generateReport, testQuery)
├── mapper.ts                         # payload → model mappers
├── query-keys.ts                     # TanStack Query key factory
├── query-options.ts                  # queryOptions for list + permissions
└── polling.ts                        # REPORT_POLL_INTERVAL_MS, REPORT_POLL_MAX_ATTEMPTS
```

### Zustand Store
```
src/lib/store/
├── reports.slice.ts                  # GenerationState slice
├── types.ts                          # + ReportsSlice added
└── index.ts                          # + createReportsSlice composed
```

### Components
```
src/components/reports/
├── reports-table.tsx                 # DataTable + columns + toolbar
├── reports-columns.tsx               # column defs (name link, status badge, actions)
├── reports-row-actions.tsx           # inline Generate/Edit/Delete buttons + delete dialog
├── reports-wizard.tsx                # <Wizard> wrapper (ReportsWizard)
├── generation-drawer.tsx             # Sheet + FormRepeater for runtime params
├── use-report-generation.ts          # polling hook
└── pages/
    ├── DanePodstawoweStep.tsx        # Step 1: status, name, description (maxLength), isKop
    ├── ZapytanieStep.tsx             # Step 2: Monaco editor + ParameterTable + test query
    ├── UprawieniaStep.tsx            # Step 3: DualListTransfer
    └── ParameterTable.tsx            # Custom table for QueryParameter[] in wizard store
```

### Reusable UI Primitive
```
src/components/ui/
└── dual-list-transfer.tsx            # DualListTransfer component
```

### Breadcrumbs
```
src/lib/breadcrumbs/registry.ts       # + 4 reports entries appended
```

### TextareaWiz Extension
```
src/components/wizard/inputs/TextareaWiz.tsx   # + maxLength prop + char counter
```

---

## Modified Files

| File | Change |
|------|--------|
| `src/lib/store/types.ts` | Add `ReportsSlice`, update `StoreState` |
| `src/lib/store/index.ts` | Compose `createReportsSlice` |
| `src/lib/breadcrumbs/registry.ts` | Add 4 `/reports` breadcrumb entries |
| `src/components/wizard/inputs/TextareaWiz.tsx` | Add `maxLength` prop + counter |
| `AGENTS.md` | Update active implementation plan path |

---

## Key Patterns

### Wizard wiring
```tsx
<Wizard
  name="reports-wizard"
  mode={mode}
  pages={pages}
  mappingUrl="/api/reports/wizard/mapping"
  dataUrl={id ? `/api/reports/wizard/data/${id}` : '/api/reports/wizard/data'}
  saveUrl="/api/reports/wizard/save"
  saveOnPageChange={false}
  cancelCallback={() => router.push('/reports')}
/>
```

### Generation trigger
```tsx
// In reports-row-actions.tsx
const anyPending = useStore(s => Object.values(s.generationStates).some(st => st === 'pending'))
const { generate } = useReportGeneration(report.id)

<Button disabled={anyPending} onClick={() => {
  if (report.parameters.length === 0) generate()
  else setGeneratingReport(report)
}}>
  <PlayIcon />
</Button>
```

### Monaco with theme
```tsx
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
const { resolvedTheme } = useTheme()

<MonacoEditor
  language="sql"
  theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
  value={sqlQuery}
  onChange={v => wizard.setValue('sqlQuery', v ?? '')}
  options={{ readOnly: mode === 'view' }}
/>
```
