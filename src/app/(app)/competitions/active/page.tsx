import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Aktywne konkursy", robots: { index: false } };

export default function CompetitionsActivePage() {
  return (
    <PlaceholderPage
      title="Aktywne konkursy"
      description="Lista aktualnie otwartych konkursów."
      badge="applications:read"
    />
  );
}
