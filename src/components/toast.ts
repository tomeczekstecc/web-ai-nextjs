import { toast as sonnerToast } from "sonner";

const DURATION = {
  short: 3000,
  default: 4000,
  long: 8000,
} as const;

type ToastOptions = {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

/**
 * App-wide toast helper built on Sonner.
 *
 * Use this instead of importing `toast` directly from "sonner" so that
 * durations, variants, and any future theming stay consistent across the app.
 *
 * Variants:
 *   toast.success  — operation completed              (4 s)
 *   toast.error    — something went wrong             (8 s — stays longer so the user can read it)
 *   toast.warning  — non-blocking caution             (5 s)
 *   toast.info     — neutral information              (4 s)
 *   toast.loading  — async in progress                (no auto-dismiss)
 *   toast.promise  — tracks a Promise automatically
 *   toast.dismiss  — imperatively dismiss by id
 */
export const toast = {
  success(message: string, options?: ToastOptions) {
    return sonnerToast.success(message, {
      duration: DURATION.default,
      ...options,
    });
  },

  error(message: string, options?: ToastOptions) {
    return sonnerToast.error(message, {
      duration: DURATION.long,
      ...options,
    });
  },

  warning(message: string, options?: ToastOptions) {
    return sonnerToast.warning(message, {
      duration: 5000,
      ...options,
    });
  },

  info(message: string, options?: ToastOptions) {
    return sonnerToast.info(message, {
      duration: DURATION.default,
      ...options,
    });
  },

  loading(message: string, options?: Omit<ToastOptions, "action">) {
    return sonnerToast.loading(message, {
      ...options,
    });
  },

  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    },
  ) {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    });
  },

  dismiss(id?: string | number) {
    return sonnerToast.dismiss(id);
  },
};
