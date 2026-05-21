import * as React from "react"
import type { DataTablePreferences } from "@/lib/data-table/types"
import { readPreferences } from "@/lib/data-table/utils"

export function useDataTablePreferences(resolvedKey: string | undefined) {
  const [initialPreferences, setInitialPreferences] = React.useState<DataTablePreferences>({})
  const [preferencesLoaded, setPreferencesLoaded] = React.useState(false)
  const hasLoaded = React.useRef(false)

  React.useEffect(() => {
    if (hasLoaded.current) return
    hasLoaded.current = true
    if (resolvedKey) {
      setInitialPreferences(readPreferences(resolvedKey))
    }
    setPreferencesLoaded(true)
  }, [resolvedKey])

  return { initialPreferences, preferencesLoaded }
}
