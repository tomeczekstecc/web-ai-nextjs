import "server-only";

export const getApiBaseUrl = () => process.env.API_URL?.replace(/\/$/, "") ?? "";

export const buildApiUrl = (path: string) => {
  const baseUrl = getApiBaseUrl();

  if (!baseUrl) {
    return null;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return new URL(normalizedPath, `${baseUrl}/`).toString();
};
