"use client";

import { useEffect } from "react";

type MSWProviderProps = {
  children: React.ReactNode;
};

export function MSWProvider({ children }: MSWProviderProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      void (async () => {
        const { worker } = await import("@/mocks/browser");
        await worker.start({ onUnhandledRequest: "warn" });
      })();
    }
  }, []);

  return <>{children}</>;
}
