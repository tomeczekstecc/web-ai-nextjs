import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/toast'
import { deleteReport } from '@/lib/api/domains/reports/commands'
import { reportsKeys } from '@/lib/api/domains/reports/query-keys'
import type { ReportListItem, ReportListResult } from '@/lib/api/domains/reports/contract'

export function useDeleteReport(report: ReportListItem) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteReport(report.id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: reportsKeys.all })
      const keys = queryClient.getQueriesData<ReportListResult>({ queryKey: reportsKeys.all })
      keys.forEach(([key, data]) => {
        if (data) {
          queryClient.setQueryData<ReportListResult>(key, {
            ...data,
            items: data.items.filter(i => i.id !== report.id),
          })
        }
      })
      return { keys }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.keys.forEach(([key, data]) => {
        if (data) queryClient.setQueryData(key, data)
      })
      toast.error('Nie udało się usunąć raportu. Spróbuj ponownie.')
    },
    onSuccess: () => {
      toast.success(`Raport „${report.name}" został usunięty.`)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.all })
    },
  })
}
