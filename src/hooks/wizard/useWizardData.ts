import { useQuery } from '@tanstack/react-query'

export function useWizardData(dataUrl: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['wizard-data', dataUrl],
    queryFn: () => fetch(dataUrl).then(r => r.json()),
    staleTime: Infinity,
  })
}
