import { TasksWizard } from "@/components/tasks-wizard/TasksWizard"

export default async function ViewTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <TasksWizard id={Number(id)} mode="view" />
}
