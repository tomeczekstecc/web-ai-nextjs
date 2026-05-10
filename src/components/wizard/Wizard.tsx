'use client'

import { WizardProvider } from './WizardProvider'
import { useWizard } from '@/hooks/wizard/useWizard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SummaryResult, WizardConfig } from '@/lib/wizard/types'

export function Wizard<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  return (
    <WizardProvider {...props}>
      <WizardShell {...props} />
    </WizardProvider>
  )
}

type NavButtonsProps = {
  page: number
  isFirst: boolean
  isLast: boolean
  busy: boolean
  mode: 'view' | 'edit'
  summary: SummaryResult | null
  onNav: (toPage: number) => void
  onCancel?: () => void
  acceptButtons?: (summary: SummaryResult | null) => React.ReactNode
  customButtons?: () => React.ReactNode
  className?: string
}

function NavButtons({
  page,
  isFirst,
  isLast,
  busy,
  mode,
  summary,
  onNav,
  onCancel,
  acceptButtons,
  customButtons,
  className,
}: NavButtonsProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {!isFirst && (
        <Button variant="secondary" onClick={() => onNav(page - 1)} disabled={busy}>
          Wstecz
        </Button>
      )}

      {mode === 'edit' && (
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Anuluj
        </Button>
      )}

      {mode === 'view' && (
        <Button variant="outline" disabled>
          Tylko do odczytu
        </Button>
      )}

      {!isLast && (
        <Button onClick={() => onNav(page + 1)} disabled={busy} className="ml-auto">
          Dalej
        </Button>
      )}

      {isLast && mode === 'edit' && acceptButtons?.(summary)}
      {isLast && customButtons?.()}
    </div>
  )
}

function WizardShell<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  const { page, mapping, nav, busy, mode, summary } = useWizard()

  const pages = props.pages
  const isFirst = page === 0
  const isLast = page === pages.length - 1
  const navLabels = mapping.length > 0 ? mapping : pages.map(p => ({ name: p.name, label: p.name }))

  const navButtonProps: NavButtonsProps = {
    page,
    isFirst,
    isLast,
    busy,
    mode,
    summary,
    onNav: nav,
    onCancel: props.cancelCallback,
    acceptButtons: props.acceptButtons,
    customButtons: props.customButtons,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
      <nav className="flex flex-col gap-1 pt-1">
        {navLabels.map((p, i) => (
          <button
            key={p.name}
            onClick={() => nav(i)}
            disabled={pages[i]?.disabled || busy}
            className={cn(
              'text-left px-3 py-2 rounded-md text-sm transition-colors',
              page === i
                ? 'bg-primary text-primary-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              (pages[i]?.disabled || busy) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div className="flex flex-col gap-4 min-w-0">
        <NavButtons {...navButtonProps} />
        <div className="flex-1">{pages[page]?.form}</div>
        <NavButtons
          {...navButtonProps}
          className="sticky bottom-4 bg-background/90 backdrop-blur border rounded-lg p-2"
        />
      </div>
    </div>
  )
}
