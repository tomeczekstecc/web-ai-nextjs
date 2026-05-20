'use client'

import { useParams } from 'next/navigation'
import { TasksWizard } from '@/components/tasks-wizard/TasksWizard'

export default function ViewTaskPage() {
  const params = useParams<{ id: string }>()
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Podgląd zadania #{params.id}</h1>
      <TasksWizard id={Number(params.id)} mode="view" />
    </div>
  )
}
