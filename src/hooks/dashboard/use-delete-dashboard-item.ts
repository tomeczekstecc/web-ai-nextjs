import { useMutation, useQueryClient } from "@tanstack/react-query"

import { toast } from "@/components/toast"
import { deleteDashboardReviewItem } from "@/lib/api/domains/dashboard/commands"
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys"
import type { DashboardReviewItem, DashboardReviewItemsResponse } from "@/lib/api/domains/dashboard/contract"

export function useDeleteDashboardItem(item: DashboardReviewItem) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteDashboardReviewItem(item.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.reviewItems() })
      const previous = queryClient.getQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
      )
      queryClient.setQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
        (old) => old ? { ...old, items: old.items.filter((i) => i.id !== item.id) } : old,
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(dashboardKeys.reviewItems(), ctx.previous)
      }
      toast.error("Nie udało się usunąć pozycji. Spróbuj ponownie.")
    },
    onSuccess: () => {
      toast.success(`"${item.header}" został usunięty.`)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
    },
  })
}
