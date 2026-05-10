'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type Props = {
  keyName: string
  hide?: boolean
  label?: string
}

export function InputWiz({ keyName, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={keyName}>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <Input
          id={keyName}
          value={f.value as string}
          onChange={e => f.onChange(e.target.value)}
          disabled={f.disabled}
        />
      </ValidationWrapper>
    </div>
  )
}
