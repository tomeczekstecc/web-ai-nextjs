export type BreadcrumbEntry = { label: string; href?: string }

export type BreadcrumbContext = {
  pathname: string
  segments: string[]
  params: Record<string, string>
}

export type BreadcrumbMapper = (
  ctx: BreadcrumbContext,
) => BreadcrumbEntry[] | null
