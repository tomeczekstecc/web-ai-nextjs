import type { DashboardReviewItem } from "@/lib/api/domains/dashboard/contract";

export const dashboardReviewItems: DashboardReviewItem[] = [
  {
    id: 1,
    header: "Konkurs na rozwój społeczeństwa obywatelskiego",
    type: "Społeczne",
    status: "Złożony",
    target: "50 000",
    limit: "2026-06-30",
    reviewer: "Anna Kowalska",
    parameters: [
      { name: "Próg punktowy", type: "Liczba",   value: "60",       description: "Minimalna liczba punktów do dofinansowania" },
      { name: "Czas trwania",  type: "Tekst",    value: "12 m-cy",  description: "Maksymalny okres realizacji projektu" },
    ],
    instruments: [
      { name: "Dotacja inwestycyjna",   amountPln: "30 000.00", amountEur: "6 800.00" },
      { name: "Dotacja na działalność", amountPln: "20 000.00", amountEur: "4 500.00" },
    ],
  },
  { id: 2,  header: "Program wsparcia inicjatyw lokalnych",          type: "Lokalne",   status: "Przyznany",  target: "100 000", limit: "2026-07-15", reviewer: "Marek Nowak",            parameters: [], instruments: [] },
  { id: 3,  header: "Dotacje na edukację ekologiczną",                type: "Ekologia",  status: "Do poprawy", target: "25 000",  limit: "2026-08-01", reviewer: "Assign reviewer",        parameters: [], instruments: [] },
  { id: 4,  header: "Konkurs dla organizacji młodzieżowych",          type: "Młodzież",  status: "W trakcie",  target: "75 000",  limit: "2026-06-20", reviewer: "Anna Kowalska",          parameters: [], instruments: [] },
  { id: 5,  header: "Wsparcie projektów na rzecz seniorów",           type: "Seniorzy",  status: "Złożony",    target: "40 000",  limit: "2026-07-10", reviewer: "Katarzyna Wiśniewska",   parameters: [], instruments: [] },
  { id: 6,  header: "Granty na działalność kulturalną NGO",           type: "Kultura",   status: "W trakcie",  target: "60 000",  limit: "2026-07-25", reviewer: "Marek Nowak",            parameters: [], instruments: [] },
  { id: 7,  header: "Dofinansowanie projektów sportowych",            type: "Sport",     status: "Przyznany",  target: "30 000",  limit: "2026-08-05", reviewer: "Anna Kowalska",          parameters: [], instruments: [] },
  { id: 8,  header: "Konkurs edukacyjny dla szkół i NGO",             type: "Edukacja",  status: "Złożony",    target: "45 000",  limit: "2026-07-18", reviewer: "Assign reviewer",        parameters: [], instruments: [] },
  { id: 9,  header: "Program aktywizacji zawodowej bezrobotnych",     type: "Społeczne", status: "Do poprawy", target: "80 000",  limit: "2026-08-12", reviewer: "Katarzyna Wiśniewska",   parameters: [], instruments: [] },
  { id: 10, header: "Wsparcie dla organizacji działających na wsi",   type: "Lokalne",   status: "W trakcie",  target: "35 000",  limit: "2026-06-28", reviewer: "Marek Nowak",            parameters: [], instruments: [] },
];
