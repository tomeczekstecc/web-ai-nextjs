import { DomainLayout } from "@/components/domain-layout"
import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

const BREADCRUMBS = [
  { label: "Start", href: "/dashboard" },
  { label: "Zadania", href: "/wizard-demo" },
  { label: "Nowe zadanie" },
]

export default function NewTaskPage() {
  return (
    <DomainLayout breadcrumbs={BREADCRUMBS}>
      <div className="px-4 pb-8 lg:px-6">
        <TasksWizard mode="edit" />
      </div>
    </DomainLayout>
  )
}
