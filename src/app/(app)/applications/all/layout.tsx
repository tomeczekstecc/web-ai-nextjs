import { requirePermission } from "@/lib/auth/rbac";

export default async function AllApplicationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("applications:write");
  return <>{children}</>;
}
