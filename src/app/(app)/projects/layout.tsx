import type { Metadata } from "next";
import type { ReactNode } from "react";

import { requirePermission } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  await requirePermission("applications:read");
  return <>{children}</>;
}
