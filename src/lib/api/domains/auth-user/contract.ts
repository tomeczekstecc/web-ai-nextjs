export type AuthProvider = "password";

export type AuthIdentity = {
  email: string;
  emailVerified: boolean;
  provider: AuthProvider;
  providerSubject?: string | null;
  username?: string | null;
  displayName?: string | null;
  image?: string | null;
};

export type LaravelAppUserPayload = {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  access_state: "active";
  roles: string[];
  permissions: string[];
  organization_name?: string | null;
};

export type LaravelAppUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  accessState: "active";
  roles: string[];
  permissions: string[];
  organizationName: string | null;
};

export type AuthUserAccessResult =
  | {
      status: "authorized";
      appUser: LaravelAppUser;
      createdOrUpdated?: "created" | "updated" | "confirmed";
    }
  | {
      status: "unlinked";
    }
  | {
      status: "denied";
      reasonCode?: string | null;
    }
  | {
      status: "unavailable";
      message: string;
    };

export type ProvisionAuthUserRequest = {
  email: string;
  email_verified: boolean;
  username?: string | null;
  display_name?: string | null;
  provider: AuthProvider;
  provider_subject?: string | null;
  image?: string | null;
};

export type ProvisionAuthUserSuccessPayload = {
  status: "authorized";
  app_user: LaravelAppUserPayload;
  created_or_updated?: "created" | "updated" | "confirmed";
};

export type ProvisionAuthUserDeniedPayload = {
  status: "denied";
  reason_code?: string;
};
