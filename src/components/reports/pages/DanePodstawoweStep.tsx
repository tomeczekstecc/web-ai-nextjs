'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { InputWiz } from '@/components/wizard/inputs/InputWiz'
import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { TextareaWiz } from '@/components/wizard/inputs/TextareaWiz'
import { useWizard } from '@/hooks/wizard/useWizard'

const STATUS_OPTIONS = [
  { value: 'projekt', label: 'Projekt' },
  { value: 'aktywny', label: 'Aktywny' },
  { value: 'archiwum', label: 'Archiwum' },
]

export function DanePodstawoweStep() {
  const { form, setValue } = useWizard()
  const isKop = !!(form.isKop as boolean | undefined)

  return (
    <div className="flex flex-col gap-4">
      <SelectWiz keyName="status" options={STATUS_OPTIONS} label="Status" />
      <InputWiz keyName="name" label="Nazwa" />
      <TextareaWiz keyName="description" label="Opis" maxLength={2000} />
      <div className="flex items-center gap-2">
        <Checkbox
          id="isKop"
          checked={isKop}
          onCheckedChange={checked => setValue('isKop', !!checked)}
        />
        <Label htmlFor="isKop">KOP</Label>
      </div>
    </div>
  )
}
