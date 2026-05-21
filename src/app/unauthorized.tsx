import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Wymagane logowanie",
  robots: { index: false },
}

export default function Unauthorized() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-8xl font-bold text-muted-foreground">401</p>
      <h1 className="text-2xl font-semibold">Wymagane logowanie</h1>
      <p className="max-w-sm text-muted-foreground">
        Aby zobaczyć tę stronę, musisz się zalogować. Sesja mogła wygasnąć.
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
