import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/toast'
import { createDashboardReviewItem } from '@/lib/api/domains/dashboard/commands'
import { dashboardKeys } from '@/lib/api/domains/dashboard/query-keys'

export function useCreateDashboardItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createDashboardReviewItem,
    onSuccess: () => {
      toast.success('Projekt został dodany.')
    },
    onError: () => {
      toast.error('Nie udało się dodać projektu. Spróbuj ponownie.')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
    },
  })
}
