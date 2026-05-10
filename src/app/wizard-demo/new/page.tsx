'use client'

import { TasksWizard } from '@/components/tasks-wizard/TasksWizard'

export default function NewTaskPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Nowe zadanie</h1>
      <TasksWizard mode="edit" />
    </div>
  )
}
