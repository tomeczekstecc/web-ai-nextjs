import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Nie znaleziono strony",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground">404</p>
      <h1 className="text-2xl font-semibold">Nie znaleziono strony</h1>
      <p className="max-w-sm text-muted-foreground">
        Strona, której szukasz, nie istnieje lub została przeniesiona.
      </p>
      <div className="flex gap-3">
        <Button nativeButton={false} render={<Link href="/auth/sign-in" />}>
          Zaloguj się
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Wróć do strony głównej
        </Button>
      </div>
    </main>
  )
}
