"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

const SAMPLE_ID = "user_abc123";
const SAMPLE_URL = "https://example.com/share/x9f3-7q2k";
const SAMPLE_STACK = `Error: Coś poszło nie tak\n    at Component (app.tsx:42:11)\n    at renderWithHooks (react-dom.js:14985:18)`;

type SectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function DemoSection({ title, description, children }: SectionProps) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

function SimulateFailureSection() {
  const [simulate, setSimulate] = useState(false);
  const originalRef = useRef<typeof navigator.clipboard.writeText | null>(null);

  useEffect(() => {
    if (!simulate) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      return;
    }
    originalRef.current = navigator.clipboard.writeText.bind(navigator.clipboard);
    navigator.clipboard.writeText = () =>
      Promise.reject(new Error("Simulated clipboard failure"));
    return () => {
      if (originalRef.current) {
        navigator.clipboard.writeText = originalRef.current;
        originalRef.current = null;
      }
    };
  }, [simulate]);

  return (
    <div className="flex w-full flex-wrap items-center gap-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-primary"
          checked={simulate}
          onChange={(event) => setSimulate(event.target.checked)}
        />
        Symuluj błąd kopiowania
      </label>
      <CopyButton
        value={SAMPLE_ID}
        label="Kopiuj ID użytkownika"
        copiedLabel="Skopiowano"
        failedLabel="Nie udało się skopiować"
      />
      <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
        {SAMPLE_ID}
      </code>
      <span className="text-xs text-muted-foreground">
        {simulate
          ? "Symulacja aktywna — kliknięcie pokaże stan błędu."
          : "Symulacja wyłączona — kopiowanie działa normalnie."}
      </span>
    </div>
  );
}

function CopyIdMenu() {
  const { copy, status } = useCopyToClipboard();
  const itemLabel = status === "copied" ? "Skopiowano" : "Kopiuj ID";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            Akcje
            <ChevronDownIcon />
          </Button>
        }
      />
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={async () => {
            const ok = await copy(SAMPLE_ID);
            if (!ok) toast.error("Nie udało się skopiować ID");
          }}
        >
          {itemLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CopyDemo() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Demo komponentu CopyButton
        </h1>
        <p className="text-sm text-muted-foreground">
          Wszystkie warianty komponentu kopiowania do schowka oraz bezpośrednie
          użycie hooka. Sekcje z domyślnymi etykietami pokazują wartości
          angielskie wbudowane w komponent; sekcje z etykietami polskimi
          ilustrują typowe użycie w polskim interfejsie.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <DemoSection
          title="1. Tryb tylko z ikoną — etykiety domyślne (angielskie)"
          description={'Bez prop-ów label/copiedLabel/failedLabel — widać domyślne "Copy" / "Copied" / "Couldn\u2019t copy".'}
        >
          <CopyButton value={SAMPLE_ID} />
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
            {SAMPLE_ID}
          </code>
        </DemoSection>

        <DemoSection
          title="2. Tryb tylko z ikoną — etykiety polskie"
          description="Konsument podaje własne etykiety w języku otaczającego widoku."
        >
          <CopyButton
            value={SAMPLE_ID}
            label="Kopiuj ID użytkownika"
            copiedLabel="Skopiowano"
            failedLabel="Nie udało się skopiować"
          />
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
            {SAMPLE_ID}
          </code>
        </DemoSection>

        <DemoSection
          title="3. Tryb z widocznym tekstem"
          description="Cały przycisk jest jednym celem kliknięcia. Tooltip nie jest pokazywany — widoczny tekst pełni rolę etykiety."
        >
          <CopyButton
            value={SAMPLE_ID}
            label="Kopiuj ID użytkownika"
          >
            <span className="font-mono text-xs">{SAMPLE_ID}</span>
          </CopyButton>
        </DemoSection>

        <DemoSection
          title="4. Stan nieaktywny (pusta wartość)"
          description="Gdy value jest pustym ciągiem, przycisk jest nieaktywny i nie zgłasza fałszywego sukcesu."
        >
          <CopyButton value="" label="Kopiuj ID" />
          <span className="text-xs text-muted-foreground">
            value={'""'} → disabled
          </span>
        </DemoSection>

        <DemoSection
          title="5. Z callbackiem onCopy (toast)"
          description="Konsument sam decyduje o dodatkowym sygnale — tutaj sonner toast."
        >
          <CopyButton
            value={SAMPLE_URL}
            label="Kopiuj link"
            copiedLabel="Skopiowano link"
            failedLabel="Nie udało się skopiować linku"
            onCopy={(_, status) => {
              if (status === "copied") {
                toast.success("Skopiowano link do schowka");
              } else {
                toast.error("Nie udało się skopiować linku");
              }
            }}
          >
            <span className="max-w-[20ch] truncate">{SAMPLE_URL}</span>
          </CopyButton>
        </DemoSection>

        <DemoSection
          title="6. Bezpośrednie użycie hooka w pozycji menu"
          description="Hook jest jedynym sposobem na kopiowanie z elementów, które nie są przyciskiem — tutaj pozycja w menu rozwijanym."
        >
          <CopyIdMenu />
        </DemoSection>

        <DemoSection
          title="7. Symulacja błędu kopiowania"
          description="Tymczasowo zastępuje navigator.clipboard.writeText odrzuconym promise. Pozwala zobaczyć stan błędu bez odbierania uprawnień w przeglądarce. Przywracane na wyłączeniu przełącznika lub odmontowaniu widoku."
        >
          <SimulateFailureSection />
        </DemoSection>
      </div>

      <footer className="rounded-xl border bg-muted/30 p-4 text-xs text-muted-foreground">
        Bardzo długa wartość do testów (stack trace):
        <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-background p-2 font-mono">
          {SAMPLE_STACK}
        </pre>
        <div className="mt-2">
          <CopyButton
            value={SAMPLE_STACK}
            label="Kopiuj przykładowy stack"
            copiedLabel="Skopiowano"
            failedLabel="Nie udało się skopiować"
          />
        </div>
      </footer>
    </main>
  );
}
