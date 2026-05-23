import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Zakończone projekty", robots: { index: false } };

export default function ProjectsCompletedPage() {
  return (
    <PlaceholderPage
      title="Zakończone projekty"
      description="Projekty zamknięte i rozliczone."
      badge="applications:read"
    />
  );
}
