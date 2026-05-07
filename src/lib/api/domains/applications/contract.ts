export type ApplicationStatus = "draft" | "submitted";

export type CreateApplicationInput = {
  firstName: string;
  lastName: string;
  email: string;
};

export type ApplicationPayload = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: ApplicationStatus;
  created_at: string;
};

export type Application = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: ApplicationStatus;
  createdAt: string;
};
