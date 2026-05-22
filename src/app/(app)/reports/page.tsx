import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient } from '@/lib/query/client'
import { reportListOptions } from '@/lib/api/domains/reports/query-options'
import { ReportsTable } from '@/components/reports/reports-table'

export default async function ReportsPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(reportListOptions({ page: 1, pageSize: 50 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ReportsTable />
    </HydrationBoundary>
  )
}
