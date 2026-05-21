'use client'

import { Check, AlertCircle } from 'lucide-react'

import { WizardProvider } from './WizardProvider'
import { useWizard } from '@/hooks/wizard/useWizard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PageMapping, SummaryResult, ValidationItem, WizardAction, WizardConfig } from '@/lib/wizard/types'

export function Wizard<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  return (
    <WizardProvider {...props}>
      <WizardShell {...props} />
    </WizardProvider>
  )
}

type StepState = 'done' | 'current' | 'upcoming' | 'disabled'

type StepInfo = {
  name: string
  label: string
  index: number
  state: StepState
  hasError: boolean
  disabled: boolean
}

function buildSteps(
  navLabels: { name: string; label: string }[],
  pages: readonly { name: string; disabled?: boolean }[],
  page: number,
  mapping: PageMapping[],
  validation: ValidationItem[],
): StepInfo[] {
  const errorByPage = new Map<string, boolean>()
  for (const m of mapping) {
    const fieldNames = new Set(m.fields.map(f => f.name))
    errorByPage.set(
      m.name,
      validation.some(v => v.type === 'error' && fieldNames.has(v.key)),
    )
  }

  return navLabels.map((p, i) => {
    const disabled = !!pages[i]?.disabled
    let state: StepState = 'upcoming'
    if (disabled) state = 'disabled'
    else if (i < page) state = 'done'
    else if (i === page) state = 'current'

    return {
      name: p.name,
      label: p.label,
      index: i,
      state,
      hasError: !!errorByPage.get(p.name),
      disabled,
    }
  })
}

function StepIndicator({ step }: { step: StepInfo }) {
  const { state, hasError, index } = step

  const base =
    'relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums ring-1 transition-all'

  if (hasError && state !== 'disabled') {
    return (
      <span className={cn(base, 'bg-destructive/10 text-destructive ring-destructive/40')}>
        <AlertCircle className="h-3.5 w-3.5" />
      </span>
    )
  }

  if (state === 'done') {
    return (
      <span className={cn(base, 'bg-primary/10 text-primary/70 ring-primary/25')}>
        <Check className="h-3.5 w-3.5" />
      </span>
    )
  }

  if (state === 'current') {
    return (
      <span className={cn(base, 'bg-primary text-primary-foreground ring-4 ring-primary/15')}>
        {index + 1}
      </span>
    )
  }

  if (state === 'disabled') {
    return (
      <span className={cn(base, 'bg-muted text-muted-foreground/60 ring-border')}>
        {index + 1}
      </span>
    )
  }

  return (
    <span className={cn(base, 'bg-background text-muted-foreground ring-border')}>
      {index + 1}
    </span>
  )
}

