import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { createWizardSlice } from './wizard.slice'
import { createReportsSlice } from './reports.slice'
import type { StoreState } from './types'

const initialState: Pick<StoreState, 'wizards' | 'generationStates'> = {
  wizards: {},
  generationStates: {},
}

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createWizardSlice(...a),
      ...createReportsSlice(...a),
    }),
    { name: 'ci-prs-store' }
  )
)

/** Reset all store state — use in tests (between cases) and logout flows. */
export function resetStore() {
  useStore.setState(initialState) // merge: resets data, keeps action functions
}
