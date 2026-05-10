'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWizard } from '@/hooks/wizard/useWizard'

type Props = {
  field: string
  error: string | undefined
  children: React.ReactNode
}

export function ValidationWrapper({ field, error, children }: Props) {
  const { pageKey } = useWizard()
  return (
    <div className="flex flex-col gap-1">
      <span id={`${pageKey}.${field}`} />
      <div className={error ? 'ring-2 ring-destructive rounded-md' : undefined}>
        {children}
      </div>
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
