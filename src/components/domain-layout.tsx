import React from "react"
import { SiteHeader, type BreadcrumbEntry } from "@/components/site-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getNavLayout } from "@/lib/menu/env"

interface DomainLayoutProps {
  breadcrumbs: BreadcrumbEntry[]
  children: React.ReactNode
}

export function DomainLayout({ breadcrumbs, children }: DomainLayoutProps) {
  const navLayout = getNavLayout()
  const title = breadcrumbs[breadcrumbs.length - 1]?.label ?? ""

  return (
    <>
      {navLayout === "sidebar" ? (
        <SiteHeader breadcrumbs={breadcrumbs} />
      ) : (
        <div className="border-b px-4 py-3 lg:px-6">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <React.Fragment key={crumb.label}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={crumb.href}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}
      <div className="px-4 py-4 lg:px-6">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      </div>
      {children}
    </>
  )
}
