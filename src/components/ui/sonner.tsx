"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { appConfig } from "@/lib/config/app"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position={appConfig.toastPosition}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          success:
            "!bg-green-50 !border-green-200 dark:!bg-green-950/60 dark:!border-green-800",
          error:
            "!bg-red-50 !border-red-200 dark:!bg-red-950/60 dark:!border-red-800",
          warning:
            "!bg-amber-50 !border-amber-200 dark:!bg-amber-950/60 dark:!border-amber-800",
          info:
            "!bg-blue-50 !border-blue-200 dark:!bg-blue-950/60 dark:!border-blue-800",
          title: "font-medium",
          icon: "mt-0.5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
