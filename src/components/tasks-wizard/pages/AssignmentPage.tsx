'use client'

import { SelectWiz } from '@/components/wizard/inputs/SelectWiz'
import { useWizard } from '@/hooks/wizard/useWizard'
import { TASK_ASSIGNEES } from '@/mocks/data/tasks-wizard'

export function AssignmentPage() {
  const { form } = useWizard()
  const isPersonal = form.type === 'personal'
  return (
    <div className="flex flex-col gap-4">
      <SelectWiz keyName="assignee_id" options={TASK_ASSIGNEES} hide={isPersonal} />
      {isPersonal && (
        <p className="text-sm text-muted-foreground">Zadanie osobiste — brak przypisania.</p>
      )}
    </div>
  )
}
