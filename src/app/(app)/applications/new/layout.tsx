// LAYER 1 — server gate na poziomie layout-u.
// Każda strona pod /applications/new/* jest chroniona tym samym gate-em.
// Użytkownik bez applications:write dostaje forbidden() zanim cokolwiek się wyrenderuje.
import { requirePermission } from "@/lib/auth/rbac";

export default async function NewApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gate blokuje Userów — tylko Oper i Admin mają applications:write.
  // Nie sprawdzamy roli "Oper" bezpośrednio — gate jest decoupled od nazw ról.
  await requirePermission("applications:write");
  return <>{children}</>;
}
