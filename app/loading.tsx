export default function Loading() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-8 lg:px-12">
      <div className="mx-auto flex min-h-[80vh] max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
        </div>

        <section className="grid flex-1 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <div className="h-8 w-56 animate-pulse rounded-full bg-muted" />
            <div className="h-20 w-full max-w-3xl animate-pulse rounded-3xl bg-muted" />
            <div className="h-24 w-full max-w-2xl animate-pulse rounded-3xl bg-muted" />
            <div className="h-12 w-56 animate-pulse rounded-2xl bg-muted" />
          </div>

          <div className="rounded-[2rem] border border-border/60 bg-card/70 p-8">
            <div className="h-5 w-44 animate-pulse rounded-full bg-muted" />
            <div className="mt-6 grid gap-4">
              <div className="h-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-20 animate-pulse rounded-2xl bg-muted" />
              <div className="h-20 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </section>

        <p className="text-sm text-muted-foreground">
          Ladowanie danych strony z warstwy backendowej...
        </p>
      </div>
    </main>
  );
}
