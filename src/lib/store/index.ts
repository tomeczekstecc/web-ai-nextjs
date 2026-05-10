import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createWizardSlice } from './wizard.slice'
import type { StoreState } from './types'

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      // TODO: future slices here
    }),
    { name: 'ci-prs-store' }
  )
)
