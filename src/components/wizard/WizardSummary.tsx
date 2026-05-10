'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/hooks/wizard/useWizard'

export function WizardSummary() {
  const { summary, validation, mapping, setPageByName } = useWizard()

  const hasErrors =
    Object.keys(summary?.error ?? {}).length > 0 ||
    Object.keys(summary?.dicts_msg?.error ?? {}).length > 0
  const hasWarnings = validation.some(v => v.type === 'warning')
  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'success'

  const groups = mapping
    .map(p => ({
      page: p,
      errors: validation.filter(v => v.type === 'error' && p.fields.some(f => f.name === v.key)),
      warnings: validation.filter(v => v.type === 'warning' && p.fields.some(f => f.name === v.key)),
    }))
    .filter(g => g.errors.length > 0 || g.warnings.length > 0)

  const dictErrors = Object.entries(summary?.dicts_msg?.error ?? {})
  const dictWarnings = Object.entries(summary?.dicts_msg?.warning ?? {}).filter(
    ([k]) => !summary?.dicts_msg?.error?.[k]
  )
  const hasDicts = dictErrors.length > 0 || dictWarnings.length > 0

  return (
    <div className="flex flex-col gap-4">
      <Alert
        variant={status === 'error' ? 'destructive' : 'default'}
        className={
          status === 'success'
            ? 'border-green-500 text-green-700 dark:text-green-400'
            : status === 'warning'
              ? 'border-yellow-500 text-yellow-700 dark:text-yellow-400'
              : ''
        }
      >
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

      {groups.map(({ page, errors, warnings }) => (
        <div key={page.name} className="border rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">{page.label}</span>
            <Button variant="outline" size="sm" onClick={() => setPageByName(page.name)}>
              Przejdź do strony
            </Button>
          </div>

          {errors.map(item => {
            const fieldMeta = page.fields.find(f => f.name === item.key)
            return (
              <div key={item.key} className="flex items-start justify-between gap-2 pl-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-destructive">
                    {fieldMeta?.label ?? item.key}
                  </span>
                  {item.msgs.map((msg, i) => (
                    <span key={i} className="text-sm text-muted-foreground">{msg}</span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPageByName(page.name, `${page.name}.${item.key}`)}
                >
                  Przejdź do pola
                </Button>
              </div>
            )
          })}

          {warnings.map(item => {
            const fieldMeta = page.fields.find(f => f.name === item.key)
            return (
              <div key={item.key} className="flex items-start justify-between gap-2 pl-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    {fieldMeta?.label ?? item.key}
                  </span>
                  {item.msgs.map((msg, i) => (
                    <span key={i} className="text-sm text-muted-foreground">{msg}</span>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPageByName(page.name, `${page.name}.${item.key}`)}
                >
                  Przejdź do pola
                </Button>
              </div>
            )
          })}
        </div>
      ))}

      {hasDicts && (
        <div className="border rounded-lg p-4 flex flex-col gap-3">
          <span className="font-medium">
            {dictErrors.length > 0 ? 'Błędy systemowe' : 'Ostrzeżenia systemowe'}
          </span>
          {dictErrors.map(([key, msgs]) => (
            <div key={key} className="pl-4 flex flex-col gap-0.5">
              {msgs.map((msg, i) => (
                <span key={i} className="text-sm text-destructive">{msg}</span>
              ))}
            </div>
          ))}
          {dictWarnings.map(([key, msgs]) => (
            <div key={key} className="pl-4 flex flex-col gap-0.5">
              {msgs.map((msg, i) => (
                <span key={i} className="text-sm text-yellow-600 dark:text-yellow-400">{msg}</span>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
