import { applicationsHandlers } from "@/mocks/handlers/applications";
import { dashboardHandlers } from "@/mocks/handlers/dashboard";
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
} from "@/mocks/handlers/wizard";
import type { PageMapping } from "@/lib/wizard/types";

const demoMapping: PageMapping[] = [
  {
    name: "krok-1",
    label: "Dane podstawowe",
    fields: [
      { name: "tytul", label: "Tytuł", type: "input", lp: 1, display: true },
    ],
  },
  {
    name: "krok-2",
    label: "Szczegóły",
    fields: [
      { name: "opis", label: "Opis", type: "textarea", lp: 1, display: true },
    ],
  },
  {
    name: "krok-3",
    label: "Podsumowanie",
    fields: [],
  },
];

const demoData: Record<string, unknown> = {
  tytul: "",
  opis: "",
};

const wizardDemoHandlers = [
  createWizardMappingHandler("/api/wizard-demo/mapping", demoMapping),
  createWizardDataHandler("/api/wizard-demo/data", demoData),
  createWizardSaveHandler("/api/wizard-demo/save"),
];

export const handlers = [
  ...dashboardHandlers,
  ...applicationsHandlers,
  ...wizardDemoHandlers,
];
