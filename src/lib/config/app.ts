import type { ToasterProps } from "sonner";

type ToastPosition = NonNullable<ToasterProps["position"]>;

const TOAST_POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

function resolveToastPosition(raw: string | undefined): ToastPosition {
  if (raw && (TOAST_POSITIONS as string[]).includes(raw)) {
    return raw as ToastPosition;
  }
  return "bottom-right";
}

/**
 * Central app configuration.
 * All values are driven by environment variables so the template
 * can be forked and renamed without touching source files.
 */
export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "CI-PRS",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3600",
  toastPosition: resolveToastPosition(process.env.NEXT_PUBLIC_TOAST_POSITION),
} as const;
