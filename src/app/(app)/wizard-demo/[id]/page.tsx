import { DomainLayout } from "@/components/domain-layout"
import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <DomainLayout breadcrumbs={[
      { label: "Home", href: "/dashboard" },
      { label: "Zadania", href: "/wizard-demo" },
      { label: `Edycja zadania #${id}` },
    ]}>
      <div className="px-4 pb-8 lg:px-6">
        <TasksWizard id={Number(id)} mode="edit" />
      </div>
    </DomainLayout>
  )
}
