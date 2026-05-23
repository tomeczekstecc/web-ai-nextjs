import type { MenuConfig } from "@/lib/api/domains/menu/contract";

export const menuConfigFixture: MenuConfig = {
  features: [
    {
      key: "dashboard",
      label: "Przegląd",
      icon: "layout-dashboard",
      to: "/dashboard",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["dashboard:read"], mode: "all" },
    },
    {
      key: "competitions",
      label: "Konkursy",
      icon: "trophy",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["applications:read"], mode: "all" },
      submenu: [
        {
          key: "active",
          label: "Aktywne konkursy",
          to: "/competitions/active",
          perms: { list: ["applications:read"], mode: "all" },
        },
        {
          key: "archive",
          label: "Archiwum",
          to: "/competitions/archive",
          perms: { list: ["applications:read"], mode: "all" },
        },
      ],
    },
    {
      // Wpis główny widoczny dla wszystkich z applications:read.
      // Submenu demonstruje filtrowanie per permission:
      //   - "Lista wniosków" — dostępna dla wszystkich z read
      //   - "Nowy wniosek"  — dostępna tylko dla Oper i Admin (write)
      key: "applications",
      label: "Wnioski",
      icon: "file-text",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["applications:read"], mode: "all" },
      submenu: [
        {
          // Widoczny dla wszystkich — User, Oper, Admin
          key: "applications-list",
          label: "Lista wniosków",
          to: "/applications",
          perms: { list: ["applications:read"], mode: "all" },
        },
        {
          // Widoczny tylko dla Oper i Admin — applications:write
          // User nie ma tej permissions → pozycja filtrowana przez filterFeatures()
          key: "applications-new",
          label: "Nowy wniosek",
          to: "/applications/new",
          perms: { list: ["applications:write"], mode: "all" },
        },
      ],
    },
    {
      key: "zadania",
      label: "Zadania",
      icon: "circle-check",
      to: "/zadania",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["dashboard:read"], mode: "all" },
    },
    {
      key: "reports",
      label: "Raporty",
      icon: "bar-chart-3",
      to: "/reports",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["dashboard:read"], mode: "all" },
    },
    {
      key: "projects",
      label: "Projekty",
      icon: "folder",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["applications:read"], mode: "all" },
      submenu: [
        {
          key: "active-projects",
          label: "Aktywne",
          to: "/projects/active",
          perms: { list: ["applications:read"], mode: "all" },
        },
        {
          key: "completed",
          label: "Zakończone",
          to: "/projects/completed",
          perms: { list: ["applications:read"], mode: "all" },
        },
      ],
    },
  ],
  settings: [
    {
      key: "account",
      label: "Moje konto",
      icon: "circle-user",
      to: "/account",
      display: ["User", "Oper", "Admin"],
      perms: { list: [], mode: "all" },
    },
    {
      key: "notifications",
      label: "Powiadomienia",
      icon: "bell",
      to: "/notifications",
      display: ["User", "Oper", "Admin"],
      perms: { list: [], mode: "all" },
    },
    {
      // Demonstruje podwójny filtr: display I perms.
      // display: ["Admin"] — tylko rola Admin widzi tę pozycję w ogóle.
      // perms: admin:access  — dodatkowe zabezpieczenie od strony uprawnień
      //   (użyteczne gdy admin:access może być kiedyś grantem dla innych ról).
      key: "admin-panel",
      label: "Panel admina",
      icon: "shield",
      to: "/admin",
      display: ["Admin"],
      perms: { list: ["admin:access"], mode: "all" },
    },
    {
      key: "logout",
      label: "Wyloguj",
      icon: "log-out",
      action: "logout",
      display: ["User", "Oper", "Admin"],
    },
  ],
};
