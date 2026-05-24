import type { StateCreator } from 'zustand'
import type { GenerationState, ReportsSlice, StoreState } from './types'

/** Named selector — stable reference, avoids inline object allocation in components. */
export const selectGenerationState =
  (reportId: number) => (s: StoreState) =>
    s.generationStates[reportId] ?? 'idle'

/** Named selector — returns a stable boolean; Object.values computed once per store update. */
export const selectAnyPending = (s: StoreState) =>
  Object.values(s.generationStates).some(st => st === 'pending')

export const createReportsSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  ReportsSlice
> = (set) => ({
  generationStates: {},

  setGenerationState: (reportId: number, state: GenerationState) =>
    set(
      (s) => ({
        generationStates: { ...s.generationStates, [reportId]: state },
      }),
      false,
      'reports/setGenerationState'
    ),

  clearGenerationState: (reportId: number) =>
    set(
      (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [reportId]: _removed, ...rest } = s.generationStates
        return { generationStates: rest }
      },
      false,
      'reports/clearGenerationState'
    ),
})
