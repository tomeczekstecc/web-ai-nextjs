import * as React from "react"
import type { DataTablePersistenceOptions, DataTablePreferences } from "@/lib/data-table/types"
import { readPreferences } from "@/lib/data-table/utils"

export function useDataTablePreferences(persistence: DataTablePersistenceOptions | undefined) {
  const [initialPreferences, setInitialPreferences] = React.useState<DataTablePreferences>({})
  const hasLoadedPreferences = React.useRef(false)

  React.useEffect(() => {
    if (persistence?.key && !hasLoadedPreferences.current) {
      hasLoadedPreferences.current = true
      setInitialPreferences(readPreferences(persistence.key))
    }
  }, [persistence?.key])

  return { initialPreferences }
}
