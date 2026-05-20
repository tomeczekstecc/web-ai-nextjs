"use client";

import { useEffect, useState } from "react";

type MSWProviderProps = {
  children: React.ReactNode;
};

export function MSWProvider({ children }: MSWProviderProps) {
  // In development, delay rendering until the MSW service worker is ready.
  // This prevents useQuery from firing before MSW can intercept requests.
  const [ready, setReady] = useState(process.env.NODE_ENV !== "development");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      void (async () => {
        const { worker } = await import("@/mocks/browser");
        await worker.start({ onUnhandledRequest: "warn" });
        setReady(true);
      })();
    }
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}
