import { http, HttpResponse } from "msw";

import { menuConfigFixture } from "@/mocks/data/menu";

export const menuHandlers = [
  http.get("*/api/config/menu", () => {
    return HttpResponse.json(menuConfigFixture);
  }),
];
