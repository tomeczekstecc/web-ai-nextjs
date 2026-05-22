'use client'

import { useQuery } from '@tanstack/react-query'
import { DualListTransfer, type DualListItem } from '@/components/ui/dual-list-transfer'
import { useWizard } from '@/hooks/wizard/useWizard'
import { reportPermissionsOptions } from '@/lib/api/domains/reports/query-options'

export function UprawieniaStep() {
  const { form, setValue, mode } = useWizard()
  const permissionIds = (form.permissionIds as number[] | undefined) ?? []
  const { data: allPermissions = [] } = useQuery(reportPermissionsOptions())

  const selected: DualListItem[] = allPermissions.filter(p => permissionIds.includes(p.id))
  const available: DualListItem[] = allPermissions.filter(p => !permissionIds.includes(p.id))

  function handleChange(next: DualListItem[]) {
    setValue('permissionIds', next.map(p => p.id))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">Uprawnienia dostępu do raportu</p>
      <DualListTransfer
        available={available}
        selected={selected}
        onChange={handleChange}
        disabled={mode === 'view'}
      />
    </div>
  )
}
