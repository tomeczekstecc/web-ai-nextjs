import { applicationsHandlers } from "@/mocks/handlers/applications";
import { taskWizardHandlers } from "@/mocks/handlers/tasks-wizard";
import { dashboardHandlers } from "@/mocks/handlers/dashboard";
import {
  createWizardMappingHandler,
  createWizardDataHandler,
  createWizardSaveHandler,
  createWizardValidationHandler,
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
    label: "Szczegóły końcowe",
    fields: [],
  },
  {
    name: "krok-4",
    label: "Podsumowanie walidacji",
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
  createWizardValidationHandler("/api/wizard-demo/validate", {
    error: {
      tytul: ["Tytuł jest wymagany i musi mieć co najmniej 3 znaki."],
    },
    warning: {
      opis: ["Opis jest bardzo krótki. Rozważ dodanie więcej szczegółów."],
    },
    dicts_msg: {
      error: {
        formularz: ["Formularz zawiera błędy, które muszą zostać poprawione przed zapisem."],
      },
      warning: {},
    },
  }),
];

export const handlers = [
  ...dashboardHandlers,
  ...applicationsHandlers,
  ...wizardDemoHandlers,
  ...taskWizardHandlers,
];
