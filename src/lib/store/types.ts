export type ValidationItem = {
  key: string
  type: 'error' | 'warning'
  msgs: string[]
}

export type WizardEntry = {
  form: Record<string, unknown>
  meta: { validation: ValidationItem[] }
}

export type WizardSlice = {
  wizards: Record<string, WizardEntry>
  setWizardData: (name: string, data: Record<string, unknown>) => void
  setWizardValidation: (name: string, items: ValidationItem[]) => void
  clearWizard: (name: string) => void
}

export type StoreState = WizardSlice
