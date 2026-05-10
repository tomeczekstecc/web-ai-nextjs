import { useQuery } from '@tanstack/react-query'
import type { PageMapping } from '@/lib/wizard/types'

export function useWizardMapping(mappingUrl: string) {
  return useQuery<PageMapping[]>({
    queryKey: ['wizard-mapping', mappingUrl],
    queryFn: () => fetch(mappingUrl).then(r => r.json()),
    staleTime: Infinity,
  })
}
