import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {/* Background blobs — same as "/" route */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="landing-blob absolute -left-56 -top-56 size-[700px] bg-blue-300/10 dark:bg-blue-800/10"
          style={{ "--blob-duration": "26s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -right-48 -top-20 size-[580px] bg-violet-300/8 dark:bg-violet-800/8"
          style={{ "--blob-duration": "32s", "--blob-delay": "-10s" } as React.CSSProperties}
        />
        <div
          className="landing-blob absolute -bottom-48 left-1/2 size-[540px] -translate-x-1/2 bg-sky-200/10 dark:bg-indigo-900/15"
          style={{ "--blob-duration": "21s", "--blob-delay": "-17s" } as React.CSSProperties}
        />
      </div>

      {/* Theme toggle — fixed top-right across all auth pages */}
      <div className="fixed right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {children}
    </div>
  );
}
