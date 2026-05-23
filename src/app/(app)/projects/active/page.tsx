import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Aktywne projekty", robots: { index: false } };

export default function ProjectsActivePage() {
  return (
    <PlaceholderPage
      title="Aktywne projekty"
      description="Projekty aktualnie w realizacji."
      badge="applications:read"
    />
  );
}
