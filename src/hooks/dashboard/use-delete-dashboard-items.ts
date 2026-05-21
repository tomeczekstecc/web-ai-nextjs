import { useMutation, useQueryClient } from "@tanstack/react-query"

import { toast } from "@/components/toast"
import { deleteDashboardReviewItems } from "@/lib/api/domains/dashboard/commands"
import { dashboardKeys } from "@/lib/api/domains/dashboard/query-keys"
import type { DashboardReviewItemsResponse } from "@/lib/api/domains/dashboard/contract"

export function useDeleteDashboardItems(onClear: () => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: number[]) => deleteDashboardReviewItems(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: dashboardKeys.reviewItems() })
      const previous = queryClient.getQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
      )
      queryClient.setQueryData<DashboardReviewItemsResponse>(
        dashboardKeys.reviewItems(),
        (old) => old ? { ...old, items: old.items.filter((i) => !ids.includes(i.id)) } : old,
      )
      return { previous }
    },
    onError: (_err, _ids, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(dashboardKeys.reviewItems(), ctx.previous)
      }
      toast.error("Nie udało się usunąć zaznaczonych pozycji. Spróbuj ponownie.")
    },
    onSuccess: (_data, ids) => {
      toast.success(`Usunięto ${ids.length} ${ids.length === 1 ? "pozycję" : "pozycji"}.`)
      onClear()
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.reviewItems() })
    },
  })
}
