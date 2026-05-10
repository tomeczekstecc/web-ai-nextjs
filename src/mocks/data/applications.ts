import type { ApplicationListPayload } from "@/lib/api/domains/applications/contract";

export const mockApplicationsResponse: ApplicationListPayload = {
  items: [
    { id: "app-001", label: "Wniosek o dofinansowanie edukacji", status: "submitted", created_at: "2024-10-01T09:00:00.000Z", updated_at: "2024-10-15T11:30:00.000Z" },
    { id: "app-002", label: "Wniosek o wsparcie kulturalne", status: "draft", created_at: "2024-10-05T14:00:00.000Z", updated_at: "2024-10-06T08:00:00.000Z" },
    { id: "app-003", label: "Wniosek o grant sportowy", status: "archived", created_at: "2024-09-20T10:00:00.000Z", updated_at: "2024-09-30T16:00:00.000Z" },
    { id: "app-004", label: "Wniosek o dofinansowanie infrastruktury", status: "submitted", created_at: "2024-10-10T08:30:00.000Z", updated_at: "2024-10-12T09:00:00.000Z" },
    { id: "app-005", label: "Wniosek o wsparcie dla MŚP", status: "draft", created_at: "2024-10-18T13:00:00.000Z", updated_at: "2024-10-18T13:00:00.000Z" },
  ],
  page: 1,
  pageSize: 10,
  totalItems: 5,
  totalPages: 1,
};
