import type { MenuConfig } from "@/lib/api/domains/menu/contract";

export const menuConfigFixture: MenuConfig = {
  features: [
    {
      key: "playground",
      label: "Playground",
      icon: "terminal",
      display: ["user"],
      perms: { list: ["playground_view"], mode: "all" },
      submenu: [
        {
          key: "history",
          label: "History",
          to: "/playground/history",
          perms: { list: ["playground_view"], mode: "all" },
        },
        {
          key: "starred",
          label: "Starred",
          to: "/playground/starred",
          perms: { list: ["playground_view"], mode: "all" },
        },
        {
          key: "settings",
          label: "Settings",
          to: "/playground/settings",
          perms: { list: ["playground_manage"], mode: "all" },
        },
      ],
    },
    {
      key: "models",
      label: "Models",
      icon: "bot",
      display: ["user"],
      perms: { list: ["models_view"], mode: "all" },
      submenu: [
        {
          key: "genesis",
          label: "Genesis",
          to: "/models/genesis",
          perms: { list: ["models_view"], mode: "all" },
        },
        {
          key: "explorer",
          label: "Explorer",
          to: "/models/explorer",
          perms: { list: ["models_view"], mode: "all" },
        },
        {
          key: "quantum",
          label: "Quantum",
          to: "/models/quantum",
          perms: { list: ["models_view", "models_advanced"], mode: "all" },
        },
      ],
    },
    {
      key: "documentation",
      label: "Documentation",
      icon: "book-open",
      display: ["user"],
      perms: { list: ["docs_view"], mode: "all" },
      submenu: [
        {
          key: "introduction",
          label: "Introduction",
          to: "/docs/introduction",
          perms: { list: ["docs_view"], mode: "all" },
        },
        {
          key: "get-started",
          label: "Get Started",
          to: "/docs/get-started",
          perms: { list: ["docs_view"], mode: "all" },
        },
        {
          key: "tutorials",
          label: "Tutorials",
          to: "/docs/tutorials",
          perms: { list: ["docs_view"], mode: "all" },
        },
        {
          key: "changelog",
          label: "Changelog",
          to: "/docs/changelog",
          perms: { list: ["docs_view"], mode: "all" },
        },
      ],
    },
    {
      key: "settings",
      label: "Settings",
      icon: "settings-2",
      display: ["user"],
      perms: { list: ["settings_view"], mode: "all" },
      submenu: [
        {
          key: "general",
          label: "General",
          to: "/settings/general",
          perms: { list: ["settings_view"], mode: "all" },
        },
        {
          key: "team",
          label: "Team",
          to: "/settings/team",
          perms: { list: ["settings_view"], mode: "all" },
        },
        {
          key: "billing",
          label: "Billing",
          to: "/settings/billing",
          perms: { list: ["billing_view"], mode: "all" },
        },
        {
          key: "limits",
          label: "Limits",
          to: "/settings/limits",
          perms: { list: ["settings_view"], mode: "all" },
        },
      ],
    },
  ],
  settings: [
    {
      key: "upgrade",
      label: "Upgrade to Pro",
      icon: "sparkles",
      to: "/upgrade",
      display: ["user"],
      perms: { list: ["billing_view"], mode: "all" },
    },
    {
      key: "account",
      label: "Account",
      icon: "circle-user",
      to: "/account",
      display: ["user"],
      perms: { list: ["account_view"], mode: "all" },
    },
    {
      key: "billing",
      label: "Billing",
      icon: "credit-card",
      to: "/billing",
      display: ["user"],
      perms: { list: ["billing_view"], mode: "all" },
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: "bell",
      to: "/notifications",
      display: ["user"],
      perms: { list: ["account_view"], mode: "all" },
    },
    {
      key: "logout",
      label: "Log out",
      icon: "log-out",
      action: "logout",
      display: ["user"],
    },
  ],
};
