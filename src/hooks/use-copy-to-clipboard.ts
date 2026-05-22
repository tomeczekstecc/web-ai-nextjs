"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyStatus = "idle" | "copied" | "failed";

export type UseCopyToClipboardOptions = {
  resetAfter?: number;
};

export type UseCopyToClipboardReturn = {
  copy: (value: string) => Promise<boolean>;
  status: CopyStatus;
  reset: () => void;
};

const DEFAULT_RESET_AFTER_MS = 1500;

// TODO: Single chokepoint for clipboard writes (FR-008). If a legacy fallback
// (document.execCommand) or permissions probing is ever required, add it here
// without changing the public hook signature or any consumer.
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {},
): UseCopyToClipboardReturn {
  const { resetAfter = DEFAULT_RESET_AFTER_MS } = options;
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimer();
    };
  }, [clearTimer]);

  const scheduleReset = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (mountedRef.current) {
        setStatus("idle");
      }
    }, resetAfter);
  }, [clearTimer, resetAfter]);

  const reset = useCallback(() => {
    clearTimer();
    if (mountedRef.current) {
      setStatus("idle");
    }
  }, [clearTimer]);

  const copy = useCallback(
    async (value: string): Promise<boolean> => {
      clearTimer();
      if (
        typeof navigator === "undefined" ||
        !navigator.clipboard?.writeText
      ) {
        if (mountedRef.current) {
          setStatus("failed");
          scheduleReset();
        }
        return false;
      }
      try {
        await navigator.clipboard.writeText(value);
        if (mountedRef.current) {
          setStatus("copied");
          scheduleReset();
        }
        return true;
      } catch {
        if (mountedRef.current) {
          setStatus("failed");
          scheduleReset();
        }
        return false;
      }
    },
    [clearTimer, scheduleReset],
  );

  return { copy, status, reset };
}
