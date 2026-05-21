import type { Metadata } from "next"

import { getCurrentPrincipal } from "@/lib/auth/rbac"

export const metadata: Metadata = {
  title: "Panel administracyjny",
  robots: { index: false },
}

export default async function AdminPage() {
  // Role check already happened in layout.tsx; here we just read the principal.
  const principal = await getCurrentPrincipal()
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Panel administracyjny</h1>
        <p className="text-sm text-muted-foreground">
          Widoczne tylko dla roli <code>Admin</code>.
        </p>
      </header>
      <section className="rounded-lg border bg-card p-4 text-sm">
        <dl className="grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Użytkownik</dt>
            <dd className="font-medium">{principal?.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{principal?.email}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{principal?.roles.join(", ") || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Uprawnienia</dt>
            <dd className="font-mono text-xs">
              {principal?.permissions.join(", ") || "—"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
