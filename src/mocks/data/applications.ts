import type {
  ApplicationPayload,
  ApplicationStatus,
} from "@/lib/api/domains/applications/contract";

// ── In-memory store ────────────────────────────────────────────────────────────
// Mutable so POST/PATCH/DELETE handlers can modify state within a browser session.

let nextId = 100;

export const mockApplications: ApplicationPayload[] = [
  {
    id: "app-001",
    label: "Wniosek o dofinansowanie edukacji",
    status: "submitted",
    created_at: "2024-10-01T09:00:00.000Z",
    updated_at: "2024-10-15T11:30:00.000Z",
  },
  {
    id: "app-002",
    label: "Wniosek o wsparcie kulturalne",
    status: "draft",
    created_at: "2024-10-05T14:00:00.000Z",
    updated_at: "2024-10-06T08:00:00.000Z",
  },
  {
    id: "app-003",
    label: "Wniosek o grant sportowy",
    status: "archived",
    created_at: "2024-09-20T10:00:00.000Z",
    updated_at: "2024-09-30T16:00:00.000Z",
  },
  {
    id: "app-004",
    label: "Wniosek o dofinansowanie infrastruktury",
    status: "submitted",
    created_at: "2024-10-10T08:30:00.000Z",
    updated_at: "2024-10-12T09:00:00.000Z",
  },
  {
    id: "app-005",
    label: "Wniosek o wsparcie dla MŚP",
    status: "draft",
    created_at: "2024-10-18T13:00:00.000Z",
    updated_at: "2024-10-18T13:00:00.000Z",
  },
];

// ── Store helpers ──────────────────────────────────────────────────────────────

export function getApplications(): ApplicationPayload[] {
  return mockApplications;
}

export function getApplication(id: string): ApplicationPayload | undefined {
  return mockApplications.find((a) => a.id === id);
}

export function createMockApplication(label: string): ApplicationPayload {
  const now = new Date().toISOString();
  const item: ApplicationPayload = {
    id: `app-${String(++nextId).padStart(3, "0")}`,
    label,
    status: "draft",
    created_at: now,
    updated_at: now,
  };
  mockApplications.push(item);
  return item;
}

export function updateMockApplication(
  id: string,
  label: string,
): ApplicationPayload | undefined {
  const item = mockApplications.find((a) => a.id === id);
  if (!item) return undefined;
  item.label = label;
  item.updated_at = new Date().toISOString();
  return item;
}

export function deleteMockApplication(id: string): boolean {
  const index = mockApplications.findIndex((a) => a.id === id);
  if (index === -1) return false;
  mockApplications.splice(index, 1);
  return true;
}

export function updateMockApplicationStatus(
  id: string,
  status: ApplicationStatus,
): ApplicationPayload | undefined {
  const item = mockApplications.find((a) => a.id === id);
  if (!item) return undefined;
  item.status = status;
  item.updated_at = new Date().toISOString();
  return item;
}

// Legacy export kept for backward compatibility with dashboard-review-items mock
export const mockApplicationsResponse = {
  get items() {
    return mockApplications;
  },
  page: 1,
  pageSize: 10,
  get totalItems() {
    return mockApplications.length;
  },
  totalPages: 1,
};
