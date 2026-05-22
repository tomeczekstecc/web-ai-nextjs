import { NextResponse } from "next/server";
import type { CreateDashboardReviewItemInput, DashboardReviewItemsResponse } from "@/lib/api/domains/dashboard/contract";

export async function GET() {
  const response: DashboardReviewItemsResponse = {
    items: [
      {
        id: 1,
        header: "Konkurs na rozwój społeczeństwa obywatelskiego",
        type: "Społeczne",
        status: "Złożony",
        target: "50 000",
        limit: "2026-06-30",
        reviewer: "Anna Kowalska",
      },
      {
        id: 2,
        header: "Program wsparcia inicjatyw lokalnych",
        type: "Lokalne",
        status: "Przyznany",
        target: "100 000",
        limit: "2026-07-15",
        reviewer: "Marek Nowak",
      },
      {
        id: 3,
        header: "Dotacje na edukację ekologiczną",
        type: "Ekologia",
        status: "Do poprawy",
        target: "25 000",
        limit: "2026-08-01",
        reviewer: "Assign reviewer",
      },
      {
        id: 4,
        header: "Konkurs dla organizacji młodzieżowych",
        type: "Młodzież",
        status: "W trakcie",
        target: "75 000",
        limit: "2026-06-20",
        reviewer: "Anna Kowalska",
      },
      {
        id: 5,
        header: "Wsparcie projektów na rzecz seniorów",
        type: "Seniorzy",
        status: "Złożony",
        target: "40 000",
        limit: "2026-07-10",
        reviewer: "Katarzyna Wiśniewska",
      },
    ],
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateDashboardReviewItemInput;
  // TODO: persist to backend
  const created = { id: Date.now(), ...body };
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { ids } = (await request.json()) as { ids: number[] };
  // TODO: persist to backend
  void ids;
  return new NextResponse(null, { status: 204 });
}
