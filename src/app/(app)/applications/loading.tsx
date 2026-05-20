import { Skeleton } from "@/components/ui/skeleton";

export default function ApplicationsLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="flex h-12 items-center gap-4 border-b px-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex h-14 items-center gap-4 border-b px-4 last:border-b-0">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}
