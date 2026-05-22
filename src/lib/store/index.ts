import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createWizardSlice } from './wizard.slice'
import { createReportsSlice } from './reports.slice'
import type { StoreState } from './types'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      ...createReportsSlice(...a),
    }),
    { name: 'ci-prs-store' }
  )
)
