'use client'

import { useWizardField } from '@/hooks/wizard/useWizardField'
import { TASK_LIST } from '@/mocks/data/tasks-wizard'

export function RelatedPage() {
  const f = useWizardField('related_ids')
  const selected = (f.value as number[]) ?? []

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium">{f.label || 'Powiązane zadania'}</p>
      {TASK_LIST.map(task => (
        <label key={task.id} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(task.id)}
            onChange={() => {
              const next = selected.includes(task.id)
                ? selected.filter(id => id !== task.id)
                : [...selected, task.id]
              f.onChange(next)
            }}
            disabled={f.disabled}
            className="h-4 w-4"
          />
          <span>{task.title}</span>
          <span className="text-muted-foreground text-xs">({task.type})</span>
        </label>
      ))}
      {f.error && <p className="text-sm text-destructive">{f.error}</p>}
    </div>
  )
}
