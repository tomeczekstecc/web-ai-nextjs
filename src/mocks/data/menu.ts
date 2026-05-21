import type { MenuConfig } from "@/lib/api/domains/menu/contract";

export const menuConfigFixture: MenuConfig = {
  features: [
    {
      key: "dashboard",
      label: "Przegląd",
      icon: "layout-dashboard",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["dashboard:read"], mode: "all" },
      submenu: [
        {
          key: "overview",
          label: "Dashboard",
          to: "/dashboard",
          perms: { list: ["dashboard:read"], mode: "all" },
        },
      ],
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
      key: "applications",
      label: "Moje wnioski",
      icon: "file-text",
      display: ["User", "Oper", "Admin"],
      perms: { list: ["applications:read"], mode: "all" },
      submenu: [
        {
          key: "in-progress",
          label: "W trakcie",
          to: "/applications/in-progress",
          perms: { list: ["applications:read"], mode: "all" },
        },
        {
          key: "submitted",
          label: "Złożone",
          to: "/applications/submitted",
          perms: { list: ["applications:read"], mode: "all" },
        },
        {
          key: "to-fix",
          label: "Do poprawy",
          to: "/applications/to-fix",
          perms: { list: ["applications:read"], mode: "all" },
        },
      ],
    },
    {
      key: "calendar",
      label: "Kalendarz",
      icon: "calendar",
      to: "/calendar",
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
      key: "logout",
      label: "Wyloguj",
      icon: "log-out",
      action: "logout",
      display: ["User", "Oper", "Admin"],
    },
  ],
};
