import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/toast'
import { updateDashboardReviewItem } from '@/lib/api/domains/dashboard/commands'
import { dashboardKeys } from '@/lib/api/domains/dashboard/query-keys'
import type { DashboardReviewItem, UpdateDashboardReviewItemInput } from '@/lib/api/domains/dashboard/contract'

export function useUpdateDashboardItem(item: DashboardReviewItem) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateDashboardReviewItemInput) =>
      updateDashboardReviewItem(item.id, data),
    onSuccess: () => {
      toast.success('Projekt został zapisany.')
    },
    onError: () => {
      toast.error('Nie udało się zapisać projektu. Spróbuj ponownie.')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
    },
  })
}
