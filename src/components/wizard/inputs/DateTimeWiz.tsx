'use client'

import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'
import { cn } from '@/lib/utils'

type Props = {
  keyName: string
  hideTime?: boolean
  hide?: boolean
  label?: string
}

export function DateTimeWiz({ keyName, hideTime, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <input
          id={keyName}
          type={hideTime ? 'date' : 'datetime-local'}
          value={f.value as string}
          onChange={e => f.onChange(e.target.value)}
          disabled={f.disabled}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs',
            'transition-colors placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </ValidationWrapper>
    </div>
  )
}
