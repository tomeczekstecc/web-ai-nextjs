import Image from "next/image";

import { appConfig } from "@/lib/config/app";

/**
 * Decorative right panel for auth card layouts.
 * Renders an inverted-background column with the app logo placeholder and name.
 * Hidden on mobile (md:block) — matches the auth card grid layout.
 */
export function RightPanel() {
  return (
    <div className="relative hidden overflow-hidden md:block bg-foreground">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-background">
        {/* App logo */}
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 p-3">
          <Image
            src="/img/app_logo.png"
            alt={appConfig.name}
            width={48}
            height={48}
            className="size-10 object-contain"
            priority
          />
        </div>

        {/* App name */}
        <p className="text-xl font-semibold tracking-tight text-background">
          {appConfig.name}
        </p>

        {/* Subtle tagline */}
        <p className="max-w-[180px] text-center text-sm text-background/50 leading-relaxed">
          Web Platform
        </p>
      </div>
    </div>
  );
}
