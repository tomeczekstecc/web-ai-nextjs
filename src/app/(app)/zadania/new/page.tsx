import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

export default function NewTaskPage() {
  return (
    <div className="px-4 pb-8 lg:px-6">
      <TasksWizard mode="edit" />
    </div>
  )
}
