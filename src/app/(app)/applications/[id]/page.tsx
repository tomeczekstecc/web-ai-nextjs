import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

// LAYER 1 — server gate + odczyt Principal w jednym wywołaniu
import { requirePermission } from "@/lib/auth/rbac";
import { getQueryClient } from "@/lib/query/client";
import { applicationDetailOptions } from "@/lib/api/domains/applications/query-options";
import { ApplicationDetailAdmin } from "@/components/applications/application-detail-admin";
import { ApplicationDetailOper } from "@/components/applications/application-detail-oper";
import { ApplicationDetailUser } from "@/components/applications/application-detail-user";

export const metadata: Metadata = {
  title: "Szczegół wniosku",
  robots: { index: false },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ApplicationDetailPage({ params }: Props) {
  const { id } = await params;

  // LAYER 1 — gate. Zwraca Principal gdy OK; 403/401 gdy nie.
  const principal = await requirePermission("applications:read");

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(applicationDetailOptions(id));

  // Server-side role branching — jedno URL /applications/[id],
  // trzy różne widoki zależnie od roli. Logika rozgałęzienia zostaje
  // na serwerze; klient dostaje gotowy widok.
  //
  // Kolejność ma znaczenie: sprawdzamy od najbardziej uprzywilejowanej roli.
  // Admin > Oper > User
  const isAdmin = principal.permissions.includes("admin:access");
  const canWrite = principal.permissions.includes("applications:write");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {isAdmin ? (
        // Admin: pełny widok + audit log + akcje administracyjne
        <ApplicationDetailAdmin id={id} />
      ) : canWrite ? (
        // Oper: pełny widok + akcje workflow (przypisz, zmień status)
        <ApplicationDetailOper id={id} />
      ) : (
        // User: własny wniosek, widok read-only
        <ApplicationDetailUser id={id} />
      )}
    </HydrationBoundary>
  );
}
