import { applicationsHandlers } from "@/mocks/handlers/applications";
import { dashboardHandlers } from "@/mocks/handlers/dashboard";

export const handlers = [...dashboardHandlers, ...applicationsHandlers];
