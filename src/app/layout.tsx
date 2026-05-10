import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";

import { MSWProvider } from "@/components/providers/msw-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "CI-PRS AI Spec-Driven-Development for Web",
  description:
    "CI-PRS frontend template with Next.js 16 App Router, shadcn/ui, and Tailwind CSS v4. Server-first API layer with light/dark themes, MSW mocking, and TanStack Query for type-safe data fetching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body
        className={cn(
          inter.variable,
          ibmPlexMono.variable,
          "font-sans antialiased",
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          themes={["light", "dark"]}
          disableTransitionOnChange
        >
          <MSWProvider>
            <QueryProvider>{children}</QueryProvider>
          </MSWProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
