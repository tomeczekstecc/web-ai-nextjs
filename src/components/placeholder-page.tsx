import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description?: string;
  /** Opcjonalne tagi widoczne w dev — permission/rola wymagana */
  badge?: string;
  children?: ReactNode;
};

/**
 * Tymczasowy placeholder dla stron w przygotowaniu.
 * Użytkownik dotarł tutaj → ma dostęp (gate w layout.tsx już przepuścił).
 * Zastąp całą tę stronę właściwym komponentem gdy feature będzie gotowy.
 */
export function PlaceholderPage({
  title,
  description,
  badge,
  children,
}: PlaceholderPageProps) {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {badge && (
            <span className="rounded-md border px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>

      {children ?? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/30">
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-sm font-medium text-foreground">
              Masz dostęp do tego zasobu.
            </p>
            <p className="text-xs text-muted-foreground">
              Funkcjonalność w przygotowaniu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
