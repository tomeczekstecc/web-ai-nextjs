import { DomainLayout } from "@/components/domain-layout"

const BREADCRUMBS = [{ label: "Przegląd" }]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DomainLayout breadcrumbs={BREADCRUMBS}>{children}</DomainLayout>
}
