'use client'

import { use } from 'react'
import { WizardContext } from '@/components/wizard/WizardContext'
import type { WizardAPI } from '@/lib/wizard/types'

export function useWizard<T = Record<string, unknown>>(): WizardAPI<T> {
  const ctx = use(WizardContext)
  if (!ctx) throw new Error('useWizard must be used inside <WizardProvider>')
  return ctx as WizardAPI<T>
}
