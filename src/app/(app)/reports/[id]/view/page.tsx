import { ReportsWizard } from '@/components/reports/reports-wizard'

export default async function ViewReportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <div className="px-4 pb-8 lg:px-6">
      <ReportsWizard id={Number(id)} mode="view" />
    </div>
  )
}
