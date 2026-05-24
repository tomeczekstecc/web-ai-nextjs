import type { StateCreator } from 'zustand'
import type { StoreState, WizardSlice, WizardEntry } from './types'

export const EMPTY_WIZARD_ENTRY: WizardEntry = { form: {}, meta: { validation: [] } }

/** Stable named selector — use instead of an inline object selector to avoid useShallow overhead. */
export const selectWizardEntry =
  (name: string) => (s: StoreState) =>
    s.wizards[name] ?? EMPTY_WIZARD_ENTRY

export const createWizardSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  WizardSlice
> = (set) => ({
  wizards: {},

  setWizardData: (name, data) =>
    set(
      (state) => ({
        wizards: {
          ...state.wizards,
          [name]: {
            form: data,
            meta: state.wizards[name]?.meta ?? { validation: [] },
          },
        },
      }),
      false,
      'wizard/setData'
    ),

  setWizardValidation: (name, items) =>
    set(
      (state) => ({
        wizards: {
          ...state.wizards,
          [name]: {
            form: state.wizards[name]?.form ?? {},
            meta: { validation: items },
          },
        },
      }),
      false,
      'wizard/setValidation'
    ),

  clearWizard: (name) =>
    set(
      (state) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [name]: _removed, ...rest } = state.wizards
        return { wizards: rest }
      },
      false,
      'wizard/clear'
    ),
})
