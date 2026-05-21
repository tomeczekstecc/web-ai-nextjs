import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4 px-4 text-center">
        <p className="text-8xl font-bold text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold">Nie znaleziono strony</h1>
        <p className="max-w-sm text-muted-foreground">
          Strona, której szukasz, nie istnieje lub została przeniesiona.
        </p>
        <Button nativeButton={false} render={<Link href="/dashboard" />}>
          Przejdź do pulpitu
        </Button>
      </div>
    </div>
  )
}
