'use client'

import { useWizard } from '@/hooks/wizard/useWizard'

export function useWizardField(keyName: string) {
  const { form, setValue, getLabel, getDisplay, validation, mode } = useWizard()
  const label = getLabel(keyName)
  const value = form[keyName] ?? ''
  const onChange = (v: unknown) => setValue(keyName as never, v)
  const hidden = !getDisplay(keyName)
  const disabled = mode === 'view'
  const error = validation.find(item => item.key === keyName)?.msgs[0]
  return { label, value, onChange, hidden, disabled, error }
}
