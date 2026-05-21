import type { Metadata } from "next";
import type { ReactNode } from "react";

import { appConfig } from "@/lib/config/app";

export const metadata: Metadata = {
  title: "Zadania",
  description: `Zarządzanie zadaniami w systemie ${appConfig.name}`,
  robots: { index: false, follow: false },
};

export default function WizardDemoLayout({ children }: { children: ReactNode }) {
  return children;
}
