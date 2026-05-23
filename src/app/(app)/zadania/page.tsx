import { dehydrate, HydrationBoundary } from "@tanstack/react-query"

import { TasksListTable } from "@/components/tasks-wizard/tasks-list-table"
import { taskListOptions } from "@/lib/api/domains/tasks/query-options"
import { getQueryClient } from "@/lib/query/client"

export default async function WizardDemoPage() {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(taskListOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TasksListTable />
    </HydrationBoundary>
  )
}
