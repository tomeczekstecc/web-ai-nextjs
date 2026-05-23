import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nowy wniosek",
  robots: { index: false },
};

// Layout powyżej (new/layout.tsx) już zweryfikował applications:write.
// Ta strona jest dostępna wyłącznie dla Oper i Admin.
export default function NewApplicationPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-6">
      <header>
        <h2 className="text-2xl font-semibold">Nowy wniosek</h2>
        <p className="text-sm text-muted-foreground">
          Dostępne wyłącznie dla ról z uprawnieniem{" "}
          <code className="text-xs">applications:write</code>.
        </p>
      </header>
      <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        Formularz nowego wniosku — placeholder
      </div>
    </div>
  );
}
