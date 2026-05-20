import { http, HttpResponse, delay } from "msw";

import type {
  ApplicationSort,
  ApplicationStatus,
  ApplicationPayload,
  CreateApplicationInput,
  UpdateApplicationInput,
  UpdateApplicationStatusInput,
} from "@/lib/api/domains/applications/contract";
import {
  getApplications,
  getApplication,
  createMockApplication,
  updateMockApplication,
  deleteMockApplication,
  updateMockApplicationStatus,
} from "@/mocks/data/applications";

// ── Filtering / sorting helper ─────────────────────────────────────────────────

function applyFilters(
  items: ApplicationPayload[],
  params: {
    search?: string;
    status?: ApplicationStatus;
    sort?: ApplicationSort;
  },
): ApplicationPayload[] {
  let result = [...items];

  if (params.search) {
    const term = params.search.toLowerCase();
    result = result.filter((a) => a.label.toLowerCase().includes(term));
  }

  if (params.status) {
    result = result.filter((a) => a.status === params.status);
  }

  if (params.sort) {
    const [field, dir] = params.sort.split(":") as [keyof ApplicationPayload, "asc" | "desc"];
    result.sort((a, b) => {
      const cmp = String(a[field] ?? "").localeCompare(String(b[field] ?? ""));
      return dir === "asc" ? cmp : -cmp;
    });
  }

  return result;
}

// ── Handlers ───────────────────────────────────────────────────────────────────

export const applicationsHandlers = [
  // GET /api/applications?page=&pageSize=&search=&status=&sort=
  http.get("/api/applications", async ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
    const search = url.searchParams.get("search") ?? undefined;
    const status = (url.searchParams.get("status") ?? undefined) as ApplicationStatus | undefined;
    const sort = (url.searchParams.get("sort") ?? undefined) as ApplicationSort | undefined;

    await delay(200);

    const filtered = applyFilters(getApplications(), { search, status, sort });
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const start = (page - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    return HttpResponse.json({ items, page, pageSize, totalItems, totalPages });
  }),

  // GET /api/applications/:id
  http.get("/api/applications/:id", async ({ params }) => {
    await delay(150);
    const item = getApplication(params.id as string);
    if (!item) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Wniosek nie istnieje." },
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),

  // POST /api/applications
  http.post("/api/applications", async ({ request }) => {
    const body = (await request.json()) as CreateApplicationInput;
    await delay(400);

    if (!body.label?.trim()) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Pole 'label' jest wymagane." },
        { status: 422 },
      );
    }

    const item = createMockApplication(body.label.trim());
    return HttpResponse.json(item, { status: 201 });
  }),

  // PATCH /api/applications/:id/status  — more specific, must come before /:id
  http.patch("/api/applications/:id/status", async ({ params, request }) => {
    const body = (await request.json()) as UpdateApplicationStatusInput;
    await delay(300);

    const item = updateMockApplicationStatus(params.id as string, body.status);
    if (!item) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Wniosek nie istnieje." },
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),

  // PATCH /api/applications/:id
  http.patch("/api/applications/:id", async ({ params, request }) => {
    const body = (await request.json()) as UpdateApplicationInput;
    await delay(300);

    if (!body.label?.trim()) {
      return HttpResponse.json(
        { code: "VALIDATION_ERROR", message: "Pole 'label' jest wymagane." },
        { status: 422 },
      );
    }

    const item = updateMockApplication(params.id as string, body.label.trim());
    if (!item) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Wniosek nie istnieje." },
        { status: 404 },
      );
    }
    return HttpResponse.json(item);
  }),

  // DELETE /api/applications/:id
  http.delete("/api/applications/:id", async ({ params }) => {
    await delay(300);

    const deleted = deleteMockApplication(params.id as string);
    if (!deleted) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Wniosek nie istnieje." },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
