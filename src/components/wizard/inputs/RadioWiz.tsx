'use client'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { ValidationWrapper } from '../ValidationWrapper'
import { useWizardField } from '@/hooks/wizard/useWizardField'

type OptionItem = { value: string; label: string }

type Props = {
  keyName: string
  options: OptionItem[]
  hide?: boolean
  label?: string
}

export function RadioWiz({ keyName, options, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <RadioGroup
          value={f.value as string}
          onValueChange={v => f.onChange(v)}
          disabled={f.disabled}
          className="flex flex-col gap-2"
        >
          {options.map(o => (
            <div key={o.value} className="flex items-center gap-2">
              <RadioGroupItem value={o.value} id={`${keyName}-${o.value}`} />
              <Label htmlFor={`${keyName}-${o.value}`}>{o.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </ValidationWrapper>
    </div>
  )
}