function VerticalStepper({
  steps,
  busy,
  onNav,
}: {
  steps: StepInfo[]
  busy: boolean
  onNav: (i: number) => void
}) {
  return (
    <nav aria-label="Kroki" className="flex flex-col">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const clickable = !step.disabled && !busy
        return (
          <div key={step.name} className="relative">
            <button
              type="button"
              onClick={() => clickable && onNav(step.index)}
              disabled={!clickable}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                clickable && 'hover:bg-muted/40',
                !clickable && 'cursor-not-allowed',
              )}
            >
              <StepIndicator step={step} />
              <span
                className={cn(
                  'truncate',
                  step.state === 'current' && 'font-medium text-foreground',
                  step.state === 'done' && 'text-foreground',
                  step.state === 'upcoming' && 'text-muted-foreground',
                  step.state === 'disabled' && 'text-muted-foreground/60',
                  step.hasError && step.state !== 'disabled' && 'text-destructive',
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[1.375rem] top-9 h-4 w-px -translate-x-1/2',
                  step.state === 'done' ? 'bg-primary/30' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

function HorizontalStepper({
  steps,
  busy,
  onNav,
}: {
  steps: StepInfo[]
  busy: boolean
  onNav: (i: number) => void
}) {
  const current = steps.find(s => s.state === 'current') ?? steps[0]
  return (
    <div className="flex flex-col gap-2 md:hidden">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{current?.label}</span>
        <span className="text-xs text-muted-foreground">
          Krok {(current?.index ?? 0) + 1} z {steps.length}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {steps.map(step => {
          const clickable = !step.disabled && !busy
          return (
            <button
              key={step.name}
              type="button"
              onClick={() => clickable && onNav(step.index)}
              disabled={!clickable}
              aria-label={step.label}
              aria-current={step.state === 'current' ? 'step' : undefined}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                step.hasError && step.state !== 'disabled'
                  ? 'bg-destructive/60'
                  : step.state === 'done'
                    ? 'bg-primary'
                    : step.state === 'current'
                      ? 'bg-primary'
                      : step.state === 'disabled'
                        ? 'bg-muted'
                        : 'bg-border',
                clickable && 'hover:opacity-80',
                !clickable && 'cursor-not-allowed',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

type FooterProps = {
  page: number
  isFirst: boolean
  isLast: boolean
  busy: boolean
  mode: 'view' | 'edit'
  summary: SummaryResult | null
  onNav: (toPage: number) => void
  onCancel?: () => void
  acceptActions?: (summary: SummaryResult | null) => WizardAction[]
  customActions?: () => WizardAction[]
}

function renderActions(actions: WizardAction[] | undefined, busy: boolean) {
  if (!actions || actions.length === 0) return null
  return actions.map((a, i) => (
    <Button
      key={i}
      size="lg"
      variant={a.variant ?? 'default'}
      onClick={a.onClick}
      disabled={busy || a.disabled}
    >
      {a.label}
    </Button>
  ))
}

function WizardFooter({
  page,
  isFirst,
  isLast,
  busy,
  mode,
  summary,
  onNav,
  onCancel,
  acceptActions,
  customActions,
}: FooterProps) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 border-t bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 md:-mx-6 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => onNav(page - 1)}
          disabled={busy || isFirst}
        >
          Wstecz
        </Button>

        {mode === 'edit' && onCancel && (
          <Button variant="outline" size="lg" onClick={onCancel} disabled={busy}>
            Anuluj
          </Button>
        )}

        {mode === 'view' && (
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Tylko do odczytu
          </span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!isLast && (
            <Button size="lg" onClick={() => onNav(page + 1)} disabled={busy}>
              Dalej
            </Button>
          )}
          {isLast && mode === 'edit' && renderActions(acceptActions?.(summary), busy)}
          {isLast && renderActions(customActions?.(), busy)}
        </div>
      </div>
    </div>
  )
}

function WizardShell<T extends Record<string, unknown>>(props: WizardConfig<T>) {
  const { page, mapping, nav, busy, loading, mode, summary, validation } = useWizard()

  const pages = props.pages
  const isFirst = page === 0
  const isLast = page === pages.length - 1
  const navLabels =
    mapping.length > 0 ? mapping : pages.map(p => ({ name: p.name, label: p.name }))

  const steps = buildSteps(navLabels, pages, page, mapping, validation)
  const current = steps[page]
  const progress = pages.length > 1 ? (page / (pages.length - 1)) * 100 : 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Krok {page + 1} z {pages.length}
            </p>
            <h2 className="truncate text-lg font-semibold text-foreground">
              {current?.label ?? props.name}
            </h2>
          </div>
        </div>
        <div
          className="h-1 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div
            className="h-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <HorizontalStepper steps={steps} busy={busy || loading} onNav={nav} />
      </header>

      {/* Body */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="hidden md:block">
          <div className="sticky top-[calc(var(--header-height,0px)+1rem)] max-h-[calc(100svh-var(--header-height,0px)-2rem)] overflow-y-auto">
            <VerticalStepper steps={steps} busy={busy || loading} onNav={nav} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <div className="flex-1">{pages[page]?.form}</div>
          <WizardFooter
            page={page}
            isFirst={isFirst}
            isLast={isLast}
            busy={busy || loading}
            mode={mode}
            summary={summary}
            onNav={nav}
            onCancel={props.cancelCallback}
            acceptActions={props.acceptActions}
            customActions={props.customActions}
          />
        </div>
      </div>
    </div>
  )
}
