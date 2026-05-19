import { http, HttpResponse, delay } from "msw";

import { mockAccountProfile } from "@/mocks/data/account";

let currentProfile = { ...mockAccountProfile };

export const accountHandlers = [
  http.get("/api/account/profile", async () => {
    await delay(300);
    return HttpResponse.json(currentProfile);
  }),

  http.patch("/api/account/profile", async ({ request }) => {
    const body = (await request.json()) as {
      first_name?: string;
      last_name?: string;
    };

    currentProfile = {
      ...currentProfile,
      first_name: body.first_name ?? currentProfile.first_name,
      last_name: body.last_name ?? currentProfile.last_name,
      display_name: `${body.first_name ?? currentProfile.first_name} ${body.last_name ?? currentProfile.last_name}`,
    };

    await delay(500);
    return HttpResponse.json(currentProfile);
  }),

  http.delete("/api/account", async ({ request }) => {
    const body = (await request.json()) as { confirmation?: string };

    await delay(800);

    if (body.confirmation !== "USUŃ KONTO") {
      return HttpResponse.json(
        {
          code: "INVALID_CONFIRMATION",
          message:
            'Wpisz "USUŃ KONTO" aby potwierdzić usunięcie.',
        },
        { status: 422 },
      );
    }

    return HttpResponse.json({
      success: true,
      message: "Konto zostało usunięte.",
    });
  }),
];
