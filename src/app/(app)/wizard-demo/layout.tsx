import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zadania",
  description: "Zarządzanie zadaniami w systemie CI-PRS",
  robots: { index: false, follow: false },
};

export default function WizardDemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
