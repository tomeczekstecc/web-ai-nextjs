import { requireRole } from "@/lib/auth/rbac"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Triggers `unauthorized()` if no session, `forbidden()` if not Admin.
  // Rendered by src/app/unauthorized.tsx and src/app/forbidden.tsx.
  await requireRole("Admin")
  return <>{children}</>
}
