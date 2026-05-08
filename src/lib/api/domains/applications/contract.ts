export type ApplicationStatus = "draft" | "submitted" | "archived";

export type ApplicationPayload = {
  id: string;
  label: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

export type Application = {
  id: string;
  label: string;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicationListParams = {
  page: number;
  pageSize: number;
  search?: string;
  status?: ApplicationStatus;
  sort?: ApplicationSort;
};

export type ApplicationSort =
  | "label:asc"
  | "label:desc"
  | "status:asc"
  | "status:desc"
  | "createdAt:asc"
  | "createdAt:desc"
  | "updatedAt:asc"
  | "updatedAt:desc";

export type ApplicationListPayload = {
  items: ApplicationPayload[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type ApplicationListResult = {
  items: Application[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type CreateApplicationInput = {
  label: string;
};

export type UpdateApplicationInput = {
  id: string;
  label: string;
};

export type UpdateApplicationStatusInput = {
  id: string;
  status: ApplicationStatus;
};

export type ApiErrorResponse = {
  code: string;
  message: string;
  details?: unknown;
};
