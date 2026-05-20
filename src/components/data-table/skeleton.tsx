import { Skeleton } from "@/components/ui/skeleton"

interface DataTableSkeletonProps {
  rows?: number
}

/**
 * Reusable loading skeleton for any DataTable usage.
 * Approximates the toolbar (search + column button) + bordered table rows layout.
 * Compose with view-specific chrome (e.g. a page heading skeleton) at the call site.
 */
export function DataTableSkeleton({ rows = 5 }: DataTableSkeletonProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border">
        {/* Header row */}
        <Skeleton className="h-10 w-full rounded-none" />
        {/* Data rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-none" />
          ))}
        </div>
      </div>
    </div>
  )
}
