import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Archiwum konkursów", robots: { index: false } };

export default function CompetitionsArchivePage() {
  return (
    <PlaceholderPage
      title="Archiwum konkursów"
      description="Zakończone i zarchiwizowane konkursy."
      badge="applications:read"
    />
  );
}
