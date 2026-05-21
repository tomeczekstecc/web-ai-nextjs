import { DomainLayout } from "@/components/domain-layout"
import type { BreadcrumbEntry } from "@/components/site-header"

const BREADCRUMBS: BreadcrumbEntry[] = [
  { label: "Start", href: "/dashboard" },
  { label: "Applications", href: "/applications" },
  { label: "All Applications" },
]

export default function ApplicationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DomainLayout breadcrumbs={BREADCRUMBS}>{children}</DomainLayout>
}
