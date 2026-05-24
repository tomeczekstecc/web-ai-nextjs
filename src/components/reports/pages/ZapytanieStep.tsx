'use client'

import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useWizard } from '@/hooks/wizard/useWizard'
import { useTestQuery } from '@/hooks/reports/use-test-query'
import type { QueryParameter } from '@/lib/api/domains/reports/contract'
import { ParameterTable } from './ParameterTable'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

export function ZapytanieStep() {
  const { form, setValue, mode } = useWizard()
  const { resolvedTheme } = useTheme()
  const testQuery = useTestQuery()
  const isView = mode === 'view'
  const sqlQuery = (form.sqlQuery as string | undefined) ?? ''
  const parameters = (form.parameters as QueryParameter[] | undefined) ?? []

  function handleTestQuery() {
    const runtimeParams = parameters.map(p => ({ name: p.name, value: p.defaultValue }))
    testQuery.mutate({ sql: sqlQuery, parameters: runtimeParams })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Zapytanie SQL</p>
        <div className="overflow-hidden rounded-md border">
          <MonacoEditor
            height="300px"
            language="sql"
            theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
            value={sqlQuery}
            onChange={v => !isView && setValue('sqlQuery', v ?? '')}
            options={{
              readOnly: isView,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
            }}
          />
        </div>
        {!isView && (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTestQuery()}
              disabled={testQuery.isPending || !sqlQuery.trim()}
            >
              {testQuery.isPending ? 'Testowanie…' : 'Testuj zapytanie'}
            </Button>
          </div>
        )}

        {testQuery.isError && (
          <p className="text-sm text-destructive">
            {testQuery.error?.message ?? 'Błąd wykonania zapytania'}
          </p>
        )}

        {testQuery.isSuccess && (
          <div className="rounded-md border p-3">
            {testQuery.data.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak danych</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {testQuery.data.columns.map(col => (
                        <th
                          key={col}
                          className="text-muted-foreground px-2 py-1 text-left text-xs font-medium"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {testQuery.data.rows.map((row, i) => (
                      <tr key={i}>
                        {testQuery.data.columns.map(col => (
                          <td key={col} className="px-2 py-1 text-xs">
                            {String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <ParameterTable />
    </div>
  )
}
