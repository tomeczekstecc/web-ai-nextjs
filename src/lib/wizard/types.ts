import type { z } from 'zod'
import type { ValidationItem } from '@/lib/store/types'

export type { ValidationItem }

export type FieldType = 'input' | 'select' | 'textarea' | 'date' | 'radio' | 'checkbox'

export type FieldMeta = {
  name: string
  label: string
  type: FieldType
  lp: number
  display: boolean
  max?: number
  decimal?: number
}

export type PageMapping = {
  name: string
  label: string
  fields: FieldMeta[]
}

export type SummaryResult = {
  error: Record<string, string[]>
  warning: Record<string, string[]>
  dicts_msg?: {
    error: Record<string, string[]>
    warning: Record<string, string[]>
  }
}

export type WizardAction = {
  label: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link'
  disabled?: boolean
}

export type WizardPage<T = Record<string, unknown>> = {
  name: string
  form: React.ReactElement
  disabled?: boolean
  isSummaryPage?: boolean
  noPayload?: boolean
  calc?: (form: T) => T
  schema?: z.ZodSchema
}

export type WizardConfig<T = Record<string, unknown>> = {
  name: string
  mode: 'view' | 'edit'
  pages: WizardPage<T>[]
  mappingUrl: string
  dataUrl: string
  saveUrl?: string
  validationUrl?: string
  saveOnPageChange: boolean
  addData?: Record<string, unknown>
  acceptActions?: (summary: SummaryResult | null) => WizardAction[]
  customActions?: () => WizardAction[]
  saveAndQuitCallback?: () => void
  cancelCallback?: () => void
}

export type WizardAPI<T = Record<string, unknown>> = {
  form: T
  setValue: (key: keyof T & string, value: unknown) => void
  setForm: (form: T) => void
  appendData: (data: Partial<T>) => void
  clearFields: (fields: (keyof T & string)[]) => void
  mapping: PageMapping[]
  getLabel: (field: string, page?: string) => string
  getType: (field: string, page?: string) => FieldType
  getDisplay: (field: string, page?: string) => boolean
  getMax: (field: string, page?: string) => number | undefined
  getDecimal: (field: string, page?: string) => number
  page: number
  pageKey: string
  setPageByName: (name: string, scrollTo?: string) => void
  nav: (toPage: number) => Promise<void>
  save: () => Promise<void>
  saveAndQuit: () => Promise<void>
  validation: ValidationItem[]
  setValidation: (items: ValidationItem[]) => void
  summary: SummaryResult | null
  mode: 'view' | 'edit'
  loading: boolean
  busy: boolean
  refetch: () => void
}
