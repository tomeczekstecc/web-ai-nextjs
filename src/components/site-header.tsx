import { BreadcrumbTrail } from "@/components/breadcrumb-bar"

/**
 * Top header bar for the sidebar navigation layout. Hosts the breadcrumb
 * trail derived from the current pathname.
 *
 * The trail is resolved inside `BreadcrumbTrail` (a client component that
 * reads `usePathname()` and the menu config), so this component itself stays
 * a server component with no per-route props.
 */
export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <BreadcrumbTrail />
      </div>
    </header>
  )
}
