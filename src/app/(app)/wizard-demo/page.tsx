import { DomainLayout } from "@/components/domain-layout"
import { WizardDemoList } from "./_wizard-demo-list"

const BREADCRUMBS = [
  { label: "Home", href: "/dashboard" },
  { label: "Zadania" },
]

export default function WizardDemoPage() {
  return (
    <DomainLayout breadcrumbs={BREADCRUMBS}>
      <div className="px-4 pb-8 lg:px-6">
        <WizardDemoList />
      </div>
    </DomainLayout>
  )
}
