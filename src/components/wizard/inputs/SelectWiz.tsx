'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export function SelectWiz({ keyName, options, hide, label: labelOverride }: Props) {
  const f = useWizardField(keyName)
  if (f.hidden || hide) return null
  const label = labelOverride ?? f.label
  return (
    <div className="flex flex-col gap-1">
      <Label>{label}</Label>
      <ValidationWrapper field={keyName} error={f.error}>
        <Select
          value={f.value as string}
          onValueChange={v => f.onChange(v)}
          disabled={f.disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </ValidationWrapper>
    </div>
  )
}
