import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export function useWizardSave(saveUrl: string | undefined) {
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: (payload) => {
      if (!saveUrl) return Promise.resolve()
      return fetch(saveUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(() => undefined)
    },
    onSuccess: () => toast.success('Zapisano'),
    onError: () => toast.error('Błąd zapisu'),
  })
}
