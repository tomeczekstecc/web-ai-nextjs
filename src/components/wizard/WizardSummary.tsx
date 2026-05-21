'use client'

import { AlertCircle, ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useWizard } from '@/hooks/wizard/useWizard'
import type { PageMapping, ValidationItem } from '@/lib/wizard/types'

type Severity = 'error' | 'warning'

type FieldRowProps = {
  label: string
  msgs: string[]
  severity: Severity
  onJump: () => void
}

function FieldRow({ label, msgs, severity, onJump }: FieldRowProps) {
  const isError = severity === 'error'
  return (
    <div
      className={cn(
        'group/row flex items-start gap-2 rounded-md px-2 py-1 transition-colors',
        isError ? 'hover:bg-destructive/5' : 'hover:bg-yellow-500/5',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
          isError ? 'bg-destructive' : 'bg-yellow-500',
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-sm font-medium',
            isError
              ? 'text-destructive'
              : 'text-yellow-700 dark:text-yellow-400',
          )}
        >
          {label}
        </span>
        {msgs.map((msg, i) => (
          <span key={i} className="text-sm leading-snug text-muted-foreground">
            {msg}
          </span>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 shrink-0 px-2 text-xs opacity-60 transition-opacity group-hover/row:opacity-100"
        onClick={onJump}
      >
        Pokaż
        <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
  )
}

function SectionHeader({
  severity,
  count,
}: {
  severity: Severity
  count: number
}) {
  const isError = severity === 'error'
  const Icon = isError ? AlertCircle : TriangleAlert
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs font-medium uppercase tracking-wide',
        isError
          ? 'text-destructive'
          : 'text-yellow-700 dark:text-yellow-400',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>
        {isError ? 'Błędy' : 'Ostrzeżenia'} · {count}
      </span>
    </div>
  )
}

type PageGroup = {
  page: PageMapping
  errors: ValidationItem[]
  warnings: ValidationItem[]
}

function PageIssueCard({
  group,
  onJumpPage,
  onJumpField,
}: {
  group: PageGroup
  onJumpPage: () => void
  onJumpField: (key: string) => void
}) {
  const { page, errors, warnings } = group
  const hasErrors = errors.length > 0

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-l-4 bg-card transition-shadow hover:shadow-sm',
        hasErrors
          ? 'border-l-destructive'
          : 'border-l-yellow-500 dark:border-l-yellow-400',
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{page.label}</span>
          <div className="flex shrink-0 items-center gap-1">
            {errors.length > 0 && (
              <Badge variant="destructive">
                {errors.length} {errors.length === 1 ? 'błąd' : 'błędów'}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge
                variant="outline"
                className="border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
              >
                {warnings.length} {warnings.length === 1 ? 'ostrzeżenie' : 'ostrzeżeń'}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onJumpPage}>
          Przejdź do strony
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-3 p-2">
        {errors.length > 0 && (
          <section className="flex flex-col gap-1">
            <SectionHeader severity="error" count={errors.length} />
            <div className="flex flex-col">
              {errors.map(item => {
                const fieldMeta = page.fields.find(f => f.name === item.key)
                return (
                  <FieldRow
                    key={item.key}
                    label={fieldMeta?.label ?? item.key}
                    msgs={item.msgs}
                    severity="error"
                    onJump={() => onJumpField(item.key)}
                  />
                )
              })}
            </div>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="flex flex-col gap-1">
            <SectionHeader severity="warning" count={warnings.length} />
            <div className="flex flex-col">
              {warnings.map(item => {
                const fieldMeta = page.fields.find(f => f.name === item.key)
                return (
                  <FieldRow
                    key={item.key}
                    label={fieldMeta?.label ?? item.key}
                    msgs={item.msgs}
                    severity="warning"
                    onJump={() => onJumpField(item.key)}
                  />
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DictCard({
  errors,
  warnings,
}: {
  errors: [string, string[]][]
  warnings: [string, string[]][]
}) {
  const hasErrors = errors.length > 0
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-l-4 bg-card',
        hasErrors
          ? 'border-l-destructive'
          : 'border-l-yellow-500 dark:border-l-yellow-400',
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium text-foreground">
          {hasErrors ? 'Błędy systemowe' : 'Ostrzeżenia systemowe'}
        </span>
        {hasErrors && (
          <Badge variant="destructive">
            {errors.length} {errors.length === 1 ? 'błąd' : 'błędów'}
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge
            variant="outline"
            className="border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
          >
            {warnings.length} {warnings.length === 1 ? 'ostrzeżenie' : 'ostrzeżeń'}
          </Badge>
        )}
      </div>
      <div className="flex flex-col gap-3 p-3">
        {errors.length > 0 && (
          <section className="flex flex-col gap-1">
            <SectionHeader severity="error" count={errors.length} />
            <div className="flex flex-col gap-1.5 pl-2">
              {errors.map(([key, msgs]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  {msgs.map((msg, i) => (
                    <span key={i} className="text-sm text-destructive">
                      {msg}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
        {warnings.length > 0 && (
          <section className="flex flex-col gap-1">
            <SectionHeader severity="warning" count={warnings.length} />
            <div className="flex flex-col gap-1.5 pl-2">
              {warnings.map(([key, msgs]) => (
                <div key={key} className="flex flex-col gap-0.5">
                  {msgs.map((msg, i) => (
                    <span
                      key={i}
                      className="text-sm text-yellow-700 dark:text-yellow-400"
                    >
                      {msg}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export function WizardSummary() {
  const { summary, validation, mapping, setPageByName } = useWizard()

  const hasErrors =
    Object.keys(summary?.error ?? {}).length > 0 ||
    Object.keys(summary?.dicts_msg?.error ?? {}).length > 0
  const hasWarnings = validation.some(v => v.type === 'warning')
  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'

  const groups: PageGroup[] = mapping
    .map(p => ({
      page: p,
      errors: validation.filter(
        v => v.type === 'error' && p.fields.some(f => f.name === v.key),
      ),
      warnings: validation.filter(
        v => v.type === 'warning' && p.fields.some(f => f.name === v.key),
      ),
    }))
    .filter(g => g.errors.length > 0 || g.warnings.length > 0)

  const dictErrors = Object.entries(summary?.dicts_msg?.error ?? {})
  const dictWarnings = Object.entries(summary?.dicts_msg?.warning ?? {}).filter(
    ([k]) => !summary?.dicts_msg?.error?.[k],
  )
  const hasDicts = dictErrors.length > 0 || dictWarnings.length > 0

  const StatusIcon =
    status === 'error' ? AlertCircle : status === 'warning' ? TriangleAlert : CheckCircle2

  return (
    <div className="flex flex-col gap-3">
      <Alert
        variant={status === 'error' ? 'destructive' : 'default'}
        className={cn(
          status === 'success' &&
            'border-green-500/40 bg-green-500/5 text-green-700 dark:text-green-400',
          status === 'warning' &&
            'border-yellow-500/40 bg-yellow-500/5 text-yellow-700 dark:text-yellow-400',
        )}
      >
        <StatusIcon className="h-4 w-4" />
        <AlertTitle>
          {status === 'error' && 'Formularz zawiera błędy'}
          {status === 'warning' && 'Formularz zawiera ostrzeżenia'}
          {status === 'success' && 'Formularz jest poprawny'}
        </AlertTitle>
        <AlertDescription>
          {status === 'error' && 'Popraw pola oznaczone poniżej przed przesłaniem.'}
          {status === 'warning' && 'Sprawdź oznaczone pola przed przesłaniem.'}
          {status === 'success' && 'Możesz przesłać formularz.'}
        </AlertDescription>
      </Alert>

      {groups.map(group => (
        <PageIssueCard
          key={group.page.name}
          group={group}
          onJumpPage={() => setPageByName(group.page.name)}
          onJumpField={key =>
            setPageByName(group.page.name, `${group.page.name}.${key}`)
          }
        />
      ))}

      {hasDicts && <DictCard errors={dictErrors} warnings={dictWarnings} />}
    </div>
  )
}
