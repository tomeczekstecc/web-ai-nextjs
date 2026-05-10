import { http, HttpResponse } from "msw";

import { mockApplicationsResponse } from "@/mocks/data/applications";

export const applicationsHandlers = [
  http.get("/api/applications", () =>
    HttpResponse.json(mockApplicationsResponse)
  ),
];
