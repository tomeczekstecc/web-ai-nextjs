import type { ReactNode } from "react"

/**
 * Args passed to the child render-prop of FormRepeater / TableRepeater.
 *
 * `name` is the dotted path prefix for the current row, e.g. `"params[0]"`,
 * so the caller can write `<form.Field name={`${name}.fieldX`}>`.
 */
export type RepeaterRowArgs = {
  /** Dotted path prefix for this row, e.g. `"parameters[2]"` */
  name: string
  /** Zero-based row index */
  index: number
  /** Remove this row (respects `min`) */
  remove: () => void
  /** Move row up (no-op when first) */
  moveUp: () => void
  /** Move row down (no-op when last) */
  moveDown: () => void
  isFirst: boolean
  isLast: boolean
  /** False when `min` is reached */
  canRemove: boolean
}

/**
 * Minimal TanStack Form surface used by repeaters.
 * Loosely typed so consumers can pass any `useForm` result without ceremony.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RepeaterFormLike = { Field: any }

export type RepeaterBaseProps<T> = {
  /** A TanStack `useForm()` result. */
  form: RepeaterFormLike
  /** Array field name on the form, e.g. `"parameters"`. */
  name: string
  /** Factory used by the Add button. */
  newItem: () => T
  /** Minimum allowed rows. Remove is disabled at this threshold. Default `0`. */
  min?: number
  /** Maximum allowed rows. Add is disabled at this threshold. Default `Infinity`. */
  max?: number
  /** Show up/down reorder controls per row. Default `false`. */
  reorderable?: boolean
  /** Label rendered above the repeater (acts as a fieldset legend). */
  label?: ReactNode
  /** Add button label. Default `"+ Dodaj"`. */
  addLabel?: ReactNode
  /** Rendered when the array is empty. Default `null`. */
  emptyState?: ReactNode
  /** Container className. */
  className?: string
  /** Disable add/remove/reorder (read-only mode). */
  disabled?: boolean
  /** Render-prop for each row. */
  children: (args: RepeaterRowArgs) => ReactNode
}
