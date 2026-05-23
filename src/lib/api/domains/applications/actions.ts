"use server";

// LAYER 2 — action gate.
//
// withPermission / withRole owijają każdą akcję uprzywilejowaną.
// Gate uruchamia się PRZED ciałem akcji — niedostępne dla wywołań
// bezpośrednich (forged POST, curl), niezależnie od tego co wyrenderował UI.
//
// Zasada: NIGDY nie owijaj wywołania w try/catch.
// withPermission rzuca forbidden() — Next.js przechwytuje ten interrupt;
// złapanie go w try/catch sprawia że akcja "się udaje" zamiast zwrócić 403.

import { withPermission, withRole } from "@/lib/auth/rbac";
import {
  createApplication as createTransport,
  submitApplication as submitTransport,
} from "@/lib/api/domains/applications/commands";
import type {
  CreateApplicationInput,
} from "@/lib/api/domains/applications/contract";

// -----------------------------------------------------------------------
// applications:write — Oper i Admin
// -----------------------------------------------------------------------

/**
 * Tworzy nowy wniosek. Dostępne dla Oper i Admin (applications:write).
 * Principal jest weryfikowany przed wywołaniem ciała — `_principal`
 * dostępny gdy potrzebny (np. do audit log principal.userId).
 */
export const createApplication = withPermission(
  "applications:write",
  async (_principal, input: CreateApplicationInput) => {
    return createTransport(input);
  },
);

/**
 * Składa wniosek (zmiana statusu draft → submitted).
 * Dostępne dla Oper i Admin (applications:write).
 */
export const submitApplication = withPermission(
  "applications:write",
  async (_principal, applicationId: string) => {
    return submitTransport(applicationId);
  },
);

// -----------------------------------------------------------------------
// admin:access — wyłącznie Admin
// -----------------------------------------------------------------------

/**
 * Archiwizuje wniosek. Wyłącznie Admin (admin:access / rola "Admin").
 *
 * Używamy withRole zamiast withPermission bo archiwizacja to
 * akcja administracyjna — koncepcyjnie "jestem adminem", nie
 * "mam zdolność X". Gdyby kiedyś pojawiła się rola "Archiver"
 * z permissions:archive — zmień na withPermission("applications:archive").
 */
export const archiveApplication = withRole(
  "Admin",
  async (principal, applicationId: string) => {
    // principal.userId dostępny do audit log
    void principal;
    // TODO: wywołaj transport archivizacji gdy backend będzie gotowy
    // return archiveTransport(applicationId);
    console.log(`[audit] Admin archiwizuje wniosek ${applicationId}`);
  },
);
