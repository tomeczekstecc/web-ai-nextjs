import { BreadcrumbTrail } from "@/components/breadcrumb-bar"
import { SidebarTrigger } from "@/components/ui/sidebar"

/**
 * Top header bar for the sidebar navigation layout. Hosts the breadcrumb
 * trail derived from the current pathname and a hamburger trigger that
 * opens the sidebar sheet on mobile (where the sidebar is offcanvas).
 *
 * The trail is resolved inside `BreadcrumbTrail` (a client component that
 * reads `usePathname()` and the menu config), so this component itself stays
 * a server component with no per-route props.
 */
export function SiteHeader({ trailing }: { trailing?: React.ReactNode }) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <BreadcrumbTrail />
        {trailing && <div className="ml-auto">{trailing}</div>}
      </div>
    </header>
  )
}
