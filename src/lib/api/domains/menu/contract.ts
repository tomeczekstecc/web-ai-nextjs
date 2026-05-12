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
  display?: string[];
  perms?: PermRule;
};

export type SettingsItem = {
  key: string;
  label: string;
  icon: string;
  to?: string;
  action?: string;
  display?: string[];
  perms?: PermRule;
};

export type MenuConfig = {
  features: FeatureItem[];
  settings: SettingsItem[];
};

export type NavLayoutMode = "sidebar" | "top-menu";
