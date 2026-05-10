import { createContext } from 'react'
import type { WizardAPI } from '@/lib/wizard/types'

export const WizardContext = createContext<WizardAPI | null>(null)
