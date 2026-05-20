import * as React from "react"
import type { OnChangeFn } from "@tanstack/react-table"

export function useControlledState<TState>(
  controlledValue: TState | undefined,
  onControlledChange: OnChangeFn<TState> | undefined,
  defaultValue: TState,
) {
  const [localValue, setLocalValue] = React.useState(defaultValue)
  const value = controlledValue ?? localValue

  const valueRef = React.useRef(value)
  // eslint-disable-next-line react-hooks/refs
  valueRef.current = value

  const onChangeRef = React.useRef(onControlledChange)
  // eslint-disable-next-line react-hooks/refs
  onChangeRef.current = onControlledChange

  const isControlled = controlledValue !== undefined

  const setValue = React.useCallback<OnChangeFn<TState>>(
    (updater) => {
      const nextValue =
        typeof updater === "function"
          ? (updater as (old: TState) => TState)(valueRef.current)
          : updater

      if (!isControlled) {
        setLocalValue(nextValue)
      }

      onChangeRef.current?.(nextValue)
    },
    [isControlled],
  )

  return [value, setValue] as const
}
