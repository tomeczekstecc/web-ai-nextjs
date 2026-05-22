import { ReportsWizard } from '@/components/reports/reports-wizard'

export default function NewReportPage() {
  return (
    <div className="px-4 pb-8 lg:px-6">
      <ReportsWizard mode="create" />
    </div>
  )
}
