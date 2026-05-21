import type { AppRole } from "@/lib/auth/principal";

export type PermRule = {
  list: string[];
  mode?: "all" | "any";
};

export type SubMenuItem = {
  key: string;
  label: string;
  to: string;
  icon?: string;
  perms?: PermRule;
};

export type FeatureItem = {
  key: string;
  label: string;
  icon: string;
  to?: string;
  submenu?: SubMenuItem[];
  /**
   * Role gate for this menu entry. Matched case-sensitively against the
   * principal's `roles` (PascalCase `AppRole` literals). Omit / leave empty
   * to skip the role check.
   */
  display?: readonly AppRole[];
  perms?: PermRule;
};

export type SettingsItem = {
  key: string;
  label: string;
  icon: string;
  to?: string;
  action?: string;
  display?: readonly AppRole[];
  perms?: PermRule;
};

export type MenuConfig = {
  features: FeatureItem[];
  settings: SettingsItem[];
};

export type NavLayoutMode = "sidebar" | "top-menu";
